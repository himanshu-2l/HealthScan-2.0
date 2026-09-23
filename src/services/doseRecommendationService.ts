/**
 * Meal Carbohydrate & Glycemic Information Service
 * Informational tracking of meal carbohydrates, current glucose, and active IOB.
 * CLINICAL SAFETY: HealthScan does NOT calculate, prescribe, or recommend insulin doses.
 * All dosing decisions must be made in accordance with the patient's clinician-prescribed plan.
 */

import {
  DoseRecommendation,
  PatientSettings,
} from '../types/health';
import {
  getPatientSettings,
  calculateIOB,
  getInsulinDoses,
} from './iobService';

/**
 * Provide informational meal carbohydrate and glycemic summary.
 * CLINICAL SAFETY: Does NOT compute or recommend insulin doses.
 */
export function calculateRecommendedDose(
  currentGlucose: number,
  mealCarbs: number,
  patientSettings?: PatientSettings,
  currentIOB?: number
): DoseRecommendation {
  const settings = patientSettings || getPatientSettings();
  const iob = currentIOB ?? calculateIOB(getInsulinDoses());
  const roundedIOB = Math.round(iob * 100) / 100;

  // Informational summary directing user to clinician care plan
  let explanation = `Logged: ${mealCarbs}g carbs, Current glucose: ${currentGlucose} mg/dL (target: ${settings.targetGlucose} mg/dL).`;
  if (roundedIOB > 0) {
    explanation += ` Active insulin on board (IOB): ${roundedIOB.toFixed(1)}u.`;
  }
  explanation += ' Follow your physician-prescribed diabetes care plan for all dosing decisions.';

  return {
    mealDose: 0,
    correctionDose: 0,
    currentIOB: roundedIOB,
    finalDose: 0,
    explanation,
  };
}

/**
 * Get common Indian meals with carb counts for quick selection
 */
export function getCommonMealCarbs(): { name: string; carbs: number; nameHindi?: string }[] {
  // Extract common meals from the meal database
  const commonMeals = [
    // Roti variations
    { name: 'Roti (1 piece)', carbs: 15, nameHindi: 'रोटी (1)' },
    { name: 'Roti (2 pieces)', carbs: 30, nameHindi: 'रोटी (2)' },
    { name: 'Paratha', carbs: 25, nameHindi: 'पराठा' },
    { name: 'Aloo Paratha', carbs: 35, nameHindi: 'आलू पराठा' },

    // Rice variations
    { name: 'White Rice (1 cup)', carbs: 45, nameHindi: 'सफेद चावल (1 कप)' },
    { name: 'Brown Rice (1 cup)', carbs: 40, nameHindi: 'भूरा चावल (1 कप)' },
    { name: 'Jeera Rice', carbs: 40, nameHindi: 'जीरा राइस' },
    { name: 'Biryani', carbs: 55, nameHindi: 'बिरयानी' },

    // South Indian
    { name: 'Idli (2 pieces)', carbs: 30, nameHindi: 'इडली (2)' },
    { name: 'Dosa (plain)', carbs: 25, nameHindi: 'डोसा' },
    { name: 'Masala Dosa', carbs: 35, nameHindi: 'मसाला डोसा' },
    { name: 'Uttapam', carbs: 30, nameHindi: 'उत्तपम' },
    { name: 'Vada (1 piece)', carbs: 20, nameHindi: 'वड़ा' },
    { name: 'Sambar Rice', carbs: 50, nameHindi: 'सांबर राइस' },

    // North Indian / Dal
    { name: 'Dal (1 bowl)', carbs: 20, nameHindi: 'दाल' },
    { name: 'Dal Makhani', carbs: 25, nameHindi: 'दाल मखनी' },
    { name: 'Chole (1 bowl)', carbs: 30, nameHindi: 'छोले' },
    { name: 'Rajma (1 bowl)', carbs: 30, nameHindi: 'राजमा' },

    // Breakfast items
    { name: 'Poha (1 bowl)', carbs: 45, nameHindi: 'पोहा' },
    { name: 'Upma', carbs: 35, nameHindi: 'उपमा' },
    { name: 'Aloo Puri (2)', carbs: 50, nameHindi: 'आलू पूरी' },
    { name: 'Bread (2 slices)', carbs: 30, nameHindi: 'ब्रेड (2 स्लाइस)' },

    // Snacks
    { name: 'Samosa (1)', carbs: 25, nameHindi: 'समोसा' },
    { name: 'Pakora (3-4)', carbs: 20, nameHindi: 'पकौड़े' },
    { name: 'Bhel Puri', carbs: 40, nameHindi: 'भेल पूरी' },
    { name: 'Pani Puri (6)', carbs: 30, nameHindi: 'पानी पूरी' },
    { name: 'Fruit (apple)', carbs: 25, nameHindi: 'सेब' },
    { name: 'Banana (1)', carbs: 27, nameHindi: 'केला' },

    // Complete meals
    { name: 'Thali (veg)', carbs: 60, nameHindi: 'वेज थाली' },
    { name: 'Thali (non-veg)', carbs: 55, nameHindi: 'नॉन-वेज थाली' },
    { name: 'Pizza (1 slice)', carbs: 30, nameHindi: 'पिज्जा' },
    { name: 'Burger', carbs: 40, nameHindi: 'बर्गर' },
  ];

  // Sort by carb count for easier selection
  return commonMeals.sort((a, b) => a.carbs - b.carbs);
}

/**
 * Get meal suggestions based on carb range
 */
export function getMealsByCarbRange(
  minCarbs: number,
  maxCarbs: number
): { name: string; carbs: number; nameHindi?: string }[] {
  const allMeals = getCommonMealCarbs();
  return allMeals.filter(meal => meal.carbs >= minCarbs && meal.carbs <= maxCarbs);
}

/**
 * Calculate total carbs from multiple meal selections
 */
export function calculateTotalCarbs(
  selections: { name: string; carbs: number; nameHindi?: string }[]
): number {
  return selections.reduce((total, meal) => total + meal.carbs, 0);
}
