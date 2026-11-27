import type { ReadinessItem, ServiceProtocolId } from '../types/concierge';

export const FOUNDER_PROFILE = {
  fullName: 'Jasmeen Williams, LPN, BS-HHS',
  shortName: 'Jasmeen Williams',
  firstName: 'Jasmeen',
  credentials: 'LPN · B.S. Health & Human Services',
  role: 'Founder & Executive Senior Advocate',
  phone: '(601) 554-6067',
  phoneHref: 'tel:6015546067',
  chambers: 'Hattiesburg & Biloxi, MS',
  website: 'southernwellofsouthms.com',
  websiteUrl: 'https://southernwellofsouthms.com',
  offlineDossierPath: '/assets/aistudio/Care_Dossier___Digital_17f52061.html',
} as const;

export const GENERATED_IMAGES = {
  executiveDesk: '/assets/aistudio/screen_5d2dbd0e.png',
  founderPortrait: '/assets/aistudio/image__12__85cb6585.png',
  pineBeltSanctuary: '/assets/aistudio/create_a_1024x1024_luxury_mobile_app_icon_for_southern_well_senior_concierge._a143e2b6.png',
} as const;

export const SERVICE_LABELS: Record<ServiceProtocolId, string> = {
  'foundation-assessment': '01. Foundation Assessment & Care Dossier',
  'medication-concierge': '02. Medication Concierge & Routine Check-Ins',
  'clinic-accompaniment': '03. Clinic Visit Coordination & Accompaniment',
  'advance-care-planning': '04. Advance Care Planning & Clinical Referrals',
  'general-consultation': 'Complimentary Family Consultation',
};

export const SCOPE_NOTICE_TEXT =
  'Southern Well Senior Concierge provides 100% non-clinical care navigation, logistical oversight, physician appointment advocacy, and strategic coordination for families throughout South Mississippi. Jasmeen Williams’ extensive geriatric and chronic care nursing background informs care management strictly for educational insight, observational literacy, and communication liaison. Southern Well does not offer or perform hands-on nursing, clinical assessments, treatment protocols, medication dispensing, or medical diagnosis. All clinical and diagnostic care remains strictly under the direct care and governance of licensed attending physicians and health systems.';

export const BRAND_TAGLINE = 'Steady advocacy for every season of aging.';

export const OVERVIEW_SCENARIOS = [
  {
    id: 'out-of-state',
    label: 'Long-Distance Children',
    regionNote: 'Serving families in Jackson, New Orleans, Mobile, Houston & Atlanta',
    headline: 'Trustworthy, boots-on-the-ground advocacy when miles stand between you',
    summary:
      'When you live in Jackson, New Orleans, Mobile, Houston, or Atlanta while your parent remains settled in South Mississippi, managing specialist visits and pharmacy refills from afar quickly becomes overwhelming.',
    focusPoints: [
      'Same-day written family debriefs following every Pine Belt or Coast clinic visit',
      'In-person accompaniment to Hattiesburg Clinic, Forrest General, and Memorial Gulfport',
      'Routine in-home check-ins with proactive pharmacy refill oversight',
    ],
  },
  {
    id: 'local-caregivers',
    label: 'Busy Local Families',
    regionNote: 'Hattiesburg, Laurel, Petal & Gulf Coast administrative relief',
    headline: 'Reclaim your role as daughter, son, or spouse',
    summary:
      'Local adult children balancing careers and households often spend every spare hour managing appointment calendars and chasing referral paperwork. We shoulder the administrative weight so your time together stays personal.',
    focusPoints: [
      'Consolidated physician directory and medication reconciliation',
      'Pre-visit question preparation so appointments stay focused and calm',
      'Warm introductions to vetted South Mississippi elder law and LCSW professionals',
    ],
  },
  {
    id: 'independent-seniors',
    label: 'Older Adults (70–95)',
    regionNote: 'Dignified independence & post-hospital continuity',
    headline: 'Steady advocacy for every season of aging at home',
    summary:
      'Designed for older adults ages 70 to 95 who prize their independence and want an organized, unhurried advocate—whether maintaining weekly routines or organizing discharge instructions after a hospital stay.',
    focusPoints: [
      'Bespoke linen Care Dossier delivered in bound hardcopy and digital format',
      'Environmental home safety walkthrough to preserve comfortable living at home',
      'Unhurried clinic escort and plain-language notes you can keep on hand',
    ],
  },
] as const;

