import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import {
  OPS_COUNTIES,
  OPS_PACKAGES,
  OPS_PORCH_TIERS,
  OPS_STEPS,
  offsetDay,
  type OpsAction,
  type OpsCheckin,
  type OpsClient,
  type OpsDataState,
} from '../../data/opsData';

interface ClientsViewProps {
  data: OpsDataState;
  onAddClient: (client: OpsClient) => void;
  onUpdateClient: (clientId: string, patch: Partial<OpsClient>) => void;
}

export function ClientsView({ data, onAddClient, onUpdateClient }: ClientsViewProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | OpsClient['status']>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [ini, setIni] = useState('');
  const [county, setCounty] = useState<string>(OPS_COUNTIES[0]);
  const [pkg, setPkg] = useState<string>(OPS_PACKAGES[2]);
  const [porch, setPorch] = useState<string>(OPS_PORCH_TIERS[0]);
  const [contact, setContact] = useState<OpsClient['contact']>('Phone');
  const [visit, setVisit] = useState('In-Home Walkthrough');
  const [needs, setNeeds] = useState('');

  const filtered = data.clients.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.ini.toLowerCase().includes(q) ||
        c.county.toLowerCase().includes(q) ||
        c.needs.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIni = ini.trim().toUpperCase().slice(0, 12);
    if (!cleanIni) return;
    const initialsSlug = cleanIni.replace(/[^A-Z]/g, '').slice(0, 2) || 'SW';
    const num = Math.floor(1000 + Math.random() * 9000);
    const created: OpsClient = {
      id: `SW-${initialsSlug}-${num}`,
      ini: cleanIni,
      county,
      pkg,
      step: 1,
      next: offsetDay(1),
      visit: visit.trim() || 'Discovery Call',
      status: 'Active',
      contact,
      packet: 'Not started',
      consent: false,
      porch,
      needs: needs.trim() || 'Initial discovery scope review',
    };
    onAddClient(created);
    setIni('');
    setNeeds('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            HIPAA-Minimized Roster
          </p>
          <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
            Client Directory ({data.clients.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          className="min-h-[42px] px-4 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider hover:bg-tertiary-container transition-colors inline-flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAdd ? 'Close Form' : 'Add Client'}</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="bg-surface-container-lowest rounded p-5 border border-brass/35 space-y-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Enroll New Client Record (Initials Only)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="ops-cli-ini" className="block text-xs font-semibold text-primary-container mb-1">
                Client Initials
              </label>
              <input
                id="ops-cli-ini"
                type="text"
                required
                value={ini}
                onChange={(e) => setIni(e.target.value)}
                placeholder="e.g., J.D."
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
              />
            </div>
            <div>
              <label htmlFor="ops-cli-county" className="block text-xs font-semibold text-primary-container mb-1">
                County / Corridor
              </label>
              <select
                id="ops-cli-county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
              >
                {OPS_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ops-cli-pkg" className="block text-xs font-semibold text-primary-container mb-1">
                Package
              </label>
              <select
                id="ops-cli-pkg"
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
              >
                {OPS_PACKAGES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ops-cli-porch" className="block text-xs font-semibold text-primary-container mb-1">
                Porch Fund / Tier
              </label>
              <select
                id="ops-cli-porch"
                value={porch}
                onChange={(e) => setPorch(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
              >
                {OPS_PORCH_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ops-cli-contact" className="block text-xs font-semibold text-primary-container mb-1">
                Preferred Contact
              </label>
              <select
                id="ops-cli-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value as OpsClient['contact'])}
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
              >
                {(['Phone', 'Text', 'Email', 'Voicemail'] as OpsClient['contact'][]).map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ops-cli-visit" className="block text-xs font-semibold text-primary-container mb-1">
                Next Milestone Type
              </label>
              <input
                id="ops-cli-visit"
                type="text"
                value={visit}
                onChange={(e) => setVisit(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ops-cli-needs" className="block text-xs font-semibold text-primary-container mb-1">
                Primary Non-Clinical Focus
              </label>
              <input
                id="ops-cli-needs"
                type="text"
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
                placeholder="Bottle inventory, clinic accompaniment, family briefings..."
                className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[42px] px-5 py-2 rounded bg-secondary text-on-secondary text-xs font-semibold uppercase tracking-wider hover:bg-secondary-container"
          >
            Save Client Record
          </button>
        </form>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, initials, county, or focus..."
            aria-label="Search client directory"
            className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Active', 'Check-in due', 'On hold', 'Closed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`min-h-[36px] px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-primary-container text-secondary-fixed'
                  : 'bg-surface-container-low text-on-surface-variant border border-brass/20 hover:text-primary-container'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Cards */}
      <div className="space-y-3">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="bg-surface-container-lowest rounded p-5 border border-brass/25 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-secondary tabular-nums">{client.id}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-editorial text-lg font-semibold text-primary-container">
                    {client.ini}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-on-surface-variant">{client.county}</span>
                </div>
                <p className="text-xs text-primary-container mt-1">{client.needs}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Status for ${client.id}`}
                  value={client.status}
                  onChange={(e) =>
                    onUpdateClient(client.id, { status: e.target.value as OpsClient['status'] })
                  }
                  className="min-h-[36px] px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant text-xs font-semibold text-primary-container"
                >
                  {(['Active', 'Check-in due', 'On hold', 'Closed'] as const).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={`Packet status for ${client.id}`}
                  value={client.packet}
                  onChange={(e) =>
                    onUpdateClient(client.id, { packet: e.target.value as OpsClient['packet'] })
                  }
                  className="min-h-[36px] px-2.5 py-1 rounded bg-surface-container-low border border-outline-variant text-xs font-medium text-primary-container"
                >
                  {(['Not started', 'Sent', 'Returned', 'Complete'] as const).map((p) => (
                    <option key={p} value={p}>
                      Packet: {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2.5 border-t border-brass/15 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  <strong className="text-primary-container">Package:</strong> {client.pkg} ({client.porch})
                </span>
                <span>
                  <strong className="text-primary-container">Step {client.step}/10:</strong>{' '}
                  {OPS_STEPS[client.step - 1]?.[0] ?? 'Active'}
                </span>
                <span>
                  <strong className="text-primary-container">Next:</strong> {client.next} ({client.visit})
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUpdateClient(client.id, { consent: !client.consent })}
                className={`min-h-[34px] px-3 py-1 rounded border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  client.consent
                    ? 'bg-surface-container-low border-sage/40 text-primary-container'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                <span>{client.consent ? 'Consents Verified' : 'Consents Missing'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressViewProps {
  data: OpsDataState;
  onUpdateClient: (clientId: string, patch: Partial<OpsClient>) => void;
}

export function ProgressView({ data, onUpdateClient }: ProgressViewProps) {
  return (
    <div className="space-y-5">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
          Milestone Readiness Ledger
        </p>
        <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
          Client Onboarding &amp; Care Progress
        </h2>
      </div>

      <div className="space-y-3">
        {data.clients.map((client) => {
          const pct = Math.round((client.step / OPS_STEPS.length) * 100);
          return (
            <div
              key={client.id}
              className="bg-surface-container-lowest rounded p-5 border border-brass/25 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-secondary text-xs tabular-nums">
                    {client.id}
                  </span>
                  <h3 className="font-editorial text-lg font-semibold text-primary-container">
                    {client.ini} · {client.pkg}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary-container tabular-nums">
                    Step {client.step} / 10 ({pct}%)
                  </span>
                  <button
                    type="button"
                    disabled={client.step >= 10}
                    onClick={() => onUpdateClient(client.id, { step: Math.min(10, client.step + 1) })}
                    className="min-h-[34px] px-3 py-1 rounded bg-primary-container text-secondary-fixed text-xs font-semibold disabled:opacity-40"
                  >
                    Next Step
                  </button>
                </div>
              </div>

              <div className="w-full h-2.5 rounded bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-sage transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-on-surface-variant gap-2">
                <span>Current Milestone: {OPS_STEPS[client.step - 1]?.[0]}</span>
                <span>Packet: {client.packet} · Consent: {client.consent ? 'Verified' : 'Pending'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CheckinsViewProps {
  data: OpsDataState;
  onAddCheckin: (checkin: OpsCheckin) => void;
  onToggleCheckin: (index: number) => void;
}

export function CheckinsView({ data, onAddCheckin, onToggleCheckin }: CheckinsViewProps) {
  const [client, setClient] = useState(data.clients[0]?.id ?? 'SW-RM-4081');
  const [date, setDate] = useState(offsetDay(1));
  const [type, setType] = useState<OpsCheckin['type']>('Phone');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    onAddCheckin({
      client,
      date,
      type,
      note: note.trim(),
      done: false,
    });
    setNote('');
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
          Routine Assurance Cadence
        </p>
        <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
          Client Check-Ins &amp; Accompaniment Schedule
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded p-5 border border-brass/25 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label htmlFor="chk-client" className="block text-xs font-semibold text-primary-container mb-1">
            Client
          </label>
          <select
            id="chk-client"
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
          <label htmlFor="chk-type" className="block text-xs font-semibold text-primary-container mb-1">
            Check-In Type
          </label>
          <select
            id="chk-type"
            value={type}
            onChange={(e) => setType(e.target.value as OpsCheckin['type'])}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          >
            {(
              [
                'Phone',
                'Home visit',
                'Pill tray review',
                'Self-advocacy check-in',
                'Appointment Accompaniment',
              ] as const
            ).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="chk-date" className="block text-xs font-semibold text-primary-container mb-1">
            Target Date
          </label>
          <input
            id="chk-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          />
        </div>
        <div>
          <label htmlFor="chk-note" className="block text-xs font-semibold text-primary-container mb-1">
            Focus Note
          </label>
          <input
            id="chk-note"
            type="text"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Agenda or location..."
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          />
        </div>
        <button
          type="submit"
          className="min-h-[40px] px-4 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule</span>
        </button>
      </form>

      <div className="space-y-2.5">
        {data.checkins.map((item, idx) => (
          <div
            key={`${item.client}-${item.date}-${idx}`}
            className="bg-surface-container-lowest rounded p-4 border border-brass/25 flex items-center justify-between gap-4"
          >
            <button
              type="button"
              onClick={() => onToggleCheckin(idx)}
              className="flex items-start gap-3 text-left flex-1 min-w-0"
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                  item.done
                    ? 'bg-primary-container border-primary-container text-secondary-fixed'
                    : 'border-primary-container text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-secondary">
                  {item.client} · {item.type}
                </p>
                <p
                  className={`text-sm mt-0.5 ${
                    item.done ? 'line-through text-on-surface-variant' : 'text-primary-container'
                  }`}
                >
                  {item.note}
                </p>
              </div>
            </button>
            <span className="text-xs font-semibold text-on-surface-variant tabular-nums shrink-0">
              {item.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ActionsViewProps {
  data: OpsDataState;
  onAddAction: (action: OpsAction) => void;
  onToggleAction: (index: number) => void;
}

export function ActionsView({ data, onAddAction, onToggleAction }: ActionsViewProps) {
  const [title, setTitle] = useState('');
  const [client, setClient] = useState(data.clients[0]?.id ?? 'SW-RM-4081');
  const [owner, setOwner] = useState<OpsAction['owner']>('Coordinator');
  const [due, setDue] = useState(offsetDay(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddAction({
      title: title.trim(),
      client,
      owner,
      due,
      done: false,
    });
    setTitle('');
  };

  return (
    <div className="space-y-5">
      <div className="bg-surface-container-low rounded p-5 border border-brass/30">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
          Accountability Tasks
        </p>
        <h2 className="font-editorial text-2xl text-primary-container font-semibold mt-1">
          Non-Clinical Action Plans
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-lowest rounded p-5 border border-brass/25 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
      >
        <div className="lg:col-span-2">
          <label htmlFor="act-title" className="block text-xs font-semibold text-primary-container mb-1">
            Action Description
          </label>
          <input
            id="act-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Follow up on signed Form 04 ROI..."
            className="w-full min-h-[40px] px-3 py-1.5 rounded bg-surface border border-outline-variant text-sm"
          />
        </div>
        <div>
          <label htmlFor="act-client" className="block text-xs font-semibold text-primary-container mb-1">
            Client
          </label>
          <select
            id="act-client"
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
          <label htmlFor="act-owner" className="block text-xs font-semibold text-primary-container mb-1">
            Owner &amp; Due
          </label>
          <div className="flex gap-1.5">
            <select
              id="act-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value as OpsAction['owner'])}
              className="flex-1 min-h-[40px] px-2 py-1.5 rounded bg-surface border border-outline-variant text-xs"
            >
              {(['Coordinator', 'Family contact', 'Client'] as const).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <input
              type="date"
              aria-label="Due date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-32 min-h-[40px] px-2 py-1.5 rounded bg-surface border border-outline-variant text-xs"
            />
          </div>
        </div>
        <button
          type="submit"
          className="min-h-[40px] px-4 py-2 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </form>

      <div className="space-y-2.5">
        {data.actions.map((act, idx) => (
          <div
            key={`${act.client}-${act.title}-${idx}`}
            className="bg-surface-container-lowest rounded p-4 border border-brass/25 flex items-center justify-between gap-4"
          >
            <button
              type="button"
              onClick={() => onToggleAction(idx)}
              className="flex items-start gap-3 text-left flex-1 min-w-0"
            >
              <CheckCircle2
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  act.done ? 'text-sage' : 'text-outline-variant'
                }`}
              />
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    act.done ? 'line-through text-on-surface-variant' : 'text-primary-container'
                  }`}
                >
                  {act.title}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {act.client} · Assigned to {act.owner}
                </p>
              </div>
            </button>
            <span className="text-xs font-semibold text-secondary tabular-nums shrink-0">
              Due {act.due}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
