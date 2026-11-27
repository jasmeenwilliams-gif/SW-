import { useState, type FormEvent } from 'react';
import QRCode from 'qrcode';
import {
  ArrowRight,
  Camera,
  Check,
  Copy,
  Download,
  FileDown,
  FileText,
  KeyRound,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Rocket,
  ShieldCheck,
  X,
} from 'lucide-react';
import { FOUNDER_PROFILE } from '../../data/conciergeData';
import {
  LAUNCH_CHECKLIST_ITEMS,
  OPS_STEP_FORMS,
  type OpsDataState,
} from '../../data/opsData';
import {
  generateSixDigitPin,
  type AccessPassRecord,
  type ProtectedArea,
} from '../../lib/accessPasses';
import { LiveQrPinScanner } from '../LiveQrPinScanner';
import { QrPinGenerator } from '../QrPinGenerator';
import { SignedAgreementQrPass } from '../SignedAgreementQrPass';

interface IssuedCredentialHandoff {
  label: string;
  clientId?: string;
  pin?: string;
  qrPayload?: string;
  qrDataUrl?: string;
}

interface FormsViewProps {
  data: OpsDataState;
  isAdmin?: boolean;
  accessPasses?: AccessPassRecord[];
  onIssuePass?: (input: {
    pin: string;
    area: ProtectedArea;
    label: string;
    agreementSigned: boolean;
  }) => Promise<void>;
  onIssueQrPass?: (input: {
    clientId: string;
    label: string;
    agreementSigned: boolean;
  }) => Promise<{ qrPayload: string; passHash: string }>;
  onTogglePassField?: (
    passHash: string,
    patch: { active?: boolean; agreementSigned?: boolean }
  ) => Promise<void>;
}