export const SERVICE_CORRIDORS = [
  {
    region: 'Pine Belt · Hattiesburg, Laurel & Petal',
    hubs: 'Hattiesburg Clinic · Forrest General · Merit Health Wesley · South Central Regional',
    coverage: 'In-home Foundation Assessments, weekly pillbox check-ins, and full clinic accompaniment.',
  },
  {
    region: 'Mississippi Gulf Coast · Gulfport, Biloxi & Ocean Springs',
    hubs: 'Memorial Hospital Gulfport · Singing River · Coastal Specialty Clinics',
    coverage: 'Dedicated coastal appointment advocacy, care coordination, and advance care referrals.',
  },
  {
    region: 'Out-of-Area Family Bridge',
    hubs: 'Jackson · New Orleans · Mobile · Houston · Atlanta',
    coverage: 'Same-day family debriefs and reliable boots-on-the-ground stewardship for distant heirs.',
  },
] as const;

export const INITIAL_READINESS_ITEMS: ReadinessItem[] = [
  {
    id: 'med-list',
    category: 'Medication & Pharmacy',
    title: 'Gather current prescription & supplement bottles',
    detail: 'Include over-the-counter vitamins and eye drops so dosing times match pharmacy records.',
  },
  {
    id: 'pharmacy-contact',
    category: 'Medication & Pharmacy',
    title: 'Confirm preferred local or mail-order pharmacy details',
    detail: 'Note store location, pharmacist name, and current auto-refill preferences.',
  },
  {
    id: 'physician-roster',
    category: 'Medical Directory',
    title: 'List primary care physician & active specialists',
    detail: 'Include cardiology, ophthalmology, neurology, or audiology clinics across Pine Belt or Coast.',
  },
  {
    id: 'portal-access',
    category: 'Medical Directory',
    title: 'Locate patient portal logins & insurance cards',
    detail: 'Medicare, supplemental policy numbers, and MyChart credentials ready for directory build.',
  },
  {
    id: 'advance-docs',
    category: 'Home & Legal',
    title: 'Identify location of healthcare proxy & living will',
    detail: 'Confirm where signed copies reside so emergency teams and clinics have clear records.',
  },
  {
    id: 'home-walkthrough',
    category: 'Home & Legal',
    title: 'Note lighting, hallway rugs & entryway steps',
    detail: 'Simple non-clinical environmental observations to review during the Foundation walkthrough.',
  },
  {
    id: 'family-circle',
    category: 'Family Logistics',
    title: 'Designate 1–2 primary family debrief recipients',
    detail: 'Establish who receives same-day post-appointment summaries by phone or email.',
  },
];

export const DEFAULT_DOSSIER_CARD = {
  clientName: 'Eleanor M. Holloway',
  city: 'Hattiesburg, MS',
  preferredHospital: 'Forrest General Hospital',
  primaryPharmacy: 'Hattiesburg Apothecary · Hardy St.',
  primaryPhysician: 'Dr. Thomas R. Greer, Internal Medicine',
  familyContact: 'Claire Holloway (Daughter · Atlanta)',
  familyPhone: '(601) 555-0148',
  allergiesOrNotes: 'Penicillin sensitivity · Prefers morning clinic visits',
};

export const INITIAL_QUESTIONS = [
  {
    id: 'q-1',
    specialty: 'Primary Care',
    question: 'Can we review the current blood pressure medication timing to minimize morning dizziness?',
    createdAt: 'Added for next visit',
  },
  {
    id: 'q-2',
    specialty: 'Cardiology',
    question: 'Which lab results should be completed prior to our follow-up appointment next quarter?',
    createdAt: 'Added for next visit',
  },
];
