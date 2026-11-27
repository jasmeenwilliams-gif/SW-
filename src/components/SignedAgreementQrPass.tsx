import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, QrCode } from 'lucide-react';
import { createClientQrPayload } from '../lib/qrPinUtils';

interface SignedAgreementQrPassProps {
  clientId: string;
  agreementSigned: boolean;
  onUsePayload?: (payload: string) => void;
}

export function SignedAgreementQrPass({
  clientId,
  agreementSigned,
  onUsePayload,
}: SignedAgreementQrPassProps) {
  const [copied, setCopied] = useState(false);

  const qrPayload = useMemo(() => {
    if (!agreementSigned || !clientId.trim()) return null;
    return createClientQrPayload(clientId.trim(), true);
  }, [clientId, agreementSigned]);

  async function handleCopy() {
    if (!qrPayload) return;
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  }

  if (!agreementSigned) {
    return (
      <div className="p-5 rounded bg-surface-container-lowest border border-brass/30 text-sm text-on-surface-variant leading-relaxed space-y-2">
        <div className="flex items-center gap-2 text-primary-container font-semibold text-xs uppercase tracking-wider">
          <QrCode className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
          <span>Client Access QR Pass Locked</span>
        </div>
        <p>
          Complete and sign the <strong className="text-primary-container">Agreement of Services</strong>{' '}
          after the initial consultation to generate and display the client QR pass.
        </p>
      </div>
    );
  }

  if (!qrPayload) return null;

  return (
    <div className="p-6 rounded bg-surface-container-lowest border border-brass/35 shadow-sm space-y-4 text-center">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-secondary font-semibold">
          Agreement Signed
        </p>
        <h3 className="font-editorial text-xl font-semibold text-primary-container mt-1">
          Client Access QR Pass
        </h3>
        <p className="text-xs text-on-surface-variant mt-1">
          Client ID:{' '}
          <strong className="text-primary-container tabular-nums">{clientId}</strong>
        </p>
      </div>

      {/* Light background preserves quiet zone for reliable scanning */}
      <div className="inline-flex p-4 rounded bg-white border border-brass/25">
        <QRCodeSVG
          value={qrPayload}
          size={192}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#0b192c"
          title={`Access QR code for ${clientId}`}
        />
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        Scan this code to generate or verify a client PIN for{' '}
        <strong className="text-primary-container">Services</strong>,{' '}
        <strong className="text-primary-container">Care Dossier</strong>, and{' '}
        <strong className="text-primary-container">For Families</strong>.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="min-h-[38px] px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant text-xs font-semibold text-primary-container hover:bg-surface-container inline-flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-sage" />
              <span>Copied Payload</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-secondary" />
              <span>Copy Pass JSON</span>
            </>
          )}
        </button>
        {onUsePayload && (
          <button
            type="button"
            onClick={() => onUsePayload(qrPayload)}
            className="min-h-[38px] px-3 py-1.5 rounded bg-primary-container text-secondary-fixed hover:bg-tertiary-container text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Test in PIN Generator</span>
          </button>
        )}
      </div>
    </div>
  );
}
