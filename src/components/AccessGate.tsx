import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  CalendarCheck,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  QrCode,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import {
  verifyAccessPin,
  verifyClientQrPass,
  type PinVerificationResult,
  type ProtectedArea,
} from '../lib/accessPasses';
import { SwMonogramCrest } from './SwMonogramCrest';

export type { ProtectedArea };

interface AccessGateProps {
  area: ProtectedArea;
  agreementSigned?: boolean;
  alreadyUnlocked?: boolean;
  isUnlocked?: boolean;
  allowAdminAutoUnlock?: boolean;
  onAgreementChange?: (signed: boolean) => void;
  onUnlock: (meta?: { label?: string; method: 'pin' | 'google_admin' }) => void;
  onRequestConsultation?: () => void;
  children: ReactNode;
}

function getFailureMessage(
  area: ProtectedArea,
  reason: PinVerificationResult['reason']
): string {
  switch (reason) {
    case 'missing_pin':
      return 'Please enter your assigned access PIN to continue.';
    case 'invalid_ops_pin':
      return 'Invalid Operations PIN. Restricted to Jasmeen Williams, LPN, BS-HHS.';
    case 'invalid_qr_pass':
      return 'QR pass could not be verified. Confirm you used an active consultation QR pass.';
    case 'agreement_required':
      return 'Agreement of Services must be signed before unlocking Services, Care Dossier, and For Families.';
    case 'revoked':
      return 'This access PIN is currently inactive. Please contact Southern Well Senior Concierge.';
    case 'unavailable':
      return 'Credential verification is unavailable in this browser context.';
    case 'invalid_family_pin':
    default:
      return area === 'operations'
        ? 'Invalid Operations PIN. Restricted to Jasmeen Williams, LPN, BS-HHS.'
        : 'PIN not recognized. Please complete your initial consultation and PIN assignment.';
  }
}

