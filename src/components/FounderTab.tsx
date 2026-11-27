import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  Compass,
  GraduationCap,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import { FOUNDER_PROFILE, GENERATED_IMAGES, SERVICE_LABELS } from '../data/conciergeData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  ConsultationRequest,
  ConsultationStatus,
  ServiceProtocolId,
} from '../types/concierge';
import { CloudSyncBanner } from './CloudSyncBanner';
import { ResilientImage } from './ResilientImage';
import { ScopeNotice } from './ScopeNotice';

interface FounderTabProps {
  onRequestService: (service: ServiceProtocolId) => void;
}

interface AdminConsultationRow extends ConsultationRequest {
  docId: string;
  createdAtMs: number;
}

const STATUS_OPTIONS: ConsultationStatus[] = [
  'pending',
  'scheduled',
  'completed',
  'archived',
];

const SERVICE_ID_SET = new Set<ServiceProtocolId>([
  'foundation-assessment',
  'medication-concierge',
  'clinic-accompaniment',
  'advance-care-planning',
  'general-consultation',
]);

function formatTimestampMs(ts: unknown): { label: string; ms: number } {
  if (ts && typeof ts === 'object' && 'toMillis' in ts) {
    const t = ts as Timestamp;
    const ms = t.toMillis();
    return {
      ms,
      label: new Date(ms).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  }
  return { ms: 0, label: 'Just now' };
}

export function FounderTab({ onRequestService }: FounderTabProps) {
  const { user, userProfile, isAdmin, authReady } = useFirebase();
  const [consultations, setConsultations] = useState<AdminConsultationRow[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    if (!authReady || !user || !userProfile || !isAdmin) {
      setConsultations([]);
      return;
    }

    const colRef = collection(db, 'consultations');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const rows: AdminConsultationRow[] = snapshot.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = formatTimestampMs(data.createdAt);
          const rawService = String(data.serviceInterest ?? 'general-consultation');
          const serviceInterest: ServiceProtocolId = SERVICE_ID_SET.has(
            rawService as ServiceProtocolId
          )
            ? (rawService as ServiceProtocolId)
            : 'general-consultation';

          const rawFormat = String(data.preferredFormat ?? 'Phone Call');
          const preferredFormat: ConsultationRequest['preferredFormat'] =
            rawFormat === 'Video Family Meeting' || rawFormat === 'In-Home Visit'
              ? rawFormat
              : 'Phone Call';

          const rawStatus = String(data.status ?? 'pending');
          const status: ConsultationStatus = STATUS_OPTIONS.includes(
            rawStatus as ConsultationStatus
          )
            ? (rawStatus as ConsultationStatus)
            : 'pending';

          return {
            id: String(data.referenceCode ?? d.id),
            docId: d.id,
            ownerId: String(data.ownerId ?? ''),
            contactName: String(data.contactName ?? ''),
            contactEmailOrPhone: String(data.contactEmailOrPhone ?? ''),
            lovedOneCity: String(data.lovedOneCity ?? ''),
            serviceInterest,
            preferredFormat,
            notes: String(data.notes ?? ''),
            status,
            submittedAt: ts.label,
            createdAtMs: ts.ms,
            syncedToCloud: true,
          };
        });

        rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setConsultations(rows);
      },
      (listenErr) => {
        try {
          handleFirestoreError(listenErr, OperationType.LIST, 'consultations');
        } catch (wrappedErr) {
          setFatalError(
            wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr))
          );
        }
      }
    );

    return () => unsub();
  }, [authReady, user, userProfile, isAdmin]);

  const handleStatusChange = async (docId: string, nextStatus: ConsultationStatus) => {
    const path = `consultations/${docId}`;
    setUpdatingId(docId);
    try {
      try {
        await updateDoc(doc(db, 'consultations', docId), {
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    } catch (wrappedErr) {
      setFatalError(
        wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = consultations.filter((c) => c.status === 'pending').length;
  const scheduledCount = consultations.filter((c) => c.status === 'scheduled').length;
  const completedCount = consultations.filter((c) => c.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14 space-y-8 lg:space-y-10">
      {/* Founder Editorial Intro */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
        <div className="lg:col-span-5">
          <div className="aspect-[3/4] lg:aspect-auto lg:h-full rounded overflow-hidden shadow-sm border border-brass/35 bg-surface-container">
            <ResilientImage
              src={GENERATED_IMAGES.founderPortrait}
              alt="Portrait of Jasmeen Williams, LPN, BS-HHS, Founder and Executive Senior Advocate of Southern Well Senior Concierge"
              className="w-full h-full object-cover object-top"
              fallbackTitle={FOUNDER_PROFILE.fullName}
            />
          </div>
        </div>

        <div className="lg:col-span-7 bg-surface-container-low rounded p-6 sm:p-8 lg:p-10 border border-brass/30 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
              {FOUNDER_PROFILE.role}
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl text-primary-container font-semibold mt-2">
              {FOUNDER_PROFILE.fullName}{' '}
              <span className="text-on-surface-variant text-xl sm:text-2xl font-normal italic block sm:inline">
                (Non-Clinical Advocacy Standard)
              </span>
            </h1>
            <p className="text-sm text-secondary font-medium mt-1.5">
              South Mississippi Sole Proprietorship · {FOUNDER_PROFILE.chambers}
            </p>

            {/* Credentials Strip */}
            <div className="mt-5 p-4 bg-surface-container-lowest rounded border border-brass/25 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary-container">
                    Licensed Practical Nurse (LPN)
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Mississippi Board of Nursing · Applied strictly for observational literacy
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary-container">
                    B.S. Health &amp; Human Services
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Strategic Health Systems Navigation &amp; Family Advocacy
                  </p>
                </div>
              </div>
            </div>

            <blockquote className="mt-6 font-editorial italic text-xl sm:text-2xl text-primary-container leading-relaxed">
              &ldquo;We do not replace your doctors, nor do we take the place of family. We are the steady, watchful advocate who bridges the two—ensuring nothing is overlooked.&rdquo;
            </blockquote>

            <p className="text-sm text-on-surface-variant mt-4 leading-relaxed">
              Serving older adults ages 70 to 95 across the Pine Belt (Hattiesburg, Laurel, Petal) and Mississippi Gulf Coast (Gulfport, Biloxi, Ocean Springs), Southern Well was built as a dedicated private-pay practice for families who want steady, personal stewardship without institutional turnover.
            </p>
            <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
              Whether family members live right down the road or across the South in Jackson, New Orleans, Mobile, Houston, or Atlanta, {FOUNDER_PROFILE.firstName}&apos;s 10+ years of geriatric and chronic care nursing knowledge inform every Care Dossier and clinic visit—strictly as non-clinical navigation working alongside your loved one&apos;s physicians.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-brass/25 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onRequestService('general-consultation')}
              className="min-h-[48px] px-5 py-3 rounded bg-secondary text-on-secondary font-semibold text-xs uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center gap-2"
            >
              <span>Speak Directly with {FOUNDER_PROFILE.firstName}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
              <a
                href={FOUNDER_PROFILE.phoneHref}
                className="inline-flex items-center gap-1.5 font-semibold text-primary-container hover:text-secondary transition-colors tabular-nums"
              >
                <Phone className="w-3.5 h-3.5 text-secondary" />
                <span>{FOUNDER_PROFILE.phone}</span>
              </a>
              <span aria-hidden="true">·</span>
              <span>{FOUNDER_PROFILE.website}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Experience & Boundary Stewardship */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            icon: Award,
            kicker: 'Navigational Insight',
            title: '10+ Years Geriatric Perspective',
            detail:
              'Clinical literacy helps us translate specialist terminology into plain-language summaries and ensure nothing is missed between appointments.',
          },
          {
            icon: Compass,
            kicker: 'Regional Relationships',
            title: 'Vetted South MS Network',
            detail:
              'Longstanding familiarity with Pine Belt clinics, coastal hospitals, elder law practitioners, and credentialed clinical social workers.',
          },
          {
            icon: ShieldCheck,
            kicker: 'Ethical Clarity',
            title: 'Strict Non-Clinical Boundary',
            detail:
              'We never administer medications, perform clinical procedures, or issue medical diagnoses—preserving clear accountability with your physicians.',
          },
        ].map(({ icon: Icon, kicker, title, detail }) => (
          <div
            key={title}
            className="bg-surface-container-lowest rounded p-6 border border-brass/25 shadow-[0_4px_20px_-2px_rgba(11,25,44,0.04)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                {kicker}
              </span>
              <Icon className="w-4 h-4 text-secondary" />
            </div>
            <h2 className="font-editorial text-xl font-medium text-primary-container">{title}</h2>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{detail}</p>
          </div>
        ))}
      </section>

      {/* Practice Admin Consultation Queue (Visible strictly when signed in as Practice Admin) */}
      {authReady && isAdmin && (
        <section className="no-print bg-surface-container-lowest rounded border border-brass/40 p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brass/20 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
                Practice Administration · Executive Queue
              </p>
              <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
                Incoming Family Consultation Requests
              </h2>
            </div>

            <div className="flex items-center gap-4 text-xs tabular-nums">
              <div className="px-3 py-2 rounded bg-surface-container-low border border-brass/25">
                <span className="text-on-surface-variant block text-[10px] uppercase tracking-wider">
                  Pending
                </span>
                <span className="font-semibold text-primary-container text-base">{pendingCount}</span>
              </div>
              <div className="px-3 py-2 rounded bg-surface-container-low border border-brass/25">
                <span className="text-on-surface-variant block text-[10px] uppercase tracking-wider">
                  Scheduled
                </span>
                <span className="font-semibold text-primary-container text-base">{scheduledCount}</span>
              </div>
              <div className="px-3 py-2 rounded bg-surface-container-low border border-brass/25">
                <span className="text-on-surface-variant block text-[10px] uppercase tracking-wider">
                  Completed
                </span>
                <span className="font-semibold text-primary-container text-base">{completedCount}</span>
              </div>
            </div>
          </div>

          {consultations.length === 0 ? (
            <div className="p-6 rounded bg-surface-container-low border border-brass/20 text-center text-sm text-on-surface-variant">
              No cloud-submitted consultation requests are currently in the intake queue.
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((item) => (
                <div
                  key={item.docId}
                  className="p-4 sm:p-5 rounded bg-surface-container-low border border-brass/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-secondary tabular-nums">{item.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-primary-container">{item.contactName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-on-surface-variant">{item.lovedOneCity}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-on-surface-variant inline-flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5 text-secondary" />
                        {item.submittedAt}
                      </span>
                    </div>
                    <p className="text-sm text-primary-container">
                      {SERVICE_LABELS[item.serviceInterest]} ({item.preferredFormat}) ·{' '}
                      <span className="text-on-surface-variant">{item.contactEmailOrPhone}</span>
                    </p>
                    {item.notes && (
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label
                      htmlFor={`status-${item.docId}`}
                      className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
                    >
                      Status
                    </label>
                    <select
                      id={`status-${item.docId}`}
                      disabled={updatingId === item.docId}
                      value={item.status ?? 'pending'}
                      onChange={(e) =>
                        void handleStatusChange(item.docId, e.target.value as ConsultationStatus)
                      }
                      className="min-h-[40px] px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant text-xs font-semibold text-primary-container capitalize focus:outline-none focus:border-brass disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st} className="capitalize">
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Founder Pledge Banner */}
      <section className="bg-primary-container text-on-primary rounded border border-brass/35 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 sconce-glow">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-secondary-fixed">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
              The Southern Well Standard
            </span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-medium">
            Every engagement begins with listening, not a checklist
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Before we ever build a Care Dossier or step into a clinic waiting room, we sit down with your family to honor your parent&apos;s dignity, lifelong habits, and independence.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRequestService('foundation-assessment')}
          className="min-h-[48px] px-5 py-3 rounded bg-secondary text-on-secondary font-semibold text-xs uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors whitespace-nowrap shrink-0 self-start md:self-center"
        >
          Request Foundation Assessment
        </button>
      </section>

      <CloudSyncBanner workspaceLabel="Practice Portal" />

      <ScopeNotice />
    </div>
  );
}
