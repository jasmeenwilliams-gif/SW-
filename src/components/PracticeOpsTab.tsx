import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Calendar,
  CheckSquare,
  ClipboardList,
  Compass,
  FileSpreadsheet,
  Gift,
  Home,
  Library,
  Lock,
  Pill,
  Rocket,
  RotateCcw,
  Share2,
  Users,
  Wallet,
} from 'lucide-react';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import {
  createSeedOpsData,
  OPS_NAV_ITEMS,
  OPS_STORAGE_KEY,
  type AlertPreset,
  type BHLSResponses,
  type MMASResponses,
  type OpsAction,
  type OpsCheckin,
  type OpsClient,
  type OpsDataState,
  type OpsMed,
  type OpsNavId,
  type OpsNavItem,
  type OpsPayment,
  type OpsReferral,
} from '../data/opsData';
import {
  addCheckIn,
  subscribeCheckIns,
  toggleCheckInDone,
} from '../lib/checkins';
import {
  issueAccessPass,
  issueClientQrPass,
  subscribeAccessPasses,
  updateAccessPassStatus,
  type AccessPassRecord,
} from '../lib/accessPasses';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CloudSyncBanner } from './CloudSyncBanner';
import { ScopeNotice } from './ScopeNotice';
import {
  ActionsView,
  CheckinsView,
  ClientsView,
  ProgressView,
} from './ops/OpsClientCareViews';
import {
  MedsView,
  PackagesView,
  PaymentsView,
  ReferralsView,
} from './ops/OpsClinicalFinanceViews';
import {
  BooksView,
  FormsView,
  HandbookView,
  LaunchView,
} from './ops/OpsGovernanceViews';
import {
  DashboardView,
  GuideView,
  SopView,
  WorkflowView,
} from './ops/OpsOverviewViews';

interface PracticeOpsTabProps {
  onOpenDossier: () => void;
  onOpenFamilies: () => void;
  onLock?: () => void;
}

const NAV_ICONS: Record<OpsNavItem['icon'], typeof Home> = {
  home: Home,
  compass: Compass,
  book: BookOpen,
  clipboard: ClipboardList,
  users: Users,
  chart: BarChart3,
  calendar: Calendar,
  check: CheckSquare,
  share: Share2,
  pill: Pill,
  gift: Gift,
  wallet: Wallet,
  file: FileSpreadsheet,
  handbook: BookMarked,
  rocket: Rocket,
  library: Library,
};

function loadInitialOpsState(): OpsDataState {
  try {
    const raw = localStorage.getItem(OPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OpsDataState>;
      const seed = createSeedOpsData();
      return {
        preset:
          parsed.preset === 'strict' || parsed.preset === 'high' || parsed.preset === 'standard'
            ? parsed.preset
            : seed.preset,
        clients: Array.isArray(parsed.clients) ? parsed.clients : seed.clients,
        checkins: Array.isArray(parsed.checkins) ? parsed.checkins : seed.checkins,
        actions: Array.isArray(parsed.actions) ? parsed.actions : seed.actions,
        referrals: Array.isArray(parsed.referrals) ? parsed.referrals : seed.referrals,
        payments: Array.isArray(parsed.payments) ? parsed.payments : seed.payments,
        meds: Array.isArray(parsed.meds) ? parsed.meds : seed.meds,
        mmasResponses:
          parsed.mmasResponses && typeof parsed.mmasResponses === 'object'
            ? { ...seed.mmasResponses, ...parsed.mmasResponses }
            : seed.mmasResponses,
        bhlsResponses:
          parsed.bhlsResponses && typeof parsed.bhlsResponses === 'object'
            ? { ...seed.bhlsResponses, ...parsed.bhlsResponses }
            : seed.bhlsResponses,
        launchDone:
          parsed.launchDone && typeof parsed.launchDone === 'object'
            ? parsed.launchDone
            : seed.launchDone,
      };
    }
  } catch {
    // Ignore localStorage parse errors
  }
  return createSeedOpsData();
}

