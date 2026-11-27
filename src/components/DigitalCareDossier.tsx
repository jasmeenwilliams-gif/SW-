import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileDown,
  FolderOpen,
  Lock,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';
import { FOUNDER_PROFILE } from '../data/conciergeData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { ServiceProtocolId } from '../types/concierge';
import { CloudSyncBanner } from './CloudSyncBanner';
import { ScopeNotice } from './ScopeNotice';
import { SwMonogramCrest } from './SwMonogramCrest';

interface DigitalCareDossierProps {
  onRequestService: (service: ServiceProtocolId) => void;
}

type FieldType = 'text' | 'area';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
}

interface TableDef {
  key: string;
  columns: string[];
  initialRows?: number;
  presets?: string[];
}

interface DossierSectionDef {
  title: string;
  intro?: string;
  table?: TableDef;
  fields?: FieldDef[];
}

interface DossierStore {
  f: Record<string, string>;
  t: Record<string, string[][]>;
}

const STORAGE_KEY = 'swDossier';

const DOSSIER_SECTIONS: DossierSectionDef[] = [
  {
    title: 'Client Snapshot',
    fields: [
      { key: 'name', label: 'Client name', type: 'text' },
      { key: 'pref', label: 'Preferred name', type: 'text' },
      { key: 'dob', label: 'Date of birth', type: 'text' },
      { key: 'addr', label: 'Address', type: 'text' },
      { key: 'ph', label: 'Phone / email', type: 'text' },
      { key: 'live', label: 'Living situation (alone, with family, other)', type: 'text' },
      { key: 'lang', label: 'Primary language', type: 'text' },
      { key: 'faith', label: 'Faith or cultural preferences', type: 'text' },
      { key: 'know', label: 'What the client wants us to know about them', type: 'area' },
      { key: 'prep', label: 'Prepared with', type: 'text' },
    ],
  },
  {
    title: 'Care Circle & Emergency Contacts',
    table: {
      key: 'circle',
      columns: ['Name', 'Relationship', 'Phone', 'Role (decision maker, caregiver, emergency)'],
      initialRows: 3,
    },
  },
  {
    title: 'Legal Documents & Wishes',
    table: {
      key: 'legal',
      columns: ['Document', 'On file? (Y/N)', 'Location / holder'],
      presets: [
        'Healthcare power of attorney',
        'Financial power of attorney',
        'Advance directive / living will',
        'Code status / POLST',
        'Will / trust',
      ],
    },
  },
  {
    title: 'Health Summary',
    fields: [
      { key: 'dx', label: 'Diagnoses and chronic conditions', type: 'area' },
      { key: 'all', label: 'Allergies and reactions', type: 'area' },
      { key: 'surg', label: 'Past surgeries and hospitalizations', type: 'area' },
      { key: 'aids', label: 'Vision / hearing / mobility aids', type: 'area' },
      { key: 'diet', label: 'Diet and swallowing needs', type: 'area' },
      { key: 'chg', label: 'Recent changes in health or function', type: 'area' },
    ],
  },
  {
    title: 'Medication List',
    table: {
      key: 'meds',
      columns: ['Medication', 'Dose', 'How often', 'Purpose', 'Prescriber'],
      initialRows: 4,
    },
    fields: [
      { key: 'pharm', label: 'Pharmacy', type: 'text' },
      { key: 'mgr', label: 'Who manages medications', type: 'text' },
      { key: 'otc', label: 'Supplements / over-the-counter', type: 'area' },
    ],
  },
  {
    title: 'Providers',
    table: {
      key: 'prov',
      columns: ['Role', 'Name & practice', 'Phone', 'Next visit'],
      presets: [
        'Primary care',
        'Specialist',
        'Specialist',
        'Dentist / eye',
        'Home health / hospice',
      ],
    },
  },
  {
    title: 'Insurance & Benefits',
    fields: [
      { key: 'mc', label: 'Medicare / Medicaid ID on file (Y/N)', type: 'text' },
      { key: 'sup', label: 'Supplement / Advantage plan', type: 'text' },
      { key: 'rx', label: 'Prescription plan', type: 'text' },
      { key: 'ltc', label: 'Long-term care coverage', type: 'text' },
      { key: 'oth', label: 'Other benefits (VA, SNAP, utilities assistance)', type: 'area' },
    ],
  },
  {
    title: 'Daily Living & Preferences',
    fields: [
      { key: 'rout', label: 'Morning and evening routines', type: 'area' },
      { key: 'meal', label: 'Meals and favorite foods', type: 'area' },
      { key: 'adl', label: 'Bathing, dressing, toileting support needed', type: 'area' },
      { key: 'soc', label: 'Hobbies, church, social activities', type: 'area' },
      { key: 'good', label: 'What a good day looks like', type: 'area' },
      { key: 'no', label: 'What the client does not want', type: 'area' },
    ],
  },
  {
    title: 'Home & Safety',
    fields: [
      {
        key: 'fall',
        label: 'Fall risks and equipment (grab bars, walker, bed rails)',
        type: 'area',
      },
      { key: 'det', label: 'Smoke / CO detectors and emergency plan', type: 'area' },
      { key: 'trans', label: 'Transportation', type: 'area' },
      { key: 'key', label: 'Key and access information (who holds a spare key)', type: 'text' },
      { key: 'pets', label: 'Pets', type: 'text' },
    ],
  },
  {
    title: 'Goals & Priorities',
    table: {
      key: 'goals',
      columns: ['Goal', 'Why it matters', 'Next step', 'Owner', 'Target date'],
      initialRows: 3,
    },
  },
  {
    title: 'Community Resources & Referrals',
    table: {
      key: 'res',
      columns: ['Resource', 'Purpose', 'Status'],
      initialRows: 3,
    },
  },
  {
    title: 'Concierge Visit & Contact Log',
    table: {
      key: 'log',
      columns: ['Date', 'Type (visit, call, appointment)', 'Summary', 'Follow-up needed'],
      initialRows: 3,
    },
  },
  {
    title: 'Consent & Acknowledgment',
    intro:
      'The client (or authorized representative) has reviewed this dossier and consents to Southern Well Senior Concierge keeping and sharing this information with the people and providers listed above for the purpose of coordinating care.',
    fields: [
      { key: 'csig', label: 'Client signature (type full name)', type: 'text' },
      { key: 'cdate', label: 'Date', type: 'text' },
      { key: 'rsig', label: 'Representative signature (if applicable)', type: 'text' },
      { key: 'nsig', label: 'Care Navigator signature', type: 'text' },
    ],
  },
];

