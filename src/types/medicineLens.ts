/**
 * Medicine Lens Data Contracts and Schema
 * Grounded in docs/MEDICINE_LENS.md specification
 */

export interface GenericIngredient {
  name: string;
  strength?: string;
}

export interface CandidateAlternative {
  name: string;
  genericName?: string;
  confidence: number;
}

export interface MedicineIdentification {
  status: 'identified' | 'possible_matches' | 'unidentified';
  confidence: number; // 0.0 - 1.0
  brandName?: string;
  genericIngredients: GenericIngredient[];
  dosageForm?: string; // Tablet, Capsule, Syrup, Injection, Ointment, etc.
  manufacturer?: string;
  alternatives?: CandidateAlternative[];
  evidence: string[];
}

export interface MedicineEducation {
  medicineClass?: string;
  commonUses: string[];
  commonSideEffects: string[];
  importantWarnings: string[];
  contraindications: string[];
  prescriptionStatus?: 'Rx' | 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X' | string;
  storage?: string;
}

export interface InteractionWarning {
  drug: string;
  interactingDrug?: string;
  severity: 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';
  explanation: string;
  mechanism?: string;
}

export interface AllergyWarning {
  allergen: string;
  matchedIngredient: string;
  severity: 'severe' | 'moderate' | 'mild';
  reaction?: string;
  advice: string;
}

export interface DuplicateIngredientWarning {
  ingredient: string;
  currentMedicine: string;
  existingMedicine: string;
  warning: string;
}

export interface PersonalizedSafety {
  evaluated: boolean;
  missingContext: string[]; // List of unprovided attributes (e.g. allergies, renal history)
  allergyWarnings: AllergyWarning[];
  interactionWarnings: InteractionWarning[];
  duplicateWarnings?: DuplicateIngredientWarning[];
  ageConsiderations: string[];
  pregnancyConsiderations: string[];
  kidneyLiverConsiderations: string[];
}

export interface MedicineSource {
  title: string;
  url?: string;
  retrievedAt?: string;
}

export interface MedicineLensResult {
  identification: MedicineIdentification;
  education?: MedicineEducation;
  personalizedSafety?: PersonalizedSafety;
  sources: MedicineSource[];
  limitations: string[];
  nextSteps: string[];
}

export type SupportedLanguage = 'en' | 'hi' | 'hinglish';

export interface LocalizedExplanation {
  language: SupportedLanguage;
  summary: string;
  whatItIsFor: string;
  howToTakeSafely: string;
  sideEffectsAndPrecautions: string;
  warningsText: string;
  emergencyAdvice: string;
}

export interface PatientSafetyContext {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
  knownAllergies?: string[];
  existingMedications?: string[];
  kidneyLiverDisease?: boolean;
  pepticUlcerOrGIBleed?: boolean;
  hypertensionOrCardiac?: boolean;
  asthma?: boolean;
}
