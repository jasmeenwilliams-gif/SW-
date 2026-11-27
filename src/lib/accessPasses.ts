import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export type ProtectedArea = 'family_suite' | 'operations';

export interface AccessPassRecord {
  passHash: string;
  area: ProtectedArea;
  label: string;
  agreementSigned: boolean;
  active: boolean;
  createdBy: string;
  createdAtMs: number;
}

export interface PinVerificationResult {
  ok: boolean;
  label?: string;
  agreementSigned?: boolean;
  passHash?: string;
  clientId?: string;
  reason?:
    | 'missing_pin'
    | 'invalid_ops_pin'
    | 'invalid_family_pin'
    | 'invalid_qr_pass'
    | 'agreement_required'
    | 'revoked'
    | 'unavailable';
}

export interface ConsultationQrPayload {
  type: 'sw_client_pass';
  clientId: string;
  agreementSigned: boolean;
  nonce: string;
  issuedAt: string;
}

/** Generates a 6-digit numeric PIN using cryptographic randomness */
export function generateSixDigitPin(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const pin = (array[0] % 900000) + 100000; // guarantees 100000–999999
  return String(pin);
}

/** Builds a QR string payload after Agreement of Services is signed */
export function createClientQrPayload(clientId: string, agreementSigned: boolean): string {
  if (!agreementSigned) {
    throw new Error('Agreement of Services must be signed before generating a client QR pass.');
  }

  const normalizedClientId = clientId.trim();
  if (!normalizedClientId) {
    throw new Error('Client reference ID is required to generate a client QR pass.');
  }

  const nonceArray = new Uint8Array(8);
  crypto.getRandomValues(nonceArray);
  const nonce = Array.from(nonceArray, (b) => b.toString(16).padStart(2, '0')).join('');

  const payload: ConsultationQrPayload = {
    type: 'sw_client_pass',
    clientId: normalizedClientId,
    agreementSigned: true,
    nonce,
    issuedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload);
}

const PIN_HASH_SALT = 'sw-concierge-v1:';

// Salted SHA-256 digests only (never store raw PIN literals in client code).
const DEFAULT_PASS_DIGESTS: Record<
  string,
  { area: ProtectedArea; label: string; agreementSigned: boolean; active: boolean }
> = {
  '8b2743caef1bfa4afe35c1a476ab640a1dbf4db15927a2fedd719c92c7e99e96': {
    area: 'operations',
    label: 'Jasmeen Williams, LPN, BS-HHS',
    agreementSigned: true,
    active: true,
  },
  '6f066ea1b46b198fa11b7356c1ff0d45cae2c3e2dac9242a312eee91514b12ee': {
    area: 'family_suite',
    label: 'Holloway / R.M. Household',
    agreementSigned: true,
    active: true,
  },
  '82d8d0f613c5b121e2f96a4832b11d52d7a646005830f108203c9ff3d0f312eb': {
    area: 'family_suite',
    label: 'M.C. Household',
    agreementSigned: true,
    active: true,
  },
};

const PASS_HASH_REGEX = /^[a-f0-9]{64}$/;

export async function hashAccessPin(rawPin: string): Promise<string> {
  const normalized = `${PIN_HASH_SALT}${rawPin.trim()}`;
  const bytes = new TextEncoder().encode(normalized);

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  throw new Error('Web Crypto SHA-256 is required to verify access credentials.');
}

function evaluatePassRecord(
  area: ProtectedArea,
  record: { area: ProtectedArea; label: string; agreementSigned: boolean; active: boolean },
  agreementSignedOverride: boolean,
  passHash: string
): PinVerificationResult {
  if (!record.active) {
    return { ok: false, reason: 'revoked' };
  }
  if (record.area !== area) {
    return {
      ok: false,
      reason: area === 'operations' ? 'invalid_ops_pin' : 'invalid_family_pin',
    };
  }
  if (area === 'family_suite' && !agreementSignedOverride && !record.agreementSigned) {
    return { ok: false, reason: 'agreement_required' };
  }
  return {
    ok: true,
    label: record.label,
    agreementSigned: record.agreementSigned,
    passHash,
  };
}

