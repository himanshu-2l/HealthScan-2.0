/**
 * Hormonal Health Service
 * AI-Powered Women's Hormonal Health & Period Intelligence System
 * Core service layer for cycle tracking, predictions, and health insights
 */

import {
  MoodLevel,
  SeverityLevel,
  CyclePhaseName,
  RiskLevel,
  HormonalProfile,
  DailyLog,
  HormoneLevels,
  CyclePhaseInfo,
  PhaseRecommendation,
  PCOSRiskAssessment,
  PCOSIndicator,
  PainEntry,
  MoodEntry,
  SkinPrediction,
  CycleGlucoseCorrelation,
  EndometriosisFlag,
  FertilityWindow,
  DailyBriefing,
  HormonalHealthData,
  ForecastDay,
  MoodPatternAnalysis,
} from '../types/hormonal';
import { getCycleData, PeriodLog } from './periodTrackerService';
import { getAllGlucoseReadings, GlucoseReading } from './glucoseService';

const STORAGE_KEY = 'healthscan_hormonal_data';

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Get all hormonal health data from localStorage
 */
export const getHormonalData = (): HormonalHealthData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        profile: {
          avgCycleLength: 28,
          avgPeriodLength: 5,
          knownConditions: [],
          lastUpdated: new Date().toISOString(),
        },
        dailyLogs: [],
        painEntries: [],
        moodEntries: [],
      };
    }
    return JSON.parse(stored) as HormonalHealthData;
  } catch (error) {
    console.error('Error retrieving hormonal data:', error);
    return {
      profile: {
        avgCycleLength: 28,
        avgPeriodLength: 5,
        knownConditions: [],
        lastUpdated: new Date().toISOString(),
      },
      dailyLogs: [],
      painEntries: [],
      moodEntries: [],
    };
  }
};

/**
 * Save hormonal health data to localStorage
 */
export const saveHormonalData = (data: HormonalHealthData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving hormonal data:', error);
  }
};

/**
 * Save a daily log entry
 */
export const saveDailyLog = (log: Omit<DailyLog, 'id' | 'timestamp'>): DailyLog => {
  const data = getHormonalData();
  
  const newLog: DailyLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  
  // Remove any existing log for the same date
  data.dailyLogs = data.dailyLogs.filter(l => l.date !== log.date);
  data.dailyLogs.push(newLog);
  
  // Sort by date (newest first)
  data.dailyLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  saveHormonalData(data);
  return newLog;
};

/**
 * Save a pain entry
 */