export function FormsView({
  data,
  isAdmin = false,
  accessPasses = [],
  onIssuePass,
  onIssueQrPass,
  onTogglePassField,
}: FormsViewProps) {
  const [passLabel, setPassLabel] = useState('');
  const [passClientId, setPassClientId] = useState(data.clients[0]?.id ?? 'SW-RM-4081');
  const [passPin, setPassPin] = useState('');
  const [passArea, setPassArea] = useState<ProtectedArea>('family_suite');
  const [passAgreementSigned, setPassAgreementSigned] = useState(true);
  const [includeQrPass, setIncludeQrPass] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [handoff, setHandoff] = useState<IssuedCredentialHandoff | null>(null);
  const [copiedField, setCopiedField] = useState<'pin' | 'qr' | null>(null);
  const [selectedQrClientId, setSelectedQrClientId] = useState(data.clients[0]?.id ?? 'SW-RM-4081');
  const [qrGeneratorSeed, setQrGeneratorSeed] = useState<string>('');
  const [pinIntakeMode, setPinIntakeMode] = useState<'paste' | 'camera'>('paste');

  function handleGeneratePin() {
    const nextPin = generateSixDigitPin();
    setPassPin(nextPin);
    if (passError) setPassError('');
  }

  async function handleCopyText(value: string, field: 'pin' | 'qr') {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Clipboard API unavailable
    }
  }

  async function handleIssuePass(e: FormEvent) {
    e.preventDefault();
    if (!onIssuePass || issuing) return;
    setPassError('');
    setPassSuccess('');

    const trimmedPin = passPin.trim();
    const trimmedLabel = passLabel.trim();
    const trimmedClientId = passClientId.trim();

    if (trimmedPin.length < 4) {
      setPassError('Enter or generate a PIN of at least 4 digits.');
      return;
    }
    if (!trimmedLabel) {
      setPassError('Enter a household or recipient label.');
      return;
    }

    setIssuing(true);
    try {
      await onIssuePass({
        pin: trimmedPin,
        area: passArea,
        label: trimmedLabel,
        agreementSigned: passAgreementSigned,
      });

      let qrPayload: string | undefined;
      let qrDataUrl: string | undefined;

      if (passArea === 'family_suite' && includeQrPass && onIssueQrPass) {
        const qrIssued = await onIssueQrPass({
          clientId: trimmedClientId || trimmedLabel,
          label: trimmedLabel,
          agreementSigned: passAgreementSigned,
        });
        qrPayload = qrIssued.qrPayload;
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 220,
          margin: 2,
          color: { dark: '#0b192c', light: '#ffffff' },
        });
      }

      setHandoff({
        label: trimmedLabel,
        clientId: passArea === 'family_suite' ? trimmedClientId || trimmedLabel : undefined,
        pin: trimmedPin,
        qrPayload,
        qrDataUrl,
      });
      setPassSuccess(`Hashed access pass issued for ${trimmedLabel}.`);
      setPassLabel('');
      setPassPin('');
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Unable to save access pass.');
    } finally {
      setIssuing(false);
    }
  }

  async function handleGenerateStandaloneQr() {
    if (!onIssueQrPass || issuing) return;
    setPassError('');
    setPassSuccess('');

    const trimmedClientId = passClientId.trim();
    const trimmedLabel = passLabel.trim() || trimmedClientId;

    setIssuing(true);
    try {
      const qrIssued = await onIssueQrPass({
        clientId: trimmedClientId,
        label: trimmedLabel,
        agreementSigned: passAgreementSigned,
      });
      const qrDataUrl = await QRCode.toDataURL(qrIssued.qrPayload, {
        width: 220,
        margin: 2,
        color: { dark: '#0b192c', light: '#ffffff' },
      });
      setHandoff({
        label: trimmedLabel,
        clientId: trimmedClientId,
        qrPayload: qrIssued.qrPayload,
        qrDataUrl,
      });
      setPassSuccess(`Client QR pass issued for ${trimmedLabel}.`);
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Unable to generate client QR pass.');
    } finally {
      setIssuing(false);
    }
  }
  const stages = [
    {
      stage: 'Stage 1 · Discovery & Fit',
      forms: [...OPS_STEP_FORMS[0], ...OPS_STEP_FORMS[1]],
    },
    {
      stage: 'Stage 2 · Enrollment Packet',
      forms: [...OPS_STEP_FORMS[2], ...OPS_STEP_FORMS[3]],
    },
    {
      stage: 'Stage 3 · Authorizations & Consents',
      forms: [...OPS_STEP_FORMS[4]],
    },
    {
      stage: 'Stage 4 · Payment & SDOH Intake',
      forms: [...OPS_STEP_FORMS[5], ...OPS_STEP_FORMS[6]],
    },
    {
      stage: 'Stage 5 · Care Plan & Ongoing Logs',
      forms: [...OPS_STEP_FORMS[7], ...OPS_STEP_FORMS[8], ...OPS_STEP_FORMS[9]],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
          Forms Directory &amp; Compliance Audit
        </p>
        <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
          Enrollment &amp; Forms (5 Stages)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stages.map((st) => (
          <div
            key={st.stage}
            className="bg-surface-container-lowest rounded p-5 border border-brass/25 space-y-3"
          >
            <h3 className="font-editorial text-lg font-semibold text-primary-container">
              {st.stage}
            </h3>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              {st.forms.map((form) => (
                <li key={form} className="flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                  <span>{form}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded p-5 border border-brass/25 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-editorial text-lg font-semibold text-primary-container">
            Active Client Packet &amp; Consent Matrix
          </h3>
          <span className="text-[11px] text-on-surface-variant">
            Select a household to preview their Signed Agreement QR Pass below
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.clients.map((c) => {
            const selected = c.id === selectedQrClientId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedQrClientId(c.id)}
                className={`p-3.5 rounded border flex items-center justify-between gap-3 text-xs text-left transition-colors ${
                  selected
                    ? 'bg-surface-container border-secondary shadow-sm'
                    : 'bg-surface-container-low border-brass/20 hover:border-brass'
                }`}
              >
                <div>
                  <p className="font-semibold text-primary-container">
                    {c.ini} ({c.id})
                  </p>
                  <p className="text-on-surface-variant mt-0.5">Packet: {c.packet}</p>
                </div>
                <span
                  className={`font-semibold whitespace-nowrap ${
                    c.consent ? 'text-sage' : 'text-secondary'
                  }`}
                >
                  {c.consent ? 'Consents Signed' : 'Consents Needed'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isAdmin && onIssuePass && (
        <div className="bg-surface-container-lowest rounded p-5 border border-brass/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
                Post-Consultation Credential Vault
              </p>
              <h3 className="font-editorial text-lg font-semibold text-primary-container mt-0.5">
                Portal Access Passes (SHA-256 Hashed)
              </h3>
            </div>
            <KeyRound className="w-4 h-4 text-secondary shrink-0" />
          </div>

          <form onSubmit={handleIssuePass} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <label
                htmlFor="issue-pass-label"
                className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1"
              >
                Household / Recipient
              </label>
              <input
                id="issue-pass-label"
                type="text"
                value={passLabel}
                onChange={(e) => setPassLabel(e.target.value)}
                placeholder="e.g. Davis Household"
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant text-xs text-primary-container"
              />
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="issue-pass-client-id"
                className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1"
              >
                Client Reference ID
              </label>
              <input
                id="issue-pass-client-id"
                type="text"
                list="ops-client-ids"
                value={passClientId}
                onChange={(e) => setPassClientId(e.target.value)}
                placeholder="e.g. SW-RM-4081"
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant text-xs text-primary-container tabular-nums"
              />
              <datalist id="ops-client-ids">
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ini} ({c.id})
                  </option>
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label
                  htmlFor="issue-pass-pin"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Assigned PIN
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePin}
                  className="text-[11px] font-semibold text-secondary hover:text-primary-container inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate 6-Digit</span>
                </button>
              </div>
              <input
                id="issue-pass-pin"
                type="text"
                inputMode="numeric"
                value={passPin}
                onChange={(e) => setPassPin(e.target.value)}
                placeholder="6-digit or 4+ chars"
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant text-xs text-primary-container tabular-nums"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="issue-pass-area"
                className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1"
              >
                Protected Suite
              </label>
              <select
                id="issue-pass-area"
                value={passArea}
                onChange={(e) => setPassArea(e.target.value as ProtectedArea)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant text-xs text-primary-container"
              >
                <option value="family_suite">Family Suite</option>
                <option value="operations">Operations Hub</option>
              </select>
            </div>

            <div className="sm:col-span-12 flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passAgreementSigned}
                    onChange={(e) => setPassAgreementSigned(e.target.checked)}
                    className="rounded border-outline-variant accent-secondary"
                  />
                  <span>Agreement of Services signed and verified on file</span>
                </label>

                {passArea === 'family_suite' && onIssueQrPass && (
                  <label className="inline-flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeQrPass}
                      onChange={(e) => setIncludeQrPass(e.target.checked)}
                      className="rounded border-outline-variant accent-secondary"
                    />
                    <span>Also generate Client QR Pass</span>
                  </label>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {passArea === 'family_suite' && onIssueQrPass && (
                  <button
                    type="button"
                    disabled={issuing}
                    onClick={() => void handleGenerateStandaloneQr()}
                    className="min-h-[40px] px-3.5 py-1.5 rounded bg-surface-container-low border border-brass/35 text-primary-container hover:bg-surface-container text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <QrCode className="w-3.5 h-3.5 text-secondary" />
                    <span>QR Pass Only</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={issuing}
                  className="min-h-[40px] px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{issuing ? 'Issuing...' : 'Issue Credential'}</span>
                </button>
              </div>
            </div>
          </form>

          {passError && (
            <p role="alert" className="text-xs text-red-800 bg-red-50 border border-red-200 rounded p-2.5">
              {passError}
            </p>
          )}
          {passSuccess && (
            <p className="text-xs text-sage bg-sage-soft border border-sage/30 rounded p-2.5">
              {passSuccess}
            </p>
          )}

          {handoff && (
            <div className="p-4 rounded bg-surface-container-low border border-brass/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                    One-Time Client Handoff Card
                  </p>
                  <h4 className="font-editorial text-base font-semibold text-primary-container mt-0.5">
                    {handoff.label}
                    {handoff.clientId ? ` · ${handoff.clientId}` : ''}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Share this credential directly with the family. Only the SHA-256 hash is stored in Firestore.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHandoff(null)}
                  aria-label="Dismiss credential handoff"
                  className="p-1.5 rounded text-on-surface-variant hover:text-primary-container"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {handoff.qrDataUrl && handoff.qrPayload && (
                  <div className="p-2.5 bg-white rounded border border-brass/30 shrink-0 space-y-2 text-center">
                    <img
                      src={handoff.qrDataUrl}
                      alt={`QR pass for ${handoff.label}`}
                      className="w-36 h-36 object-contain"
                    />
                    <a
                      href={handoff.qrDataUrl}
                      download={`SouthernWell_QR_${(handoff.clientId || handoff.label).replace(/[^a-zA-Z0-9_-]/g, '_')}.png`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:underline"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download QR</span>
                    </a>
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-2.5 w-full">
                  {handoff.pin && (
                    <div className="p-3 rounded bg-white border border-brass/25 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                          Assigned Access PIN
                        </span>
                        <span className="font-mono text-lg font-semibold text-primary-container tracking-widest tabular-nums">
                          {handoff.pin}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCopyText(handoff.pin!, 'pin')}
                        className="px-2.5 py-1.5 rounded bg-surface-container-low border border-outline-variant text-xs font-semibold text-primary-container inline-flex items-center gap-1.5"
                      >
                        {copiedField === 'pin' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-sage" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-secondary" />
                            <span>Copy PIN</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {handoff.qrPayload && (
                    <div className="p-3 rounded bg-white border border-brass/25 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                          QR Pass JSON Payload
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopyText(handoff.qrPayload!, 'qr')}
                          className="px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant text-[11px] font-semibold text-primary-container inline-flex items-center gap-1"
                        >
                          {copiedField === 'qr' ? (
                            <>
                              <Check className="w-3 h-3 text-sage" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-secondary" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-mono text-[11px] text-on-surface-variant break-all">
                        {handoff.qrPayload}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {accessPasses.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-brass/20">
              {accessPasses.map((pass) => (
                <div
                  key={pass.passHash}
                  className="p-3 rounded bg-surface-container-low border border-brass/20 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-primary-container truncate">
                      {pass.label}
                    </p>
                    <p className="text-on-surface-variant mt-0.5 tabular-nums">
                      {pass.area === 'operations' ? 'Operations Hub' : 'Family Suite'} ·{' '}
                      Digest {pass.passHash.slice(0, 10)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pass.area === 'family_suite' && onTogglePassField && (
                      <button
                        type="button"
                        onClick={() =>
                          void onTogglePassField(pass.passHash, {
                            agreementSigned: !pass.agreementSigned,
                          })
                        }
                        className={`px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors ${
                          pass.agreementSigned
                            ? 'bg-sage-soft border-sage/30 text-sage'
                            : 'bg-white border-outline-variant text-on-surface-variant'
                        }`}
                      >
                        {pass.agreementSigned ? 'Agreement Signed' : 'Agreement Pending'}
                      </button>
                    )}
                    {onTogglePassField && (
                      <button
                        type="button"
                        onClick={() =>
                          void onTogglePassField(pass.passHash, {
                            active: !pass.active,
                          })
                        }
                        className={`px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors ${
                          pass.active
                            ? 'bg-primary-container border-primary-container text-secondary-fixed'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        {pass.active ? 'Active' : 'Revoked'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant pt-2 border-t border-brass/20">
              No custom household passes stored in Firestore yet. Baseline credentials remain active; issue new household PINs above as families complete onboarding.
            </p>
          )}
        </div>
      )}

      {(() => {
        const selectedClient =
          data.clients.find((c) => c.id === selectedQrClientId) ?? data.clients[0];
        const qrClientId = selectedClient?.id ?? selectedQrClientId;
        const qrSigned = Boolean(selectedClient?.consent);

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5">
              <SignedAgreementQrPass
                clientId={qrClientId}
                agreementSigned={qrSigned}
                onUsePayload={(payload) => setQrGeneratorSeed(payload)}
              />
            </div>
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-grid grid-cols-2 gap-1 p-1 rounded bg-surface-container-low border border-brass/25">
                <button
                  type="button"
                  onClick={() => setPinIntakeMode('paste')}
                  className={`min-h-[36px] px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors ${
                    pinIntakeMode === 'paste'
                      ? 'bg-primary-container text-secondary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-primary-container'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Paste / Upload QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPinIntakeMode('camera')}
                  className={`min-h-[36px] px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors ${
                    pinIntakeMode === 'camera'
                      ? 'bg-primary-container text-secondary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-primary-container'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera Scan</span>
                </button>
              </div>

              {pinIntakeMode === 'camera' ? (
                <LiveQrPinScanner
                  vaultSynced={Boolean(isAdmin && onIssuePass)}
                  onPinGenerated={
                    isAdmin && onIssuePass
                      ? async ({ clientId, pin }) => {
                          await onIssuePass({
                            pin,
                            area: 'family_suite',
                            label: `${clientId} · Consultation PIN`,
                            agreementSigned: true,
                          });
                        }
                      : undefined
                  }
                />
              ) : (
                <QrPinGenerator
                  externalPayload={qrGeneratorSeed}
                  vaultSynced={Boolean(isAdmin && onIssuePass)}
                  onPinGenerated={
                    isAdmin && onIssuePass
                      ? async ({ clientId, pin }) => {
                          await onIssuePass({
                            pin,
                            area: 'family_suite',
                            label: `${clientId} · Consultation PIN`,
                            agreementSigned: true,
                          });
                        }
                      : undefined
                  }
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export function HandbookView() {
  return (
    <div className="space-y-6">
      <div className="bg-primary-container text-on-primary rounded p-6 border border-brass/40 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-fixed">
          Form 09 Companion Policy
        </p>
        <h2 className="font-editorial text-2xl sm:text-3xl font-medium">
          Southern Well Client Handbook
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Plain-language client commitments governing non-clinical advocacy, family communication turnaround, and emergency escalation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: '100% Non-Clinical Navigation Scope',
            body: 'Southern Well coordinators never diagnose conditions, alter prescriptions, inject medications, or provide skilled nursing care. All medical decisions remain strictly with licensed physicians.',
          },
          {
            title: '24-Hour Post-Visit Briefing Guarantee',
            body: 'Following every accompanied clinic visit, authorized family members and DPOA proxies receive a plain-language written summary and updated action list within 24 hours.',
          },
          {
            title: 'Emergency 911 Escalation Protocol',
            body: 'In the event of chest pain, acute shortness of breath, sudden neurological changes, or severe fall distress, coordinators dial 911 immediately and notify the designated family contact.',
          },
          {
            title: 'Direct Pine Belt & Coast Dispatch',
            body: `Reach ${FOUNDER_PROFILE.fullName} directly at ${FOUNDER_PROFILE.phone} (${FOUNDER_PROFILE.chambers}) for scheduling adjustments or urgent logistical questions.`,
          },
        ].map((card) => (
          <div
            key={card.title}
            className="bg-surface-container-lowest rounded p-6 border border-brass/25 space-y-2"
          >
            <h3 className="font-editorial text-xl font-medium text-primary-container">
              {card.title}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-low rounded p-5 border border-brass/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm text-primary-container font-medium">
          <ShieldCheck className="w-4 h-4 text-secondary" />
          <span>Dual-Corridor Chambers: {FOUNDER_PROFILE.chambers}</span>
        </div>
        <a
          href={FOUNDER_PROFILE.phoneHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline tabular-nums"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{FOUNDER_PROFILE.phone}</span>
        </a>
      </div>
    </div>
  );
}

interface LaunchViewProps {
  data: OpsDataState;
  onToggleLaunchItem: (id: string) => void;
}

export function LaunchView({ data, onToggleLaunchItem }: LaunchViewProps) {
  const doneCount = LAUNCH_CHECKLIST_ITEMS.filter((i) => Boolean(data.launchDone[i.id])).length;
  const pct = Math.round((doneCount / LAUNCH_CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded p-5 sm:p-6 border border-brass/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Practice Infrastructure Checklist
          </p>
          <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
            Launch Readiness ({doneCount} / {LAUNCH_CHECKLIST_ITEMS.length})
          </h2>
        </div>
        <div className="flex items-center gap-2 text-primary-container font-editorial text-2xl font-semibold tabular-nums">
          <Rocket className="w-5 h-5 text-secondary" />
          <span>{pct}%</span>
        </div>
      </div>

      <div className="w-full h-2.5 rounded bg-surface-container overflow-hidden">
        <div className="h-full bg-sage transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2.5">
        {LAUNCH_CHECKLIST_ITEMS.map((item) => {
          const checked = Boolean(data.launchDone[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleLaunchItem(item.id)}
              aria-pressed={checked}
              className="w-full text-left bg-surface-container-lowest rounded p-4 border border-brass/25 flex items-start gap-3 hover:border-brass transition-colors"
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  checked
                    ? 'bg-primary-container border-primary-container text-secondary-fixed'
                    : 'border-primary-container text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary block">
                  {item.category}
                </span>
                <p
                  className={`text-sm font-medium mt-0.5 ${
                    checked ? 'line-through text-on-surface-variant' : 'text-primary-container'
                  }`}
                >
                  {item.title}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface BooksViewProps {
  onOpenDossier: () => void;
  onOpenFamilies: () => void;
}

export function BooksView({ onOpenDossier, onOpenFamilies }: BooksViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
          Archival Binders &amp; Digital Companions
        </p>
        <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
          Client Workbooks &amp; Dossier Editions
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <article className="bg-primary-container text-on-primary rounded p-6 border border-brass/40 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary-fixed">
              13-Section Digital Record
            </span>
            <h3 className="font-editorial text-2xl font-medium">Care Dossier – Digital</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Interactive client binder covering Care Circle, Legal Wishes, Medications, Providers, Home Safety, and Consent.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDossier}
            className="min-h-[42px] px-4 py-2 rounded bg-secondary text-on-secondary text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2"
          >
            <span>Open Care Dossier</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </article>

        <article className="bg-surface-container-lowest rounded p-6 border border-brass/25 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Standalone Archival File
            </span>
            <h3 className="font-editorial text-2xl font-medium text-primary-container">
              Offline HTML Care Dossier
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Portable single-file HTML workbook formatted for clinic USB drives, kitchen-table laptops, or print binders.
            </p>
          </div>
          <a
            href={FOUNDER_PROFILE.offlineDossierPath}
            download="Care_Dossier_Southern_Well.html"
            className="min-h-[42px] px-4 py-2 rounded bg-surface-container-low border border-brass/35 text-primary-container text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:bg-surface-container"
          >
            <FileDown className="w-4 h-4 text-secondary" />
            <span>Download HTML Edition</span>
          </a>
        </article>

        <article className="bg-surface-container-lowest rounded p-6 border border-brass/25 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Out-of-Area Family Kit
            </span>
            <h3 className="font-editorial text-2xl font-medium text-primary-container">
              Family Preparation Kit
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Foundation readiness checklist, pre-visit clinic question builder, and refrigerator Quick-Reference Care Card.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenFamilies}
              className="flex-1 min-h-[42px] px-3 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5"
            >
              <span>Open Kit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              aria-label="Print workbooks"
              className="min-h-[42px] px-3 py-2 rounded bg-surface-container-low border border-outline-variant text-primary-container"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
