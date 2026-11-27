import { useState } from 'react';
import {
  Check,
  Gift,
  HeartHandshake,
  Pill,
  Plus,
  Share2,
  Wallet,
} from 'lucide-react';
import {
  calculateBHLS,
  calculateMMAS,
  OPS_PACKAGES,
  OPS_PORCH_TIERS,
  offsetDay,
  type BHLSResponses,
  type MMASResponses,
  type OpsDataState,
  type OpsMed,
  type OpsPayment,
  type OpsReferral,
} from '../../data/opsData';

interface ReferralsViewProps {
  data: OpsDataState;
  onAddReferral: (ref: OpsReferral) => void;
  onUpdateReferralStatus: (index: number, status: OpsReferral['status']) => void;
}

export function ReferralsView({
  data,
  onAddReferral,
  onUpdateReferralStatus,
}: ReferralsViewProps) {
  const [client, setClient] = useState(data.clients[0]?.id ?? 'SW-RM-4081');
  const [kind, setKind] = useState<OpsReferral['kind']>('Provider');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(offsetDay(0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) return;
    onAddReferral({
      client,
      kind,
      to: to.trim(),
      date,
      status: 'Pending',
    });
    setTo('');
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Vetted Partner Network
          </p>
          <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
            Clinical, Legal &amp; Community Referrals
          </h2>
        </div>
        <Share2 className="w-5 h-5 text-secondary shrink-0" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded p-5 border border-brass/25 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label htmlFor="ref-client" className="block text-xs font-semibold text-primary-container mb-1">
            Client
          </label>
          <select
            id="ref-client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          >
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ini} ({c.id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ref-kind" className="block text-xs font-semibold text-primary-container mb-1">
            Partner Type
          </label>
          <select
            id="ref-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as OpsReferral['kind'])}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          >
            {(['LCSW', 'Provider', 'Pharmacy', 'Community resource', 'Elder Law'] as const).map(
              (k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              )
            )}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="ref-to" className="block text-xs font-semibold text-primary-container mb-1">
            Receiving Organization / Specialist
          </label>
          <input
            id="ref-to"
            type="text"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g., Hattiesburg Clinic Memory Center"
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            aria-label="Referral date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 min-h-[40px] px-2 py-1.5 rounded bg-surface border border-outline-variant text-xs"
          />
          <button
            type="submit"
            className="min-h-[40px] px-4 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider shrink-0"
          >
            Log
          </button>
        </div>
      </form>

      <div className="space-y-2.5">
        {data.referrals.map((ref, idx) => (
          <div
            key={`${ref.client}-${ref.to}-${idx}`}
            className="bg-surface-container-lowest rounded p-4 border border-brass/25 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs font-semibold text-secondary">
                {ref.client} · {ref.kind}
              </p>
              <p className="text-sm font-medium text-primary-container mt-0.5">{ref.to}</p>
              <p className="text-xs text-on-surface-variant tabular-nums mt-0.5">
                Logged {ref.date}
              </p>
            </div>
            <select
              aria-label={`Referral status for ${ref.to}`}
              value={ref.status}
              onChange={(e) =>
                onUpdateReferralStatus(idx, e.target.value as OpsReferral['status'])
              }
              className="min-h-[38px] px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant text-xs font-semibold text-primary-container"
            >
              {(['Pending', 'Sent', 'Closed'] as const).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MedsViewProps {
  data: OpsDataState;
  onAddMed: (med: OpsMed) => void;
  onToggleMed: (index: number) => void;
  onUpdateMmas: (next: MMASResponses) => void;
  onUpdateBhls: (next: BHLSResponses) => void;
}

const MMAS_QUESTIONS: { key: keyof MMASResponses; label: string }[] = [
  { key: 'q1', label: '1. Do you sometimes forget to take your pills?' },
  { key: 'q2', label: '2. Were there any days over the past two weeks you did not take your medicine?' },
  { key: 'q3', label: '3. Have you ever cut back or stopped taking medicine without telling your doctor?' },
  { key: 'q4', label: '4. When you travel or leave home, do you sometimes forget to bring your medicine?' },
  { key: 'q5', label: '5. Did you take all your medicines yesterday? (Yes = 1, No = 0)' },
  { key: 'q6', label: '6. When you feel like your symptoms are under control, do you sometimes stop?' },
  { key: 'q7', label: '7. Do you ever feel hassled about sticking to your treatment plan?' },
];

const BHLS_QUESTIONS: { key: keyof BHLSResponses; label: string }[] = [
  { key: 'q1', label: '1. How often do you have someone help you read hospital or clinic materials?' },
  { key: 'q2', label: '2. How confident are you filling out medical forms by yourself?' },
  { key: 'q3', label: '3. How often do you have problems learning about your health due to difficulty reading written info?' },
];

export function MedsView({
  data,
  onAddMed,
  onToggleMed,
  onUpdateMmas,
  onUpdateBhls,
}: MedsViewProps) {
  const [client, setClient] = useState(data.clients[0]?.id ?? 'SW-RM-4081');
  const [item, setItem] = useState('');
  const [src, setSrc] = useState<OpsMed['src']>('Provider');
  const [refill, setRefill] = useState(offsetDay(7));
  const [pharm, setPharm] = useState('Highland Pharmacy');

  const mmasResult = calculateMMAS(data.mmasResponses);
  const bhlsResult = calculateBHLS(data.bhlsResponses);

  const toneStyle = (tone: 'navy' | 'brass' | 'crimson') =>
    tone === 'crimson'
      ? 'bg-red-50 border-red-200 text-red-950'
      : tone === 'brass'
        ? 'bg-surface-container-low border-brass text-primary-container'
        : 'bg-primary-container border-brass/40 text-on-primary';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return;
    onAddMed({
      client,
      item: item.trim(),
      src,
      refill,
      pharm: pharm.trim() || 'Preferred Pharmacy',
      done: false,
    });
    setItem('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Non-Clinical Observational Inventory
          </p>
          <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
            Medication Tracker, MMAS-8 &amp; BHLS Check-Ins
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Containers recorded verbatim as supplied. Refill alerts support timely client/pharmacy coordination only.
          </p>
        </div>
        <Pill className="w-6 h-6 text-secondary shrink-0" />
      </div>

      {/* Add Medication Refill Tracker Item */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded p-5 border border-brass/25 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
      >
        <div>
          <label htmlFor="med-client" className="block text-xs font-semibold text-primary-container mb-1">
            Client
          </label>
          <select
            id="med-client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          >
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ini} ({c.id})
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="med-item" className="block text-xs font-semibold text-primary-container mb-1">
            Medication Label (Verbatim)
          </label>
          <input
            id="med-item"
            type="text"
            required
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g., Furosemide 20mg Daily"
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          />
        </div>
        <div>
          <label htmlFor="med-pharm" className="block text-xs font-semibold text-primary-container mb-1">
            Pharmacy &amp; Source
          </label>
          <div className="flex gap-1.5">
            <input
              id="med-pharm"
              type="text"
              value={pharm}
              onChange={(e) => setPharm(e.target.value)}
              className="flex-1 min-w-0 min-h-[40px] px-2.5 py-1.5 rounded bg-surface border border-outline-variant text-xs"
            />
            <select
              aria-label="Medication source"
              value={src}
              onChange={(e) => setSrc(e.target.value as OpsMed['src'])}
              className="min-h-[40px] px-2 py-1.5 rounded bg-surface border border-outline-variant text-xs"
            >
              <option value="Provider">Provider</option>
              <option value="Client">Client</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="med-refill" className="block text-xs font-semibold text-primary-container mb-1">
            Next Refill Date
          </label>
          <input
            id="med-refill"
            type="date"
            value={refill}
            onChange={(e) => setRefill(e.target.value)}
            className="w-full min-h-[40px] px-2.5 py-1.5 rounded bg-surface border border-outline-variant text-xs"
          />
        </div>
        <button
          type="submit"
          className="min-h-[40px] px-4 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Refill Roster */}
      <div className="space-y-2">
        {data.meds.map((m, idx) => (
          <div
            key={`${m.client}-${m.item}-${idx}`}
            className="bg-surface-container-lowest rounded p-4 border border-brass/25 flex items-center justify-between gap-4"
          >
            <button
              type="button"
              onClick={() => onToggleMed(idx)}
              className="flex items-start gap-3 text-left flex-1 min-w-0"
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  m.done
                    ? 'bg-primary-container border-primary-container text-secondary-fixed'
                    : 'border-primary-container text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    m.done ? 'line-through text-on-surface-variant' : 'text-primary-container'
                  }`}
                >
                  {m.item}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {m.client} · {m.pharm} · Label source: {m.src}
                </p>
              </div>
            </button>
            <span className="text-xs font-semibold text-secondary tabular-nums shrink-0">
              Refill {m.refill}
            </span>
          </div>
        ))}
      </div>

      {/* MMAS-8 & BHLS Check-In Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* MMAS-8 */}
        <section className="bg-surface-container-lowest rounded p-5 sm:p-6 border border-brass/30 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
              Routine Adherence Screen
            </p>
            <h3 className="font-editorial text-xl font-medium text-primary-container">
              MMAS-8 Medication Routine Check-In
            </h3>
          </div>

          <div className={`p-4 rounded border space-y-1.5 ${toneStyle(mmasResult.tone)}`}>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider">
              <span>{mmasResult.label}</span>
              <span className="tabular-nums">Score: {mmasResult.score} / 8</span>
            </div>
            <p className="text-xs leading-relaxed opacity-95">{mmasResult.recommendation}</p>
          </div>

          <div className="space-y-2.5">
            {MMAS_QUESTIONS.map((q) => {
              const val = data.mmasResponses[q.key];
              return (
                <div
                  key={q.key}
                  className="p-3 rounded bg-surface-container-low border border-brass/15 flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-primary-container leading-snug">{q.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {[
                      { v: 1, label: 'Score 1' },
                      { v: 0, label: 'Score 0' },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() =>
                          onUpdateMmas({ ...data.mmasResponses, [q.key]: opt.v })
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          val === opt.v
                            ? 'bg-primary-container text-secondary-fixed'
                            : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="p-3 rounded bg-surface-container-low border border-brass/15 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-primary-container font-medium">
                  8. How often do you have difficulty remembering to take all your medicines?
                </span>
                <span className="font-semibold text-secondary tabular-nums">
                  Option {data.mmasResponses.q8} / 4
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { v: 4, label: 'Never' },
                  { v: 3, label: 'Once' },
                  { v: 2, label: 'Sometimes' },
                  { v: 1, label: 'Usually' },
                  { v: 0, label: 'Always' },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => onUpdateMmas({ ...data.mmasResponses, q8: opt.v })}
                    className={`py-1.5 px-1 rounded text-[11px] font-semibold transition-colors ${
                      data.mmasResponses.q8 === opt.v
                        ? 'bg-primary-container text-secondary-fixed'
                        : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BHLS */}
        <section className="bg-surface-container-lowest rounded p-5 sm:p-6 border border-brass/30 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
              Communication Accessibility Screen
            </p>
            <h3 className="font-editorial text-xl font-medium text-primary-container">
              BHLS Brief Health Literacy Check-In
            </h3>
          </div>

          <div className={`p-4 rounded border space-y-1.5 ${toneStyle(bhlsResult.tone)}`}>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider">
              <span>{bhlsResult.label}</span>
              <span className="tabular-nums">Score: {bhlsResult.score} / 15</span>
            </div>
            <p className="text-xs leading-relaxed opacity-95">{bhlsResult.recommendation}</p>
          </div>

          <div className="space-y-3">
            {BHLS_QUESTIONS.map((q) => {
              const val = data.bhlsResponses[q.key];
              return (
                <div
                  key={q.key}
                  className="p-3.5 rounded bg-surface-container-low border border-brass/15 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-primary-container font-medium leading-snug">
                      {q.label}
                    </span>
                    <span className="font-semibold text-secondary tabular-nums shrink-0">
                      {val} / 5
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((scoreVal) => (
                      <button
                        key={scoreVal}
                        type="button"
                        onClick={() =>
                          onUpdateBhls({ ...data.bhlsResponses, [q.key]: scoreVal })
                        }
                        className={`py-1.5 rounded text-[11px] font-semibold tabular-nums transition-colors ${
                          val === scoreVal
                            ? 'bg-primary-container text-secondary-fixed'
                            : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant'
                        }`}
                      >
                        {scoreVal}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export function PackagesView({ data }: { data: OpsDataState }) {
  const pkgDescriptions: Record<string, { rate: string; scope: string }> = {
    Essentials: {
      rate: '$220 / month',
      scope: 'Bi-weekly phone check-ins, Care Dossier setup, and pharmacy refill reminders.',
    },
    Signature: {
      rate: '$425 / month',
      scope: 'Weekly check-ins, 1 in-person clinic accompaniment monthly, and bound 5-Tab Dossier.',
    },
    'Care Navigation': {
      rate: '$690 / month',
      scope: 'Full Pine Belt / Gulf Coast advocacy, multi-visit accompaniment, and 24-hr family debriefs.',
    },
    'À La Carte': {
      rate: '$95 / hour',
      scope: 'Targeted hospital discharge transitions, single appointment accompaniment, or home walkthrough.',
    },
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Private-Pay Fee Schedule &amp; Equity Tiers
          </p>
          <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
            Care Packages &amp; Granny Doris Porch Fund
          </h2>
        </div>
        <Gift className="w-6 h-6 text-secondary shrink-0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPS_PACKAGES.map((pkg) => {
          const count = data.clients.filter((c) => c.pkg === pkg).length;
          const info = pkgDescriptions[pkg];
          return (
            <div
              key={pkg}
              className="bg-surface-container-lowest rounded p-6 border border-brass/25 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-editorial text-xl font-semibold text-primary-container">
                  {pkg}
                </h3>
                <span className="text-sm font-semibold text-secondary tabular-nums">
                  {info?.rate}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{info?.scope}</p>
              <p className="text-xs font-semibold text-primary-container pt-2 border-t border-brass/15 tabular-nums">
                Active clients on tier: {count}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-primary-container text-on-primary rounded p-6 border border-brass/40 space-y-3">
        <div className="flex items-center gap-2 text-secondary-fixed">
          <HeartHandshake className="w-5 h-5" />
          <h3 className="font-editorial text-xl font-medium">
            Granny Doris Porch Fund &amp; Sliding Scale Allocation
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {OPS_PORCH_TIERS.map((tier) => {
            const count = data.clients.filter((c) => c.porch === tier).length;
            return (
              <div
                key={tier}
                className="p-3.5 rounded bg-tertiary-container border border-brass/25"
              >
                <p className="text-xs font-semibold text-secondary-fixed">{tier}</p>
                <p className="font-editorial text-2xl text-on-primary mt-1 tabular-nums">
                  {count}
                </p>
                <p className="text-[11px] text-slate-300">Enrolled clients</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface PaymentsViewProps {
  data: OpsDataState;
  onAddPayment: (payment: OpsPayment) => void;
  onUpdatePaymentStatus: (index: number, status: OpsPayment['status']) => void;
}

export function PaymentsView({
  data,
  onAddPayment,
  onUpdatePaymentStatus,
}: PaymentsViewProps) {
  const [client, setClient] = useState(data.clients[0]?.id ?? 'SW-RM-4081');
  const [amt, setAmt] = useState('220');
  const [due, setDue] = useState(offsetDay(5));
  const [status, setStatus] = useState<OpsPayment['status']>('Due');

  const totalPaid = data.payments
    .filter((p) => p.status === 'Paid')
    .reduce((acc, p) => acc + p.amt, 0);
  const totalOpen = data.payments
    .filter((p) => p.status !== 'Paid')
    .reduce((acc, p) => acc + p.amt, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amt);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    onAddPayment({
      client,
      amt: Math.round(numeric),
      due,
      status,
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Retainer Ledger
          </p>
          <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
            Payment Tracking
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs tabular-nums">
          <div className="px-3.5 py-2 rounded bg-surface-container-lowest border border-brass/25">
            <span className="text-on-surface-variant block text-[10px] uppercase tracking-wider">
              Collected
            </span>
            <span className="font-editorial text-xl font-semibold text-primary-container">
              ${totalPaid}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded bg-surface-container-lowest border border-brass/25">
            <span className="text-on-surface-variant block text-[10px] uppercase tracking-wider">
              Due / Overdue
            </span>
            <span className="font-editorial text-xl font-semibold text-secondary">
              ${totalOpen}
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded p-5 border border-brass/25 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label htmlFor="pay-client" className="block text-xs font-semibold text-primary-container mb-1">
            Client
          </label>
          <select
            id="pay-client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          >
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ini} ({c.id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pay-amt" className="block text-xs font-semibold text-primary-container mb-1">
            Amount (USD)
          </label>
          <input
            id="pay-amt"
            type="number"
            min={1}
            required
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="pay-due" className="block text-xs font-semibold text-primary-container mb-1">
            Due Date
          </label>
          <input
            id="pay-due"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          />
        </div>
        <div>
          <label htmlFor="pay-status" className="block text-xs font-semibold text-primary-container mb-1">
            Status
          </label>
          <select
            id="pay-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OpsPayment['status'])}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          >
            {(['Due', 'Paid', 'Overdue'] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="min-h-[40px] px-4 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5"
        >
          <Wallet className="w-4 h-4" />
          <span>Record</span>
        </button>
      </form>

      <div className="space-y-2.5">
        {data.payments.map((p, idx) => (
          <div
            key={`${p.client}-${p.due}-${idx}`}
            className="bg-surface-container-lowest rounded p-4 border border-brass/25 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs font-semibold text-secondary tabular-nums">{p.client}</p>
              <p className="font-editorial text-xl font-semibold text-primary-container tabular-nums">
                ${p.amt}
              </p>
              <p className="text-xs text-on-surface-variant tabular-nums">Due {p.due}</p>
            </div>
            <select
              aria-label={`Payment status for ${p.client}`}
              value={p.status}
              onChange={(e) =>
                onUpdatePaymentStatus(idx, e.target.value as OpsPayment['status'])
              }
              className={`min-h-[38px] px-3 py-1.5 rounded border text-xs font-semibold ${
                p.status === 'Overdue'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : p.status === 'Paid'
                    ? 'bg-surface-container-low border-sage/40 text-primary-container'
                    : 'bg-surface-container-low border-brass text-secondary'
              }`}
            >
              {(['Paid', 'Due', 'Overdue'] as const).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