export const savePainEntry = (entry: Omit<PainEntry, 'id' | 'timestamp'>): PainEntry => {
  const data = getHormonalData();
  
  const newEntry: PainEntry = {
    ...entry,
    id: `pain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  
  data.painEntries.push(newEntry);
  
  // Sort by date (newest first)
  data.painEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  saveHormonalData(data);
  return newEntry;
};

/**
 * Get all daily logs
 */
export const getDailyLogs = (): DailyLog[] => {
  const data = getHormonalData();
  return data.dailyLogs;
};

/**
 * Get all pain entries
 */
export const getPainEntries = (): PainEntry[] => {
  const data = getHormonalData();
  return data.painEntries;
};

/**
 * Delete a daily log by ID
 */
export const deleteDailyLog = (id: string): boolean => {
  const data = getHormonalData();
  const initialLength = data.dailyLogs.length;
  data.dailyLogs = data.dailyLogs.filter(log => log.id !== id);
  
  if (data.dailyLogs.length === initialLength) {
    return false;
  }
  
  saveHormonalData(data);
  return true;
};

/**
 * Delete a pain entry by ID
 */
export const deletePainEntry = (id: string): boolean => {
  const data = getHormonalData();
  const initialLength = data.painEntries.length;
  data.painEntries = data.painEntries.filter(entry => entry.id !== id);
  
  if (data.painEntries.length === initialLength) {
    return false;
  }
  
  saveHormonalData(data);
  return true;
};

// ============================================================================
// Cycle Phase Calculator
// ============================================================================

/**
 * Get the last period start date from period tracker data
 */
const getLastPeriodStart = (): Date | null => {
  const cycleData = getCycleData();
  if (cycleData.logs.length === 0) return null;
  
  // Logs are sorted newest first
  return new Date(cycleData.logs[0].startDate);
};

/**
 * Calculate current cycle day based on last period start
 */
const getCurrentCycleDay = (cycleLength: number): number => {
  const lastPeriodStart = getLastPeriodStart();
  if (!lastPeriodStart) return 1;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastPeriodStart.setHours(0, 0, 0, 0);
  
  const dayOfCycle = Math.floor(
    (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  // Handle cycles that have completed
  return dayOfCycle <= cycleLength ? dayOfCycle : ((dayOfCycle - 1) % cycleLength) + 1;
};

/**
 * Get current cycle phase with detailed information
 * Adaptive for non-28-day cycles using proportional phase breakdown
 */
export const getCurrentCyclePhase = (): CyclePhaseInfo => {
  const cycleData = getCycleData();
  const cycleLength = cycleData.averageCycleLength || 28;
  const periodLength = cycleData.averagePeriodLength || 5;
  const cycleDay = getCurrentCycleDay(cycleLength);
  
  // Calculate ovulation day (luteal phase is consistently ~14 days)
  const ovulationDay = cycleLength - 14;
  
  // Determine phase boundaries
  const menstrualEnd = periodLength;
  const follicularEnd = ovulationDay - 2;
  const ovulationEnd = ovulationDay + 1;
  
  let phase: CyclePhaseName;
  let dayInPhase: number;
  let totalPhaseDays: number;
  
  if (cycleDay <= menstrualEnd) {
    phase = 'menstrual';
    dayInPhase = cycleDay;
    totalPhaseDays = menstrualEnd;
  } else if (cycleDay <= follicularEnd) {
    phase = 'follicular';
    dayInPhase = cycleDay - menstrualEnd;
    totalPhaseDays = follicularEnd - menstrualEnd;
  } else if (cycleDay <= ovulationEnd) {
    phase = 'ovulation';
    dayInPhase = cycleDay - follicularEnd;
    totalPhaseDays = 3; // ovulation is 3 days
  } else {
    phase = 'luteal';
    dayInPhase = cycleDay - ovulationEnd;
    totalPhaseDays = cycleLength - ovulationEnd;
  }
  
  const hormoneLevels = estimateHormoneLevels(cycleDay, cycleLength);
  const expectedSymptoms = getExpectedSymptoms(phase, cycleDay, cycleLength);
  const recommendations = getPhaseRecommendations(phase);
  
  return {
    phase,
    dayInPhase,
    totalPhaseDays,
    cycleDay,
    totalCycleDays: cycleLength,
    hormoneLevels,
    expectedSymptoms,
    recommendations,
  };
};

/**
 * Get expected symptoms for a given phase and cycle day
 */
const getExpectedSymptoms = (phase: CyclePhaseName, cycleDay: number, cycleLength: number): string[] => {
  const symptoms: Record<CyclePhaseName, string[]> = {
    menstrual: ['Cramps', 'Fatigue', 'Bloating', 'Lower back pain', 'Mood swings', 'Headaches'],
    follicular: ['Increased energy', 'Improved mood', 'Clearer skin', 'Heightened senses'],
    ovulation: ['Mild cramping (ovulation pain)', 'Increased libido', 'Cervical mucus changes', 'Breast tenderness'],
    luteal: ['PMS symptoms', 'Bloating', 'Breast tenderness', 'Mood changes', 'Food cravings', 'Fatigue'],
  };
  
  // Add late-luteal specific symptoms
  if (phase === 'luteal' && cycleDay > cycleLength - 5) {
    return [...symptoms[phase], 'Premenstrual tension', 'Sleep disturbances'];
  }
  
  return symptoms[phase];
};

// ============================================================================
// Hormone Level Estimator
// ============================================================================

/**
 * Estimate hormone levels based on cycle day using mathematical curves
 * Returns normalized 0-100 values
 */
export const estimateHormoneLevels = (cycleDay: number, cycleLength: number): HormoneLevels => {
  // Normalize cycle day to 0-1 range for calculations
  const normalizedDay = (cycleDay - 1) / cycleLength;
  const ovulationDay = (cycleLength - 14) / cycleLength;
  
  // Estrogen: Low during menstruation, rises in follicular, peaks at ovulation, secondary peak in luteal
  const estrogen = Math.round(
    30 + 
    50 * Math.exp(-Math.pow((normalizedDay - ovulationDay) * 8, 2)) + // Peak at ovulation
    20 * Math.sin(normalizedDay * Math.PI * 2 + Math.PI / 4) // Secondary fluctuations
  );
  
  // Progesterone: Low in follicular, rises after ovulation, peaks mid-luteal
  const progesterone = Math.round(
    normalizedDay > ovulationDay
      ? 30 + 60 * Math.sin(((normalizedDay - ovulationDay) / (1 - ovulationDay)) * Math.PI)
      : 10 + Math.random() * 10
  );
  
  // LH: Sharp peak just before ovulation
  const lh = Math.round(
    15 + 85 * Math.exp(-Math.pow((normalizedDay - ovulationDay + 0.02) * 20, 2))
  );
  
  // FSH: Higher in early follicular, lower in luteal
  const fsh = Math.round(
    25 + 35 * Math.exp(-Math.pow(normalizedDay * 5, 2)) + // Early follicular peak
    20 * Math.exp(-Math.pow((normalizedDay - ovulationDay + 0.05) * 15, 2)) // Smaller pre-ovulation peak
  );
  
  // Testosterone: Slight rise mid-cycle, peaks around ovulation
  const testosterone = Math.round(
    25 + 40 * Math.exp(-Math.pow((normalizedDay - ovulationDay) * 10, 2))
  );
  
  return {
    estrogen: Math.max(0, Math.min(100, estrogen)),
    progesterone: Math.max(0, Math.min(100, progesterone)),
    lh: Math.max(0, Math.min(100, lh)),
    fsh: Math.max(0, Math.min(100, fsh)),
    testosterone: Math.max(0, Math.min(100, testosterone)),
  };
};

// ============================================================================
// Daily Briefing
// ============================================================================

/**
 * Get daily briefing with phase info, predictions, and recommendations
 */
export const getDailyBriefing = (): DailyBriefing => {
  const today = new Date().toISOString().split('T')[0];
  const phaseInfo = getCurrentCyclePhase();
  const { phase, cycleDay } = phaseInfo;
  
  // Calculate predicted scores based on phase and hormone levels
  const predictedEnergy = calculatePredictedEnergy(phase, phaseInfo.hormoneLevels);
  const predictedMood = calculatePredictedMood(phase, phaseInfo.hormoneLevels);
  const predictedFocus = calculatePredictedFocus(phase, phaseInfo.hormoneLevels);
  const predictedStrength = calculatePredictedStrength(phase, phaseInfo.hormoneLevels);
  const predictedLibido = calculatePredictedLibido(phase, phaseInfo.hormoneLevels);
  const predictedSkinCondition = predictSkinCondition().predictedSeverity;
  
  const hormonalSummary = generateHormonalSummary(phase, phaseInfo.hormoneLevels);
  
  return {
    date: today,
    cycleDay,
    phase,
    phaseInfo,
    predictedEnergy,
    predictedMood,
    predictedFocus,
    predictedStrength,
    predictedSkinCondition,
    predictedLibido,
    hormonalSummary,
    expectedSymptoms: phaseInfo.expectedSymptoms,
    recommendations: phaseInfo.recommendations,
  };
};

/**
 * Calculate predicted energy level (1-5 scale)
 */
const calculatePredictedEnergy = (phase: CyclePhaseName, hormones: HormoneLevels): number => {
  const baseEnergy: Record<CyclePhaseName, number> = {
    menstrual: 2,
    follicular: 4,
    ovulation: 5,
    luteal: 3,
  };
  
  // Adjust based on estrogen (energy-boosting hormone)
  const estrogenFactor = (hormones.estrogen - 30) / 70;
  const adjustedEnergy = baseEnergy[phase] + estrogenFactor;
  
  return Math.max(1, Math.min(5, Math.round(adjustedEnergy)));
};

/**
 * Calculate predicted mood level (1-5 scale)
 */
const calculatePredictedMood = (phase: CyclePhaseName, hormones: HormoneLevels): number => {
  const baseMood: Record<CyclePhaseName, number> = {
    menstrual: 2.5,
    follicular: 4,
    ovulation: 4.5,
    luteal: 3,
  };
  
  // Adjust based on estrogen and progesterone balance
  const hormoneBalance = (hormones.estrogen - hormones.progesterone) / 100;
  const adjustedMood = baseMood[phase] + hormoneBalance;
  
  return Math.max(1, Math.min(5, Math.round(adjustedMood)));
};

/**
 * Calculate predicted focus level (1-5 scale)
 */
const calculatePredictedFocus = (phase: CyclePhaseName, hormones: HormoneLevels): number => {
  const baseFocus: Record<CyclePhaseName, number> = {
    menstrual: 2,
    follicular: 4.5,
    ovulation: 4,
    luteal: 3,
  };
  
  return Math.round(baseFocus[phase]);
};

/**
 * Calculate predicted strength level (1-5 scale)
 */
const calculatePredictedStrength = (phase: CyclePhaseName, hormones: HormoneLevels): number => {
  const baseStrength: Record<CyclePhaseName, number> = {
    menstrual: 2,
    follicular: 4,
    ovulation: 3.5,
    luteal: 3,
  };
  
  // Testosterone slightly affects strength
  const testosteroneFactor = (hormones.testosterone - 25) / 75;
  const adjustedStrength = baseStrength[phase] + testosteroneFactor * 0.5;
  
  return Math.max(1, Math.min(5, Math.round(adjustedStrength)));
};

/**
 * Calculate predicted libido level (1-5 scale)
 */
const calculatePredictedLibido = (phase: CyclePhaseName, hormones: HormoneLevels): number => {
  const baseLibido: Record<CyclePhaseName, number> = {
    menstrual: 2,
    follicular: 3,
    ovulation: 5,
    luteal: 2.5,
  };
  
  // Testosterone is the primary driver of libido
  const testosteroneFactor = (hormones.testosterone - 25) / 75;
  const adjustedLibido = baseLibido[phase] + testosteroneFactor;
  
  return Math.max(1, Math.min(5, Math.round(adjustedLibido)));
};

/**
 * Generate a human-readable hormonal summary
 */
const generateHormonalSummary = (phase: CyclePhaseName, hormones: HormoneLevels): string => {
  const summaries: Record<CyclePhaseName, string> = {
    menstrual: `Estrogen and progesterone are at their lowest levels. Your body is shedding the uterine lining. Energy may be lower, but this is a good time for rest and reflection.`,
    follicular: `Estrogen is rising, boosting your energy, mood, and cognitive function. Testosterone is also increasing, enhancing motivation and libido. A great time for new projects and social activities.`,
    ovulation: `Estrogen peaks and LH surges, triggering egg release. This is your most fertile window. You may feel confident, energetic, and socially magnetic. Some experience mild ovulation pain.`,
    luteal: `Progesterone rises to prepare the uterus for potential pregnancy. You may feel more introspective and need more rest. If pregnancy doesn't occur, hormones will drop toward the end of this phase.`,
  };
  
  return summaries[phase];
};