function sanitizeOpsPayload(state: OpsDataState) {
  const m = state.mmasResponses;
  const b = state.bhlsResponses;
  const launchEntries = Object.entries(state.launchDone ?? {}).slice(0, 30);
  const launchDone: Record<string, boolean> = {};
  launchEntries.forEach(([k, v]) => {
    launchDone[k] = Boolean(v);
  });

  return {
    preset: state.preset,
    clients: state.clients.slice(0, 150),
    checkins: state.checkins.slice(0, 300),
    actions: state.actions.slice(0, 300),
    referrals: state.referrals.slice(0, 200),
    payments: state.payments.slice(0, 300),
    meds: state.meds.slice(0, 300),
    mmasResponses: {
      q1: Number(m.q1 ?? 0),
      q2: Number(m.q2 ?? 0),
      q3: Number(m.q3 ?? 0),
      q4: Number(m.q4 ?? 0),
      q5: Number(m.q5 ?? 0),
      q6: Number(m.q6 ?? 0),
      q7: Number(m.q7 ?? 0),
      q8: Number(m.q8 ?? 4),
    },
    bhlsResponses: {
      q1: Number(b.q1 ?? 3),
      q2: Number(b.q2 ?? 3),
      q3: Number(b.q3 ?? 3),
    },
    launchDone,
  };
}

