import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  LogIn,
  ShieldCheck,
  X,
} from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import { FOUNDER_PROFILE, SERVICE_LABELS } from '../data/conciergeData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { ConsultationRequest, ServiceProtocolId } from '../types/concierge';

interface ConsultationModalProps {
  isOpen: boolean;
  initialService: ServiceProtocolId;
  onClose: () => void;
  onSubmitSuccess: (request: ConsultationRequest) => void;
}

const CITIES = [
  'Hattiesburg, MS',
  'Laurel, MS',
  'Gulfport, MS',
  'Biloxi / Ocean Springs',
  'Petal / Oak Grove',
  'Other Pine Belt / Coast',
];

const FORMATS: ConsultationRequest['preferredFormat'][] = [
  'Phone Call',
  'Video Family Meeting',
  'In-Home Visit',
];

export function ConsultationModal({
  isOpen,
  initialService,
  onClose,
  onSubmitSuccess,
}: ConsultationModalProps) {
  const { user, authReady, authLoading, authError, signInWithGoogle, clearAuthError } =
    useFirebase();
  const [contactName, setContactName] = useState('');
  const [contactEmailOrPhone, setContactEmailOrPhone] = useState('');
  const [lovedOneCity, setLovedOneCity] = useState(CITIES[0]);
  const [serviceInterest, setServiceInterest] = useState<ServiceProtocolId>(initialService);
  const [preferredFormat, setPreferredFormat] =
    useState<ConsultationRequest['preferredFormat']>('Phone Call');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [confirmedRequest, setConfirmedRequest] = useState<ConsultationRequest | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    setServiceInterest(initialService);
  }, [initialService]);

  useEffect(() => {
    if (isOpen && user) {
      setContactName((prev) => prev || user.displayName || '');
      setContactEmailOrPhone((prev) => prev || user.email || '');
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg('');
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submitRequest = async (activeUserUid?: string) => {
    const cleanName = contactName.trim().slice(0, 120);
    const cleanContact = contactEmailOrPhone.trim().slice(0, 160);
    const cleanNotes = notes.trim().slice(0, 2000);

    if (!cleanName || cleanContact.length < 3) {
      setErrorMsg(
        'Please provide your name and a valid phone number or email address (at least 3 characters) so we may reach you.'
      );
      return;
    }

    const referenceNum = `SW-${Math.floor(1000 + Math.random() * 9000)}`;
    const submittedLabel = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    if (activeUserUid) {
      const docId = `sw-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const path = `consultations/${docId}`;
      setSubmitting(true);
      setErrorMsg('');
      try {
        try {
          await setDoc(doc(db, 'consultations', docId), {
            ownerId: activeUserUid,
            referenceCode: referenceNum,
            contactName: cleanName,
            contactEmailOrPhone: cleanContact,
            lovedOneCity,
            serviceInterest,
            preferredFormat,
            notes: cleanNotes,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }

        const created: ConsultationRequest = {
          id: referenceNum,
          docId,
          ownerId: activeUserUid,
          contactName: cleanName,
          contactEmailOrPhone: cleanContact,
          lovedOneCity,
          serviceInterest,
          preferredFormat,
          notes: cleanNotes,
          status: 'pending',
          submittedAt: submittedLabel,
          syncedToCloud: true,
        };
        setConfirmedRequest(created);
        onSubmitSuccess(created);
      } catch (wrappedErr) {
        setFatalError(
          wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr))
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const localDraft: ConsultationRequest = {
      id: referenceNum,
      contactName: cleanName,
      contactEmailOrPhone: cleanContact,
      lovedOneCity,
      serviceInterest,
      preferredFormat,
      notes: cleanNotes,
      status: 'pending',
      submittedAt: submittedLabel,
      syncedToCloud: false,
    };
    setConfirmedRequest(localDraft);
    onSubmitSuccess(localDraft);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitRequest(user?.uid);
  };

  const handleSignInAndSubmit = async () => {
    const cleanName = contactName.trim();
    const cleanContact = contactEmailOrPhone.trim();
    const signedInUser = await signInWithGoogle();
    if (!signedInUser) return;
    if (cleanName && cleanContact.length >= 3) {
      await submitRequest(signedInUser.uid);
    }
  };

  const handleResetAndClose = () => {
    setConfirmedRequest(null);
    setContactName('');
    setContactEmailOrPhone('');
    setNotes('');
    clearAuthError();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
    >
      <div className="w-full sm:max-w-lg bg-surface rounded-t sm:rounded shadow-xl border border-brass/40 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md px-5 py-4 border-b border-brass/25 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Private Client Intake
            </p>
            <h2
              id="consultation-dialog-title"
              className="font-editorial text-xl font-semibold text-primary-container leading-tight"
            >
              {confirmedRequest ? 'Consultation Request Logged' : 'Schedule Family Consultation'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close consultation request"
            className="min-w-[44px] min-h-[44px] rounded flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedRequest ? (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="p-4 rounded bg-primary-container text-on-primary space-y-2 border border-brass/35">
              <div className="flex items-center gap-2 text-secondary-fixed">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold tracking-wider tabular-nums">
                  Reference {confirmedRequest.id}
                </span>
              </div>
              <p className="font-editorial text-lg font-medium">
                Thank you, {confirmedRequest.contactName}.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {confirmedRequest.syncedToCloud ? (
                  <>
                    Your confidential inquiry for{' '}
                    <strong className="text-on-primary">{confirmedRequest.lovedOneCity}</strong> has been submitted directly to{' '}
                    {FOUNDER_PROFILE.fullName}&apos;s Practice Portal ({FOUNDER_PROFILE.phone}).
                  </>
                ) : (
                  <>
                    Your confidential inquiry draft for{' '}
                    <strong className="text-on-primary">{confirmedRequest.lovedOneCity}</strong> is saved in this browser for{' '}
                    {FOUNDER_PROFILE.fullName} ({FOUNDER_PROFILE.phone}).
                  </>
                )}
              </p>
            </div>

            <dl className="bg-surface-container-low rounded p-4 space-y-3 text-sm border border-brass/25">
              <div className="flex justify-between gap-4">
                <dt className="text-on-surface-variant">Protocol Focus</dt>
                <dd className="font-medium text-primary-container text-right">
                  {SERVICE_LABELS[confirmedRequest.serviceInterest]}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-brass/15 pt-2.5">
                <dt className="text-on-surface-variant">Preferred Format</dt>
                <dd className="font-medium text-primary-container">{confirmedRequest.preferredFormat}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-brass/15 pt-2.5">
                <dt className="text-on-surface-variant">Reply Channel</dt>
                <dd className="font-medium text-primary-container">{confirmedRequest.contactEmailOrPhone}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-brass/15 pt-2.5">
                <dt className="text-on-surface-variant">Portal Status</dt>
                <dd className="font-medium text-primary-container capitalize">
                  {confirmedRequest.syncedToCloud
                    ? `${confirmedRequest.status ?? 'pending'} · Cloud Submitted`
                    : 'Local Session Draft'}
                </dd>
              </div>
            </dl>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {confirmedRequest.syncedToCloud
                ? 'Live status updates for your consultation appear in your header banner whenever you return while signed in.'
                : 'Your consultation summary is saved in your session header. Sign in with Google next time to submit directly to our Practice Portal.'}
            </p>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full min-h-[48px] py-3 px-4 rounded bg-primary-container text-secondary-fixed font-semibold text-xs uppercase tracking-wider hover:bg-tertiary-container transition-colors"
            >
              Return to Southern Well
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-2.5 p-3 rounded bg-surface-container-low border border-brass/25 text-xs text-on-surface-variant">
              <ShieldCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <span>
                Complimentary 30-minute conversation with {FOUNDER_PROFILE.fullName} ({FOUNDER_PROFILE.phone}). Strictly confidential, non-clinical guidance.
              </span>
            </div>

            {authReady && (
              <div className="p-3 rounded bg-surface-container-low border border-brass/30 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                {user ? (
                  <div className="flex items-center gap-2 text-primary-container font-medium">
                    <Cloud className="w-4 h-4 text-sage shrink-0" />
                    <span>Submitting to Practice Portal as {user.email}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-on-surface-variant">
                      Sign in with Google to submit directly to our Practice Portal &amp; track status.
                    </span>
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() => void handleSignInAndSubmit()}
                      className="min-h-[36px] px-3 py-1.5 rounded bg-primary-container text-secondary-fixed text-[11px] font-semibold uppercase tracking-wider hover:bg-tertiary-container disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 shrink-0"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{authLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {(errorMsg || authError) && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
              >
                {errorMsg || authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="sw-name" className="block text-xs font-semibold text-primary">
                Your Name
              </label>
              <input
                id="sw-name"
                type="text"
                maxLength={120}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g., Claire Holloway"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sw-contact" className="block text-xs font-semibold text-primary">
                Phone Number or Email
              </label>
              <input
                id="sw-contact"
                type="text"
                maxLength={160}
                value={contactEmailOrPhone}
                onChange={(e) => setContactEmailOrPhone(e.target.value)}
                placeholder="(601) 555-0192 or claire@example.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="sw-city" className="block text-xs font-semibold text-primary">
                  Loved One&apos;s Location
                </label>
                <select
                  id="sw-city"
                  value={lovedOneCity}
                  onChange={(e) => setLovedOneCity(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sw-service" className="block text-xs font-semibold text-primary">
                  Area of Interest
                </label>
                <select
                  id="sw-service"
                  value={serviceInterest}
                  onChange={(e) => setServiceInterest(e.target.value as ServiceProtocolId)}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {(Object.keys(SERVICE_LABELS) as ServiceProtocolId[]).map((key) => (
                    <option key={key} value={key}>
                      {SERVICE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-primary">Preferred Meeting Format</span>
              <div className="grid grid-cols-3 gap-2">
                {FORMATS.map((format) => {
                  const selected = preferredFormat === format;
                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setPreferredFormat(format)}
                      className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-medium transition-colors border ${
                        selected
                          ? 'bg-primary-container text-on-primary border-primary-container'
                          : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:text-primary'
                      }`}
                    >
                      {format}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sw-notes" className="block text-xs font-semibold text-primary">
                Brief Family Context (Optional)
              </label>
              <textarea
                id="sw-notes"
                rows={3}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share upcoming appointments, out-of-state family coordination needs, or preferred call times..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 min-h-[48px] py-3 px-4 rounded bg-primary-container text-secondary-fixed font-semibold text-xs uppercase tracking-wider hover:bg-tertiary-container disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>
                  {submitting
                    ? 'Submitting Request...'
                    : user
                      ? 'Submit Confidential Request'
                      : 'Save Consultation Draft'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
