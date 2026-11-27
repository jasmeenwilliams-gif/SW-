import { useEffect, useState } from 'react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  FileText,
  FolderOpen,
  LayoutGrid,
  Lock,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react';
import { collection, onSnapshot, query, where, type Timestamp } from 'firebase/firestore';
import { AboutLandingTab } from './components/AboutLandingTab';
import { AccessGate, type ProtectedArea } from './components/AccessGate';
import { ConsultationModal } from './components/ConsultationModal';
import { DigitalCareDossier } from './components/DigitalCareDossier';
import { FounderTab } from './components/FounderTab';
import { LaunchKitTab } from './components/LaunchKitTab';
import { PracticeOpsTab } from './components/PracticeOpsTab';
import { ServicesTab } from './components/ServicesTab';
import { SwMonogramCrest } from './components/SwMonogramCrest';
import { useFirebase } from './contexts/FirebaseContext';
import { FOUNDER_PROFILE, SCOPE_NOTICE_TEXT } from './data/conciergeData';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import type {
  ConsultationRequest,
  ConsultationStatus,
  ServiceProtocolId,
  TabPath,
} from './types/concierge';

const NAV_ITEMS: { id: TabPath; label: string; mobileLabel: string; icon: typeof LayoutGrid }[] = [
  { id: 'about', label: 'About', mobileLabel: 'About', icon: LayoutGrid },
  { id: 'services', label: 'Services', mobileLabel: 'Services', icon: Stethoscope },
  { id: 'the-care-dossier', label: 'Care Dossier', mobileLabel: 'Dossier', icon: FileText },
  { id: 'for-families', label: 'For Families', mobileLabel: 'Families', icon: Users },
  { id: 'credentials', label: 'Credentials', mobileLabel: 'Creds', icon: Award },
  { id: 'operations', label: 'Operations', mobileLabel: 'Ops', icon: Briefcase },
];

const INQUIRY_STORAGE_KEY = 'sw_latest_inquiry_v1';
const UNLOCKED_STORAGE_KEY = 'sw_unlocked_areas_v1';

interface PortalAccessState {
  family_suite: boolean;
  operations: boolean;
  agreementSigned: boolean;
  familyLabel?: string;
  opsLabel?: string;
  manualLockFamily?: boolean;
  manualLockOps?: boolean;
}

function loadPortalAccessState(): PortalAccessState {
  try {
    const raw = sessionStorage.getItem(UNLOCKED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PortalAccessState>;
      return {
        family_suite: Boolean(parsed.family_suite),
        operations: Boolean(parsed.operations),
        agreementSigned: Boolean(parsed.agreementSigned),
        familyLabel: typeof parsed.familyLabel === 'string' ? parsed.familyLabel : undefined,
        opsLabel: typeof parsed.opsLabel === 'string' ? parsed.opsLabel : undefined,
        manualLockFamily: Boolean(parsed.manualLockFamily),
        manualLockOps: Boolean(parsed.manualLockOps),
      };
    }
  } catch {
    // Ignore storage errors
  }
  return { family_suite: false, operations: false, agreementSigned: false };
}