function createDefaultRows(table: TableDef): string[][] {
  const count = table.presets ? table.presets.length : (table.initialRows ?? 3);
  const rows: string[][] = [];
  for (let i = 0; i < count; i++) {
    const row = table.columns.map((_, colIdx) =>
      table.presets && colIdx === 0 ? table.presets[i] : ''
    );
    rows.push(row);
  }
  return rows;
}

function hydrateDossierStore(raw?: Partial<DossierStore> | null): DossierStore {
  const f: Record<string, string> = { ...(raw?.f ?? {}) };
  const t: Record<string, string[][]> = { ...(raw?.t ?? {}) };

  DOSSIER_SECTIONS.forEach((sec) => {
    if (sec.table) {
      const existing = t[sec.table.key];
      if (!Array.isArray(existing) || existing.length === 0) {
        t[sec.table.key] = createDefaultRows(sec.table);
      } else {
        t[sec.table.key] = existing.map((row) =>
          sec.table!.columns.map((_, idx) => (typeof row?.[idx] === 'string' ? row[idx] : ''))
        );
      }
    }
  });

  return { f, t };
}

function loadInitialStore(): DossierStore {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return hydrateDossierStore(JSON.parse(saved) as Partial<DossierStore>);
    }
  } catch {
    // Ignore storage parsing errors
  }
  return hydrateDossierStore(null);
}

