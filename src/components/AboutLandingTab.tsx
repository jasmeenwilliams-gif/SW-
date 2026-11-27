import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FolderOpen,
  GraduationCap,
  Handshake,
  Phone,
  PlaneTakeoff,
  Shield,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';
import { FOUNDER_PROFILE, GENERATED_IMAGES } from '../data/conciergeData';
import type { ServiceProtocolId, TabPath } from '../types/concierge';
import { ResilientImage } from './ResilientImage';
import { ScopeNotice } from './ScopeNotice';
import { SignedAgreementQrPass } from './SignedAgreementQrPass';
import { SwMonogramCrest } from './SwMonogramCrest';

interface AboutLandingTabProps {
  onNavigateTab: (tab: TabPath) => void;
  onRequestService: (service: ServiceProtocolId) => void;
  agreementSigned?: boolean;
  onAgreementChange?: (signed: boolean) => void;
}

export function AboutLandingTab({
  onNavigateTab,
  onRequestService,
  agreementSigned = false,
  onAgreementChange,
}: AboutLandingTabProps) {
  return (
    <div className="w-full flex flex-col">
      {/* 1. HERO SECTION: Midnight Navy Deep Chambers */}
      <section className="relative w-full bg-primary-container text-on-primary overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 20% 35%, rgba(197, 160, 89, 0.14) 0%, transparent 60%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-12 pb-16 lg:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: Typographic Authority */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-fixed">
                South Mississippi · Non-Clinical Senior Care Navigation · Knowledge-Based Guidance
              </p>

              <h1 className="font-editorial text-[36px] sm:text-[44px] lg:text-[52px] leading-[1.1] text-surface-bright font-semibold tracking-tight">
                Steady Advocacy for{' '}
                <span className="italic font-normal text-secondary-fixed-dim">
                  Every Season
                </span>{' '}
                of Aging.
              </h1>

              <p className="text-base sm:text-[17px] text-slate-200 leading-relaxed max-w-2xl">
                Grounded in 10+ years of geriatric and chronic care nursing knowledge used strictly for insight and non-clinical guidance, Southern Well Senior Concierge delivers white-glove logistical coordination, clinic appointment accompaniment, and proactive family updates—giving local and long-distance families unwavering peace of mind across the Pine Belt and the Mississippi Gulf Coast.
              </p>

              {/* CTA Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onRequestService('general-consultation')}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-all duration-200 shadow-md text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Schedule a Complimentary Consultation</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('services')}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded bg-transparent border border-brass/50 text-secondary-fixed hover:bg-brass/10 transition-all duration-200 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                >
                  <span>Explore Concierge Services</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Trust Marker */}
              <div className="pt-3 flex items-center gap-2.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-secondary-fixed-dim shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Serving Families Across Hattiesburg, Laurel &amp; The Gulf Coast · Est. 2027
                </span>
              </div>
            </div>

            {/* Right: Executive Desk Showcase */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-md lg:max-w-none aspect-[16/10] rounded overflow-hidden shadow-2xl bg-[#081220] border border-brass/30 sconce-glow">
                <ResilientImage
                  src={GENERATED_IMAGES.executiveDesk}
                  alt="Southern Well Senior Concierge digital interface on a tablet resting on a walnut executive desk with fountain pens and warm brass lamp"
                  className="w-full h-full object-cover object-center"
                  fallbackTitle="The Sovereign Protocol"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-primary-container/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3.5 bg-primary-container/90 backdrop-blur-sm rounded border border-brass/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SwMonogramCrest className="w-6 h-6 text-brass shrink-0" />
                    <span className="text-[11px] font-semibold uppercase text-secondary-fixed tracking-wider truncate">
                      The Sovereign Protocol
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 whitespace-nowrap shrink-0">
                    Pine Belt &amp; Gulf Coast
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EXECUTIVE VALUE PROPOSITION BAR */}
      <section className="w-full bg-surface-container-low border-y border-brass/20 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 lg:divide-x divide-brass/20">
            <div className="flex flex-col gap-1.5 pt-2 sm:pt-0 lg:px-4 first:lg:pl-0">
              <div className="flex items-baseline gap-2">
                <span className="font-editorial text-4xl text-secondary font-semibold tabular-nums">
                  10+
                </span>
                <span className="text-base text-primary-container font-semibold">Years</span>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Geriatric Nursing Insight
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Non-clinical navigational acumen applied for vigilant family peace of mind.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-4 sm:pt-0 lg:px-4">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-6 h-6 text-secondary shrink-0" />
                <span className="text-base text-primary-container font-semibold">In-Clinic</span>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Boots-on-the-Ground Presence
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                In-person accompaniment across Hattiesburg, Laurel, and Gulf Coast facilities.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-4 sm:pt-0 lg:px-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-secondary shrink-0" />
                <span className="text-base text-primary-container font-semibold">
                  Care Dossier
                </span>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Unified Protocol
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Bespoke hardbound binder and synchronized digital records for estate stewards.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-4 sm:pt-0 lg:px-4">
              <div className="flex items-center gap-2.5">
                <Handshake className="w-6 h-6 text-secondary shrink-0" />
                <span className="text-base text-primary-container font-semibold">
                  Zero Friction
                </span>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Collaborative Liaison
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Proactive communication aligning doctors, family members, and elder law counsel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHO WE SERVE: Bespoke Client Pathways */}
      <section className="w-full bg-surface py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col gap-10 lg:gap-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brass/20 pb-8">
            <div className="max-w-2xl flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
                Tailored Stewardship
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-primary-container font-semibold">
                Distinct Guidance for Every Family Dynamic
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
              Whether you are managing complex logistics across state lines or seeking focused advocacy at home, our advisory framework brings absolute clarity to your family&apos;s routine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: PlaneTakeoff,
                kicker: 'Geographic Distance',
                title: 'For Long-Distance Adult Children',
                body: 'A dedicated local boots-on-the-ground advocate in South Mississippi. Attending appointments in person, organizing home care logistics, liaising with local providers, and sending structured, plain-language updates after every visit so you are never left guessing.',
                actionLabel: 'Structured Visit Briefings',
              },
              {
                icon: Users,
                kicker: 'Local Support',
                title: 'For Busy Local Families',
                body: 'Relieving the daily administrative weight of specialist scheduling, pharmacy refills, and routine wellness check-ins. We restore your bandwidth so your time together is spent as a loving daughter or son, not as an exhausted case manager.',
                actionLabel: 'Preserving Family Harmony',
              },
              {
                icon: UserCheck,
                kicker: 'Personal Agency',
                title: 'For Independent Older Adults',
                body: 'Honoring your autonomy, dignity, and private preferences. Helping you stay organized, heard and respected at medical appointments, and confident in the familiar sanctuary of your own home with an unhurried, experienced ally.',
                actionLabel: 'Self-Directed Dignity',
              },
            ].map(({ icon: Icon, kicker, title, body, actionLabel }) => (
              <article
                key={title}
                className="bg-surface-container-lowest p-7 lg:p-8 rounded border border-brass/25 shadow-[0_4px_20px_-2px_rgba(11,25,44,0.05)] flex flex-col justify-between hover:border-brass transition-colors"
              >
                <div className="flex flex-col gap-4">
                  <div className="w-11 h-11 rounded bg-primary-container text-secondary-fixed flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                    {kicker}
                  </span>
                  <h3 className="font-editorial text-xl text-primary-container font-medium">
                    {title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{body}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab('for-families')}
                  className="pt-5 mt-6 border-t border-brass/15 flex items-center justify-between gap-2 text-secondary hover:text-primary-container text-[11px] font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>{actionLabel}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CORE CONCIERGE SERVICES (Two-by-Two Grid) */}
      <section className="w-full bg-surface-container-low py-16 lg:py-24 border-t border-brass/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col gap-10 lg:gap-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
                The Scope of Engagement
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl text-primary-container font-semibold">
                Comprehensive Non-Clinical Navigation
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('services')}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary hover:text-primary-container transition-colors self-start md:self-auto"
            >
              <span>Pine Belt · Mississippi Gulf Coast · Full Protocols</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {[
              {
                num: '01',
                tag: 'Foundational Protocol',
                serviceId: 'foundation-assessment' as ServiceProtocolId,
                title: 'The Foundation Assessment & Care Dossier',
                body: 'Comprehensive non-clinical evaluation of home safety, daily living rhythms, physician contact directories, and observational medication reconciliation for pharmacy accuracy. Clients receive both a bespoke hardbound executive binder and synchronized digital access for all authorized stakeholders.',
                bullets: [
                  'Environmental safety and mobility baseline scan',
                  'Master physician & specialist roster consolidation',
                  'Physical archival binder with secure digital companion',
                ],
              },
              {
                num: '02',
                tag: 'Vigilant Oversight',
                serviceId: 'medication-concierge' as ServiceProtocolId,
                title: 'Medication Concierge & Routine Check-Ins',
                body: 'Weekly and monthly proactive check-ins, non-clinical pillbox organization oversight, timely pharmacy refill tracking, and routine rhythm observation designed to catch subtle changes early before they escalate into hospital admissions.',
                bullets: [
                  'Proactive pharmacy liaison & refill synchronization',
                  'Non-clinical pillbox setup validation & tracking',
                  'Scheduled observational in-home wellness visits',
                ],
              },
              {
                num: '03',
                tag: 'In-Person Clinical Liaison',
                serviceId: 'clinic-accompaniment' as ServiceProtocolId,
                title: 'Clinic Visit Accompaniment & Plain-Language Debriefs',
                body: 'Pre-visit question formulation, in-person attendance at specialty clinics across South Mississippi, meticulous note-taking during consultations, and prompt structured summaries delivered in plain English to designated estate stewards.',
                bullets: [
                  'Collaborative agenda prep prior to clinic arrival',
                  'Objective attendance & physician inquiry advocacy',
                  'Same-day plain-language executive family briefings',
                ],
              },
              {
                num: '04',
                tag: 'Strategic Planning',
                serviceId: 'advance-care-planning' as ServiceProtocolId,
                title: 'Advance Care Planning & Warm Community Referrals',
                body: 'Organizing non-clinical advance care preferences and connecting families seamlessly with vetted South Mississippi Licensed Clinical Social Workers (LCSWs), elder law attorneys, trusted home-care agencies, and medical specialists.',
                bullets: [
                  'Vetted network of estate attorneys & elder law counsel',
                  'Warm introductions to trusted South Mississippi LCSWs',
                  'Advance directive cataloging and emergency dissemination',
                ],
              },
            ].map((item) => (
              <article
                key={item.num}
                className="bg-surface-container-lowest p-7 lg:p-9 rounded border border-brass/25 flex flex-col justify-between gap-6 group hover:border-brass transition-colors shadow-[0_4px_20px_-2px_rgba(11,25,44,0.04)]"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-brass/15 pb-4">
                    <span className="font-editorial text-3xl text-brass/65 font-semibold group-hover:text-secondary transition-colors tabular-nums">
                      {item.num}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 bg-surface-container rounded text-primary-container border border-brass/25">
                      {item.tag}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="font-editorial text-2xl text-primary-container font-medium">
                      {item.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{item.body}</p>
                  </div>

                  <ul className="flex flex-col gap-2 text-xs text-on-surface-variant pt-1">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-brass/15 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onRequestService(item.serviceId)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary-container transition-colors"
                  >
                    <span>Inquire About Protocol {item.num}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('services')}
                    className="text-xs text-on-surface-variant hover:text-primary-container transition-colors"
                  >
                    Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. THE FOUNDATION CARE DOSSIER SHOWCASE */}
      <section className="w-full bg-primary-container text-on-primary py-16 lg:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 75% 50%, rgba(197, 160, 89, 0.1) 0%, transparent 60%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: Interactive Linen & Digital Dossier Showcase */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative w-full max-w-md rounded border border-brass/45 bg-tertiary-container p-6 sm:p-8 shadow-2xl sconce-glow space-y-6">
                <div className="relative aspect-[5/4] rounded overflow-hidden border border-brass/35 bg-[#09172a] flex items-center justify-center">
                  <ResilientImage
                    src="/assets/aistudio/create_a_1024x1024_luxury_mobile_app_icon_for_southern_well_senior_concierge._a143e2b6.png"
                    alt="Southern Well Senior Concierge Care Dossier gold-embossed SW monogram crest on midnight navy leather"
                    className="w-full h-full object-contain object-center pb-8"
                    fallbackTitle="Southern Well Care Dossier"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SwMonogramCrest className="w-6 h-6 text-brass shrink-0" />
                      <span className="font-editorial text-lg text-on-primary font-medium">
                        Care Dossier – Digital
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary-fixed tabular-nums">
                      13 Sections
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Every family engagement establishes a living client dossier—combining our Deep Midnight linen executive binder with an interactive digital companion you can update, back up, and print anytime.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    {[
                      'Client Snapshot',
                      'Medication List',
                      'Providers & Visits',
                      'Legal Directives',
                    ].map((label) => (
                      <div
                        key={label}
                        className="px-3 py-2 rounded bg-primary-container/90 border border-brass/25 text-secondary-fixed font-medium flex items-center gap-2"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-brass shrink-0" />
                        <span className="truncate">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab('the-care-dossier')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-colors text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span>Open Interactive Digital Care Dossier</span>
                </button>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary-fixed-dim pt-4 text-center">
                Physical Archival Hardbound Binder &amp; Secure Local Digital Edition
              </span>
            </div>

            {/* Right: Executive Architecture Description */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary-fixed">
                Proprietary Protocol · Foundation Architecture
              </p>

              <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] leading-tight text-surface-bright font-semibold">
                The Foundation{' '}
                <span className="italic font-normal text-secondary-fixed-dim">
                  Care Dossier
                </span>
              </h2>

              <p className="text-base text-slate-300 leading-relaxed">
                In times of sudden change, frantic searching through drawers and disconnected patient portals creates dangerous friction. The Foundation Care Dossier establishes a singular, authoritative baseline that travels with the client to emergency chambers, new specialists, and family conferences.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {[
                  {
                    title: 'Master Physician Index',
                    desc: 'Complete listing of attending physicians, clinic lines, and specialty notes.',
                  },
                  {
                    title: 'Emergency Escalation Protocol',
                    desc: 'Pre-arranged proxies, hospital preferences, and power of attorney directives.',
                  },
                  {
                    title: 'Observational Health History',
                    desc: 'Surgical milestones, allergies, vital baseline norms, and chronic factors.',
                  },
                  {
                    title: 'Daily Living Rhythm Guide',
                    desc: 'Personal routines, mobility precautions, dietary regimens, and preferences.',
                  },
                ].map((mod) => (
                  <div
                    key={mod.title}
                    className="p-4 bg-tertiary-container rounded border border-brass/25 flex flex-col gap-1.5"
                  >
                    <span className="text-sm text-secondary-fixed font-semibold">
                      {mod.title}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{mod.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateTab('the-care-dossier')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container rounded transition-all text-xs font-semibold uppercase tracking-wider"
                >
                  <span>Open Care Dossier</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRequestService('foundation-assessment')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 border border-brass/45 text-secondary-fixed hover:bg-brass/10 rounded transition-all text-xs font-semibold uppercase tracking-wider"
                >
                  <span>Request Dossier Overview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOUNDER SPOTLIGHT: JASMEEN WILLIAMS, LPN, BS-HHS */}
      <section className="w-full bg-surface py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-surface-container-low border border-brass/30 rounded p-6 sm:p-10 lg:p-14 shadow-[0_4px_20px_-2px_rgba(11,25,44,0.05)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Founder Portrait */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-sm aspect-[3/4] rounded overflow-hidden shadow-xl border border-brass/40 bg-surface-container-high">
                  <ResilientImage
                    src={GENERATED_IMAGES.founderPortrait}
                    alt="Jasmeen Williams, LPN, BS-HHS, Founder and Executive Senior Advocate"
                    className="w-full h-full object-cover object-top"
                    fallbackTitle={FOUNDER_PROFILE.fullName}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-container/35 via-transparent to-transparent" />
                </div>
                <div className="mt-4 text-center">
                  <span className="font-editorial text-xl text-primary-container font-medium block">
                    {FOUNDER_PROFILE.shortName}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                    {FOUNDER_PROFILE.credentials}
                  </span>
                </div>
              </div>

              {/* Founder Narrative & Credentials */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
                    Practice Leadership &amp; Advocacy
                  </span>
                  <h2 className="font-editorial text-3xl sm:text-4xl text-primary-container font-semibold">
                    Anchored in Diligence, Driven by Dignity
                  </h2>
                </div>

                {/* Credentials Block */}
                <div className="p-4 sm:p-5 bg-surface-container-lowest rounded border border-brass/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-secondary shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-primary-container block">
                        Licensed Practical Nurse (LPN)
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Mississippi Board of Nursing · Non-Clinical Advocacy Standard
                      </span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-brass/25 hidden sm:block" />
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-6 h-6 text-secondary shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-primary-container block">
                        B.S. Health &amp; Human Services
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Strategic Health Systems Navigation
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                  Jasmeen founded Southern Well on an unwavering conviction: older adults and their families deserve to navigate the healthcare continuum with unhurried attention, dignified support, and complete transparency. Grounded in over a decade of geriatric and chronic care nursing knowledge, she serves strictly as an objective navigator and vigilant family proxy.
                </p>
                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                  Her discernment ensures that complex medical instructions are translated into actionable, plain-language steps, doctor appointments are thoroughly documented, and changes in routine are identified before crises emerge.
                </p>

                {/* Quote Card (Hairline Border per DESIGN_f79170ef.md & frontend-design) */}
                <blockquote className="p-6 bg-surface-container rounded border border-brass/35 flex flex-col gap-2.5">
                  <p className="font-editorial text-xl italic text-primary-container leading-relaxed">
                    &ldquo;We do not replace your doctors, nor do we take the place of family. We are the steady, watchful advocate who bridges the two—ensuring nothing is overlooked.&rdquo;
                  </p>
                  <footer className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary">
                      — Jasmeen Williams, Founder
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('credentials')}
                      className="text-xs font-semibold text-primary-container hover:text-secondary transition-colors inline-flex items-center gap-1"
                    >
                      <span>View Full Leadership &amp; Credentials</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6B. POST-CONSULTATION ACCESS & SIGNED AGREEMENT QR PASS */}
      <section className="w-full bg-surface-container-low border-t border-brass/20 py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
                  Post-Consultation Onboarding
                </span>
                <h2 className="font-editorial text-3xl sm:text-4xl text-primary-container font-semibold">
                  Private Client Suite &amp; Signed Agreement Pass
                </h2>
              </div>

              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-2xl">
                Initial consultations establish care goals, priority clinic rhythms, and service alignment. Once the Agreement of Services is signed and your household PIN is assigned, families gain full access to{' '}
                <strong className="text-primary-container">Services</strong>,{' '}
                <strong className="text-primary-container">Care Dossier</strong>, and{' '}
                <strong className="text-primary-container">For Families</strong>.
              </p>

              <label className="flex items-start gap-3 p-4 rounded bg-surface-container-lowest border border-brass/30 text-sm text-primary-container cursor-pointer max-w-xl">
                <input
                  type="checkbox"
                  checked={agreementSigned}
                  onChange={(e) => onAgreementChange?.(e.target.checked)}
                  className="mt-1 rounded border-outline-variant accent-secondary shrink-0"
                />
                <span className="leading-relaxed font-medium">
                  Agreement of Services signed after initial consultation
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateTab('services')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded bg-primary-container text-secondary-fixed hover:bg-tertiary-container text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>Access Client Suite</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRequestService('general-consultation')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded bg-surface-container-lowest border border-brass/35 text-primary-container hover:bg-surface-container text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  <span>Schedule Consultation</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                <SignedAgreementQrPass
                  clientId="SW-RM-4081"
                  agreementSigned={agreementSigned}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. COMPREHENSIVE COMPLIANCE & SCOPE NOTICE */}
      <section className="w-full bg-surface-container py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <ScopeNotice />
        </div>
      </section>

      {/* 8. FINAL CONSULTATION CTA BANNER */}
      <section className="w-full bg-primary-container text-on-primary py-16 lg:py-24 relative overflow-hidden border-t border-brass/40">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(197, 160, 89, 0.12) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center relative z-10 flex flex-col items-center gap-7">
          <div className="w-14 h-14 rounded-full bg-brass/15 flex items-center justify-center border border-brass/45">
            <Shield className="w-6 h-6 text-secondary-fixed" />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary-fixed">
              Pine Belt &amp; Mississippi Gulf Coast
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-[46px] text-surface-bright font-semibold leading-tight">
              Give Your Family the Gift of Steady Guidance.
            </h2>
            <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Schedule an unhurried, private consultation to review your family&apos;s current health logistics, clinic rhythms, and advocacy needs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => onRequestService('general-consultation')}
              className="min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container transition-all duration-200 shadow-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Schedule a Complimentary Consultation</span>
            </button>
            <a
              href={FOUNDER_PROFILE.phoneHref}
              className="min-h-[48px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded bg-tertiary-container border border-brass/45 text-secondary-fixed hover:bg-white/10 transition-all duration-200 text-base font-semibold tracking-tight tabular-nums whitespace-nowrap"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>{FOUNDER_PROFILE.phone}</span>
            </a>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-6 text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-secondary-fixed-dim" /> Hattiesburg Chambers
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-secondary-fixed-dim" /> Biloxi &amp; Gulfport Consultations
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-secondary-fixed-dim" /> Laurel &amp; Ocean Springs Advisory
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