/**
 * Get 7-day forecast with predictions
 */
export const get7DayForecast = (): ForecastDay[] => {
  const cycleData = getCycleData();
  const cycleLength = cycleData.averageCycleLength || 28;
  const currentCycleDay = getCurrentCycleDay(cycleLength);
  const today = new Date();
  
  const forecast: ForecastDay[] = [];
  
  for (let i = 0; i < 7; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    const forecastCycleDay = ((currentCycleDay + i - 1) % cycleLength) + 1;
    const phase = determinePhaseForDay(forecastCycleDay, cycleLength, cycleData.averagePeriodLength || 5);
    const hormones = estimateHormoneLevels(forecastCycleDay, cycleLength);
    
    const predictedEnergy = calculatePredictedEnergy(phase, hormones);
    const predictedMood = calculatePredictedMood(phase, hormones);
    const keyFlags = generateKeyFlags(phase, forecastCycleDay, cycleLength);
    
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      cycleDay: forecastCycleDay,
      phase,
      predictedEnergy,
      predictedMood,
      keyFlags,
    });
  }
  
  return forecast;
};

/**
 * Determine phase for a specific cycle day
 */
const determinePhaseForDay = (cycleDay: number, cycleLength: number, periodLength: number): CyclePhaseName => {
  const ovulationDay = cycleLength - 14;
  
  if (cycleDay <= periodLength) return 'menstrual';
  if (cycleDay <= ovulationDay - 2) return 'follicular';
  if (cycleDay <= ovulationDay + 1) return 'ovulation';
  return 'luteal';
};

/**
 * Generate key flags for forecast day
 */
const generateKeyFlags = (phase: CyclePhaseName, cycleDay: number, cycleLength: number): string[] => {
  const flags: string[] = [];
  
  if (phase === 'ovulation') flags.push('Peak Fertility');
  if (phase === 'menstrual' && cycleDay === 1) flags.push('Period Start');
  if (phase === 'luteal' && cycleDay === cycleLength) flags.push('Cycle End');
  if (phase === 'luteal' && cycleDay >= cycleLength - 3) flags.push('PMS Window');
  if (cycleDay >= 12 && cycleDay <= 16) flags.push('High Energy');
  
  return flags;
};

// ============================================================================
// Phase Recommendations
// ============================================================================

/**
 * Get evidence-based recommendations for each cycle phase
 */
export const getPhaseRecommendations = (phase: CyclePhaseName): PhaseRecommendation => {
  const recommendations: Record<CyclePhaseName, PhaseRecommendation> = {
    menstrual: {
      nutrition: [
        'Increase iron-rich foods: spinach, lentils, red meat, fortified cereals',
        'Add vitamin C to enhance iron absorption: citrus fruits, bell peppers',
        'Stay hydrated with warm herbal teas: ginger, chamomile, raspberry leaf',
        'Reduce salt to minimize bloating',
        'Include magnesium-rich foods: dark chocolate, nuts, bananas',
      ],
      exercise: [
        'Gentle yoga and stretching to ease cramps',
        'Light walking to boost circulation',
        'Restorative poses: child\'s pose, legs up the wall',
        'Avoid high-intensity workouts if experiencing fatigue',
        'Swimming can be soothing if comfortable',
      ],
      skincare: [
        'Focus on hydration: hyaluronic acid, gentle moisturizers',
        'Use calming ingredients: centella asiatica, aloe vera',
        'Avoid introducing new active ingredients',
        'Gentle cleansing to avoid stripping natural oils',
        'Warm compresses for acne if present',
      ],
      rest: [
        'Prioritize 8-9 hours of sleep',
        'Take short naps if needed',
        'Practice gentle breathing exercises',
        'Limit caffeine after 2 PM',
        'Create a relaxing bedtime routine',
      ],
      general: [
        'Listen to your body and rest when needed',
        'Use a heating pad for cramps',
        'Track your flow and symptoms',
        'Practice self-compassion',
        'Consider light massage for lower back',
      ],
    },
    follicular: {
      nutrition: [
        'Focus on fresh, light foods: salads, smoothies, lean proteins',
        'Include fermented foods for gut health: kimchi, yogurt, kefir',
        'Eat sprouted grains and seeds for energy',
        'Add omega-3 rich foods: salmon, chia seeds, walnuts',
        'Experiment with new healthy recipes',
      ],
      exercise: [
        'High-intensity interval training (HIIT)',
        'Try new workout classes or routines',
        'Strength training to build muscle',
        'Cardio activities: running, cycling, dancing',
        'Group sports and competitive activities',
      ],
      skincare: [
        'Introduce active ingredients: vitamin C, niacinamide',
        'Exfoliate gently 1-2 times per week',
        'Your skin is more resilient now',
        'Focus on brightening and evening tone',
        'Don\'t forget SPF daily',
      ],
      rest: [
        'You may need less sleep - aim for 7-8 hours',
        'Morning routines are easier to maintain',
        'Use this energy for productive mornings',
        'Meditation and mindfulness practices',
        'Social activities in the evening',
      ],
      general: [
        'Start new projects and set goals',
        'Socialize and network',
        'Learn new skills',
        'Plan and organize',
        'Your creativity is peaking - use it!',
      ],
    },
    ovulation: {
      nutrition: [
        'Anti-inflammatory foods: berries, fatty fish, leafy greens',
        'Support liver health: cruciferous vegetables, beets',
        'Stay well-hydrated',
        'Include zinc-rich foods: pumpkin seeds, oysters, chickpeas',
        'Antioxidant-rich foods for egg health',
      ],
      exercise: [
        'Continue high-intensity workouts',
        'Pilates and core strengthening',
        'Dance and expressive movement',
        'Team sports',
        'Your coordination is at its best',
      ],
      skincare: [
        'Maintain your routine but watch for changes',
        'Some experience ovulation glow',
        'Others may get hormonal breakouts',
        'Keep skin clean and balanced',
        'Lightweight moisturizers work well',
      ],
      rest: [
        'Energy is high but rest is still important',
        '7-8 hours of quality sleep',
        'Active recovery days',
        'Social connection fulfills you now',
        'Evening wind-down still matters',
      ],
      general: [
        'Peak communication skills - have important conversations',
        'Schedule presentations or performances',
        'Your intuition is strong',
        'Fertility is highest if trying to conceive',
        'Use protection if avoiding pregnancy',
      ],
    },
    luteal: {
      nutrition: [
        'Complex carbs to support mood: sweet potatoes, quinoa, oats',
        'Increase tryptophan for serotonin: turkey, eggs, pumpkin seeds',
        'Calcium-rich foods may reduce PMS: dairy, fortified plant milk',
        'Limit caffeine and alcohol',
        'Small, frequent meals to manage blood sugar',
      ],
      exercise: [
        'Moderate intensity: brisk walking, light jogging',
        'Strength training with adequate recovery',
        'Yoga for PMS relief',
        'Swimming for low-impact cardio',
        'Listen to your body - scale back if needed',
      ],
      skincare: [
        'Prevent hormonal acne: salicylic acid, benzoyl peroxide',
        'Don\'t pick at emerging breakouts',
        'Oil-absorbing masks if needed',
        'Continue gentle cleansing',
        'Spot treat as needed',
      ],
      rest: [
        'Prioritize 8+ hours of sleep',
        'Create a calming evening routine',
        'Reduce screen time before bed',
        'Practice stress-reduction techniques',
        'Allow yourself extra rest days',
      ],
      general: [
        'Complete ongoing projects rather than starting new ones',
        'Practice self-care rituals',
        'Journaling and reflection',
        'Set boundaries - it\'s okay to say no',
        'Prepare for your next cycle',
      ],
    },
  };
  
  return recommendations[phase];
};