function computeCompletionPercent(store: DossierStore): number {
  let totalUnits = 0;
  let doneUnits = 0;

  DOSSIER_SECTIONS.forEach((sec) => {
    (sec.fields ?? []).forEach((field) => {
      totalUnits += 1;
      if (store.f[field.key]?.trim()) {
        doneUnits += 1;
      }
    });

    if (sec.table) {
      totalUnits += 1;
      const rows = store.t[sec.table.key] ?? [];
      const hasEntry = rows.some((row) =>
        row.some((val, colIdx) => {
          const isPresetCol = Boolean(sec.table?.presets) && colIdx === 0;
          return Boolean(val?.trim()) && !isPresetCol;
        })
      );
      if (hasEntry) {
        doneUnits += 1;
      }
    }
  });

  return totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;
}

function hasAnyDossierEntries(store: DossierStore): boolean {
  const hasField = Object.values(store.f).some((val) => Boolean(val?.trim()));
  if (hasField) return true;

  return DOSSIER_SECTIONS.some((sec) => {
    if (!sec.table) return false;
    const rows = store.t[sec.table.key] ?? [];
    return rows.some((row) =>
      row.some((val, colIdx) => {
        const isPresetCol = Boolean(sec.table?.presets) && colIdx === 0;
        return Boolean(val?.trim()) && !isPresetCol;
      })
    );
  });
}

function toFirestorePayload(store: DossierStore) {
  const fields: Record<string, string> = {};
  Object.entries(store.f)
    .slice(0, 45)
    .forEach(([k, v]) => {
      fields[k] = typeof v === 'string' ? v.slice(0, 4000) : '';
    });

  const tables: Record<string, { cells: string[] }[]> = {};
  Object.entries(store.t)
    .slice(0, 10)
    .forEach(([tableKey, rows]) => {
      tables[tableKey] = (rows ?? []).slice(0, 50).map((row) => ({
        cells: row.map((cell) => (typeof cell === 'string' ? cell.slice(0, 1000) : '')),
      }));
    });

  return {
    title: 'Care Dossier – Digital',
    fields,
    tables,
    completionPercent: computeCompletionPercent(store),
  };
}

function fromFirestoreData(data: Record<string, unknown>): DossierStore {
  const rawFields =
    data.fields && typeof data.fields === 'object'
      ? (data.fields as Record<string, unknown>)
      : {};
  const f: Record<string, string> = {};
  Object.entries(rawFields).forEach(([k, v]) => {
    if (typeof v === 'string') {
      f[k] = v;
    }
  });

  const rawTables =
    data.tables && typeof data.tables === 'object'
      ? (data.tables as Record<string, unknown>)
      : {};
  const t: Record<string, string[][]> = {};
  Object.entries(rawTables).forEach(([tableKey, rows]) => {
    if (Array.isArray(rows)) {
      t[tableKey] = rows.map((rowObj) => {
        if (
          rowObj &&
          typeof rowObj === 'object' &&
          'cells' in rowObj &&
          Array.isArray((rowObj as { cells: unknown }).cells)
        ) {
          return (rowObj as { cells: unknown[] }).cells.map((c) =>
            typeof c === 'string' ? c : ''
          );
        }
        return [];
      });
    }
  });

  return hydrateDossierStore({ f, t });
}

