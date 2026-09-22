/**
 * Deterministic Medicine Safety & Interaction Service
 * 
 * Non-negotiable rules:
 * - 100% deterministic logic. Zero LLM hallucinations for drug safety.
 * - Cross-checks active ingredients against patient allergies, existing medications, and conditions.
 * - Highlights missing context explicitly (never assumes missing = safe).
 * Grounded in docs/MEDICINE_LENS.md
 */

import { DRUG_INTERACTIONS, ALLERGY_CROSS_REACTIVITY } from '../data/indianMedicines';
import { normalizeGeneric } from './medicineResolverService';
import {
  GenericIngredient,
  PersonalizedSafety,
  InteractionWarning,
  AllergyWarning,
  DuplicateIngredientWarning,
  PatientSafetyContext
} from '../types/medicineLens';
import { getPatientProfile } from './patientProfileService';

/**
 * Checks whether an active generic ingredient matches an allergy,
 * including known cross-reactivity families (e.g. penicillin -> amoxicillin).
 */
function checkAllergyMatch(allergenRaw: string, ingredientNorm: string): { matched: boolean; family?: string } {
  const allergen = normalizeGeneric(allergenRaw);
  if (!allergen || !ingredientNorm) return { matched: false };

  // Direct match
  if (ingredientNorm.includes(allergen) || allergen.includes(ingredientNorm)) {
    return { matched: true };
  }

  // Cross-reactivity family match
  for (const [family, members] of Object.entries(ALLERGY_CROSS_REACTIVITY)) {
    const isAllergenInFamily = allergen.includes(family) || members.some(m => allergen.includes(m) || m.includes(allergen));
    if (isAllergenInFamily) {
      const isIngredientInFamily = members.some(m => ingredientNorm.includes(m) || m.includes(ingredientNorm));
      if (isIngredientInFamily) {
        return { matched: true, family };
      }
    }
  }

  return { matched: false };
}

/**
 * Deterministically checks safety and interactions for a scanned medicine
 * against a patient's clinical context.
 */