export async function verifyAccessPin(
  area: ProtectedArea,
  rawPin: string,
  agreementSignedOverride = false
): Promise<PinVerificationResult> {
  const trimmed = rawPin.trim();
  if (!trimmed) {
    return { ok: false, reason: 'missing_pin' };
  }

  let passHash = '';
  try {
    passHash = await hashAccessPin(trimmed);
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (!PASS_HASH_REGEX.test(passHash)) {
    return {
      ok: false,
      reason: area === 'operations' ? 'invalid_ops_pin' : 'invalid_family_pin',
    };
  }

  try {
    const snap = await getDoc(doc(db, 'accessPasses', passHash));
    if (snap.exists()) {
      const data = snap.data() as Record<string, unknown>;
      const recordArea: ProtectedArea =
        data.area === 'operations' ? 'operations' : 'family_suite';
      return evaluatePassRecord(
        area,
        {
          area: recordArea,
          label: String(data.label ?? 'Authorized Household'),
          agreementSigned: Boolean(data.agreementSigned),
          active: Boolean(data.active),
        },
        agreementSignedOverride,
        passHash
      );
    }
  } catch {
    // Fall back to hashed baseline digests if offline or pass directory unavailable
  }

  const baseline = DEFAULT_PASS_DIGESTS[passHash];
  if (!baseline) {
    return {
      ok: false,
      reason: area === 'operations' ? 'invalid_ops_pin' : 'invalid_family_pin',
    };
  }

  return evaluatePassRecord(area, baseline, agreementSignedOverride, passHash);
}

export async function verifyClientQrPass(
  rawQrText: string,
  agreementSignedOverride = false
): Promise<PinVerificationResult> {
  const trimmed = rawQrText.trim();
  if (!trimmed) {
    return { ok: false, reason: 'invalid_qr_pass' };
  }

  let parsed: Partial<ConsultationQrPayload>;
  try {
    parsed = JSON.parse(trimmed) as Partial<ConsultationQrPayload>;
  } catch {
    return { ok: false, reason: 'invalid_qr_pass' };
  }

  if (
    parsed.type !== 'sw_client_pass' ||
    typeof parsed.clientId !== 'string' ||
    !parsed.clientId.trim() ||
    typeof parsed.nonce !== 'string' ||
    parsed.nonce.trim().length < 16
  ) {
    return { ok: false, reason: 'invalid_qr_pass' };
  }

  if (!parsed.agreementSigned && !agreementSignedOverride) {
    return { ok: false, reason: 'agreement_required' };
  }

  let passHash = '';
  try {
    passHash = await hashAccessPin(parsed.nonce.trim());
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (!PASS_HASH_REGEX.test(passHash)) {
    return { ok: false, reason: 'invalid_qr_pass' };
  }

  try {
    const snap = await getDoc(doc(db, 'accessPasses', passHash));
    if (!snap.exists()) {
      return { ok: false, reason: 'invalid_qr_pass' };
    }
    const data = snap.data() as Record<string, unknown>;
    const recordArea: ProtectedArea =
      data.area === 'operations' ? 'operations' : 'family_suite';
    const evalResult = evaluatePassRecord(
      'family_suite',
      {
        area: recordArea,
        label: String(data.label ?? parsed.clientId),
        agreementSigned: Boolean(data.agreementSigned),
        active: Boolean(data.active),
      },
      agreementSignedOverride,
      passHash
    );
    if (!evalResult.ok) {
      return evalResult;
    }
    return {
      ...evalResult,
      clientId: parsed.clientId.trim(),
    };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export async function issueAccessPass(
  createdByUid: string,
  input: {
    pin: string;
    area: ProtectedArea;
    label: string;
    agreementSigned: boolean;
  }
): Promise<string> {
  const passHash = await hashAccessPin(input.pin);
  if (!PASS_HASH_REGEX.test(passHash)) {
    throw new Error('Unable to generate a valid credential digest.');
  }

  const label = input.label.trim().slice(0, 80);
  if (!label) {
    throw new Error('Household or recipient label is required.');
  }

  const path = `accessPasses/${passHash}`;
  try {
    await setDoc(doc(db, 'accessPasses', passHash), {
      passHash,
      area: input.area,
      label,
      agreementSigned: Boolean(input.agreementSigned),
      active: true,
      createdBy: createdByUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return passHash;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function issueClientQrPass(
  createdByUid: string,
  input: {
    clientId: string;
    label: string;
    agreementSigned: boolean;
  }
): Promise<{ qrPayload: string; passHash: string }> {
  const qrPayload = createClientQrPayload(input.clientId, input.agreementSigned);
  const parsed = JSON.parse(qrPayload) as ConsultationQrPayload;
  const passHash = await hashAccessPin(parsed.nonce);
  if (!PASS_HASH_REGEX.test(passHash)) {
    throw new Error('Unable to generate a valid QR credential digest.');
  }

  const baseLabel = input.label.trim() || input.clientId.trim();
  const label = `${baseLabel} · QR Pass`.slice(0, 80);
  const path = `accessPasses/${passHash}`;
  try {
    await setDoc(doc(db, 'accessPasses', passHash), {
      passHash,
      area: 'family_suite',
      label,
      agreementSigned: true,
      active: true,
      createdBy: createdByUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { qrPayload, passHash };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateAccessPassStatus(
  passHash: string,
  patch: {
    active?: boolean;
    agreementSigned?: boolean;
  }
): Promise<void> {
  const path = `accessPasses/${passHash}`;
  try {
    await updateDoc(doc(db, 'accessPasses', passHash), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeAccessPasses(
  isAdmin: boolean,
  onData: (passes: AccessPassRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isAdmin) {
    onData([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'accessPasses'),
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const created = data.createdAt as Timestamp | undefined;
        const createdAtMs =
          created && typeof created === 'object' && 'toMillis' in created
            ? created.toMillis()
            : 0;
        return {
          passHash: String(data.passHash ?? d.id),
          area: (data.area === 'operations' ? 'operations' : 'family_suite') as ProtectedArea,
          label: String(data.label ?? 'Household Pass'),
          agreementSigned: Boolean(data.agreementSigned),
          active: Boolean(data.active),
          createdBy: String(data.createdBy ?? ''),
          createdAtMs,
        } satisfies AccessPassRecord;
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (listenErr) => {
      try {
        handleFirestoreError(listenErr, OperationType.LIST, 'accessPasses');
      } catch (wrappedErr) {
        if (onError) {
          onError(wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr)));
        }
      }
    }
  );
}