// ============================================================================
// PCOS Risk Engine
// ============================================================================

/**
 * Calculate PCOS risk based on cycle patterns and symptoms
 * Analyzes last 3-6 cycles for indicators
 */
export const calculatePCOSRisk = (): PCOSRiskAssessment => {
  const cycleData = getCycleData();
  const hormonalData = getHormonalData();
  const dailyLogs = hormonalData.dailyLogs;
  
  const indicators: PCOSIndicator[] = [];
  let score = 0;
  
  // Get last 6 cycles for analysis
  const sortedLogs = [...cycleData.logs].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  // Calculate cycle lengths
  const cycleLengths: number[] = [];
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevStart = new Date(sortedLogs[i - 1].startDate);
    const currStart = new Date(sortedLogs[i].startDate);
    const cycleLength = Math.round(
      (currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (cycleLength >= 21 && cycleLength <= 90) {
      cycleLengths.push(cycleLength);
    }
  }
  
  // Indicator 1: Cycle length > 35 days
  const longCycles = cycleLengths.filter(cl => cl > 35);
  const hasLongCycles = longCycles.length >= 2;
  indicators.push({
    name: 'Long menstrual cycles (>35 days)',
    detected: hasLongCycles,
    evidence: hasLongCycles 
      ? `${longCycles.length} cycles longer than 35 days detected` 
      : 'No long cycles detected',
  });
  if (hasLongCycles) score++;
  
  // Indicator 2: Cycle length < 21 days
  const shortCycles = cycleLengths.filter(cl => cl < 21);
  const hasShortCycles = shortCycles.length >= 2;
  indicators.push({
    name: 'Short menstrual cycles (<21 days)',
    detected: hasShortCycles,
    evidence: hasShortCycles 
      ? `${shortCycles.length} cycles shorter than 21 days detected` 
      : 'No short cycles detected',
  });
  if (hasShortCycles) score++;
  
  // Indicator 3: High cycle variance (>7 days)
  const cycleVariance = calculateVariance(cycleLengths);
  const hasHighVariance = cycleVariance > 49; // variance > 49 means std dev > 7
  indicators.push({
    name: 'Irregular cycle length (variance >7 days)',
    detected: hasHighVariance,
    evidence: hasHighVariance 
      ? `Cycle length variance: ${Math.round(cycleVariance)} days²` 
      : `Cycle length variance: ${Math.round(cycleVariance)} days² (normal)`,
  });
  if (hasHighVariance) score++;
  
  // Indicator 4: Jawline acne (androgen excess sign)
  const acneLogs = dailyLogs.filter(log => 
    log.skinCondition === 'moderate' || log.skinCondition === 'severe'
  );
  const hasPersistentAcne = acneLogs.length >= 5;
  indicators.push({
    name: 'Persistent acne (possible androgen excess)',
    detected: hasPersistentAcne,
    evidence: hasPersistentAcne 
      ? `${acneLogs.length} days with moderate/severe skin issues logged` 
      : 'No persistent acne pattern detected',
    dates: acneLogs.slice(0, 5).map(l => l.date),
  });
  if (hasPersistentAcne) score++;
  
  // Indicator 5: Fatigue not explained by other factors
  const fatigueLogs = dailyLogs.filter(log => log.energy <= 2);
  const hasChronicFatigue = fatigueLogs.length >= 10;
  indicators.push({
    name: 'Chronic fatigue (low energy logged frequently)',
    detected: hasChronicFatigue,
    evidence: hasChronicFatigue 
      ? `${fatigueLogs.length} days with low energy (≤2/5) logged` 
      : 'No chronic fatigue pattern detected',
  });
  if (hasChronicFatigue) score++;
  
  // Indicator 6: Bloating
  const bloatingLogs = dailyLogs.filter(log => log.bloating === 'moderate' || log.bloating === 'severe');
  const hasPersistentBloating = bloatingLogs.length >= 7;
  indicators.push({
    name: 'Persistent bloating',
    detected: hasPersistentBloating,
    evidence: hasPersistentBloating 
      ? `${bloatingLogs.length} days with moderate/severe bloating` 
      : 'No persistent bloating detected',
  });
  if (hasPersistentBloating) score++;
  
  // Indicator 7: Non-cyclical mood instability
  const moodLogs = dailyLogs.filter(log => 
    log.mood === 'bad' || log.mood === 'terrible'
  );
  // Check if mood issues occur outside luteal phase
  const nonLutealMoodIssues = moodLogs.filter(log => log.phase !== 'luteal');
  const hasNonCyclicalMoodIssues = nonLutealMoodIssues.length >= 5;
  indicators.push({
    name: 'Non-cyclical mood instability',
    detected: hasNonCyclicalMoodIssues,
    evidence: hasNonCyclicalMoodIssues 
      ? `${nonLutealMoodIssues.length} low mood entries outside luteal phase` 
      : 'Mood patterns appear cyclical',
  });
  if (hasNonCyclicalMoodIssues) score++;
  
  // Indicator 8: Weight gain pattern (if tracked in notes)
  const weightMentionLogs = dailyLogs.filter(log => 
    log.notes.toLowerCase().includes('weight') || 
    log.notes.toLowerCase().includes('gain')
  );
  const mentionsWeightGain = weightMentionLogs.length >= 3;
  indicators.push({
    name: 'Weight concerns mentioned',
    detected: mentionsWeightGain,
    evidence: mentionsWeightGain 
      ? 'Weight gain mentioned in notes' 
      : 'No weight concerns noted',
  });
  if (mentionsWeightGain) score++;
  
  // Indicator 9: Hair concerns (if tracked in notes)
  const hairMentionLogs = dailyLogs.filter(log => 
    log.notes.toLowerCase().includes('hair') || 
    log.notes.toLowerCase().includes('hirsutism')
  );
  const mentionsHairIssues = hairMentionLogs.length >= 2;
  indicators.push({
    name: 'Hair-related concerns',
    detected: mentionsHairIssues,
    evidence: mentionsHairIssues 
      ? 'Hair concerns mentioned in notes' 
      : 'No hair concerns noted',
  });
  if (mentionsHairIssues) score++;
  
  // Determine risk level
  let riskLevel: RiskLevel;
  if (score >= 6) riskLevel = 'high';
  else if (score >= 4) riskLevel = 'moderate';
  else if (score >= 2) riskLevel = 'low';
  else riskLevel = 'low';
  
  // Generate recommendation
  let recommendation: string;
  if (riskLevel === 'high') {
    recommendation = 'Multiple PCOS indicators detected. We strongly recommend consulting an endocrinologist or gynecologist for evaluation. Early diagnosis and management can prevent long-term complications.';
  } else if (riskLevel === 'moderate') {
    recommendation = 'Some PCOS indicators are present. Consider discussing these findings with your healthcare provider. Lifestyle modifications may help manage symptoms.';
  } else {
    recommendation = 'Few PCOS indicators detected. Continue monitoring your cycles and symptoms. Maintain a healthy lifestyle with regular exercise and balanced nutrition.';
  }
  
  return {
    score,
    totalIndicators: 9,
    indicators,
    riskLevel,
    cyclesAnalyzed: cycleLengths.length,
    recommendation,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Calculate variance of an array of numbers
 */
const calculateVariance = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
};

// ============================================================================
// Pain & Endometriosis Analysis
// ============================================================================

/**
 * Analyze pain entries for endometriosis red flags
 */
export const analyzeEndometriosisRisk = (): EndometriosisFlag[] => {
  const painEntries = getPainEntries();
  const flags: EndometriosisFlag[] = [];
  
  if (painEntries.length === 0) return flags;
  
  // Sort by date
  const sortedEntries = [...painEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Flag 1: Severe pain (>7/10) consistently
  const severePainEntries = sortedEntries.filter(e => e.painLevel > 7);
  if (severePainEntries.length >= 3) {
    flags.push({
      flagType: 'Severe Pain Pattern',
      severity: 'high',
      evidencePoints: severePainEntries.slice(-5).map(e => ({
        date: e.date,
        detail: `Pain level ${e.painLevel}/10, locations: ${e.locations.join(', ')}`,
      })),
      recommendation: 'Consistent severe pain (>7/10) may indicate endometriosis. Consider consulting a gynecologist specializing in pelvic pain.',
      consecutivePainkillerDays: countConsecutivePainkillerUse(sortedEntries),
    });
  }
  
  // Flag 2: Pain lasting >3 days
  const longDurationEntries = sortedEntries.filter(e => e.durationHours > 72);
  if (longDurationEntries.length >= 2) {
    flags.push({
      flagType: 'Prolonged Pain Episodes',
      severity: 'moderate',
      evidencePoints: longDurationEntries.slice(-3).map(e => ({
        date: e.date,
        detail: `Pain lasted ${Math.round(e.durationHours / 24)} days`,
      })),
      recommendation: 'Pain episodes lasting more than 3 days warrant medical evaluation.',
      consecutivePainkillerDays: countConsecutivePainkillerUse(sortedEntries),
    });
  }
  
  // Flag 3: Pain preventing activities
  const activityPreventingEntries = sortedEntries.filter(e => e.preventsActivities);
  if (activityPreventingEntries.length >= 3) {
    flags.push({
      flagType: 'Activity-Limiting Pain',
      severity: 'high',
      evidencePoints: activityPreventingEntries.slice(-5).map(e => ({
        date: e.date,
        detail: `Pain prevented daily activities`,
      })),
      recommendation: 'Pain that prevents normal activities is a red flag for endometriosis.',
      consecutivePainkillerDays: countConsecutivePainkillerUse(sortedEntries),
    });
  }
  
  // Flag 4: Pain during bowel movements
  const bowelPainEntries = sortedEntries.filter(e => e.duringBowelMovement);
  if (bowelPainEntries.length >= 2) {
    flags.push({
      flagType: 'Pain During Bowel Movements',
      severity: 'high',
      evidencePoints: bowelPainEntries.slice(-3).map(e => ({
        date: e.date,
        detail: 'Pain reported during bowel movement',
      })),
      recommendation: 'Pain during bowel movements, especially during menstruation, is a classic sign of endometriosis.',
      consecutivePainkillerDays: countConsecutivePainkillerUse(sortedEntries),
    });
  }
  
  // Flag 5: Pain radiating to legs/back
  const radiatingPainEntries = sortedEntries.filter(
    e => e.radiatesTo.some(loc => loc.toLowerCase().includes('leg') || loc.toLowerCase().includes('back'))
  );
  if (radiatingPainEntries.length >= 2) {
    flags.push({
      flagType: 'Radiating Pain',
      severity: 'moderate',
      evidencePoints: radiatingPainEntries.slice(-3).map(e => ({
        date: e.date,
        detail: `Pain radiates to: ${e.radiatesTo.join(', ')}`,
      })),
      recommendation: 'Pain that radiates to legs or back may indicate deep infiltrating endometriosis.',
      consecutivePainkillerDays: countConsecutivePainkillerUse(sortedEntries),
    });
  }
  
  return flags;
};

/**
 * Count consecutive days of painkiller use
 */
const countConsecutivePainkillerUse = (entries: PainEntry[]): number => {
  if (entries.length === 0) return 0;
  
  // Sort by date descending
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let consecutiveDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const entry of sorted) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor(
      (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (dayDiff === consecutiveDays && entry.medicationTaken.length > 0) {
      consecutiveDays++;
      currentDate = entryDate;
    } else if (dayDiff > consecutiveDays) {
      break;
    }
  }
  
  return consecutiveDays;
};

// ============================================================================
// Mood Pattern Analysis
// ============================================================================

/**
 * Analyze mood patterns to classify as cyclical vs persistent
 * Requires at least 2 cycles of data
 */
export const analyzeMoodPatterns = (): MoodPatternAnalysis => {
  const hormonalData = getHormonalData();
  const dailyLogs = hormonalData.dailyLogs;
  const cycleData = getCycleData();
  
  // Need at least 2 cycles worth of mood data
  const moodLogs = dailyLogs.filter(log => 
    log.mood && log.energy !== undefined && log.anxiety !== undefined
  );
  
  if (moodLogs.length < 14) {
    return {
      patternType: 'insufficient_data',
      cyclesAnalyzed: 0,
      lutealPhaseMoodDrop: false,
      averageMoodByPhase: { menstrual: 0, follicular: 0, ovulation: 0, luteal: 0 },
      pmddLikelihood: 'low',
      description: 'Insufficient mood data. Log your mood daily for at least 2 cycles to see pattern analysis.',
      chartData: [],
    };
  }
  
  // Calculate average mood by phase
  const phaseMoods: Record<CyclePhaseName, number[]> = {
    menstrual: [],
    follicular: [],
    ovulation: [],
    luteal: [],
  };
  
  const phaseEnergies: Record<CyclePhaseName, number[]> = {
    menstrual: [],
    follicular: [],
    ovulation: [],
    luteal: [],
  };
  
  const phaseAnxiety: Record<CyclePhaseName, number[]> = {
    menstrual: [],
    follicular: [],
    ovulation: [],
    luteal: [],
  };
  
  // Convert mood to numeric score
  const moodScores: Record<MoodLevel, number> = {
    great: 5,
    good: 4,
    neutral: 3,
    bad: 2,
    terrible: 1,
  };
  
  moodLogs.forEach(log => {
    const moodScore = moodScores[log.mood];
    phaseMoods[log.phase].push(moodScore);
    phaseEnergies[log.phase].push(log.energy);
    phaseAnxiety[log.phase].push(log.anxiety);
  });
  
  // Calculate averages
  const averageMoodByPhase: Record<CyclePhaseName, number> = {
    menstrual: average(phaseMoods.menstrual),
    follicular: average(phaseMoods.follicular),
    ovulation: average(phaseMoods.ovulation),
    luteal: average(phaseMoods.luteal),
  };
  
  // Determine if there's a luteal phase mood drop
  const lutealMood = averageMoodByPhase.luteal;
  const follicularMood = averageMoodByPhase.follicular;
  const lutealPhaseMoodDrop = lutealMood > 0 && follicularMood > 0 && lutealMood < follicularMood - 0.5;
  
  // Determine pattern type
  let patternType: 'cyclical' | 'persistent' | 'insufficient_data';
  let description: string;
  
  const moodVariance = calculateVariance(Object.values(averageMoodByPhase).filter(v => v > 0));
  
  if (moodVariance < 0.25) {
    patternType = 'persistent';
    description = 'Your mood appears relatively stable across cycle phases. This suggests your emotional well-being is not strongly tied to hormonal fluctuations.';
  } else if (lutealPhaseMoodDrop) {
    patternType = 'cyclical';
    description = 'Your mood shows a cyclical pattern with lower mood during the luteal phase. This is common and may indicate PMS. Track for more cycles to assess PMDD risk.';
  } else {
    patternType = 'cyclical';
    description = 'Your mood varies with your cycle but not in a typical PMS pattern. This is still considered cyclical variation.';
  }
  
  // Assess PMDD likelihood
  let pmddLikelihood: RiskLevel = 'low';
  if (lutealPhaseMoodDrop) {
    const lutealLowMoodCount = moodLogs.filter(
      log => log.phase === 'luteal' && (log.mood === 'bad' || log.mood === 'terrible')
    ).length;
    const lutealTotalCount = phaseMoods.luteal.length;
    
    if (lutealTotalCount > 0 && lutealLowMoodCount / lutealTotalCount > 0.5) {
      pmddLikelihood = 'high';
    } else if (lutealTotalCount > 0 && lutealLowMoodCount / lutealTotalCount > 0.3) {
      pmddLikelihood = 'moderate';
    }
  }
  
  // Generate chart data
  const chartData = moodLogs
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(log => ({
      cycleDay: log.cycleDay,
      mood: moodScores[log.mood],
      energy: log.energy,
      anxiety: log.anxiety,
      phase: log.phase,
    }));
  
  // Estimate cycles analyzed
  const cyclesAnalyzed = Math.floor(moodLogs.length / (cycleData.averageCycleLength || 28));
  
  return {
    patternType,
    cyclesAnalyzed: Math.max(1, cyclesAnalyzed),
    lutealPhaseMoodDrop,
    averageMoodByPhase,
    pmddLikelihood,
    description,
    chartData,
  };
};

/**
 * Calculate average of an array
 */
const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

// ============================================================================
// Skin Predictor
// ============================================================================

/**
 * Predict skin condition and breakout window based on cycle day
 * Testosterone spike around day 12-14 causes breakouts 3-5 days later
 */
export const predictSkinCondition = (): SkinPrediction => {
  const cycleData = getCycleData();
  const cycleLength = cycleData.averageCycleLength || 28;
  const currentDay = getCurrentCycleDay(cycleLength);
  
  // Testosterone spike typically occurs around ovulation (cycleLength - 14)
  const ovulationDay = cycleLength - 14;
  const testosteroneSpikeStart = ovulationDay - 2;
  const testosteroneSpikeEnd = ovulationDay + 1;
  
  // Breakouts appear 3-5 days after testosterone spike
  const breakoutWindowStart = testosteroneSpikeStart + 3;
  const breakoutWindowEnd = testosteroneSpikeEnd + 5;
  
  // Calculate days until breakout window
  let daysUntilBreakout: number;
  if (currentDay < breakoutWindowStart) {
    daysUntilBreakout = breakoutWindowStart - currentDay;
  } else if (currentDay > breakoutWindowEnd) {
    // Next cycle's breakout window
    daysUntilBreakout = (cycleLength - currentDay) + breakoutWindowStart;
  } else {
    daysUntilBreakout = 0; // Currently in breakout window
  }
  
  // Determine predicted severity based on phase
  let predictedSeverity: SeverityLevel;
  if (currentDay >= breakoutWindowStart && currentDay <= breakoutWindowEnd) {
    predictedSeverity = 'moderate';
  } else if (currentDay <= 5) {
    predictedSeverity = 'mild'; // Menstrual phase often clears skin
  } else if (currentDay >= cycleLength - 7) {
    predictedSeverity = 'moderate'; // Pre-menstrual
  } else {
    predictedSeverity = 'none';
  }
  
  // Proactive steps
  const proactiveSteps: string[] = [
    'Start using salicylic acid cleanser 2-3 days before predicted breakout',
    'Avoid introducing new skincare products during high-risk windows',
    'Keep pillowcases clean (change every 2-3 days)',
    'Stay hydrated and reduce dairy/sugar intake',
    'Don\'t pick or squeeze emerging blemishes',
    'Consider a clay mask during the breakout window',
  ];
  
  // Current phase skincare advice
  const phase = determinePhaseForDay(currentDay, cycleLength, cycleData.averagePeriodLength || 5);
  const currentPhaseSkincareAdvice = getPhaseRecommendations(phase).skincare;
  
  return {
    currentDay,
    breakoutWindowStart,
    breakoutWindowEnd,
    daysUntilBreakout,
    predictedSeverity,
    proactiveSteps,
    currentPhaseSkincareAdvice,
  };
};

// ============================================================================
// Glucose-Cycle Correlation
// ============================================================================

/**
 * Correlate glucose readings with cycle phases
 * Identifies late-luteal insulin resistance pattern
 */
export const getGlucoseCycleCorrelation = (): CycleGlucoseCorrelation[] => {
  const glucoseReadings = getAllGlucoseReadings();
  const cycleData = getCycleData();
  const cycleLength = cycleData.averageCycleLength || 28;
  
  if (glucoseReadings.length === 0) return [];
  
  // Map readings to cycle days
  const lastPeriodStart = getLastPeriodStart();
  if (!lastPeriodStart) return [];
  
  const correlations: CycleGlucoseCorrelation[] = [];
  
  // Group readings by cycle day
  const readingsByCycleDay: Record<number, GlucoseReading[]> = {};
  
  glucoseReadings.forEach(reading => {
    const readingDate = new Date(reading.timestamp);
    const daysSincePeriodStart = Math.floor(
      (readingDate.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Handle multiple cycles
    const cycleDay = ((daysSincePeriodStart % cycleLength) + cycleLength) % cycleLength + 1;
    
    if (!readingsByCycleDay[cycleDay]) {
      readingsByCycleDay[cycleDay] = [];
    }
    readingsByCycleDay[cycleDay].push(reading);
  });
  
  // Calculate averages for each cycle day
  const allFastingValues: number[] = [];
  const allPostMealValues: number[] = [];
  
  Object.values(readingsByCycleDay).forEach(readings => {
    readings.forEach(r => {
      if (r.fasting) allFastingValues.push(r.fasting);
      if (r.postMeal) allPostMealValues.push(r.postMeal);
    });
  });
  
  const overallAvgFasting = average(allFastingValues) || 100;
  const overallAvgPostMeal = average(allPostMealValues) || 140;
  
  Object.entries(readingsByCycleDay).forEach(([cycleDayStr, readings]) => {
    const cycleDay = parseInt(cycleDayStr);
    const phase = determinePhaseForDay(cycleDay, cycleLength, cycleData.averagePeriodLength || 5);
    
    const fastingValues = readings.filter(r => r.fasting).map(r => r.fasting!);
    const postMealValues = readings.filter(r => r.postMeal).map(r => r.postMeal!);
    
    const avgGlucoseFasting = average(fastingValues) || 0;
    const avgGlucosePostMeal = average(postMealValues) || 0;
    
    // Calculate deviation from overall average
    const fastingDeviation = avgGlucoseFasting - overallAvgFasting;
    const postMealDeviation = avgGlucosePostMeal - overallAvgPostMeal;
    const glucoseDeviation = (fastingDeviation + postMealDeviation) / 2;
    
    // Assess insulin resistance risk
    let insulinResistanceRisk: 'normal' | 'elevated' | 'high' = 'normal';
    if (phase === 'luteal' && cycleDay >= cycleLength - 7) {
      // Late luteal phase - higher glucose is common due to progesterone
      if (avgGlucoseFasting > 110 || avgGlucosePostMeal > 160) {
        insulinResistanceRisk = 'elevated';
      }
      if (avgGlucoseFasting > 126 || avgGlucosePostMeal > 200) {
        insulinResistanceRisk = 'high';
      }
    }
    
    correlations.push({
      cycleDay,
      phase,
      avgGlucoseFasting: Math.round(avgGlucoseFasting) || 0,
      avgGlucosePostMeal: Math.round(avgGlucosePostMeal) || 0,
      glucoseDeviation: Math.round(glucoseDeviation * 10) / 10,
      insulinResistanceRisk,
    });
  });
  
  // Sort by cycle day
  return correlations.sort((a, b) => a.cycleDay - b.cycleDay);
};

/**
 * Get proactive alert if approaching high-glucose phase
 */
export const getGlucosePhaseAlert = (): { daysUntil: number; message: string } | null => {
  const cycleData = getCycleData();
  const cycleLength = cycleData.averageCycleLength || 28;
  const currentDay = getCurrentCycleDay(cycleLength);
  
  // High glucose risk typically starts 7 days before period (late luteal)
  const highGlucosePhaseStart = cycleLength - 7;
  
  if (currentDay >= highGlucosePhaseStart && currentDay <= cycleLength) {
    return {
      daysUntil: 0,
      message: 'You are currently in the late luteal phase when insulin resistance may be elevated. Monitor glucose more frequently and consider reducing carbohydrate intake.',
    };
  }
  
  const daysUntil = highGlucosePhaseStart - currentDay;
  if (daysUntil > 0 && daysUntil <= 3) {
    return {
      daysUntil,
      message: `Your late luteal phase (high glucose risk) begins in ${daysUntil} day${daysUntil === 1 ? '' : 's'}. Consider preparing by planning lower-carb meals and scheduling glucose checks.`,
    };
  }
  
  return null;
};

// ============================================================================
// Fertility Window
// ============================================================================

/**
 * Calculate fertility window using multiple methods
 */
export const calculateFertilityWindow = (): FertilityWindow => {
  const cycleData = getCycleData();
  const hormonalData = getHormonalData();
  const cycleLength = cycleData.averageCycleLength || 28;
  
  // Get last period start
  const lastPeriodStart = getLastPeriodStart();
  if (!lastPeriodStart) {
    return {
      fertileStart: '',
      fertileEnd: '',
      ovulationDate: '',
      confidence: 0,
      method: 'calendar',
    };
  }
  
  // Calendar method
  const ovulationDay = cycleLength - 14;
  const ovulationDate = new Date(lastPeriodStart);
  ovulationDate.setDate(lastPeriodStart.getDate() + ovulationDay);
  
  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(ovulationDate.getDate() - 5);
  
  const fertileEnd = new Date(ovulationDate);
  fertileEnd.setDate(ovulationDate.getDate() + 1);
  
  // Check for BBT data (basal body temperature)
  const recentLogs = hormonalData.dailyLogs.slice(0, 14);
  const bbtLogs = recentLogs.filter(log => log.basalBodyTemp);
  
  // Check for cervical mucus data
  const mucusLogs = recentLogs.filter(log => 
    log.cervicalMucus === 'watery' || log.cervicalMucus === 'egg-white'
  );
  
  // Determine method and confidence
  let method: string;
  let confidence: number;
  
  if (bbtLogs.length >= 3 && mucusLogs.length >= 1) {
    method = 'combined';
    confidence = 85;
  } else if (bbtLogs.length >= 3) {
    method = 'bbt';
    confidence = 75;
  } else if (mucusLogs.length >= 2) {
    method = 'mucus';
    confidence = 70;
  } else {
    method = 'calendar';
    confidence = 60;
  }
  
  // Adjust confidence based on cycle regularity
  const cycleLengths: number[] = [];
  const sortedLogs = [...cycleData.logs].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevStart = new Date(sortedLogs[i - 1].startDate);
    const currStart = new Date(sortedLogs[i].startDate);
    const cycleLen = Math.round(
      (currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (cycleLen >= 21 && cycleLen <= 45) {
      cycleLengths.push(cycleLen);
    }
  }
  
  if (cycleLengths.length >= 3) {
    const variance = calculateVariance(cycleLengths);
    if (variance < 9) {
      confidence += 10; // Very regular cycles
    } else if (variance > 25) {
      confidence -= 15; // Irregular cycles
    }
  }
  
  return {
    fertileStart: fertileStart.toISOString().split('T')[0],
    fertileEnd: fertileEnd.toISOString().split('T')[0],
    ovulationDate: ovulationDate.toISOString().split('T')[0],
    confidence: Math.min(95, Math.max(40, confidence)),
    method,
  };
};

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate PCOS assessment report
 */
export const generatePCOSReport = (): string => {
  const assessment = calculatePCOSRisk();
  
  let report = `
========================================
PCOS RISK ASSESSMENT REPORT
Generated: ${new Date(assessment.generatedAt).toLocaleString()}
========================================

OVERALL RISK: ${assessment.riskLevel.toUpperCase()}
Score: ${assessment.score}/${assessment.totalIndicators}
Cycles Analyzed: ${assessment.cyclesAnalyzed}

RECOMMENDATION:
${assessment.recommendation}

DETAILED INDICATORS:
----------------------------------------
`;

  assessment.indicators.forEach(indicator => {
    report += `
[${indicator.detected ? '✓' : '○'}] ${indicator.name}
    Status: ${indicator.detected ? 'DETECTED' : 'Not detected'}
    Evidence: ${indicator.evidence}
`;
    if (indicator.dates && indicator.dates.length > 0) {
      report += `    Relevant dates: ${indicator.dates.join(', ')}\n`;
    }
  });

  report += `
========================================
This report is generated based on your tracked cycle and symptom data.
It is not a medical diagnosis. Please consult with a healthcare provider
for proper evaluation and diagnosis.
========================================
`;

  return report;
};

/**
 * Generate mood pattern report for healthcare provider
 */
export const generateMoodReport = (): string => {
  const analysis = analyzeMoodPatterns();
  
  let report = `
========================================
MOOD PATTERN ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
========================================

PATTERN TYPE: ${analysis.patternType.toUpperCase().replace('_', ' ')}
Cycles Analyzed: ${analysis.cyclesAnalyzed}
PMDD Likelihood: ${analysis.pmddLikelihood.toUpperCase()}

DESCRIPTION:
${analysis.description}

LUTEAL PHASE MOOD DROP: ${analysis.lutealPhaseMoodDrop ? 'Yes' : 'No'}

AVERAGE MOOD BY PHASE (1-5 scale):
----------------------------------------
Menstrual:   ${analysis.averageMoodByPhase.menstrual.toFixed(2)}
Follicular:  ${analysis.averageMoodByPhase.follicular.toFixed(2)}
Ovulation:   ${analysis.averageMoodByPhase.ovulation.toFixed(2)}
Luteal:      ${analysis.averageMoodByPhase.luteal.toFixed(2)}

`;

  if (analysis.pmddLikelihood === 'high') {
    report += `
⚠️  PMDD ALERT:
Your mood patterns suggest possible Premenstrual Dysphoric Disorder (PMDD).
This is a serious condition that affects quality of life. Please discuss
with a mental health professional or gynecologist.

Symptoms to discuss:
- Severe mood changes before period
- Impact on daily functioning
- Duration of symptoms (should be 1-2 weeks before period)
- Improvement after period starts
`;
  }

  report += `
========================================
This report is intended for discussion with your healthcare provider.
It is not a diagnostic tool.
========================================
`;

  return report;
};

/**
 * Generate pain/endometriosis referral report
 */
export const generatePainReport = (): string => {
  const flags = analyzeEndometriosisRisk();
  const painEntries = getPainEntries();
  
  let report = `
========================================
PELVIC PAIN ASSESSMENT REPORT
Generated: ${new Date().toLocaleString()}
========================================

Total Pain Entries Logged: ${painEntries.length}

`;

  if (flags.length === 0) {
    report += `
No significant endometriosis risk flags detected based on your pain logs.
Continue monitoring and consult a doctor if pain worsens or changes.
`;
  } else {
    report += `ENDOMETRIOSIS RISK FLAGS DETECTED: ${flags.length}

DETAILED FINDINGS:
----------------------------------------
`;

    flags.forEach((flag, index) => {
      report += `
${index + 1}. ${flag.flagType}
   Severity: ${flag.severity.toUpperCase()}
   Recommendation: ${flag.recommendation}
   
   Evidence:
`;
      flag.evidencePoints.forEach(point => {
        report += `   - ${point.date}: ${point.detail}\n`;
      });
      
      if (flag.consecutivePainkillerDays > 0) {
        report += `   - Consecutive painkiller use: ${flag.consecutivePainkillerDays} days\n`;
      }
    });

    report += `
========================================
REFERRAL RECOMMENDATION:
Based on your logged symptoms, a consultation with a gynecologist
specializing in pelvic pain or endometriosis is recommended.

Consider asking about:
- Pelvic ultrasound
- Assessment for endometriosis
- Pain management options
- Fertility preservation (if applicable)
========================================
`;
  }

  // Add pain summary statistics
  if (painEntries.length > 0) {
    const avgPain = average(painEntries.map(e => e.painLevel));
    const maxPain = Math.max(...painEntries.map(e => e.painLevel));
    const painLocations = new Set(painEntries.flatMap(e => e.locations));
    
    report += `
PAIN SUMMARY:
----------------------------------------
Average Pain Level: ${avgPain.toFixed(1)}/10
Maximum Pain Logged: ${maxPain}/10
Common Pain Locations: ${Array.from(painLocations).join(', ') || 'Not specified'}
`;
  }

  report += `
========================================
This report summarizes your logged pain data and is not a diagnosis.
Please consult with a healthcare provider for proper evaluation.
========================================
`;

  return report;
};
