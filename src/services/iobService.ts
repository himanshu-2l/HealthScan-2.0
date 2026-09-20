/**
 * Insulin on Board (IOB) Service
 * Calculates active insulin, tracks doses, and provides dosing recommendations
 */

import {
  InsulinDose,
  IOBPoint,
  PatientSettings,
  DoseRecommendation,
  StackingWarning,
  NightAssessment,
} from '../types/health';

const STORAGE_KEY_DOSES = 'healthScan_insulin_doses';
const STORAGE_KEY_SETTINGS = 'healthScan_diabetes_settings';

const DEFAULT_SETTINGS: PatientSettings = {
  insulinToCarbRatio: 10,
  correctionFactor: 50,
  targetGlucose: 120,
  rapidInsulinDuration: 4,
  longInsulinDuration: 24,
  rapidInsulinPeak: 75,
};

/**
 * Generate a unique ID
 */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `iob-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate IOB for a single dose at a given time
 * Uses biexponential decay for rapid insulin, linear for long-acting
 */
export const calculateSingleDoseIOB = (
  dose: InsulinDose,
  currentTime: Date,
  settings: PatientSettings
): number => {
  const doseTime = new Date(dose.timestamp).getTime();
  const currentTimeMs = currentTime.getTime();
  const tMinutes = (currentTimeMs - doseTime) / (1000 * 60); // Time since dose in minutes

  if (tMinutes < 0) {
    return 0; // Dose is in the future
  }

  if (dose.type === 'rapid') {
    const durationMinutes = settings.rapidInsulinDuration * 60;
    const tp = settings.rapidInsulinPeak;
    const tau = (durationMinutes / 5);

    if (tMinutes >= durationMinutes) {
      return 0;
    }

    // Biexponential decay curve
    const iob = dose.units * (1 - (tMinutes / durationMinutes) * (1 + tMinutes / (2 * tp))) * Math.exp(-tMinutes / tau);
    return Math.max(0, iob);
  } else {
    // Long-acting insulin: linear decay
    const durationMinutes = settings.longInsulinDuration * 60;

    if (tMinutes >= durationMinutes) {
      return 0;
    }

    const iob = dose.units * (1 - tMinutes / durationMinutes);
    return Math.max(0, iob);
  }
};

/**
 * Calculate total IOB from all active doses
 */
export const calculateIOB = (
  doses: InsulinDose[],
  currentTime?: Date
): number => {
  const now = currentTime || new Date();
  const settings = getPatientSettings();

  return doses.reduce((total, dose) => {
    return total + calculateSingleDoseIOB(dose, now, settings);
  }, 0);
};

/**
 * Get IOB timeline for chart display
 * Returns IOB values at 15-minute intervals
 */
export const getIOBTimeline = (
  doses: InsulinDose[],
  hours: number
): IOBPoint[] => {
  const timeline: IOBPoint[] = [];
  const now = new Date();
  const settings = getPatientSettings();
  const intervals = hours * 4; // 15-minute intervals

  for (let i = 0; i <= intervals; i++) {
    const time = new Date(now.getTime() + i * 15 * 60 * 1000);
    const iob = calculateIOB(doses, time);

    timeline.push({
      time: time.toISOString(),
      iob: Math.round(iob * 100) / 100, // Round to 2 decimal places
    });
  }

  return timeline;
};

/**
 * Log a new insulin dose
 */
export const logInsulinDose = (dose: Omit<InsulinDose, 'id'>): InsulinDose => {
  try {
    const doses = getInsulinDoses();

    const newDose: InsulinDose = {
      ...dose,
      id: generateId(),
    };

    doses.push(newDose);

    // Sort by timestamp (newest first)
    doses.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    localStorage.setItem(STORAGE_KEY_DOSES, JSON.stringify(doses));
    return newDose;
  } catch (error) {
    console.error('Error logging insulin dose:', error);
    throw new Error('Failed to log insulin dose');
  }
};

/**
 * Get all insulin doses
 */
export const getInsulinDoses = (): InsulinDose[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DOSES);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as InsulinDose[];
  } catch (error) {
    console.error('Error retrieving insulin doses:', error);
    return [];
  }
};

/**
 * Delete an insulin dose by ID
 */
export const deleteInsulinDose = (id: string): void => {
  try {
    const doses = getInsulinDoses();
    const filtered = doses.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY_DOSES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting insulin dose:', error);
    throw new Error('Failed to delete insulin dose');
  }
};

/**
 * Get only active doses (those with remaining IOB)
 */
export const getActiveDoses = (currentTime?: Date): InsulinDose[] => {
  const now = currentTime || new Date();
  const settings = getPatientSettings();
  const allDoses = getInsulinDoses();

  return allDoses.filter(dose => {
    const iob = calculateSingleDoseIOB(dose, now, settings);
    return iob > 0.01; // Threshold to avoid floating point issues
  });
};

/**
 * Get patient settings
 */
export const getPatientSettings = (): PatientSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as PatientSettings;
  } catch (error) {
    console.error('Error retrieving patient settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Save patient settings
 */
export const savePatientSettings = (settings: PatientSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving patient settings:', error);
    throw new Error('Failed to save patient settings');
  }
};

/**
 * Calculate meal bolus dose based on carbs
 */
export const calculateMealDose = (
  carbs: number,
  currentGlucose: number,
  settings?: PatientSettings
): DoseRecommendation => {
  const patientSettings = settings || getPatientSettings();

  // Meal dose: carbs / ICR
  const mealDose = carbs / patientSettings.insulinToCarbRatio;

  // Correction dose: (current - target) / CF
  const glucoseDiff = currentGlucose - patientSettings.targetGlucose;
  const correctionDose = glucoseDiff > 0 ? glucoseDiff / patientSettings.correctionFactor : 0;

  // Current IOB
  const doses = getInsulinDoses();
  const currentIOB = calculateIOB(doses);

  // Final dose accounts for IOB (don't subtract if glucose is high)
  let finalDose = mealDose + correctionDose;
  if (currentIOB > 0 && glucoseDiff <= 0) {
    finalDose = Math.max(0, finalDose - currentIOB);
  } else if (currentIOB > 0) {
    // Partial IOB consideration for high glucose
    finalDose = Math.max(0, finalDose - currentIOB * 0.5);
  }

  // Build explanation
  let explanation = `Meal dose: ${mealDose.toFixed(1)}u for ${carbs}g carbs (1:${patientSettings.insulinToCarbRatio})`;
  if (correctionDose > 0) {
    explanation += ` + ${correctionDose.toFixed(1)}u correction (${glucoseDiff}mg/dL ÷ ${patientSettings.correctionFactor})`;
  }
  if (currentIOB > 0) {
    explanation += ` - ${currentIOB.toFixed(1)}u IOB adjustment`;
  }
  explanation += ` = ${finalDose.toFixed(1)}u recommended`;

  return {
    mealDose: Math.round(mealDose * 10) / 10,
    correctionDose: Math.round(correctionDose * 10) / 10,
    currentIOB: Math.round(currentIOB * 100) / 100,
    finalDose: Math.round(finalDose * 10) / 10,
    explanation,
  };
};

/**
 * Check for insulin stacking risk
 */
export const checkStackingRisk = (
  newDose: number,
  currentGlucose: number
): StackingWarning => {
  const settings = getPatientSettings();
  const doses = getInsulinDoses();
  const currentIOB = calculateIOB(doses);

  // Find time since last rapid dose
  const rapidDoses = doses.filter(d => d.type === 'rapid');
  let timeSinceLastDose = Infinity;

  if (rapidDoses.length > 0) {
    const lastDose = rapidDoses[0]; // Already sorted newest first
    const lastDoseTime = new Date(lastDose.timestamp).getTime();
    timeSinceLastDose = (Date.now() - lastDoseTime) / (1000 * 60);
  }

  // Predict glucose in 2 hours
  const predictedGlucoseIn2Hours = Math.max(
    70,
    currentGlucose - currentIOB * settings.correctionFactor
  );

  // Calculate safe max additional dose
  const glucoseDiff = currentGlucose - settings.targetGlucose;
  const safeMaxDose = Math.max(0, glucoseDiff / settings.correctionFactor - currentIOB);

  // Determine risk
  const isAtRisk = currentIOB > 3 || (currentIOB > 1.5 && timeSinceLastDose < 120);

  let warningMessage = '';
  if (isAtRisk) {
    if (currentIOB > 5) {
      warningMessage = `High IOB (${currentIOB.toFixed(1)}u) - Risk of hypoglycemia. Wait ${Math.ceil((settings.rapidInsulinDuration * 60 - timeSinceLastDose) / 15) * 15} minutes before dosing.`;
    } else if (timeSinceLastDose < 60) {
      warningMessage = `Dosed ${Math.round(timeSinceLastDose)} minutes ago. Insulin stacking risk - consider waiting.`;
    } else {
      warningMessage = `Active insulin (${currentIOB.toFixed(1)}u) may cover this. Consider reducing dose by ${Math.min(newDose * 0.5, currentIOB).toFixed(1)}u.`;
    }
  } else if (currentIOB > 0) {
    warningMessage = `Note: ${currentIOB.toFixed(1)}u active insulin. Monitor glucose closely.`;
  } else {
    warningMessage = 'No stacking risk detected.';
  }

  return {
    isAtRisk,
    currentIOB: Math.round(currentIOB * 100) / 100,
    timeSinceLastDose: Math.round(timeSinceLastDose),
    predictedGlucoseIn2Hours: Math.round(predictedGlucoseIn2Hours),
    safeMaxDose: Math.round(safeMaxDose * 10) / 10,
    warningMessage,
  };
};

/**
 * Assess nighttime safety for sleep
 */
export const assessNightSafety = (
  currentGlucose: number,
  bedtime?: Date
): NightAssessment => {
  const settings = getPatientSettings();
  const doses = getInsulinDoses();
  const currentIOB = calculateIOB(doses, bedtime);

  // Simple prediction: assume glucose drops by IOB * CF over 3 hours
  // and then stabilizes or rises slightly
  const predicted3AMGlucose = Math.max(
    60,
    currentGlucose - currentIOB * settings.correctionFactor * 0.7
  );

  let riskLevel: 'safe' | 'caution' | 'danger';
  let recommendation: string;
  let snackSuggestion: string | undefined;

  if (predicted3AMGlucose < 70 || (currentGlucose < 100 && currentIOB > 3)) {
    riskLevel = 'danger';
    recommendation = 'Risk of nighttime hypoglycemia. Set alarm for 2 AM check.';
    snackSuggestion = 'Have 15g fast-acting carbs before bed (e.g., 4 glucose tablets or 1/2 cup juice).';
  } else if (predicted3AMGlucose < 90 || (currentGlucose < 120 && currentIOB > 2)) {
    riskLevel = 'caution';
    recommendation = 'Monitor closely. Consider a small snack if trending down.';
    snackSuggestion = 'Optional: 10g carbs (e.g., 1/2 banana or small apple).';
  } else if (currentGlucose > 250) {
    riskLevel = 'caution';
    recommendation = 'High glucose - check ketones and hydrate before sleep.';
  } else {
    riskLevel = 'safe';
    recommendation = 'Glucose stable for sleep. Sweet dreams!';
  }

  return {
    currentGlucose,
    currentIOB: Math.round(currentIOB * 100) / 100,
    predicted3AMGlucose: Math.round(predicted3AMGlucose),
    riskLevel,
    recommendation,
    snackSuggestion,
  };
};

/**
 * Clear all insulin doses (for testing/debugging)
 */
export const clearAllDoses = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_DOSES);
  } catch (error) {
    console.error('Error clearing insulin doses:', error);
  }
};

/**
 * Reset settings to defaults
 */
export const resetSettings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
  } catch (error) {
    console.error('Error resetting settings:', error);
  }
};
