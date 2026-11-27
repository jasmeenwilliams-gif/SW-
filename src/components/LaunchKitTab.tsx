import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileDown,
  FileSpreadsheet,
  FileText,
  MapPin,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
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
  DEFAULT_DOSSIER_CARD,
  FOUNDER_PROFILE,
  INITIAL_QUESTIONS,
  INITIAL_READINESS_ITEMS,
  OVERVIEW_SCENARIOS,
  SERVICE_CORRIDORS,
} from '../data/conciergeData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { ClinicQuestion, DossierCardData, ServiceProtocolId } from '../types/concierge';
import { CloudSyncBanner } from './CloudSyncBanner';
import { ScopeNotice } from './ScopeNotice';
import { SwMonogramCrest } from './SwMonogramCrest';

interface LaunchKitTabProps {
  onRequestService: (service: ServiceProtocolId) => void;
  onOpenDossier?: () => void;
}

const STORAGE_KEYS = {
  checkedIds: 'sw_launch_kit_checked_v1',
  questions: 'sw_launch_kit_questions_v1',
  dossier: 'sw_launch_kit_dossier_v1',
};

const SPECIALTIES = [
  'Primary Care',
  'Cardiology',
  'Neurology',
  'Ophthalmology',
  'Pharmacy Review',
  'Orthopedics',
];

function sanitizeLaunchKitPayload(
  checkedIds: string[],
  questions: ClinicQuestion[],
  dossierCard: DossierCardData
) {
  return {
    checkedIds: checkedIds
      .filter((id) => typeof id === 'string' && id.length > 0)
      .slice(0, 20)
      .map((id) => id.slice(0, 64)),
    questions: questions.slice(0, 50).map((q) => ({
      id: String(q.id).slice(0, 64),
      specialty: String(q.specialty).slice(0, 80),
      question: String(q.question).slice(0, 500),
      createdAt: String(q.createdAt).slice(0, 64),
    })),
    dossierCard: {
      clientName: String(dossierCard.clientName ?? '').slice(0, 120),
      city: String(dossierCard.city ?? '').slice(0, 120),
      preferredHospital: String(dossierCard.preferredHospital ?? '').slice(0, 160),
      primaryPharmacy: String(dossierCard.primaryPharmacy ?? '').slice(0, 160),
      primaryPhysician: String(dossierCard.primaryPhysician ?? '').slice(0, 160),
      familyContact: String(dossierCard.familyContact ?? '').slice(0, 120),
      familyPhone: String(dossierCard.familyPhone ?? '').slice(0, 60),
      allergiesOrNotes: String(dossierCard.allergiesOrNotes ?? '').slice(0, 500),
    },
  };
}