export function AccessGate({
  area,
  agreementSigned = false,
  alreadyUnlocked,
  isUnlocked,
  allowAdminAutoUnlock = true,
  onAgreementChange,
  onUnlock,
  onRequestConsultation,
  children,
}: AccessGateProps) {
  const { isAdmin, authReady, authLoading, authError, signInWithGoogle, userProfile } =
    useFirebase();
  const controlledUnlocked = alreadyUnlocked ?? isUnlocked;
  const [unlocked, setUnlocked] = useState(Boolean(controlledUnlocked));
  const [localAgreementSigned, setLocalAgreementSigned] = useState(agreementSigned);
  const [entryMode, setEntryMode] = useState<'pin' | 'qr'>('pin');
  const [pin, setPin] = useState('');
  const [qrPayloadText, setQrPayloadText] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveAgreementSigned = onAgreementChange ? agreementSigned : localAgreementSigned;

  useEffect(() => {
    if (controlledUnlocked !== undefined) {
      setUnlocked(Boolean(controlledUnlocked));
    }
  }, [controlledUnlocked]);

  useEffect(() => {
    setLocalAgreementSigned(agreementSigned);
  }, [agreementSigned]);

  useEffect(() => {
    if (authReady && isAdmin && allowAdminAutoUnlock && !unlocked) {
      setUnlocked(true);
      onUnlock({
        label: userProfile?.displayName || 'Jasmeen Williams, LPN, BS-HHS',
        method: 'google_admin',
      });
    }
  }, [authReady, isAdmin, allowAdminAutoUnlock, unlocked, onUnlock, userProfile]);

  if (unlocked) {
    return <>{children}</>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const result =
        !isOps && entryMode === 'qr'
          ? await verifyClientQrPass(qrPayloadText, effectiveAgreementSigned)
          : await verifyAccessPin(area, pin, effectiveAgreementSigned);

      if (!result.ok) {
        setError(getFailureMessage(area, result.reason));
        return;
      }
      setUnlocked(true);
      setPin('');
      setQrPayloadText('');
      onUnlock({ label: result.label, method: 'pin' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQrImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');

    type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
    };
    const Detector = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
      .BarcodeDetector;

    if (!Detector) {
      setError('Automatic QR image scanning is not supported in this browser. Paste your QR JSON pass below.');
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const detector = new Detector({ formats: ['qr_code'] });
      const codes = await detector.detect(bitmap);
      bitmap.close();
      const rawValue = codes[0]?.rawValue?.trim();
      if (!rawValue) {
        setError('No QR pass code detected in the uploaded image.');
        return;
      }
      setQrPayloadText(rawValue);
      setSubmitting(true);
      try {
        const result = await verifyClientQrPass(rawValue, effectiveAgreementSigned);
        if (!result.ok) {
          setError(getFailureMessage(area, result.reason));
          return;
        }
        setUnlocked(true);
        setQrPayloadText('');
        onUnlock({ label: result.label, method: 'pin' });
      } finally {
        setSubmitting(false);
      }
    } catch {
      setError('Unable to decode QR image. Please paste your QR JSON pass text instead.');
    }
  }

  const isOps = area === 'operations';

  return (
    <section className="max-w-xl mx-auto my-10 sm:my-16 px-4 sm:px-6">
      <div className="bg-surface-container-lowest rounded border border-brass/35 shadow-sm overflow-hidden">
        {/* Top Navy Header Strip */}
        <div className="bg-primary-container text-on-primary px-6 py-5 sm:px-8 border-b border-brass/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <SwMonogramCrest className="w-8 h-8 text-brass shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-fixed">
                {isOps ? 'Founder & Operations Access' : 'Post-Consultation Client Access'}
              </p>
              <h2 className="font-editorial text-xl sm:text-2xl font-medium text-on-primary truncate">
                {isOps ? 'Practice Operations Hub' : 'Private Client & Family Suite'}
              </h2>
            </div>
          </div>
          <Lock className="w-5 h-5 text-brass shrink-0" aria-hidden="true" />
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {isOps
              ? 'Restricted to Jasmeen Williams, LPN, BS-HHS for active caseload tracking, client check-ins, and SOP governance.'
              : 'Services, Care Dossier, and For Families are private client resources unlocked once your initial consultation is completed and your Agreement of Services is signed.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isOps && (
              <div className="grid grid-cols-2 gap-1 p-1 rounded bg-surface-container-low border border-brass/25">
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('pin');
                    setError('');
                  }}
                  className={`min-h-[38px] rounded text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors ${
                    entryMode === 'pin'
                      ? 'bg-primary-container text-secondary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-primary-container'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Household PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryMode('qr');
                    setError('');
                  }}
                  className={`min-h-[38px] rounded text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors ${
                    entryMode === 'qr'
                      ? 'bg-primary-container text-secondary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-primary-container'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Pass</span>
                </button>
              </div>
            )}

            {isOps || entryMode === 'pin' ? (
              <div>
                <label
                  htmlFor={`access-pin-${area}`}
                  className="block text-xs font-semibold uppercase tracking-wider text-primary-container mb-2"
                >
                  {isOps ? 'Operations Access PIN' : 'Assigned Household PIN'}
                </label>
                <div className="relative">
                  <KeyRound
                    className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id={`access-pin-${area}`}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={
                      isOps ? 'Enter Operations PIN' : 'Enter 4- or 6-digit Household PIN'
                    }
                    className="w-full min-h-[46px] pl-10 pr-11 py-2.5 rounded bg-surface-container-low border border-outline-variant focus:border-secondary focus:outline-none text-sm font-medium text-primary-container tracking-widest tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => !prev)}
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-primary-container transition-colors"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="access-qr-payload"
                    className="block text-xs font-semibold uppercase tracking-wider text-primary-container"
                  >
                    Consultation QR Pass Payload
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary-container cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleQrImageUpload(e)}
                      className="sr-only"
                    />
                  </label>
                </div>
                <textarea
                  id="access-qr-payload"
                  rows={3}
                  value={qrPayloadText}
                  onChange={(e) => {
                    setQrPayloadText(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder='Paste your QR pass payload ({"type":"sw_client_pass",...}) or upload the QR image'
                  className="w-full p-3 rounded bg-surface-container-low border border-outline-variant focus:border-secondary focus:outline-none text-xs font-mono text-primary-container"
                />
              </div>
            )}

            {!isOps && (
              <label className="flex items-start gap-2.5 p-3 rounded bg-surface-container-low border border-brass/25 text-xs text-primary-container cursor-pointer">
                <input
                  type="checkbox"
                  checked={effectiveAgreementSigned}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setLocalAgreementSigned(checked);
                    onAgreementChange?.(checked);
                    if (error) setError('');
                  }}
                  className="mt-0.5 rounded border-outline-variant accent-secondary shrink-0"
                />
                <span className="leading-relaxed">
                  Agreement of Services signed after initial consultation
                </span>
              </label>
            )}

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded bg-red-50 border border-red-200 text-xs text-red-900 leading-relaxed"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-5 py-2.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Verifying Credentials...'
                  : isOps
                    ? 'Unlock Operations Hub'
                    : 'Unlock Family Suite'}
              </span>
            </button>
          </form>

          {isOps ? (
            <div className="pt-5 border-t border-brass/20 space-y-3">
              <p className="text-xs text-on-surface-variant">
                Verified Practice Administrator? Sign in with your Southern Well Google account to synchronize Firestore operations and unlock immediately.
              </p>
              {authError && (
                <p role="alert" className="text-xs text-red-800">
                  {authError}
                </p>
              )}
              {authReady && isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setUnlocked(true);
                    onUnlock({
                      label: userProfile?.displayName || 'Jasmeen Williams, LPN, BS-HHS',
                      method: 'google_admin',
                    });
                  }}
                  className="w-full min-h-[44px] px-4 py-2 rounded bg-surface-container-low border border-brass/35 hover:bg-surface-container text-primary-container text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-secondary" />
                  <span>Continue as Practice Admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => void signInWithGoogle()}
                  className="w-full min-h-[44px] px-4 py-2 rounded bg-surface-container-low border border-brass/35 hover:bg-surface-container text-primary-container text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4 text-secondary" />
                  <span>
                    {authLoading
                      ? 'Connecting Google Sign-In...'
                      : 'Sign in with Google (Practice Admin)'}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="pt-5 border-t border-brass/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                New family seeking care coordination or awaiting PIN assignment?
              </p>
              {onRequestConsultation && (
                <button
                  type="button"
                  onClick={onRequestConsultation}
                  className="min-h-[40px] px-3.5 py-2 rounded bg-surface-container-low border border-brass/35 hover:bg-surface-container text-primary-container text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-secondary" />
                  <span>Schedule Consultation</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
