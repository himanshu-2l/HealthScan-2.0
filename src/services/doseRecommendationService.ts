/**
 * Smart Dose Recommendation Service
 * Calculates insulin doses based on glucose, carbs, and IOB
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
import { MEAL_DATABASE } from './mealPlannerService';

const DEFAULT_SETTINGS: PatientSettings = {
  insulinToCarbRatio: 10,
  correctionFactor: 50,
  targetGlucose: 120,
  rapidInsulinDuration: 4,
  longInsulinDuration: 24,
  rapidInsulinPeak: 75,
};

/**
 * Calculate recommended insulin dose based on glucose, carbs, and IOB
 */
export function calculateRecommendedDose(
  currentGlucose: number,
  mealCarbs: number,
  patientSettings?: PatientSettings,
  currentIOB?: number
): DoseRecommendation {
  // Get settings (default if not provided)
  const settings = patientSettings || getPatientSettings();

  // Meal dose = mealCarbs / insulinToCarbRatio
  const mealDose = mealCarbs / settings.insulinToCarbRatio;

  // Correction dose = max(0, (currentGlucose - targetGlucose) / correctionFactor)
  const glucoseDiff = currentGlucose - settings.targetGlucose;
  const correctionDose = glucoseDiff > 0 ? glucoseDiff / settings.correctionFactor : 0;

  // IOB = currentIOB ?? calculateIOB(getInsulinDoses())
  const iob = currentIOB ?? calculateIOB(getInsulinDoses());

  // Final dose = max(0, mealDose + correctionDose - iob)
  const rawDose = mealDose + correctionDose - iob;
  const finalDose = Math.max(0, rawDose);

  // Round to nearest 0.5 unit
  const roundedFinalDose = Math.round(finalDose * 2) / 2;
  const roundedMealDose = Math.round(mealDose * 10) / 10;
  const roundedCorrectionDose = Math.round(correctionDose * 10) / 10;
  const roundedIOB = Math.round(iob * 100) / 100;

  // Generate plain-language explanation
  let explanation = '';

  if (mealCarbs > 0 && glucoseDiff > 0) {
    // Both meal and correction needed
    explanation = `You need ${roundedMealDose.toFixed(1)} units for your ${mealCarbs}g of carbs ` +
      `plus ${roundedCorrectionDose.toFixed(1)} units to bring down your high blood sugar ` +
      `(currently ${currentGlucose} mg/dL, target is ${settings.targetGlucose} mg/dL).`;
  } else if (mealCarbs > 0) {
    // Only meal dose needed
    explanation = `You need ${roundedMealDose.toFixed(1)} units for your ${mealCarbs}g of carbs.`;
  } else if (glucoseDiff > 0) {
    // Only correction needed
    explanation = `You need ${roundedCorrectionDose.toFixed(1)} units to bring down your ` +
      `high blood sugar (currently ${currentGlucose} mg/dL, target is ${settings.targetGlucose} mg/dL).`;
  } else {
    // No insulin needed
    explanation = `Your blood sugar is below target (${currentGlucose} mg/dL). ` +
      `No correction needed.`;
  }

  // Add IOB adjustment to explanation
  if (roundedIOB > 0 && roundedFinalDose > 0) {
    explanation += ` We subtracted ${roundedIOB.toFixed(1)} units for insulin already active in your body.`;
  } else if (roundedIOB > 0 && roundedFinalDose === 0) {
    explanation += ` The ${roundedIOB.toFixed(1)} units of active insulin in your body should cover this.`;
  }

  // Final recommendation
  if (roundedFinalDose > 0) {
    explanation += ` Recommended dose: ${roundedFinalDose.toFixed(1)} units.`;
  } else {
    explanation += ` No additional insulin needed at this time.`;
  }

  return {
    mealDose: roundedMealDose,
    correctionDose: roundedCorrectionDose,
    currentIOB: roundedIOB,
    finalDose: roundedFinalDose,
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
