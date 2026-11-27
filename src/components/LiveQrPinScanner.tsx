import { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Check, Copy, RefreshCw } from 'lucide-react';
import { generatePin, type ConsultationQrPayload } from '../lib/qrPinUtils';

interface LiveQrPinScannerProps {
  onPinGenerated?: (data: { clientId: string; pin: string }) => void | Promise<void>;
  vaultSynced?: boolean;
}

export function LiveQrPinScanner({
  onPinGenerated,
  vaultSynced = false,
}: LiveQrPinScannerProps) {
  const reactId = useId().replace(/:/g, '');
  const scannerContainerId = `sw-qr-camera-reader-${reactId}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const mountedRef = useRef(true);

  const [scanning, setScanning] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [persisting, setPersisting] = useState(false);
  const [persistedToVault, setPersistedToVault] = useState(false);
  const [copied, setCopied] = useState(false);

  async function stopScanner() {
    const instance = scannerRef.current;
    scannerRef.current = null;
    if (!instance) {
      if (mountedRef.current) setScanning(false);
      return;
    }

    try {
      if (instance.isScanning) {
        await instance.stop();
      }
      await instance.clear();
    } catch {
      // Ignore cleanup errors if already stopped or unmounted
    } finally {
      if (mountedRef.current) setScanning(false);
    }
  }

  async function startScanner() {
    if (!mountedRef.current) return;
    setError('');
    setGeneratedPin(null);
    setActiveClientId(null);
    setPersistedToVault(false);
    hasScannedRef.current = false;

    if (scannerRef.current) {
      await stopScanner();
    }

    const containerEl = document.getElementById(scannerContainerId);
    if (!containerEl || !mountedRef.current) return;

    const html5QrCode = new Html5Qrcode(scannerContainerId);
    scannerRef.current = html5QrCode;

    try {
      setScanning(true);
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        async (decodedText) => {
          if (hasScannedRef.current || !mountedRef.current) return;

          try {
            const parsed = JSON.parse(decodedText.trim()) as Partial<ConsultationQrPayload>;

            if (parsed.type !== 'sw_client_pass' || !parsed.clientId) {
              setError('Unrecognized QR pass. Scan a valid Southern Well consultation QR code.');
              return;
            }

            if (!parsed.agreementSigned) {
              setError('Agreement of Services must be signed before generating a PIN.');
              return;
            }

            hasScannedRef.current = true;
            const pin = generatePin(6);

            setActiveClientId(parsed.clientId);
            setGeneratedPin(pin);
            await stopScanner();

            if (onPinGenerated) {
              setPersisting(true);
              try {
                await onPinGenerated({ clientId: parsed.clientId, pin });
                if (mountedRef.current) {
                  setPersistedToVault(vaultSynced);
                }
              } catch (saveErr) {
                if (mountedRef.current) {
                  setError(
                    saveErr instanceof Error
                      ? `PIN generated (${pin}), but Firestore registration failed: ${saveErr.message}`
                      : `PIN generated (${pin}), but Firestore registration failed.`
                  );
                }
              } finally {
                if (mountedRef.current) setPersisting(false);
              }
            }
          } catch {
            setError('QR code scanned, but its data format was not recognized.');
          }
        },
        () => {
          // Per-frame scan misses occur continuously while aiming; keep UI quiet
        }
      );
    } catch (err) {
      if (mountedRef.current) {
        setScanning(false);
        setError(
          err instanceof Error
            ? `Camera unavailable or permission denied: ${err.message}`
            : 'Could not access camera. Check browser camera permissions.'
        );
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    void startScanner();

    return () => {
      mountedRef.current = false;
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            Camera Scan → PIN
          </p>
          <h3 className="font-editorial text-lg font-semibold text-primary-container mt-0.5">
            Scan Client QR Pass
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-xl leading-relaxed">
            Point a phone camera or webcam at the signed consultation QR code to issue a 6-digit access PIN.
          </p>
        </div>

        {scanning ? (
          <button
            type="button"
            onClick={() => void stopScanner()}
            className="min-h-[38px] px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border border-brass/35 text-primary-container hover:bg-surface-container-low inline-flex items-center gap-1.5 shrink-0"
          >
            <CameraOff className="w-3.5 h-3.5 text-secondary" />
            <span>Stop Camera</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startScanner()}
            className="min-h-[38px] px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-primary-container text-secondary-fixed hover:bg-tertiary-container inline-flex items-center gap-1.5 shrink-0"
          >
            {generatedPin ? (
              <RefreshCw className="w-3.5 h-3.5" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            <span>{generatedPin ? 'Scan Again' : 'Start Camera'}</span>
          </button>
        )}
      </div>

      {/* Camera viewfinder mount */}
      <div
        id={scannerContainerId}
        className="w-full min-h-[240px] rounded overflow-hidden bg-surface-container-low border border-brass/25"
      />

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
              {persisting ? 'Registering 6-Digit Access PIN...' : 'Generated 6-Digit Access PIN'}
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