export function LaunchKitTab({ onRequestService, onOpenDossier }: LaunchKitTabProps) {
  const { user, userProfile, authReady } = useFirebase();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(OVERVIEW_SCENARIOS[0].id);
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.checkedIds);
      return saved ? (JSON.parse(saved) as string[]) : ['med-list', 'family-circle'];
    } catch {
      return ['med-list', 'family-circle'];
    }
  });

  const [questions, setQuestions] = useState<ClinicQuestion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.questions);
      return saved ? (JSON.parse(saved) as ClinicQuestion[]) : INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });

  const [dossier, setDossier] = useState<DossierCardData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.dossier);
      return saved ? (JSON.parse(saved) as DossierCardData) : DEFAULT_DOSSIER_CARD;
    } catch {
      return DEFAULT_DOSSIER_CARD;
    }
  });

  const [newSpecialty, setNewSpecialty] = useState(SPECIALTIES[0]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [copiedNotice, setCopiedNotice] = useState<'questions' | 'dossier' | null>(null);
  const [cloudDocExists, setCloudDocExists] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const cloudDocExistsRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.checkedIds, JSON.stringify(checkedIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [checkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.questions, JSON.stringify(questions));
    } catch {
      // Ignore storage quota errors
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.dossier, JSON.stringify(dossier));
    } catch {
      // Ignore storage quota errors
    }
  }, [dossier]);

  const writeKitToCloud = async (
    nextChecked: string[],
    nextQuestions: ClinicQuestion[],
    nextDossier: DossierCardData,
    uid: string
  ) => {
    const kitPath = `users/${uid}/launchKits/default`;
    const kitRef = doc(db, 'users', uid, 'launchKits', 'default');
    const payload = sanitizeLaunchKitPayload(nextChecked, nextQuestions, nextDossier);
    setSyncState('saving');

    try {
      if (cloudDocExistsRef.current) {
        try {
          await updateDoc(kitRef, {
            ...payload,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, kitPath);
        }
      } else {
        try {
          await setDoc(kitRef, {
            ownerId: uid,
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          cloudDocExistsRef.current = true;
          setCloudDocExists(true);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, kitPath);
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

    const kitPath = `users/${user.uid}/launchKits/default`;
    const kitRef = doc(db, 'users', user.uid, 'launchKits', 'default');

    const unsub = onSnapshot(
      kitRef,
      (snap) => {
        if (snap.exists()) {
          cloudDocExistsRef.current = true;
          setCloudDocExists(true);
          if (!snap.metadata.hasPendingWrites) {
            const data = snap.data() as Record<string, unknown>;
            if (Array.isArray(data.checkedIds)) {
              setCheckedIds(data.checkedIds.filter((x): x is string => typeof x === 'string'));
            }
            if (Array.isArray(data.questions)) {
              setQuestions(
                data.questions
                  .filter((q): q is Record<string, unknown> => Boolean(q && typeof q === 'object'))
                  .map((q) => ({
                    id: String(q.id ?? `q-${Date.now()}`),
                    specialty: String(q.specialty ?? 'Primary Care'),
                    question: String(q.question ?? ''),
                    createdAt: String(q.createdAt ?? 'Prepared'),
                  }))
              );
            }
            if (data.dossierCard && typeof data.dossierCard === 'object') {
              const card = data.dossierCard as Record<string, unknown>;
              setDossier({
                clientName: String(card.clientName ?? DEFAULT_DOSSIER_CARD.clientName),
                city: String(card.city ?? DEFAULT_DOSSIER_CARD.city),
                preferredHospital: String(
                  card.preferredHospital ?? DEFAULT_DOSSIER_CARD.preferredHospital
                ),
                primaryPharmacy: String(
                  card.primaryPharmacy ?? DEFAULT_DOSSIER_CARD.primaryPharmacy
                ),
                primaryPhysician: String(
                  card.primaryPhysician ?? DEFAULT_DOSSIER_CARD.primaryPhysician
                ),
                familyContact: String(card.familyContact ?? DEFAULT_DOSSIER_CARD.familyContact),
                familyPhone: String(card.familyPhone ?? DEFAULT_DOSSIER_CARD.familyPhone),
                allergiesOrNotes: String(
                  card.allergiesOrNotes ?? DEFAULT_DOSSIER_CARD.allergiesOrNotes
                ),
              });
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
          handleFirestoreError(listenErr, OperationType.GET, kitPath);
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

  const scheduleCloudSync = (
    nextChecked: string[],
    nextQuestions: ClinicQuestion[],
    nextDossier: DossierCardData
  ) => {
    if (!authReady || !user || !userProfile) return;
    setSyncState('saving');
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    const uid = user.uid;
    saveTimerRef.current = setTimeout(() => {
      void writeKitToCloud(nextChecked, nextQuestions, nextDossier, uid);
    }, 450);
  };

  const activeScenario =
    OVERVIEW_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? OVERVIEW_SCENARIOS[0];

  const toggleItem = (id: string) => {
    const next = checkedIds.includes(id)
      ? checkedIds.filter((item) => item !== id)
      : [...checkedIds, id];
    setCheckedIds(next);
    scheduleCloudSync(next, questions, dossier);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const item: ClinicQuestion = {
      id: `q-${Date.now()}`,
      specialty: newSpecialty,
      question: newQuestionText.trim(),
      createdAt: 'Prepared',
    };
    const next = [item, ...questions];
    setQuestions(next);
    setNewQuestionText('');
    scheduleCloudSync(checkedIds, next, dossier);
  };

  const handleDeleteQuestion = (id: string) => {
    const next = questions.filter((q) => q.id !== id);
    setQuestions(next);
    scheduleCloudSync(checkedIds, next, dossier);
  };

  const handleResetChecklist = () => {
    setCheckedIds([]);
    scheduleCloudSync([], questions, dossier);
  };

  const handleDossierChange = (nextDossier: DossierCardData) => {
    setDossier(nextDossier);
    scheduleCloudSync(checkedIds, questions, nextDossier);
  };

  const handleCopyText = async (type: 'questions' | 'dossier') => {
    const text =
      type === 'questions'
        ? [
            'SOUTHERN WELL — PRE-VISIT CLINIC QUESTIONS',
            ...questions.map((q, idx) => `${idx + 1}. [${q.specialty}] ${q.question}`),
          ].join('\n')
        : [
            'SOUTHERN WELL — CARE DOSSIER QUICK REFERENCE',
            `Client: ${dossier.clientName} (${dossier.city})`,
            `Primary Physician: ${dossier.primaryPhysician}`,
            `Preferred Hospital: ${dossier.preferredHospital}`,
            `Primary Pharmacy: ${dossier.primaryPharmacy}`,
            `Family Debrief Contact: ${dossier.familyContact} · ${dossier.familyPhone}`,
            `Notes & Sensitivities: ${dossier.allergiesOrNotes}`,
          ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedNotice(type);
      setTimeout(() => setCopiedNotice(null), 2200);
    } catch {
      setCopiedNotice(type);
      setTimeout(() => setCopiedNotice(null), 2200);
    }
  };

  const completedCount = checkedIds.length;
  const totalCount = INITIAL_READINESS_ITEMS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14 space-y-8 lg:space-y-10">
      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            For Families &amp; Estate Stewards
          </p>
          <h1 className="font-editorial text-[36px] sm:text-[42px] leading-[1.1] text-primary-container font-semibold mt-2">
            Family Guidance &amp; Preparation Kit
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-2.5 leading-relaxed max-w-2xl">
            Explore how we tailor advocacy for your family&apos;s dynamic, and use our private preparation tools—synced privately across devices when signed in.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="no-print min-h-[44px] px-4 py-2.5 rounded bg-surface-container-low border border-brass/35 text-primary-container text-xs font-semibold uppercase tracking-wider hover:bg-surface-container transition-colors inline-flex items-center gap-2 self-start lg:self-auto shrink-0"
        >
          <Printer className="w-4 h-4 text-secondary" />
          <span>Print Family Kit</span>
        </button>
      </section>

      <CloudSyncBanner
        workspaceLabel="Family Preparation Kit"
        syncState={syncState}
        showPushDraft={Boolean(user && userProfile && !cloudDocExists)}
        onPushDraft={() => {
          if (user && userProfile) {
            void writeKitToCloud(checkedIds, questions, dossier, user.uid);
          }
        }}
      />

      {/* Interactive Family Situation Selector */}
      <section className="bg-surface-container-low rounded p-6 sm:p-8 border border-brass/30 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
              Tailored Engagement
            </p>
            <h2 className="font-editorial text-2xl text-primary-container font-medium mt-1">
              How We Support Your Family&apos;s Season
            </h2>
          </div>

          <div
            className="flex flex-wrap gap-1.5 p-1 bg-surface-container rounded border border-brass/20"
            role="tablist"
            aria-label="Select family situation"
          >
            {OVERVIEW_SCENARIOS.map((scenario) => {
              const active = scenario.id === activeScenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={`min-h-[40px] px-3.5 py-2 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-primary-container text-secondary-fixed shadow-sm'
                      : 'text-on-surface-variant hover:text-primary-container'
                  }`}
                >
                  {scenario.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4 border-t border-brass/20">
          <div className="lg:col-span-6 space-y-2">
            <p className="text-xs text-secondary font-semibold">{activeScenario.regionNote}</p>
            <h3 className="font-editorial text-xl sm:text-2xl text-primary-container font-medium">
              {activeScenario.headline}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {activeScenario.summary}
            </p>
          </div>
          <div className="lg:col-span-6 bg-surface-container-lowest rounded p-5 border border-brass/25 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Primary Concierge Focus
            </p>
            <ul className="space-y-2.5">
              {activeScenario.focusPoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-primary-container">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Full Digital Care Dossier Callout */}
      {onOpenDossier && (
        <section className="no-print bg-primary-container text-on-primary rounded p-6 sm:p-7 border border-brass/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sconce-glow">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-secondary-fixed text-[11px] font-semibold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Full 13-Section Record</span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-medium">
              Complete Interactive Care Dossier – Digital
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Document medications, providers, legal directives, daily routines, home safety, and visit logs with JSON backup support and print/PDF export.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenDossier}
              className="min-h-[44px] px-4 py-2.5 rounded bg-secondary text-on-secondary text-xs font-semibold uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors inline-flex items-center gap-2 whitespace-nowrap"
            >
              <span>Open Digital Care Dossier</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={FOUNDER_PROFILE.offlineDossierPath}
              download="Care_Dossier_Southern_Well.html"
              className="min-h-[44px] px-3.5 py-2.5 rounded bg-tertiary-container border border-brass/35 text-secondary-fixed text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <FileDown className="w-4 h-4" />
              <span>Offline HTML</span>
            </a>
          </div>
        </section>
      )}

      {/* Main Grid: Checklist + Clinic Question Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1. Readiness Checklist */}
        <section className="lg:col-span-6 bg-surface-container-lowest rounded p-6 border border-brass/25 space-y-4 shadow-[0_4px_20px_-2px_rgba(11,25,44,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Pre-Assessment Checklist
              </p>
              <h2 className="font-editorial text-xl text-primary-container font-medium mt-0.5">
                Foundation Dossier Readiness
              </h2>
            </div>
            <div className="text-right tabular-nums">
              <span className="font-editorial text-xl font-semibold text-primary-container">
                {completedCount}/{totalCount}
              </span>
              <p className="text-[11px] text-on-surface-variant">{progressPct}% gathered</p>
            </div>
          </div>

          <div
            className="w-full h-2 rounded-full bg-surface-container overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Care readiness checklist progress"
          >
            <div
              className="h-full bg-sage transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <ul className="divide-y divide-brass/15">
            {INITIAL_READINESS_ITEMS.map((item) => {
              const checked = checkedIds.includes(item.id);
              return (
                <li key={item.id} className="py-2.5 first:pt-1 last:pb-1">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    aria-pressed={checked}
                    className="w-full text-left flex items-start gap-3 py-1 group"
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-primary-container border-primary-container text-secondary-fixed'
                          : 'bg-surface-container-lowest border-primary-container text-transparent group-hover:border-secondary'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-secondary font-semibold">
                        <span>{item.category}</span>
                      </div>
                      <p
                        className={`text-sm font-medium mt-0.5 leading-snug ${
                          checked ? 'line-through text-on-surface-variant' : 'text-primary-container'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="no-print pt-3 flex items-center justify-between border-t border-brass/20">
            <button
              type="button"
              onClick={handleResetChecklist}
              className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-primary-container transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Checklist</span>
            </button>
            <button
              type="button"
              onClick={() => onRequestService('foundation-assessment')}
              className="min-h-[40px] text-xs font-semibold text-secondary hover:text-primary-container transition-colors"
            >
              Ready for Foundation Assessment →
            </button>
          </div>
        </section>

        {/* 2. Clinic Visit Question Builder */}
        <section className="lg:col-span-6 bg-surface-container-lowest rounded p-6 border border-brass/25 space-y-4 shadow-[0_4px_20px_-2px_rgba(11,25,44,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Service 03 Companion Tool
              </p>
              <h2 className="font-editorial text-xl text-primary-container font-medium mt-0.5">
                Pre-Visit Clinic Question Builder
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleCopyText('questions')}
              className="no-print min-h-[40px] px-3 py-1.5 rounded bg-surface-container-low border border-brass/30 text-xs font-medium text-primary-container hover:bg-surface-container transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <Copy className="w-3.5 h-3.5 text-secondary" />
              <span>{copiedNotice === 'questions' ? 'Copied' : 'Copy List'}</span>
            </button>
          </div>

          <form onSubmit={handleAddQuestion} className="no-print space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                aria-label="Clinic specialty"
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                className="min-h-[44px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-xs font-medium text-primary-container focus:outline-none focus:border-brass"
              >
                {SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Write a question for the upcoming appointment..."
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container focus:outline-none focus:border-brass"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider hover:bg-tertiary-container transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {questions.length === 0 ? (
            <div className="p-5 rounded bg-surface-container-low border border-brass/20 text-center text-sm text-on-surface-variant">
              No appointment questions drafted yet. Add a specialty question above to prepare for your next clinic visit.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {questions.map((item, idx) => (
                <li
                  key={item.id}
                  className="p-3.5 rounded bg-surface-container-low border border-brass/20 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-secondary">
                      <span className="tabular-nums">Question {idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.specialty}</span>
                    </div>
                    <p className="text-sm text-primary-container mt-1 leading-relaxed">
                      {item.question}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(item.id)}
                    aria-label={`Remove question ${idx + 1}`}
                    className="no-print min-w-[36px] min-h-[36px] rounded flex items-center justify-center text-on-surface-variant hover:text-red-700 hover:bg-surface-container transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 3. Quick-Reference Care Dossier Card Builder */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="no-print lg:col-span-6 bg-surface-container-lowest rounded p-6 border border-brass/25 space-y-4 shadow-[0_4px_20px_-2px_rgba(11,25,44,0.04)]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-secondary" />
            <h2 className="font-editorial text-xl text-primary-container font-medium">
              Quick-Reference Care Card Editor
            </h2>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Customize this sample Care Dossier summary card for a wallet, refrigerator folder, or emergency binder.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="dossier-name" className="block text-xs font-semibold text-primary-container mb-1">
                Client Full Name
              </label>
              <input
                id="dossier-name"
                type="text"
                value={dossier.clientName}
                onChange={(e) => handleDossierChange({ ...dossier, clientName: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container focus:outline-none focus:border-brass"
              />
            </div>
            <div>
              <label htmlFor="dossier-city" className="block text-xs font-semibold text-primary-container mb-1">
                City &amp; State
              </label>
              <input
                id="dossier-city"
                type="text"
                value={dossier.city}
                onChange={(e) => handleDossierChange({ ...dossier, city: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container focus:outline-none focus:border-brass"
              />
            </div>
            <div>
              <label htmlFor="dossier-hospital" className="block text-xs font-semibold text-primary-container mb-1">
                Preferred Hospital
              </label>
              <input
                id="dossier-hospital"
                type="text"
                value={dossier.preferredHospital}
                onChange={(e) => handleDossierChange({ ...dossier, preferredHospital: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container focus:outline-none focus:border-brass"
              />
            </div>
            <div>
              <label htmlFor="dossier-pharmacy" className="block text-xs font-semibold text-primary-container mb-1">
                Primary Pharmacy
              </label>
              <input
                id="dossier-pharmacy"
                type="text"
                value={dossier.primaryPharmacy}
                onChange={(e) => handleDossierChange({ ...dossier, primaryPharmacy: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container focus:outline-none focus:border-brass"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="dossier-physician" className="block text-xs font-semibold text-primary-container mb-1">
                Primary Physician
              </label>
              <input
                id="dossier-physician"
                type="text"
                value={dossier.primaryPhysician}
                onChange={(e) => handleDossierChange({ ...dossier, primaryPhysician: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container focus:outline-none focus:border-brass"
              />
            </div>
            <div>
              <label htmlFor="dossier-contact" className="block text-xs font-semibold text-primary-container mb-1">
                Family Contact
              </label>
              <input
                id="dossier-contact"
                type="text"
                value={dossier.familyContact}
                onChange={(e) => handleDossierChange({ ...dossier, familyContact: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container focus:outline-none focus:border-brass"
              />
            </div>
            <div>
              <label htmlFor="dossier-phone" className="block text-xs font-semibold text-primary-container mb-1">
                Family Phone
              </label>
              <input
                id="dossier-phone"
                type="text"
                value={dossier.familyPhone}
                onChange={(e) => handleDossierChange({ ...dossier, familyPhone: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container tabular-nums focus:outline-none focus:border-brass"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="dossier-notes" className="block text-xs font-semibold text-primary-container mb-1">
                Sensitivities &amp; Preferences
              </label>
              <input
                id="dossier-notes"
                type="text"
                value={dossier.allergiesOrNotes}
                onChange={(e) => handleDossierChange({ ...dossier, allergiesOrNotes: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded bg-surface-container-lowest border border-outline-variant text-sm text-primary-container focus:outline-none focus:border-brass"
              />
            </div>
          </div>
        </div>

        {/* Live Formatted Dossier Preview */}
        <div className="lg:col-span-6 bg-primary-container text-on-primary rounded p-6 sm:p-8 flex flex-col justify-between shadow-md border border-brass/40 sconce-glow">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-brass/35 pb-4">
              <div className="flex items-start gap-3">
                <SwMonogramCrest className="w-9 h-9 text-brass shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary-fixed">
                    Southern Well · Care Dossier Card
                  </p>
                  <h3 className="font-editorial text-2xl text-on-primary font-medium mt-0.5">
                    {dossier.clientName || 'Client Name'}
                  </h3>
                  <p className="text-xs text-slate-300">{dossier.city}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText('dossier')}
                className="no-print min-h-[40px] px-3 py-1.5 rounded bg-tertiary-container border border-brass/40 text-xs font-semibold text-secondary-fixed hover:bg-white/10 transition-colors inline-flex items-center gap-1.5 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedNotice === 'dossier' ? 'Copied' : 'Copy Card'}</span>
              </button>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[11px] text-secondary-fixed font-semibold uppercase tracking-wider">
                  Primary Physician
                </dt>
                <dd className="text-on-primary mt-0.5">{dossier.primaryPhysician}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-secondary-fixed font-semibold uppercase tracking-wider">
                  Preferred Hospital
                </dt>
                <dd className="text-on-primary mt-0.5">{dossier.preferredHospital}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-secondary-fixed font-semibold uppercase tracking-wider">
                  Primary Pharmacy
                </dt>
                <dd className="text-on-primary mt-0.5">{dossier.primaryPharmacy}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-secondary-fixed font-semibold uppercase tracking-wider">
                  Family Contact
                </dt>
                <dd className="text-on-primary mt-0.5">
                  {dossier.familyContact}
                  <span className="block text-xs text-slate-300 tabular-nums">
                    {dossier.familyPhone}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-brass/20">
                <dt className="text-[11px] text-secondary-fixed font-semibold uppercase tracking-wider">
                  Sensitivities &amp; Visit Preferences
                </dt>
                <dd className="text-on-primary mt-0.5 text-sm">{dossier.allergiesOrNotes}</dd>
              </div>
            </dl>
          </div>

          <div className="no-print mt-6 pt-4 border-t border-brass/25 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-300">
              Full bound &amp; digital dossier delivered in Protocol 01
            </span>
            <button
              type="button"
              onClick={() => onRequestService('foundation-assessment')}
              className="min-h-[44px] px-4 py-2 rounded bg-secondary text-on-secondary text-xs font-semibold uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors"
            >
              Build Official Dossier
            </button>
          </div>
        </div>
      </section>

      {/* Regional Corridors */}
      <section className="bg-primary-container text-on-primary rounded p-6 sm:p-8 border border-brass/35 space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary-fixed">
            Regional Footprint
          </p>
          <h2 className="font-editorial text-2xl font-medium mt-1">
            Serving South Mississippi&apos;s Pine Belt &amp; Gulf Coast
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SERVICE_CORRIDORS.map((corridor) => (
            <div
              key={corridor.region}
              className="bg-tertiary-container rounded p-4 border border-brass/25 space-y-2"
            >
              <div className="flex items-center gap-2 text-secondary-fixed">
                <MapPin className="w-4 h-4 shrink-0" />
                <h3 className="font-editorial text-base font-medium text-on-primary">
                  {corridor.region}
                </h3>
              </div>
              <p className="text-xs text-secondary-fixed-dim font-medium">{corridor.hubs}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{corridor.coverage}</p>
            </div>
          ))}
        </div>
      </section>

      <ScopeNotice />
    </div>
  );
}