export function DigitalCareDossier({ onRequestService }: DigitalCareDossierProps) {
  const { user, userProfile, authReady } = useFirebase();
  const [store, setStore] = useState<DossierStore>(loadInitialStore);
  const [openIndices, setOpenIndices] = useState<number[]>([0]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cloudDocExists, setCloudDocExists] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const cloudDocExistsRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  const writeStoreToCloud = async (next: DossierStore, uid: string) => {
    const dossierPath = `users/${uid}/dossiers/primary`;
    const dossierRef = doc(db, 'users', uid, 'dossiers', 'primary');
    const payload = toFirestorePayload(next);
    setSyncState('saving');

    try {
      if (cloudDocExistsRef.current) {
        try {
          await updateDoc(dossierRef, {
            ...payload,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, dossierPath);
        }
      } else {
        try {
          await setDoc(dossierRef, {
            ownerId: uid,
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          cloudDocExistsRef.current = true;
          setCloudDocExists(true);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, dossierPath);
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

    if (!authReady || !user || !userProfile) {
      cloudDocExistsRef.current = false;
      setCloudDocExists(false);
      setSyncState('idle');
      return;
    }

    const dossierPath = `users/${user.uid}/dossiers/primary`;
    const dossierRef = doc(db, 'users', user.uid, 'dossiers', 'primary');

    const unsub = onSnapshot(
      dossierRef,
      (snap) => {
        if (snap.exists()) {
          cloudDocExistsRef.current = true;
          setCloudDocExists(true);
          if (!snap.metadata.hasPendingWrites) {
            const remote = fromFirestoreData(snap.data() as Record<string, unknown>);
            setStore(remote);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
            } catch {
              // Ignore local quota errors
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
          handleFirestoreError(listenErr, OperationType.GET, dossierPath);
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
  }, [authReady, user, userProfile]);

  const persistStore = (next: DossierStore) => {
    setStore(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }

    if (authReady && user && userProfile) {
      setSyncState('saving');
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      const uid = user.uid;
      saveTimerRef.current = setTimeout(() => {
        void writeStoreToCloud(next, uid);
      }, 450);
    }
  };

  const handlePushLocalDraft = () => {
    if (!authReady || !user || !userProfile) return;
    void writeStoreToCloud(store, user.uid);
    setStatusMessage({
      type: 'success',
      text: 'Your Care Dossier has been saved to your private cloud account.',
    });
  };

  const handleFieldChange = (key: string, value: string) => {
    persistStore({
      ...store,
      f: { ...store.f, [key]: value },
    });
  };

  const handleCellChange = (
    tableKey: string,
    rowIdx: number,
    colIdx: number,
    value: string
  ) => {
    const currentRows = store.t[tableKey] ?? [];
    const updatedRows = currentRows.map((row, r) =>
      r === rowIdx ? row.map((cell, c) => (c === colIdx ? value : cell)) : row
    );
    persistStore({
      ...store,
      t: { ...store.t, [tableKey]: updatedRows },
    });
  };

  const handleAddRow = (table: TableDef) => {
    const currentRows = store.t[table.key] ?? [];
    const blankRow = table.columns.map(() => '');
    persistStore({
      ...store,
      t: { ...store.t, [table.key]: [...currentRows, blankRow] },
    });
  };

  const handleRemoveRow = (tableKey: string, rowIdx: number) => {
    const currentRows = store.t[tableKey] ?? [];
    if (currentRows.length <= 1) return;
    persistStore({
      ...store,
      t: {
        ...store.t,
        [tableKey]: currentRows.filter((_, idx) => idx !== rowIdx),
      },
    });
  };

  const sectionProgress = useMemo(() => {
    let totalUnits = 0;
    let doneUnits = 0;

    const perSection = DOSSIER_SECTIONS.map((sec) => {
      let t = 0;
      let d = 0;

      (sec.fields ?? []).forEach((field) => {
        t += 1;
        if (store.f[field.key]?.trim()) {
          d += 1;
        }
      });

      if (sec.table) {
        t += 1;
        const rows = store.t[sec.table.key] ?? [];
        const hasEntry = rows.some((row) =>
          row.some((val, colIdx) => {
            const isPresetCol = Boolean(sec.table?.presets) && colIdx === 0;
            return Boolean(val?.trim()) && !isPresetCol;
          })
        );
        if (hasEntry) {
          d += 1;
        }
      }

      totalUnits += t;
      doneUnits += d;
      return { done: d, total: t };
    });

    const percent = totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;
    return { perSection, percent, doneUnits, totalUnits };
  }, [store]);

  const allExpanded = openIndices.length === DOSSIER_SECTIONS.length;

  const toggleSection = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  const handleToggleAll = () => {
    if (allExpanded) {
      setOpenIndices([]);
    } else {
      setOpenIndices(DOSSIER_SECTIONS.map((_, idx) => idx));
    }
  };

  const handlePrint = () => {
    setOpenIndices(DOSSIER_SECTIONS.map((_, idx) => idx));
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleSaveBackup = () => {
    const payload = JSON.stringify(store, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'care-dossier-backup.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: 'success',
      text: 'Care Dossier backup downloaded (care-dossier-backup.json).',
    });
  };

  const handleLoadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<DossierStore>;
        const hydrated = hydrateDossierStore(parsed);
        persistStore(hydrated);
        setStatusMessage({
          type: 'success',
          text: `Restored dossier records from ${file.name}.`,
        });
      } catch {
        setStatusMessage({
          type: 'error',
          text: 'That backup file could not be read. Please select a valid Care Dossier JSON file.',
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleConfirmClear = () => {
    const fresh = hydrateDossierStore(null);
    persistStore(fresh);
    setConfirmClear(false);
    setStatusMessage({
      type: 'success',
      text: 'All local Care Dossier entries on this device have been cleared.',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14 space-y-6 lg:space-y-8">
      {/* Bespoke Digital Care Dossier Cover Banner */}
      <section className="relative rounded overflow-hidden bg-primary-container text-on-primary border border-brass/40 shadow-md p-6 sm:p-8 lg:p-10 sconce-glow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-3 text-secondary-fixed">
              <SwMonogramCrest className="w-9 h-9 text-brass shrink-0" />
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase">
                  Southern Well Senior Concierge
                </p>
                <p className="text-xs text-slate-300">
                  Steady advocacy for every season of aging.
                </p>
              </div>
            </div>

            <h1 className="font-editorial text-[34px] sm:text-[42px] leading-[1.1] font-semibold text-on-primary pt-1">
              Care Dossier – Digital
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Complete 13-part digital client record covering client snapshot, care circle, legal wishes, health summary, medications, providers, insurance, daily living preferences, home safety, goals, community referrals, visit logs, and consent.
            </p>

            <div className="no-print pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  toolbarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="min-h-[44px] px-5 py-2.5 rounded bg-secondary text-on-secondary font-semibold text-xs uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors whitespace-nowrap"
              >
                Open the Dossier ↓
              </button>
              <a
                href={FOUNDER_PROFILE.offlineDossierPath}
                download="Care_Dossier_Southern_Well.html"
                className="min-h-[44px] px-4 py-2.5 rounded bg-tertiary-container border border-brass/40 text-secondary-fixed text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                <FileDown className="w-4 h-4" />
                <span>Download Standalone HTML</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 bg-tertiary-container rounded p-4 sm:p-5 border border-brass/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-secondary-fixed font-semibold">
              <span>Dossier Completion</span>
              <span className="tabular-nums">{sectionProgress.percent}%</span>
            </div>
            <div
              className="w-full h-2.5 rounded-full bg-primary-container overflow-hidden border border-white/10"
              role="progressbar"
              aria-valuenow={sectionProgress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall Care Dossier completion"
            >
              <div
                className="h-full bg-sage transition-all duration-300"
                style={{ width: `${sectionProgress.percent}%` }}
              />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {sectionProgress.doneUnits} of {sectionProgress.totalUnits} items completed across 13 sections.
            </p>
            <div className="pt-2 border-t border-brass/20 text-xs text-slate-300">
              <p className="font-medium text-on-primary">{FOUNDER_PROFILE.fullName}</p>
              <p className="tabular-nums mt-0.5">
                {FOUNDER_PROFILE.phone} · {FOUNDER_PROFILE.website}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Sync & Privacy Notice */}
      <div className="space-y-3">
        <CloudSyncBanner
          workspaceLabel="Digital Care Dossier"
          syncState={syncState}
          showPushDraft={Boolean(user && userProfile && !cloudDocExists && hasAnyDossierEntries(store))}
          onPushDraft={handlePushLocalDraft}
        />

        <div className="bg-surface-container-low rounded p-4 sm:p-5 border border-brass/35 flex items-start gap-3">
          <Lock className="w-4 h-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            <strong className="text-primary-container font-semibold">Privacy:</strong>{' '}
            {user
              ? 'Your Care Dossier is encrypted in transit and stored privately under your signed-in account, with a local copy cached in this browser.'
              : 'Information you type stays in this browser on this device unless you sign in with Google to sync across devices.'}{' '}
            Use <strong className="text-primary-container font-semibold">Save backup</strong> to keep an offline JSON copy, and share printed or saved copies only with people the client has authorized in writing.
          </p>
        </div>
      </div>

      {/* Sticky Progress & Controls Bar */}
      <div
        ref={toolbarRef}
        className="no-print sticky top-16 md:top-20 z-30 bg-surface/95 backdrop-blur-md rounded border border-brass/30 px-4 py-3 shadow-sm flex flex-wrap items-center gap-3"
      >
        <div className="flex-1 min-w-[180px] flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-sage transition-all duration-300"
              style={{ width: `${sectionProgress.percent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-primary tabular-nums whitespace-nowrap">
            {sectionProgress.percent}% complete
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleAll}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-medium text-primary hover:bg-surface-container transition-colors whitespace-nowrap"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-medium hover:bg-tertiary-container transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5 text-secondary-fixed" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          className={`no-print rounded-xl p-3.5 border flex items-center justify-between gap-3 text-xs sm:text-sm ${
            statusMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-sage-soft border-sage/30 text-primary'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 13 Collapsible Dossier Sections */}
      <div className="space-y-3">
        {DOSSIER_SECTIONS.map((section, idx) => {
          const isOpen = openIndices.includes(idx);
          const stat = sectionProgress.perSection[idx];
          const tableRows = section.table ? (store.t[section.table.key] ?? []) : [];

          return (
            <section
              key={section.title}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 overflow-hidden shadow-[0_1px_2px_rgba(22,38,59,0.03)]"
            >
              <button
                type="button"
                onClick={() => toggleSection(idx)}
                aria-expanded={isOpen}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left bg-surface-container-low/70 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-editorial text-lg sm:text-xl font-semibold text-primary leading-snug">
                    <span className="tabular-nums text-secondary mr-2">{idx + 1}.</span>
                    {section.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-on-surface-variant tabular-nums">
                    {stat.done}/{stat.total}
                  </span>
                  <ChevronDown
                    className={`no-print w-4 h-4 text-secondary transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="p-5 sm:p-6 border-t border-outline-variant/40 space-y-5">
                  {section.intro && (
                    <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-container-low rounded-xl p-4 border border-outline-variant/40">
                      {section.intro}
                    </p>
                  )}

                  {section.table && (
                    <div className="space-y-3">
                      <div className="overflow-x-auto rounded-xl border border-outline-variant/50">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-surface-container-low border-b border-outline-variant/50">
                              {section.table.columns.map((col) => (
                                <th
                                  key={col}
                                  className="px-3 py-2.5 text-[11px] font-semibold tracking-wider text-secondary uppercase whitespace-nowrap"
                                >
                                  {col}
                                </th>
                              ))}
                              <th className="no-print w-10 px-2 py-2.5" aria-label="Row actions" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/40">
                            {tableRows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="bg-surface-container-lowest">
                                {section.table!.columns.map((col, colIdx) => (
                                  <td key={col} className="p-1.5 min-w-[140px]">
                                    <input
                                      type="text"
                                      aria-label={`${section.title} row ${rowIdx + 1} ${col}`}
                                      value={row[colIdx] ?? ''}
                                      onChange={(e) =>
                                        handleCellChange(
                                          section.table!.key,
                                          rowIdx,
                                          colIdx,
                                          e.target.value
                                        )
                                      }
                                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg border border-outline-variant/60 bg-surface text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest"
                                    />
                                  </td>
                                ))}
                                <td className="no-print p-1.5 text-center">
                                  <button
                                    type="button"
                                    disabled={tableRows.length <= 1}
                                    onClick={() => handleRemoveRow(section.table!.key, rowIdx)}
                                    aria-label={`Remove row ${rowIdx + 1} from ${section.title}`}
                                    className="min-w-[36px] min-h-[36px] rounded-lg inline-flex items-center justify-center text-on-surface-variant hover:text-red-700 hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddRow(section.table!)}
                        className="no-print min-h-[40px] px-3.5 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-semibold text-primary hover:bg-surface-container transition-colors inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-secondary" />
                        <span>Add row</span>
                      </button>
                    </div>
                  )}

                  {section.fields && section.fields.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields.map((field) => {
                        const inputId = `dossier-field-${field.key}`;
                        const value = store.f[field.key] ?? '';
                        const isFullWidth = field.type === 'area';

                        return (
                          <div
                            key={field.key}
                            className={isFullWidth ? 'md:col-span-2 space-y-1.5' : 'space-y-1.5'}
                          >
                            <label
                              htmlFor={inputId}
                              className="block text-xs font-semibold text-primary"
                            >
                              {field.label}
                            </label>
                            {field.type === 'area' ? (
                              <textarea
                                id={inputId}
                                rows={3}
                                value={value}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-outline-variant text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest"
                              />
                            ) : (
                              <input
                                id={inputId}
                                type="text"
                                value={value}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-surface border border-outline-variant text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-surface-container-lowest"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Backup, Restore & Clear Toolbar */}
      <section className="no-print bg-surface-container-low rounded-2xl p-4 sm:p-5 border border-outline-variant/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveBackup}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs sm:text-sm font-medium hover:bg-tertiary-container transition-colors inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-secondary-fixed" />
              <span>Save backup</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-primary text-xs sm:text-sm font-medium hover:bg-surface-container transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-secondary" />
              <span>Load backup</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleLoadBackup}
              className="hidden"
            />

            {!confirmClear && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface-variant text-xs sm:text-sm font-medium hover:text-red-700 hover:border-red-300 transition-colors inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRequestService('foundation-assessment')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-sage text-on-sage text-xs sm:text-sm font-medium hover:bg-sage-hover transition-colors inline-flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Request Bound Linen Edition</span>
          </button>
        </div>

        {confirmClear && (
          <div
            role="alertdialog"
            aria-label="Confirm clearing dossier entries"
            className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-xs sm:text-sm text-red-950 font-medium">
              Clear everything in this Care Dossier on this device? Download a JSON backup first if you want to keep a copy.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white border border-outline-variant text-xs font-medium text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-red-700 text-white text-xs font-semibold hover:bg-red-800"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Dossier Confidentiality & Founder Footer */}
      <footer className="bg-surface-container-low rounded-2xl p-5 border border-brass/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-on-surface-variant">
        <div className="space-y-1">
          <p className="font-semibold text-primary">
            {FOUNDER_PROFILE.fullName} · {FOUNDER_PROFILE.role}
          </p>
          <p className="tabular-nums">
            <a href={FOUNDER_PROFILE.phoneHref} className="hover:text-primary underline-offset-2 hover:underline">
              {FOUNDER_PROFILE.phone}
            </a>{' '}
            · {FOUNDER_PROFILE.website}
          </p>
        </div>
        <div className="flex items-center gap-2 text-secondary font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Confidential. Contains protected health information.</span>
        </div>
      </footer>

      <ScopeNotice />
    </div>
  );
}
