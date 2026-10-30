export type PillShape = 'round' | 'capsule' | 'oval' | 'scored' | 'diamond' | 'drop';

export interface VisualPill {
  shape: PillShape;
  colorHex: string;
  colorName: string;
}

export interface Medicine {
  id: string;
  name: string;
  doseDescription: string;
  intervalHours: number;
  instructions: string;
  visualPill: VisualPill;
  stock: number;
  minStockAlert: number;
  createdAt: string;
}

export type DoseStatus = 'pending' | 'taken' | 'postponed' | 'missed';
export type ActorRole = 'patient' | 'caregiver';

export interface DoseLog {
  id: string;
  medicineId: string;
  scheduledTime: string;
  takenTime?: string;
  status: DoseStatus;
  registeredBy: ActorRole;
  notes?: string;
}

export interface AdherenceSummary {
  totalScheduled: number;
  totalTaken: number;
  totalPostponed: number;
  totalMissed: number;
  adherencePercentage: number;
  statusRating: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface DuplicateCheckResult {
  allowed: boolean;
  reason?: string;
  lastTakenAt?: string;
}

export interface EscalationResult {
  shouldEscalate: boolean;
  minutesElapsed: number;
  message: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EmergencyProfile {
  patientFullName: string;
  age: number;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  healthInsurance: string;
  emergencyContact: EmergencyContact;
}

export interface MedicationAdherenceBreakdown {
  medicineId: string;
  medicineName: string;
  doseDescription: string;
  totalScheduled: number;
  totalTaken: number;
  adherenceRate: number;
  status: 'optimal' | 'regular' | 'deficient';
}

export interface ClinicalSummaryReport {
  patientName: string;
  patientAge: number;
  overallAdherencePercentage: number;
  medicationBreakdown: MedicationAdherenceBreakdown[];
  clinicalWarnings: string[];
  formattedReportText: string;
}