export function PracticeOpsTab({
  onOpenDossier,
  onOpenFamilies,
  onLock,
}: PracticeOpsTabProps) {
  const { user, userProfile, isAdmin, authReady } = useFirebase();
  const [activeNav, setActiveNav] = useState<OpsNavId>('dashboard');
  const [data, setData] = useState<OpsDataState>(loadInitialOpsState);
  const [confirmReset, setConfirmReset] = useState(false);
  const [cloudDocExists, setCloudDocExists] = useState(false);
  const [cloudCheckins, setCloudCheckins] = useState<OpsCheckin[]>([]);
  const [accessPasses, setAccessPasses] = useState<AccessPassRecord[]>([]);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const cloudDocExistsRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  const writeOpsToCloud = async (next: OpsDataState, uid: string) => {
    const opsPath = 'practiceOps/main';
    const opsRef = doc(db, 'practiceOps', 'main');
    const payload = sanitizeOpsPayload(next);
    setSyncState('saving');

    try {
      if (cloudDocExistsRef.current) {
        try {
          await updateDoc(opsRef, {
            ...payload,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, opsPath);
        }
      } else {
        try {
          await setDoc(opsRef, {
            ownerId: uid,
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          cloudDocExistsRef.current = true;
          setCloudDocExists(true);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, opsPath);
        }
      }
      setSyncState('synced');
    } catch (wrappedErr) {
      setSyncState('error');
      setFatalError(
        wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr))
      );
    }
  };

  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (!authReady || !user || !userProfile || !isAdmin) {
      cloudDocExistsRef.current = false;
      setCloudDocExists(false);
      setSyncState('idle');
      return;
    }

    const opsPath = 'practiceOps/main';
    const opsRef = doc(db, 'practiceOps', 'main');

    const unsub = onSnapshot(
      opsRef,
      (snap) => {
        if (snap.exists()) {
          cloudDocExistsRef.current = true;
          setCloudDocExists(true);
          if (!snap.metadata.hasPendingWrites) {
            const raw = snap.data() as Record<string, unknown>;
            const seed = createSeedOpsData();
            const remote: OpsDataState = {
              preset:
                raw.preset === 'strict' || raw.preset === 'high' || raw.preset === 'standard'
                  ? raw.preset
                  : seed.preset,
              clients: Array.isArray(raw.clients) ? (raw.clients as OpsClient[]) : seed.clients,
              checkins: Array.isArray(raw.checkins)
                ? (raw.checkins as OpsCheckin[])
                : seed.checkins,
              actions: Array.isArray(raw.actions) ? (raw.actions as OpsAction[]) : seed.actions,
              referrals: Array.isArray(raw.referrals)
                ? (raw.referrals as OpsReferral[])
                : seed.referrals,
              payments: Array.isArray(raw.payments)
                ? (raw.payments as OpsPayment[])
                : seed.payments,
              meds: Array.isArray(raw.meds) ? (raw.meds as OpsMed[]) : seed.meds,
              mmasResponses:
                raw.mmasResponses && typeof raw.mmasResponses === 'object'
                  ? (raw.mmasResponses as MMASResponses)
                  : seed.mmasResponses,
              bhlsResponses:
                raw.bhlsResponses && typeof raw.bhlsResponses === 'object'
                  ? (raw.bhlsResponses as BHLSResponses)
                  : seed.bhlsResponses,
              launchDone:
                raw.launchDone && typeof raw.launchDone === 'object'
                  ? (raw.launchDone as Record<string, boolean>)
                  : seed.launchDone,
            };
            setData(remote);
            try {
              localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(remote));
            } catch {
              // Ignore local storage errors
            }
          }
          setSyncState('synced');
        } else {
          cloudDocExistsRef.current = false;
          setCloudDocExists(false);
          setSyncState('idle');
        }
      },
      (listenErr) => {
        setSyncState('error');
        try {
          handleFirestoreError(listenErr, OperationType.GET, opsPath);
        } catch (wrappedErr) {
          setFatalError(
            wrappedErr instanceof Error ? wrappedErr : new Error(String(wrappedErr))
          );
        }
      }
    );

    return () => {
      unsub();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [authReady, user, userProfile, isAdmin]);

  useEffect(() => {
    if (!authReady || !user || !userProfile) {
      setCloudCheckins([]);
      return;
    }

    const unsub = subscribeCheckIns(
      user.uid,
      isAdmin,
      (items) => {
        setCloudCheckins(items);
      },
      (err) => {
        setFatalError(err);
      }
    );

    return () => unsub();
  }, [authReady, user, userProfile, isAdmin]);

  useEffect(() => {
    if (!authReady || !user || !userProfile || !isAdmin) {
      setAccessPasses([]);
      return;
    }

    const unsub = subscribeAccessPasses(
      isAdmin,
      (items) => setAccessPasses(items),
      (err) => setFatalError(err)
    );

    return () => unsub();
  }, [authReady, user, userProfile, isAdmin]);

  const effectiveCheckins =
    authReady && user && userProfile && cloudCheckins.length > 0
      ? [...cloudCheckins, ...data.checkins.filter((localItem) => !localItem.docId)]
      : data.checkins;

  const dashboardData: OpsDataState =
    effectiveCheckins === data.checkins ? data : { ...data, checkins: effectiveCheckins };

  const commitData = (updater: (prev: OpsDataState) => OpsDataState) => {
    setData((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }

      if (authReady && user && userProfile && isAdmin) {
        setSyncState('saving');
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }
        const uid = user.uid;
        saveTimerRef.current = setTimeout(() => {
          void writeOpsToCloud(next, uid);
        }, 450);
      }

      return next;
    });
  };

  const handleResetSeed = () => {
    const seed = createSeedOpsData();
    commitData(() => seed);
    setConfirmReset(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12 space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Southern Well Practice Command
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl text-primary-container font-semibold mt-1">
            Operations &amp; Caseload Hub
          </h1>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          {onLock && (
            <button
              type="button"
              onClick={onLock}
              className="min-h-[40px] px-3.5 py-2 rounded bg-primary-container text-secondary-fixed hover:bg-tertiary-container text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Operations</span>
            </button>
          )}
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="min-h-[40px] px-3.5 py-2 rounded bg-surface-container-low border border-outline-variant text-xs font-medium text-on-surface-variant hover:text-primary-container transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-secondary" />
              <span>Reset Practice Seed</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-1.5 text-xs">
              <span className="text-red-950 font-medium">Restore sample roster?</span>
              <button
                type="button"
                onClick={handleResetSeed}
                className="px-2.5 py-1 rounded bg-red-700 text-white font-semibold"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1 rounded bg-white border border-outline-variant text-primary-container"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Sync Banner (Admin Vault Sync vs Local Preview) */}
      <CloudSyncBanner
        workspaceLabel={isAdmin ? 'Practice Operations Vault' : 'Local Practice Operations Preview'}
        syncState={isAdmin ? syncState : 'idle'}
        showPushDraft={Boolean(isAdmin && user && userProfile && !cloudDocExists)}
        onPushDraft={() => {
          if (isAdmin && user && userProfile) {
            void writeOpsToCloud(data, user.uid);
          }
        }}
      />

      {/* Mobile View Selector */}
      <div className="lg:hidden no-print">
        <label htmlFor="ops-mobile-nav" className="block text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1.5">
          Operations Section
        </label>
        <select
          id="ops-mobile-nav"
          value={activeNav}
          onChange={(e) => setActiveNav(e.target.value as OpsNavId)}
          className="w-full min-h-[44px] px-3.5 py-2 rounded bg-surface-container-lowest border border-brass/35 text-sm font-semibold text-primary-container"
        >
          {OPS_NAV_ITEMS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Split Workspace: Desktop Sidebar + Active Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 bg-surface-container-low rounded border border-brass/30 p-3 space-y-1">
          {OPS_NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded text-xs font-medium flex items-center gap-2.5 transition-colors ${
                  active
                    ? 'bg-primary-container text-secondary-fixed font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-primary-container hover:bg-surface-container'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-secondary-fixed' : 'text-secondary'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-9 min-w-0">
          {activeNav === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              onChangePreset={(preset: AlertPreset) =>
                commitData((prev) => ({ ...prev, preset }))
              }
              onNavigateOps={setActiveNav}
            />
          )}

          {activeNav === 'workflow' && (
            <WorkflowView
              data={data}
              onUpdateClientStep={(clientId, nextStep) =>
                commitData((prev) => ({
                  ...prev,
                  clients: prev.clients.map((c) =>
                    c.id === clientId ? { ...c, step: Math.max(1, Math.min(10, nextStep)) } : c
                  ),
                }))
              }
            />
          )}

          {activeNav === 'guide' && <GuideView />}
          {activeNav === 'sop' && <SopView />}

          {activeNav === 'clients' && (
            <ClientsView
              data={data}
              onAddClient={(client) =>
                commitData((prev) => ({ ...prev, clients: [client, ...prev.clients] }))
              }
              onUpdateClient={(clientId, patch) =>
                commitData((prev) => ({
                  ...prev,
                  clients: prev.clients.map((c) => (c.id === clientId ? { ...c, ...patch } : c)),
                }))
              }
            />
          )}

          {activeNav === 'progress' && (
            <ProgressView
              data={data}
              onUpdateClient={(clientId, patch) =>
                commitData((prev) => ({
                  ...prev,
                  clients: prev.clients.map((c) => (c.id === clientId ? { ...c, ...patch } : c)),
                }))
              }
            />
          )}

          {activeNav === 'checkins' && (
            <CheckinsView
              data={dashboardData}
              onAddCheckin={(checkin) => {
                if (authReady && user && userProfile) {
                  void addCheckIn(checkin.client, checkin.note, {
                    date: checkin.date,
                    type: checkin.type,
                  }).catch((err) => {
                    setFatalError(err instanceof Error ? err : new Error(String(err)));
                  });
                } else {
                  commitData((prev) => ({ ...prev, checkins: [checkin, ...prev.checkins] }));
                }
              }}
              onToggleCheckin={(idx) => {
                const target = dashboardData.checkins[idx];
                if (target?.docId) {
                  void toggleCheckInDone(target.docId, !target.done).catch((err) => {
                    setFatalError(err instanceof Error ? err : new Error(String(err)));
                  });
                } else {
                  const localIndex = data.checkins.indexOf(target);
                  if (localIndex >= 0) {
                    commitData((prev) => ({
                      ...prev,
                      checkins: prev.checkins.map((item, i) =>
                        i === localIndex ? { ...item, done: !item.done } : item
                      ),
                    }));
                  }
                }
              }}
            />
          )}

          {activeNav === 'actions' && (
            <ActionsView
              data={data}
              onAddAction={(action) =>
                commitData((prev) => ({ ...prev, actions: [action, ...prev.actions] }))
              }
              onToggleAction={(idx) =>
                commitData((prev) => ({
                  ...prev,
                  actions: prev.actions.map((item, i) =>
                    i === idx ? { ...item, done: !item.done } : item
                  ),
                }))
              }
            />
          )}

          {activeNav === 'referrals' && (
            <ReferralsView
              data={data}
              onAddReferral={(ref) =>
                commitData((prev) => ({ ...prev, referrals: [ref, ...prev.referrals] }))
              }
              onUpdateReferralStatus={(idx, status) =>
                commitData((prev) => ({
                  ...prev,
                  referrals: prev.referrals.map((r, i) => (i === idx ? { ...r, status } : r)),
                }))
              }
            />
          )}

          {activeNav === 'meds' && (
            <MedsView
              data={data}
              onAddMed={(med) =>
                commitData((prev) => ({ ...prev, meds: [med, ...prev.meds] }))
              }
              onToggleMed={(idx) =>
                commitData((prev) => ({
                  ...prev,
                  meds: prev.meds.map((m, i) => (i === idx ? { ...m, done: !m.done } : m)),
                }))
              }
              onUpdateMmas={(mmasResponses) =>
                commitData((prev) => ({ ...prev, mmasResponses }))
              }
              onUpdateBhls={(bhlsResponses) =>
                commitData((prev) => ({ ...prev, bhlsResponses }))
              }
            />
          )}

          {activeNav === 'packages' && <PackagesView data={data} />}

          {activeNav === 'payments' && (
            <PaymentsView
              data={data}
              onAddPayment={(payment) =>
                commitData((prev) => ({ ...prev, payments: [payment, ...prev.payments] }))
              }
              onUpdatePaymentStatus={(idx, status) =>
                commitData((prev) => ({
                  ...prev,
                  payments: prev.payments.map((p, i) => (i === idx ? { ...p, status } : p)),
                }))
              }
            />
          )}

          {activeNav === 'forms' && (
            <FormsView
              data={data}
              isAdmin={isAdmin}
              accessPasses={accessPasses}
              onIssuePass={async (input) => {
                if (!user) return;
                await issueAccessPass(user.uid, input);
              }}
              onIssueQrPass={async (input) => {
                if (!user) {
                  throw new Error('Practice administrator sign-in is required.');
                }
                return issueClientQrPass(user.uid, input);
              }}
              onTogglePassField={async (passHash, patch) => {
                await updateAccessPassStatus(passHash, patch);
              }}
            />
          )}
          {activeNav === 'handbook' && <HandbookView />}

          {activeNav === 'launch' && (
            <LaunchView
              data={data}
              onToggleLaunchItem={(id) =>
                commitData((prev) => ({
                  ...prev,
                  launchDone: { ...prev.launchDone, [id]: !prev.launchDone[id] },
                }))
              }
            />
          )}

          {activeNav === 'books' && (
            <BooksView
              onOpenDossier={onOpenDossier}
              onOpenFamilies={onOpenFamilies}
            />
          )}
        </div>
      </div>

      <ScopeNotice />
    </div>
  );
}
