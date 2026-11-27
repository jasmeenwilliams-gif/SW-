export type TabPath =
  | 'about'
  | 'services'
  | 'the-care-dossier'
  | 'for-families'
  | 'credentials'
  | 'operations';

export type ServiceProtocolId =
  | 'foundation-assessment'
  | 'medication-concierge'
  | 'clinic-accompaniment'
  | 'advance-care-planning'
  | 'general-consultation';

export type ConsultationStatus = 'pending' | 'scheduled' | 'completed' | 'archived';

export interface ConsultationRequest {
  id: string;
  docId?: string;
  ownerId?: string;
  contactName: string;
  contactEmailOrPhone: string;
  lovedOneCity: string;
  serviceInterest: ServiceProtocolId;
  preferredFormat: 'Phone Call' | 'Video Family Meeting' | 'In-Home Visit';
  notes: string;
  status?: ConsultationStatus;
  submittedAt: string;
  syncedToCloud?: boolean;
}

export interface ReadinessItem {
  id: string;
  category: 'Medical Directory' | 'Medication & Pharmacy' | 'Home & Legal' | 'Family Logistics';
  title: string;
  detail: string;
}

export interface ClinicQuestion {
  id: string;
  specialty: string;
  question: string;
  createdAt: string;
}

export interface DossierCardData {
  clientName: string;
  city: string;
  preferredHospital: string;
  primaryPharmacy: string;
  primaryPhysician: string;
  familyContact: string;
  familyPhone: string;
  allergiesOrNotes: string;
}
