import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Check, Copy, QrCode, ShieldCheck, Upload } from 'lucide-react';
import { generatePin, type ConsultationQrPayload } from '../lib/qrPinUtils';

interface QrPinGeneratorProps {
  onPinGenerated?: (data: { clientId: string; pin: string }) => void | Promise<void>;
  vaultSynced?: boolean;
  externalPayload?: string;
}

export function QrPinGenerator({
  onPinGenerated,
  vaultSynced = false,
  externalPayload,
}: QrPinGeneratorProps) {
  const [rawScan, setRawScan] = useState('');
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [persisting, setPersisting] = useState(false);
  const [persistedToVault, setPersistedToVault] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (externalPayload) {
      setRawScan(externalPayload);
      setError('');
    }
  }, [externalPayload]);

  async function handleDecodedQrText(decodedText: string) {
    setError('');
    setGeneratedPin(null);
    setPersistedToVault(false);

    let parsed: Partial<ConsultationQrPayload>;
    try {
      parsed = JSON.parse(decodedText.trim()) as Partial<ConsultationQrPayload>;
    } catch {
      setError('Could not read QR data. Ensure the scanned code contains valid pass JSON.');
      return;
    }

    if (parsed.type !== 'sw_client_pass' || !parsed.clientId) {
      setError('Unrecognized QR code. Please scan a valid Southern Well consultation pass.');
      return;
    }

    if (!parsed.agreementSigned) {
      setError('Agreement of Services is not marked signed on this pass.');
      return;
    }

    const pin = generatePin(6);
    setActiveClientId(parsed.clientId);
    setGeneratedPin(pin);

    if (onPinGenerated) {
      setPersisting(true);
      try {
        await onPinGenerated({ clientId: parsed.clientId, pin });
        setPersistedToVault(vaultSynced);
      } catch (err) {
        setError(
          err instanceof Error
            ? `PIN generated (${pin}), but saving to Firestore failed: ${err.message}`
            : `PIN generated (${pin}), but saving to Firestore failed.`
        );
      } finally {
        setPersisting(false);
      }
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void handleDecodedQrText(rawScan);
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
      setError(
        'Automatic QR image decoding is unavailable in this browser. Paste the QR JSON payload below.'
      );
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
      setRawScan(rawValue);
      await handleDecodedQrText(rawValue);
    } catch {
      setError('Could not read QR data. Ensure the scanned code contains valid pass JSON.');
    }
  }

  async function handleCopyPin() {
    if (!generatedPin) return;
    try {
      await navigator.clipboard.writeText(generatedPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded p-5 border border-brass/30 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Post-Consultation Access
          </p>
          <h3 className="font-editorial text-lg font-semibold text-primary-container mt-0.5">
            Generate Client PIN from QR Scan
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
            Scan, upload, or paste a signed consultation QR payload to issue a 6-digit household PIN for Services, Care Dossier, and For Families.
          </p>
        </div>
        <QrCode className="w-4 h-4 text-secondary shrink-0 mt-1" aria-hidden="true" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="qr-pin-generator-input"
            className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
          >
            Consultation QR Pass JSON
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
          id="qr-pin-generator-input"
          rows={3}
          value={rawScan}
          onChange={(e) => {
            setRawScan(e.target.value);
            if (error) setError('');
          }}
          placeholder='{"type":"sw_client_pass","clientId":"SW-RM-4081","agreementSigned":true,"nonce":"..."}'
          className="w-full p-3 text-xs font-mono rounded bg-surface-container-low border border-outline-variant focus:border-secondary focus:outline-none text-primary-container"
          required
        />

        <button
          type="submit"
          disabled={persisting}
          className="w-full sm:w-auto min-h-[42px] py-2 px-5 rounded bg-primary-container text-secondary-fixed hover:bg-tertiary-container text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{persisting ? 'Verifying & Registering...' : 'Verify QR & Generate PIN'}</span>
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="text-xs text-red-900 bg-red-50 border border-red-200 rounded p-3 font-medium"
        >
          {error}
        </p>
      )}

      {generatedPin && activeClientId && (
        <div className="p-4 rounded bg-surface-container-low border border-brass/40 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-on-surface-variant">
              Client ID: <strong className="text-primary-container">{activeClientId}</strong>
            </p>
            <p className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
              Generated 6-Digit Access PIN
            </p>
            <p className="text-2xl font-mono tracking-widest font-semibold text-primary-container tabular-nums">
              {generatedPin}
            </p>
            <p className="text-[11px] text-on-surface-variant">
              {persistedToVault
                ? 'Hashed credential saved to Firestore /accessPasses and ready for household login.'
                : 'Sign in as Practice Admin to automatically register this PIN digest in Firestore.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleCopyPin()}
            className="min-h-[40px] px-3.5 py-2 rounded bg-white border border-brass/35 text-xs font-semibold text-primary-container hover:bg-surface-container inline-flex items-center gap-1.5"
          >
            {copied ? (
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
    </div>
  );
}