export function evaluateMedicineSafety(
  scannedIngredients: GenericIngredient[],
  customContext?: PatientSafetyContext,
  ageWarnings?: { pediatric?: string; geriatric?: string },
  pregnancyRisk?: string
): PersonalizedSafety {
  // If no custom context provided, try to load from persistent PatientProfile
  const profile = getPatientProfile();
  
  let patientAge: number | undefined = customContext?.age;
  let knownAllergies: string[] = customContext?.knownAllergies || [];
  let existingMedications: string[] = customContext?.existingMedications || [];
  let isPregnant = customContext?.isPregnant ?? false;
  let kidneyLiverDisease = customContext?.kidneyLiverDisease ?? false;

  // Hydrate from profile if available
  if (profile) {
    if (patientAge === undefined && profile.dateOfBirth) {
      const dob = new Date(profile.dateOfBirth);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      patientAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    if (knownAllergies.length === 0 && profile.allergies) {
      knownAllergies = profile.allergies.map(a => a.allergen);
    }
    if (existingMedications.length === 0 && profile.medications) {
      existingMedications = profile.medications.filter(m => m.isActive).map(m => m.name);
    }
    if (!kidneyLiverDisease && profile.medicalHistory) {
      kidneyLiverDisease = profile.medicalHistory.some(h => 
        /kidney|renal|liver|hepatic|cirrhosis|nephropathy/i.test(h.condition)
      );
    }
  }

  const missingContext: string[] = [];
  if (patientAge === undefined) missingContext.push('Patient age not specified');
  if (knownAllergies.length === 0) missingContext.push('Allergy history not provided');
  if (existingMedications.length === 0) missingContext.push('Current active medications list not provided');

  const normalizedScanned = scannedIngredients.map(g => normalizeGeneric(g.name)).filter(Boolean);

  // 1. ALLERGY CHECKS
  const allergyWarnings: AllergyWarning[] = [];
  for (const ingredient of normalizedScanned) {
    for (const allergen of knownAllergies) {
      const match = checkAllergyMatch(allergen, ingredient);
      if (match.matched) {
        allergyWarnings.push({
          allergen,
          matchedIngredient: ingredient,
          severity: 'severe',
          reaction: 'Risk of acute allergic reaction or anaphylaxis',
          advice: `CRITICAL ALLERGY ALERT: This medicine contains or cross-reacts with "${ingredient}", which conflicts with your reported "${allergen}" allergy. Do NOT consume without emergency physician clearance.`
        });
      }
    }
  }

  // 2. DRUG-DRUG INTERACTIONS
  const interactionWarnings: InteractionWarning[] = [];
  const normalizedExisting = existingMedications.map(m => normalizeGeneric(m)).filter(Boolean);

  for (const scannedDrug of normalizedScanned) {
    for (const existingDrug of normalizedExisting) {
      if (scannedDrug === existingDrug) continue; // Duplicate handled separately

      // Search interaction table in both directions
      const foundInteraction = DRUG_INTERACTIONS.find(
        pair =>
          (scannedDrug.includes(pair.drugA) && existingDrug.includes(pair.drugB)) ||
          (scannedDrug.includes(pair.drugB) && existingDrug.includes(pair.drugA)) ||
          (pair.drugA.includes(scannedDrug) && pair.drugB.includes(existingDrug)) ||
          (pair.drugB.includes(scannedDrug) && pair.drugA.includes(existingDrug))
      );

      if (foundInteraction) {
        interactionWarnings.push({
          drug: scannedDrug,
          interactingDrug: existingDrug,
          severity: foundInteraction.severity,
          explanation: foundInteraction.clinicalAdvice,
          mechanism: foundInteraction.mechanism
        });
      }
    }
  }

  // 3. DUPLICATE ACTIVE INGREDIENT CHECK
  const duplicateWarnings: DuplicateIngredientWarning[] = [];
  for (const scannedDrug of normalizedScanned) {
    for (const existingDrug of normalizedExisting) {
      if (scannedDrug === existingDrug || scannedDrug.includes(existingDrug) || existingDrug.includes(scannedDrug)) {
        duplicateWarnings.push({
          ingredient: scannedDrug,
          currentMedicine: scannedDrug,
          existingMedicine: existingDrug,
          warning: `DUPLICATE ACTIVE INGREDIENT WARNING: You are already taking a medication containing "${existingDrug}". Combining this with the scanned medicine can cause an accidental overdose (e.g. liver toxicity from excess paracetamol or severe bleeding from dual NSAIDs).`
        });
      }
    }
  }

  // 4. AGE CONSIDERATIONS
  const ageConsiderations: string[] = [];
  if (patientAge !== undefined) {
    if (patientAge < 12) {
      ageConsiderations.push('Pediatric Caution: Adult tablet strengths and dosages are unsafe for children. Dosing must be calculated strictly by body weight using pediatric syrups or drops.');
      if (ageWarnings?.pediatric) {
        ageConsiderations.push(ageWarnings.pediatric);
      }
    } else if (patientAge >= 65) {
      ageConsiderations.push('Geriatric Caution: Slower hepatic and renal clearance increases sensitivity to drug accumulation, sedation, and fall risks.');
      if (ageWarnings?.geriatric) {
        ageConsiderations.push(ageWarnings.geriatric);
      }
    }
  }

  // 5. PREGNANCY CONSIDERATIONS
  const pregnancyConsiderations: string[] = [];
  if (isPregnant) {
    if (pregnancyRisk === 'Contraindicated in pregnancy') {
      pregnancyConsiderations.push('CRITICAL: This medicine is explicitly CONTRAINDICATED during pregnancy due to established risk of fetal injury or birth defects.');
    } else if (pregnancyRisk === 'Avoid unless prescribed') {
      pregnancyConsiderations.push('WARNING: Avoid this medicine during pregnancy unless directly prescribed by your obstetrician/gynecologist.');
    } else if (pregnancyRisk) {
      pregnancyConsiderations.push(`Pregnancy Safety Status: ${pregnancyRisk}. Always confirm safety with your prenatal specialist.`);
    }
  }

  // 6. KIDNEY & LIVER CONSIDERATIONS
  const kidneyLiverConsiderations: string[] = [];
  if (kidneyLiverDisease) {
    kidneyLiverConsiderations.push('Renal/Hepatic Alert: In pre-existing kidney or liver impairment, drug metabolism is impaired. Dosage adjustments, hydration, and renal panel monitoring may be necessary.');
  }

  return {
    evaluated: true,
    missingContext,
    allergyWarnings,
    interactionWarnings,
    duplicateWarnings,
    ageConsiderations,
    pregnancyConsiderations,
    kidneyLiverConsiderations
  };
}