function savePortalAccessState(next: PortalAccessState) {
  try {
    sessionStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
}

function getInitialTab(): TabPath {
  const hash = window.location.hash.replace('#', '');
  if (
    hash === 'about' ||
    hash === 'services' ||
    hash === 'the-care-dossier' ||
    hash === 'for-families' ||
    hash === 'credentials' ||
    hash === 'operations'
  ) {
    return hash;
  }
  return 'about';
}

export default function App() {
  const { user, userProfile, authReady } = useFirebase();
  const [activeTab, setActiveTab] = useState<TabPath>(getInitialTab);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<ServiceProtocolId>('foundation-assessment');
  const [portalAccess, setPortalAccess] = useState<PortalAccessState>(loadPortalAccessState);
  const [latestRequest, setLatestRequest] = useState<ConsultationRequest | null>(() => {
    try {
      const saved = localStorage.getItem(INQUIRY_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ConsultationRequest) : null;
    } catch {
      return null;
    }
  });
  const [cloudLatestRequest, setCloudLatestRequest] = useState<ConsultationRequest | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!authReady || !user || !userProfile) {
      setCloudLatestRequest(null);
      return;
    }

    const q = query(collection(db, 'consultations'), where('ownerId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setCloudLatestRequest(null);
          return;
        }

        const mapped = snapshot.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const created = data.createdAt as Timestamp | undefined;
          const ms =
            created && typeof created === 'object' && 'toMillis' in created
              ? created.toMillis()
              : 0;
          const rawStatus = String(data.status ?? 'pending');
          const status: ConsultationStatus =
            rawStatus === 'scheduled' || rawStatus === 'completed' || rawStatus === 'archived'
              ? rawStatus
              : 'pending';

          return {
            ms,
            item: {
              id: String(data.referenceCode ?? d.id),
              docId: d.id,
              ownerId: String(data.ownerId ?? user.uid),
              contactName: String(data.contactName ?? ''),
              contactEmailOrPhone: String(data.contactEmailOrPhone ?? ''),
              lovedOneCity: String(data.lovedOneCity ?? ''),
              serviceInterest: String(
                data.serviceInterest ?? 'general-consultation'
              ) as ServiceProtocolId,
              preferredFormat: String(
                data.preferredFormat ?? 'Phone Call'
              ) as ConsultationRequest['preferredFormat'],
              notes: String(data.notes ?? ''),
              status,
              submittedAt:
                ms > 0
                  ? new Date(ms).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'Just now',
              syncedToCloud: true,
            } satisfies ConsultationRequest,
          };
        });

        mapped.sort((a, b) => b.ms - a.ms);
        setCloudLatestRequest(mapped[0]?.item ?? null);
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
  }, [authReady, user, userProfile]);

  const handleNavigate = (tab: TabPath) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenConsultation = (service: ServiceProtocolId) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleRequestSuccess = (req: ConsultationRequest) => {
    setLatestRequest(req);
    try {
      localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(req));
    } catch {
      // Ignore storage errors
    }
  };

  const handleUnlockArea = (
    area: ProtectedArea,
    meta?: { label?: string; method: 'pin' | 'google_admin' }
  ) => {
    setPortalAccess((prev) => {
      const next: PortalAccessState =
        area === 'operations'
          ? {
              ...prev,
              operations: true,
              opsLabel: meta?.label ?? prev.opsLabel ?? 'Jasmeen Williams, LPN, BS-HHS',
              manualLockOps: false,
            }
          : {
              ...prev,
              family_suite: true,
              familyLabel: meta?.label ?? prev.familyLabel ?? 'Authorized Household',
              manualLockFamily: false,
            };
      savePortalAccessState(next);
      return next;
    });
  };

  const handleLockArea = (area: ProtectedArea) => {
    setPortalAccess((prev) => {
      const next: PortalAccessState =
        area === 'operations'
          ? { ...prev, operations: false, opsLabel: undefined, manualLockOps: true }
          : { ...prev, family_suite: false, familyLabel: undefined, manualLockFamily: true };
      savePortalAccessState(next);
      return next;
    });
  };

  const handleLockAll = () => {
    setPortalAccess((prev) => {
      const next: PortalAccessState = {
        ...prev,
        family_suite: false,
        operations: false,
        familyLabel: undefined,
        opsLabel: undefined,
        manualLockFamily: true,
        manualLockOps: true,
      };
      savePortalAccessState(next);
      return next;
    });
  };

  const handleAgreementChange = (signed: boolean) => {
    setPortalAccess((prev) => {
      const next: PortalAccessState = { ...prev, agreementSigned: signed };
      savePortalAccessState(next);
      return next;
    });
  };

  const isNavLocked = (tabId: TabPath): boolean => {
    if (tabId === 'operations') return !portalAccess.operations;
    if (tabId === 'services' || tabId === 'the-care-dossier' || tabId === 'for-families') {
      return !portalAccess.family_suite;
    }
    return false;
  };

  const currentProtectedArea: ProtectedArea | null =
    activeTab === 'operations'
      ? 'operations'
      : activeTab === 'services' || activeTab === 'the-care-dossier' || activeTab === 'for-families'
        ? 'family_suite'
        : null;

  const isCurrentAreaUnlocked =
    currentProtectedArea === 'operations'
      ? portalAccess.operations
      : currentProtectedArea === 'family_suite'
        ? portalAccess.family_suite
        : false;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Top Bar: Clean 3-Zone Contract */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-md pt-safe border-b border-brass/20 shadow-[0_1px_8px_rgba(11,25,44,0.04)]">
        <div className="max-w-7xl mx-auto h-16 md:h-20 px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate('about')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 min-h-[44px]"
          >
            <SwMonogramCrest className="w-8 h-8 text-secondary shrink-0" />
            <span className="font-editorial text-xl font-semibold text-primary-container tracking-tight">
              Southern Well
            </span>
          </button>

          {/* Zone 2: Desktop Single-Line Navigation */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-5">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              const locked = isNavLocked(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-[44px] inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    active
                      ? 'text-secondary border-secondary'
                      : 'text-on-surface-variant border-transparent hover:text-primary-container hover:border-brass/40'
                  }`}
                >
                  <span>{item.label}</span>
                  {locked && <Lock className="w-3 h-3 opacity-60 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleOpenConsultation('general-consultation')}
              className="min-h-[42px] px-4 sm:px-5 py-2 rounded bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              Schedule Consultation
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 w-full pt-16 md:pt-20 pb-16 lg:pb-0">
        {(cloudLatestRequest ?? latestRequest) && (() => {
          const displayedRequest = cloudLatestRequest ?? latestRequest!;
          const statusLabel =
            displayedRequest.status === 'scheduled'
              ? 'Scheduled'
              : displayedRequest.status === 'completed'
                ? 'Completed'
                : displayedRequest.status === 'archived'
                  ? 'Archived'
                  : 'Pending Review';
          return (
            <div className="no-print bg-surface-container-low border-b border-brass/25">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  <p className="text-xs sm:text-sm text-primary-container truncate">
                    <span className="font-semibold tabular-nums">{displayedRequest.id}</span>
                    <span className="text-on-surface-variant">
                      {' '}
                      · {displayedRequest.syncedToCloud ? `Portal Status: ${statusLabel}` : 'Consultation draft saved'} for{' '}
                      {displayedRequest.lovedOneCity} ({displayedRequest.preferredFormat})
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenConsultation(displayedRequest.serviceInterest)}
                  className="text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary-container transition-colors whitespace-nowrap"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          );
        })()}

        {(portalAccess.family_suite || portalAccess.operations) && (
          <div className="no-print bg-surface-container-low border-b border-brass/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="text-on-surface-variant truncate">
                {currentProtectedArea && isCurrentAreaUnlocked ? (
                  <>
                    <span className="font-semibold text-primary-container">
                      {currentProtectedArea === 'operations'
                        ? 'Operations Access Active'
                        : 'Client & Family Suite Unlocked'}
                    </span>
                    {' · '}
                    <span>
                      {currentProtectedArea === 'operations'
                        ? portalAccess.opsLabel || 'Jasmeen Williams, LPN, BS-HHS'
                        : portalAccess.familyLabel || 'Authorized Household'}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-primary-container">
                    Protected Portal Session Active
                  </span>
                )}
              </p>
              <div className="flex items-center gap-4 shrink-0">
                {currentProtectedArea && isCurrentAreaUnlocked && portalAccess.family_suite && portalAccess.operations && (
                  <button
                    type="button"
                    onClick={() => handleLockArea(currentProtectedArea)}
                    className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary-container transition-colors whitespace-nowrap"
                  >
                    Lock {currentProtectedArea === 'operations' ? 'Operations' : 'Family Suite'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLockAll}
                  className="text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary-container transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Views</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <AboutLandingTab
            onNavigateTab={handleNavigate}
            onRequestService={handleOpenConsultation}
            agreementSigned={portalAccess.agreementSigned}
            onAgreementChange={handleAgreementChange}
          />
        )}
        {activeTab === 'services' && (
          <AccessGate
            area="family_suite"
            agreementSigned={portalAccess.agreementSigned}
            alreadyUnlocked={portalAccess.family_suite}
            allowAdminAutoUnlock={!portalAccess.manualLockFamily}
            onAgreementChange={handleAgreementChange}
            onUnlock={(meta) => handleUnlockArea('family_suite', meta)}
            onRequestConsultation={() => handleOpenConsultation('general-consultation')}
          >
            <ServicesTab
              onRequestService={handleOpenConsultation}
              onOpenDossier={() => handleNavigate('the-care-dossier')}
            />
          </AccessGate>
        )}
        {activeTab === 'the-care-dossier' && (
          <AccessGate
            area="family_suite"
            agreementSigned={portalAccess.agreementSigned}
            alreadyUnlocked={portalAccess.family_suite}
            allowAdminAutoUnlock={!portalAccess.manualLockFamily}
            onAgreementChange={handleAgreementChange}
            onUnlock={(meta) => handleUnlockArea('family_suite', meta)}
            onRequestConsultation={() => handleOpenConsultation('general-consultation')}
          >
            <DigitalCareDossier onRequestService={handleOpenConsultation} />
          </AccessGate>
        )}
        {activeTab === 'for-families' && (
          <AccessGate
            area="family_suite"
            agreementSigned={portalAccess.agreementSigned}
            alreadyUnlocked={portalAccess.family_suite}
            allowAdminAutoUnlock={!portalAccess.manualLockFamily}
            onAgreementChange={handleAgreementChange}
            onUnlock={(meta) => handleUnlockArea('family_suite', meta)}
            onRequestConsultation={() => handleOpenConsultation('general-consultation')}
          >
            <LaunchKitTab
              onRequestService={handleOpenConsultation}
              onOpenDossier={() => handleNavigate('the-care-dossier')}
            />
          </AccessGate>
        )}
        {activeTab === 'credentials' && (
          <FounderTab onRequestService={handleOpenConsultation} />
        )}
        {activeTab === 'operations' && (
          <AccessGate
            area="operations"
            alreadyUnlocked={portalAccess.operations}
            allowAdminAutoUnlock={!portalAccess.manualLockOps}
            onUnlock={(meta) => handleUnlockArea('operations', meta)}
          >
            <PracticeOpsTab
              onOpenDossier={() => handleNavigate('the-care-dossier')}
              onOpenFamilies={() => handleNavigate('for-families')}
              onLock={() => handleLockArea('operations')}
            />
          </AccessGate>
        )}
      </main>

      {/* Sovereign Executive Footer */}
      <footer className="no-print w-full bg-primary-container text-on-primary border-t border-brass/25 pt-12 pb-24 lg:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-10">
            {/* Column 1: Brand Summary */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <SwMonogramCrest className="w-7 h-7 text-brass shrink-0" />
                <span className="font-editorial text-xl text-on-primary">Southern Well</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sovereign care advisory, private advocacy, and strategic health oversight tailored for senior principals and distinguished families across South Mississippi.
              </p>
              <div className="pt-1 space-y-0.5">
                <span className="text-[10px] font-semibold uppercase text-secondary-fixed-dim tracking-widest block">
                  Executive Chambers
                </span>
                <span className="text-xs text-on-primary block">{FOUNDER_PROFILE.chambers}</span>
                <a
                  href={FOUNDER_PROFILE.phoneHref}
                  className="text-xs text-secondary-fixed hover:underline tabular-nums inline-block pt-0.5"
                >
                  {FOUNDER_PROFILE.phone}
                </a>
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold uppercase text-secondary-fixed-dim tracking-widest">
                Navigation
              </span>
              <ul className="flex flex-col gap-2 text-xs text-slate-300">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('about')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    About the Practice
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('services')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Bespoke Navigation
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('the-care-dossier')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    The Care Dossier
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('for-families')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    For Estate Stewards
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('credentials')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Clinical Leadership
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('operations')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Operations Hub
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Practice Pillars */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold uppercase text-secondary-fixed-dim tracking-widest">
                Practice Pillars
              </span>
              <ul className="flex flex-col gap-2 text-xs text-slate-300">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenConsultation('foundation-assessment')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Observational Assessment
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('the-care-dossier')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Executive Health Dossier
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenConsultation('clinic-accompaniment')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Care Network Coordination
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenConsultation('medication-concierge')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Routine Wellness Oversight
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('for-families')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Family Concierge Briefings
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Service Region */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold uppercase text-secondary-fixed-dim tracking-widest">
                Service Region
              </span>
              <ul className="flex flex-col gap-2 text-xs text-slate-300">
                <li>Hattiesburg</li>
                <li>Laurel</li>
                <li>Biloxi</li>
                <li>Gulfport</li>
                <li>Ocean Springs</li>
              </ul>
            </div>

            {/* Column 5: Compliance & Legal */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold uppercase text-secondary-fixed-dim tracking-widest">
                Compliance &amp; Legal
              </span>
              <ul className="flex flex-col gap-2 text-xs text-slate-300">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('credentials')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Scope of Practice
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('the-care-dossier')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Privacy &amp; Discretion Code
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenConsultation('general-consultation')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Terms of Engagement
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('credentials')}
                    className="hover:text-on-primary transition-colors text-left"
                  >
                    Regulatory Disclosures
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-brass/20 flex flex-col gap-5">
            <div className="bg-tertiary-container p-4 rounded border border-brass/20">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-secondary-fixed-dim shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-secondary-fixed-dim font-medium">
                    Scope of Service &amp; Non-Clinical Disclosure:
                  </strong>{' '}
                  {SCOPE_NOTICE_TEXT}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-300">
              <span>
                © 2025 Southern Well Senior Concierge, LLC. Pine Belt &amp; Gulf Coast. All rights reserved.
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary-fixed-dim inline-flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Confidential &amp; Privileged Senior Advisory</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface/95 backdrop-blur-xl border-t border-brass/30 shadow-[0_-2px_12px_rgba(11,25,44,0.06)]"
      >
        <div className="h-14 px-1 grid grid-cols-6 items-stretch">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[44px] px-0.5 transition-colors border-t-2 ${
                  active
                    ? 'text-secondary border-secondary font-semibold'
                    : 'text-on-surface-variant border-transparent hover:text-primary-container'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={active ? 2.1 : 1.75} />
                <span className="text-[10px] tracking-wide mt-0.5 whitespace-nowrap">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Interactive Consultation & Assessment Request Drawer/Modal */}
      <ConsultationModal
        isOpen={modalOpen}
        initialService={selectedService}
        onClose={() => setModalOpen(false)}
        onSubmitSuccess={handleRequestSuccess}
      />
    </div>
  );
}
