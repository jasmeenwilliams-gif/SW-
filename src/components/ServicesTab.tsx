import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Gavel,
  HeartHandshake,
  Lock,
  MailCheck,
  MessageSquareMore,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';
import { BRAND_TAGLINE } from '../data/conciergeData';
import type { ServiceProtocolId } from '../types/concierge';
import { ResilientImage } from './ResilientImage';
import { ScopeNotice } from './ScopeNotice';
import { SwMonogramCrest } from './SwMonogramCrest';

interface ServicesTabProps {
  onRequestService: (service: ServiceProtocolId) => void;
  onOpenDossier?: () => void;
}

type ServiceFilter = 'all' | 'foundation' | 'ongoing' | 'planning';
type CheckInCadence = 'Weekly' | 'Bi-Weekly' | 'Monthly';

const CADENCE_DETAILS: Record<CheckInCadence, string> = {
  Weekly: 'Ideal for active prescription adjustments or out-of-state families wanting Friday afternoon updates.',
  'Bi-Weekly': 'Balanced rhythm for steady routines, pillbox refreshes, and proactive pharmacy refill tracking.',
  Monthly: 'Light-touch oversight with comprehensive wellness check-ins and seasonal safety reviews.',
};

export function ServicesTab({ onRequestService, onOpenDossier }: ServicesTabProps) {
  const [filter, setFilter] = useState<ServiceFilter>('all');
  const [cadence, setCadence] = useState<CheckInCadence>('Weekly');

  const showCard = (group: Exclude<ServiceFilter, 'all'>) => filter === 'all' || filter === group;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-14 space-y-8 lg:space-y-10">
      {/* Editorial Introduction Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-end">
        <div className="lg:col-span-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            Pine Belt &amp; Mississippi Gulf Coast
          </p>
          <h1 className="font-editorial text-[36px] sm:text-[42px] lg:text-[48px] leading-[1.1] text-primary-container font-semibold mt-2">
            Our Concierge Services
          </h1>
          <p className="font-editorial italic text-lg sm:text-xl text-secondary mt-1.5">
            {BRAND_TAGLINE}
          </p>
          <p className="text-sm sm:text-base text-on-surface-variant mt-2.5 leading-relaxed max-w-xl">
            Private-pay, non-clinical care navigation and family advocacy grounded in 10+ years of geriatric nursing knowledge—tailored for older adults (70–95) and their local or long-distance families.
          </p>
        </div>

        {/* Regional Trust Capsule */}
        <div className="lg:col-span-5">
          <div className="p-4 bg-surface-container-low rounded border border-brass/35 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded bg-primary-container flex items-center justify-center text-secondary-fixed shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary-container truncate">
                  Private Client Assurance
                </p>
                <p className="text-xs text-on-surface-variant tracking-wide truncate">
                  Hattiesburg · Laurel · Petal · Gulfport · Biloxi · Ocean Springs
                </p>
              </div>
            </div>
            <Lock className="w-4 h-4 text-brass shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Interactive Filter Segmented Control */}
      <div
        className="flex items-center gap-1.5 p-1 bg-surface-container rounded border border-brass/20 overflow-x-auto max-w-full sm:w-fit"
        role="tablist"
        aria-label="Filter concierge services"
      >
        {(
          [
            { id: 'all', label: 'All Protocols' },
            { id: 'foundation', label: 'Foundation' },
            { id: 'ongoing', label: 'Routine & Clinic' },
            { id: 'planning', label: 'Advance Planning' },
          ] as const
        ).map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.id)}
              className={`min-h-[40px] px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-primary-container text-secondary-fixed shadow-sm'
                  : 'text-on-surface-variant hover:text-primary-container'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Service Cards Stream */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Service 01: Hero Midnight Card (Featured Foundation) */}
        {showCard('foundation') && (
          <article className="lg:col-span-2 relative bg-primary-container text-on-primary rounded p-6 sm:p-8 shadow-md overflow-hidden flex flex-col justify-between border border-brass/40 sconce-glow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center gap-2.5 text-[11px] text-secondary-fixed font-semibold uppercase tracking-wider">
                  <SwMonogramCrest className="w-6 h-6 text-brass shrink-0" />
                  <span>Inaugural Protocol</span>
                  <span aria-hidden="true">·</span>
                  <span>Linen Care Dossier</span>
                </div>
                <h2 className="font-editorial text-2xl sm:text-3xl text-on-primary font-medium tracking-tight mt-3">
                  01. The Foundation Assessment &amp; Care Dossier
                </h2>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed max-w-2xl">
                  Comprehensive non-clinical home and care review, physician directory organization, observational medication reconciliation for pharmacy accuracy, home safety walkthrough, and bespoke Midnight Navy archival Southern Well Care Dossier.
                </p>

                <div className="mt-6 pt-5 border-t border-brass/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onRequestService('foundation-assessment')}
                      className="group min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded bg-secondary text-on-secondary font-semibold text-xs uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Request Assessment</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    {onOpenDossier && (
                      <button
                        type="button"
                        onClick={onOpenDossier}
                        className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded bg-tertiary-container border border-brass/45 text-secondary-fixed text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Open Digital Care Dossier</span>
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-slate-300">
                    Initial Intake · Bound Hardcopy &amp; Digital
                  </span>
                </div>
              </div>

              {/* Deliverables Checklist */}
              <div className="lg:col-span-5 bg-tertiary-container rounded p-5 border border-brass/25">
                <p className="text-[11px] uppercase tracking-wider text-secondary-fixed font-semibold mb-3">
                  Core Deliverables
                </p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    'Physician Directory Build',
                    'Observational Medication Reconciliation',
                    'Environmental Safety Walkthrough',
                    'Archival Hardcopy & Digital Care Dossier',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-on-primary text-sm">
                      <CheckCircle2 className="w-4 h-4 text-secondary-fixed shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        )}

        {/* Service 02: Medication Concierge */}
        {showCard('ongoing') && (
          <article className="bg-surface-container-lowest rounded p-6 sm:p-7 border border-brass/25 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(11,25,44,0.04)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  02 · Routine Assurance
                </span>
                <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-secondary-fixed">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <h2 className="font-editorial text-2xl text-primary-container font-medium tracking-tight">
                02. Medication Concierge &amp; Routine Check-Ins
              </h2>
              <p className="text-sm text-on-surface-variant mt-2.5 leading-relaxed">
                Scheduled weekly or monthly in-home and virtual check-ins, non-clinical pillbox organization oversight, timely pharmacy refill coordination, and monitoring daily wellness routines.
              </p>

              {/* Interactive Cadence Selector */}
              <div className="mt-5 p-3.5 rounded bg-surface-container-low border border-brass/25">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-semibold text-primary-container">
                    Preferred Check-In Rhythm
                  </span>
                  <span className="text-xs text-secondary font-semibold">{cadence}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Weekly', 'Bi-Weekly', 'Monthly'] as CheckInCadence[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCadence(option)}
                      className={`min-h-[38px] px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                        cadence === option
                          ? 'bg-primary-container text-secondary-fixed'
                          : 'bg-surface-container-lowest text-on-surface-variant hover:text-primary-container border border-outline-variant/40'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-2.5 leading-relaxed">
                  {CADENCE_DETAILS[cadence]}
                </p>
              </div>

              {/* Highlights Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {[
                  { icon: ClipboardList, label: 'Non-clinical pillbox oversight' },
                  { icon: Clock, label: 'Proactive refill tracking' },
                  { icon: Sparkles, label: 'Gentle routine monitoring' },
                  { icon: MailCheck, label: 'Real-time family updates' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="bg-surface-container-low p-3 rounded border border-brass/20 flex flex-col justify-between gap-2"
                  >
                    <Icon className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-primary-container leading-snug font-medium">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-brass/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onRequestService('medication-concierge')}
                className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary-container transition-colors"
              >
                <span>Inquire About Routine Care</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-on-surface-variant">In-Home &amp; Virtual</span>
            </div>
          </article>
        )}

        {/* Service 03: Clinic Visit Coordination & Accompaniment */}
        {showCard('ongoing') && (
          <article className="bg-surface-container-lowest rounded p-6 sm:p-7 border border-brass/25 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(11,25,44,0.04)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                  03 · Appointment Advocacy
                </span>
                <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-secondary-fixed">
                  <Car className="w-4 h-4" />
                </div>
              </div>
              <h2 className="font-editorial text-2xl text-primary-container font-medium tracking-tight">
                03. Clinic Visit Coordination &amp; Accompaniment
              </h2>
              <p className="text-sm text-on-surface-variant mt-2.5 leading-relaxed">
                Preparing targeted questions beforehand, accompanying clients to appointments across the Pine Belt and Gulf Coast, taking thorough notes, and delivering clear plain-English post-visit summaries.
              </p>

              {/* Key Features List */}
              <div className="mt-5 bg-surface-container-low rounded p-4 border border-brass/20 divide-y divide-brass/15">
                {[
                  {
                    icon: MessageSquareMore,
                    title: 'Pre-visit question preparation',
                    desc: 'Ensuring client voice and clarity before physician encounters',
                  },
                  {
                    icon: UserCheck,
                    title: 'In-person clinic accompaniment',
                    desc: 'Dedicated escort and physical presence from check-in to checkout',
                  },
                  {
                    icon: FileText,
                    title: 'Plain-language consultation notes',
                    desc: 'Translating medical terminology into clear actionable points',
                  },
                  {
                    icon: HeartHandshake,
                    title: 'Prompt family debrief',
                    desc: 'Same-day electronic or telephone overview sent directly to designated heirs',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 py-2.5 first:pt-1 last:pb-1">
                    <Icon className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary-container leading-snug">{title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-brass/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onRequestService('clinic-accompaniment')}
                className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary-container transition-colors"
              >
                <span>Arrange Clinic Accompaniment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-on-surface-variant">Pine Belt &amp; Coast</span>
            </div>
          </article>
        )}

        {/* Service 04: Advance Care Planning & Clinical Referrals */}
        {showCard('planning') && (
          <article className="lg:col-span-2 bg-surface-container-lowest rounded p-6 sm:p-8 border border-brass/25 flex flex-col justify-between shadow-[0_4px_20px_-2px_rgba(11,25,44,0.04)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-secondary" />
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                    04 · Strategic Foresight
                  </span>
                </div>
                <h2 className="font-editorial text-2xl sm:text-3xl text-primary-container font-medium tracking-tight">
                  04. Advance Care Planning &amp; Clinical Referrals
                </h2>
                <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
                  Organizing non-clinical advance care preferences and connecting families seamlessly with vetted South Mississippi Licensed Clinical Social Workers (LCSWs), elder law attorneys, and clinical specialists.
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => onRequestService('advance-care-planning')}
                    className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary-container transition-colors"
                  >
                    <span>Request Referral Introduction</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <p className="text-[11px] uppercase tracking-wider text-secondary font-semibold mb-3">
                  Professional Network
                </p>
                <div className="flex flex-col gap-2.5">
                  {[
                    {
                      icon: Users,
                      title: 'Vetted LCSW Network',
                      meta: 'Credentialed',
                    },
                    {
                      icon: Gavel,
                      title: 'Local Elder Law Practitioners',
                      meta: 'South MS',
                    },
                    {
                      icon: Stethoscope,
                      title: 'South MS Clinical Specialists',
                      meta: 'Direct Access',
                    },
                  ].map(({ icon: Icon, title, meta }) => (
                    <div
                      key={title}
                      className="flex items-center justify-between p-3.5 bg-surface-container-low rounded border border-brass/20"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-secondary shrink-0" />
                        <span className="text-sm text-primary-container font-medium">{title}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant font-medium">{meta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        )}
      </section>

      {/* Visual Pause & Editorial Craftsmanship + Bottom CTA */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 relative rounded overflow-hidden shadow-sm border border-brass/35 bg-[#09172a] min-h-[280px] lg:min-h-[320px] flex items-center justify-center">
          <ResilientImage
            src="/assets/aistudio/create_a_1024x1024_luxury_mobile_app_icon_for_southern_well_senior_concierge._a143e2b6.png"
            alt="Southern Well Senior Concierge gold-embossed SW botanical monogram crest with oak leaves and magnolia blossoms on midnight navy leather"
            className="w-full h-full max-h-[320px] object-contain object-center"
            fallbackTitle="Discretion & Dignity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/90 via-transparent to-transparent flex flex-col justify-end p-6 pointer-events-none">
            <p className="text-[11px] uppercase tracking-wider text-secondary-fixed font-semibold">
              Discretion &amp; Dignity
            </p>
            <p className="font-editorial text-xl text-on-primary font-medium mt-1">
              Preserving Family Harmony across South Mississippi
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 bg-surface-container-low rounded p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-brass/30">
          <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center text-secondary-fixed mb-3">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h3 className="font-editorial text-2xl text-primary-container font-medium max-w-md">
            Ready to ease the administrative weight of family caregiving?
          </h3>
          <p className="text-sm text-on-surface-variant mt-2 mb-5 max-w-md leading-relaxed">
            Connect with Jasmeen Williams, LPN, BS-HHS for a confidential discussion regarding your loved one&apos;s needs.
          </p>
          <button
            type="button"
            onClick={() => onRequestService('general-consultation')}
            className="w-full sm:w-auto min-h-[48px] py-3 px-6 bg-secondary text-on-secondary rounded font-semibold text-xs uppercase tracking-wider shadow-sm hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-center gap-2"
          >
            <span>Schedule a Complimentary Family Consultation</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </section>

      <ScopeNotice />
    </div>
  );
}
