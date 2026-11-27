import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  HUB_PRESETS,
  LAUNCH_CHECKLIST_ITEMS,
  OPS_COUNTIES,
  OPS_COUNTY_COLORS,
  OPS_STEP_FORMS,
  OPS_STEPS,
  SOP_ITEMS,
  WORKFLOW_GUIDE_SECTIONS,
  type AlertPreset,
  type OpsDataState,
  type OpsNavId,
} from '../../data/opsData';

interface DashboardViewProps {
  data: OpsDataState;
  onChangePreset: (preset: AlertPreset) => void;
  onNavigateOps: (nav: OpsNavId) => void;
}

export function DashboardView({
  data,
  onChangePreset,
  onNavigateOps,
}: DashboardViewProps) {
  const today = new Date().toISOString().slice(0, 10);
  const presetThresholds = HUB_PRESETS[data.preset];

  const activeClients = data.clients.filter((c) => c.status === 'Active' || c.status === 'Check-in due').length;
  const openCheckins = data.checkins.filter((c) => !c.done);
  const openActions = data.actions.filter((a) => !a.done);
  const pendingReferrals = data.referrals.filter((r) => r.status === 'Pending');
  const unpaidPayments = data.payments.filter((p) => p.status !== 'Paid');
  const unpaidAmount = unpaidPayments.reduce((acc, p) => acc + p.amt, 0);

  const launchCompleted = LAUNCH_CHECKLIST_ITEMS.filter((i) => Boolean(data.launchDone[i.id])).length;
  const launchPct = Math.round((launchCompleted / LAUNCH_CHECKLIST_ITEMS.length) * 100);

  const overdueOrDueActions = openActions.filter((a) => a.due <= today).length;
  const actionAlert = openActions.length > presetThresholds.a || overdueOrDueActions > 0;
  const paymentAlert = unpaidPayments.length > presetThresholds.p;
  const referralAlert = pendingReferrals.length > presetThresholds.r;

  const countyCounts = OPS_COUNTIES.map((county, idx) => ({
    county,
    color: OPS_COUNTY_COLORS[idx] ?? '#16263B',
    count: data.clients.filter((c) => c.county === county).length,
  }));
  const maxCountyCount = Math.max(1, ...countyCounts.map((c) => c.count));

  return (
    <div className="space-y-6">
      {/* Command Header + Alert Sensitivity Preset */}
      <div className="bg-primary-container text-on-primary rounded p-6 border border-brass/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sconce-glow">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-fixed">
            Executive Command Overview
          </p>
          <h2 className="font-editorial text-2xl sm:text-3xl font-medium mt-1">
            Pine Belt &amp; Gulf Coast Practice Pulse
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time non-clinical caseload oversight, compliance checkpoints, and family briefing cadence.
          </p>
        </div>

        <div className="space-y-1.5 shrink-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-secondary-fixed-dim">
            Alert Sensitivity Preset
          </span>
          <div
            className="inline-flex p-1 rounded bg-tertiary-container border border-brass/30 gap-1"
            role="group"
            aria-label="Alert sensitivity preset"
          >
            {(['strict', 'standard', 'high'] as AlertPreset[]).map((preset) => {
              const active = data.preset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangePreset(preset)}
                  className={`min-h-[36px] px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors ${
                    active
                      ? 'bg-secondary text-on-secondary'
                      : 'text-slate-300 hover:text-on-primary'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Executive KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Active Caseload',
            value: String(activeClients),
            sub: `${data.clients.length} total clients`,
            nav: 'clients' as OpsNavId,
            alert: false,
          },
          {
            label: 'Open Check-Ins',
            value: String(openCheckins.length),
            sub: 'Scheduled touchpoints',
            nav: 'checkins' as OpsNavId,
            alert: openCheckins.length > 0,
          },
          {
            label: 'Action Plans',
            value: String(openActions.length),
            sub: actionAlert ? 'Attention threshold reached' : 'Within threshold',
            nav: 'actions' as OpsNavId,
            alert: actionAlert,
          },
          {
            label: 'Pending Referrals',
            value: String(pendingReferrals.length),
            sub: referralAlert ? 'Follow-up queued' : 'On track',
            nav: 'referrals' as OpsNavId,
            alert: referralAlert,
          },
          {
            label: 'Payments Due',
            value: `$${unpaidAmount}`,
            sub: `${unpaidPayments.length} open invoice${unpaidPayments.length === 1 ? '' : 's'}`,
            nav: 'payments' as OpsNavId,
            alert: paymentAlert,
          },
          {
            label: 'Launch Readiness',
            value: `${launchPct}%`,
            sub: `${launchCompleted}/${LAUNCH_CHECKLIST_ITEMS.length} verified`,
            nav: 'launch' as OpsNavId,
            alert: false,
          },
        ].map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => onNavigateOps(kpi.nav)}
            className={`text-left p-4 rounded bg-surface-container-lowest border transition-colors ${
              kpi.alert
                ? 'border-brass bg-surface-container-low hover:border-secondary'
                : 'border-brass/25 hover:border-brass'
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary block">
              {kpi.label}
            </span>
            <span className="font-editorial text-2xl font-semibold text-primary-container tabular-nums block mt-1">
              {kpi.value}
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-1 truncate">
              {kpi.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Regional Distribution & Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-6 bg-surface-container-lowest rounded p-5 sm:p-6 border border-brass/25 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Geographic Coverage
              </p>
              <h3 className="font-editorial text-xl font-medium text-primary-container">
                Regional Caseload Distribution
              </h3>
            </div>
            <Users className="w-4 h-4 text-secondary shrink-0" />
          </div>

          <div className="space-y-3">
            {countyCounts.map((row) => (
              <div key={row.county} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-primary-container">{row.county}</span>
                  <span className="tabular-nums text-on-surface-variant font-semibold">
                    {row.count}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded bg-surface-container overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.max(row.count > 0 ? 12 : 0, (row.count / maxCountyCount) * 100)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-6 bg-surface-container-lowest rounded p-5 sm:p-6 border border-brass/25 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Active Focus
              </p>
              <h3 className="font-editorial text-xl font-medium text-primary-container">
                Immediate Coordinator Queue
              </h3>
            </div>
            <CalendarClock className="w-4 h-4 text-secondary shrink-0" />
          </div>

          <div className="space-y-2.5">
            {openCheckins.slice(0, 3).map((chk, idx) => (
              <div
                key={`${chk.client}-${chk.date}-${idx}`}
                className="p-3 rounded bg-surface-container-low border border-brass/20 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-primary-container">
                    {chk.client} · {chk.type}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{chk.note}</p>
                </div>
                <span className="text-[11px] font-semibold text-secondary tabular-nums shrink-0">
                  {chk.date}
                </span>
              </div>
            ))}

            {openActions.slice(0, 2).map((act, idx) => (
              <div
                key={`${act.client}-${act.title}-${idx}`}
                className="p-3 rounded bg-surface-container-low border border-brass/20 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary-container truncate">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {act.client} · {act.owner}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-secondary tabular-nums shrink-0">
                  {act.due}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-brass/20 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => onNavigateOps('workflow')}
              className="text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary-container inline-flex items-center gap-1"
            >
              <span>Inspect 10-Step Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateOps('meds')}
              className="text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary-container inline-flex items-center gap-1"
            >
              <span>MMAS &amp; BHLS Check-Ins</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

interface WorkflowViewProps {
  data: OpsDataState;
  onUpdateClientStep: (clientId: string, nextStep: number) => void;
}

export function WorkflowView({ data, onUpdateClientStep }: WorkflowViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded p-5 sm:p-6 border border-brass/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            End-to-End Caseload Lifecycle
          </p>
          <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
            10-Step Intake &amp; Coordination Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Track each client from initial inquiry through Foundation Care Plan and active coordination, with required forms mapped per stage.
          </p>
        </div>
        <Compass className="w-6 h-6 text-secondary shrink-0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPS_STEPS.map(([stepName, sla], index) => {
          const stepNum = index + 1;
          const forms = OPS_STEP_FORMS[index] ?? [];
          const stepClients = data.clients.filter((c) => c.step === stepNum);

          return (
            <div
              key={stepName}
              className="bg-surface-container-lowest rounded p-5 border border-brass/25 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary tabular-nums">
                    Step {String(stepNum).padStart(2, '0')} · {stepName}
                  </span>
                  <span className="text-[11px] font-medium text-on-surface-variant">
                    SLA: {sla}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Required Forms &amp; Checkpoints
                  </p>
                  <ul className="space-y-1 text-xs text-primary-container">
                    {forms.map((form) => (
                      <li key={form} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                        <span>{form}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-brass/15 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Clients Currently Here ({stepClients.length})
                </p>
                {stepClients.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">No clients at this step</p>
                ) : (
                  <div className="space-y-1.5">
                    {stepClients.map((client) => (
                      <div
                        key={client.id}
                        className="p-2.5 rounded bg-surface-container-low border border-brass/20 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-primary-container">{client.ini}</span>
                          <span className="text-on-surface-variant">
                            {' '}
                            ({client.id}) · {client.pkg}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={stepNum <= 1}
                            onClick={() => onUpdateClientStep(client.id, stepNum - 1)}
                            className="px-2 py-1 rounded bg-surface-container-lowest border border-outline-variant text-[11px] font-medium text-primary-container disabled:opacity-40"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            disabled={stepNum >= OPS_STEPS.length}
                            onClick={() => onUpdateClientStep(client.id, stepNum + 1)}
                            className="px-2 py-1 rounded bg-primary-container text-secondary-fixed text-[11px] font-semibold disabled:opacity-40"
                          >
                            Advance
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GuideView() {
  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded p-5 sm:p-6 border border-brass/30 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Practice Playbook
          </p>
          <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
            Southern Well Workflow Manual
          </h2>
        </div>
        <BookOpen className="w-6 h-6 text-secondary shrink-0" />
      </div>

      <div className="space-y-4">
        {WORKFLOW_GUIDE_SECTIONS.map((sec) => (
          <article
            key={sec.phase}
            className="bg-surface-container-lowest rounded p-6 border border-brass/25 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-editorial text-xl font-medium text-primary-container">
                {sec.phase}
              </h3>
              <span className="text-xs font-semibold text-secondary">{sec.sla}</span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{sec.summary}</p>
            <ul className="space-y-2 pt-2 border-t border-brass/15">
              {sec.actions.map((action) => (
                <li key={action} className="flex items-start gap-2.5 text-sm text-primary-container">
                  <ClipboardCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

export function SopView() {
  return (
    <div className="space-y-6">
      <div className="bg-primary-container text-on-primary rounded p-6 border border-brass/40 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-fixed">
            Governance &amp; Ethical Guardrails
          </p>
          <h2 className="font-editorial text-2xl font-medium mt-1">
            Standard Operating Procedures (SOP-01 – SOP-04)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Non-negotiable operational standards preserving non-clinical advocacy boundaries across South Mississippi.
          </p>
        </div>
        <ShieldCheck className="w-6 h-6 text-secondary-fixed shrink-0" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SOP_ITEMS.map((sop) => (
          <article
            key={sop.code}
            className="bg-surface-container-lowest rounded p-6 border border-brass/25 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                {sop.code}
              </span>
              <span className="text-xs text-on-surface-variant">{sop.cadence}</span>
            </div>
            <h3 className="font-editorial text-xl font-medium text-primary-container">
              {sop.title}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{sop.summary}</p>
            <p className="text-xs font-semibold text-primary-container pt-2 border-t border-brass/15">
              Accountable Owner: {sop.owner}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
