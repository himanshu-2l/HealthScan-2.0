/**
 * Glucose Prediction Engine
 * Advanced glucose prediction with IOB, carb absorption, and dawn phenomenon modeling
 */

import { getPatientSettings, calculateIOB, getInsulinDoses } from './iobService';
import { getAllGlucoseReadings, GlucoseReading } from './glucoseService';

// ============================================
// Types
// ============================================

export interface PredictionPoint {
  time: string; // ISO date
  predictedGlucose: number;
  confidenceLow: number;
  confidenceHigh: number;
  zone: 'danger_low' | 'low' | 'normal' | 'elevated' | 'high';
}

export interface PredictionInput {
  currentGlucose: number;
  trendDirection: 'rising' | 'falling' | 'stable';
  trendRate?: number; // mg/dL per hour
  activeIOB?: number;
  recentMealCarbs?: number;
  mealTime?: string; // ISO date of last meal
  carbType?: 'fast' | 'medium' | 'slow';
}

export interface PredictionAlert {
  type: 'hypo_risk' | 'hyper_risk' | 'dawn_phenomenon';
  triggerTime: string;
  predictedValue: number;
  message: string;
  actionRequired: string;
}

export interface PredictionResult {
  points: PredictionPoint[];
  alerts: PredictionAlert[];
  dawnPhenomenonDetected: boolean;
  lowestPredicted: number;
  highestPredicted: number;
  timeToLow?: number; // minutes until < 70
  timeToHigh?: number; // minutes until > 180
}

// ============================================
// Constants
// ============================================

const GLUCOSE_THRESHOLDS = {
  DANGER_LOW: 54,
  LOW: 70,
  NORMAL_HIGH: 140,
  ELEVATED: 180,
  HIGH: 250,
};

const CARB_ABSORPTION = {
  fast: { peakMinutes: 30, durationMinutes: 90 },
  medium: { peakMinutes: 60, durationMinutes: 150 },
  slow: { peakMinutes: 90, durationMinutes: 210 },
};

const DAWN_PHENOMENON = {
  startHour: 4,
  endHour: 8,
  minRise: 15,
  maxRise: 30,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get zone classification based on glucose value
 */
const getGlucoseZone = (value: number): PredictionPoint['zone'] => {
  if (value < GLUCOSE_THRESHOLDS.DANGER_LOW) return 'danger_low';
  if (value < GLUCOSE_THRESHOLDS.LOW) return 'low';
  if (value <= GLUCOSE_THRESHOLDS.ELEVATED) return 'normal';
  if (value <= GLUCOSE_THRESHOLDS.HIGH) return 'elevated';
  return 'high';
};

/**
 * Calculate trend effect with decay over time
 * Trend fades as it becomes less reliable over longer periods
 */
const calculateTrendEffect = (
  trendDirection: 'rising' | 'falling' | 'stable',
  trendRate: number | undefined,
  minutesElapsed: number
): number => {
  if (trendDirection === 'stable' || !trendRate) {
    return 0;
  }

  // Convert hourly rate to per-minute
  const perMinuteRate = trendRate / 60;
  
  // Apply decay factor - trend becomes less reliable over time
  // Decay: 1.0 at t=0, 0.5 at t=2hrs, 0.25 at t=4hrs
  const decayFactor = Math.exp(-minutesElapsed / 120);
  
  const direction = trendDirection === 'rising' ? 1 : -1;
  return perMinuteRate * minutesElapsed * direction * decayFactor;
};

/**
 * Calculate insulin effect based on IOB decay
 */
const calculateInsulinEffect = (
  activeIOB: number,
  minutesElapsed: number,
  correctionFactor: number
): number => {
  if (activeIOB <= 0) return 0;

  // IOB decays over time (simplified model)
  // Assume rapid insulin with 4-hour duration
  const durationMinutes = 4 * 60;
  const remainingIOB = activeIOB * Math.max(0, 1 - minutesElapsed / durationMinutes);
  
  // Effect is cumulative drop from insulin action
  // Peak effect is around 75 minutes, then declines
  const peakMinutes = 75;
  const timeSinceDose = minutesElapsed;
  
  let effectFactor: number;
  if (timeSinceDose < peakMinutes) {
    // Rising phase
    effectFactor = timeSinceDose / peakMinutes;
  } else {
    // Declining phase
    effectFactor = Math.max(0, 1 - (timeSinceDose - peakMinutes) / (durationMinutes - peakMinutes));
  }
  
  // Total glucose drop from insulin
  const totalDrop = activeIOB * correctionFactor;
  const currentEffect = totalDrop * effectFactor * 0.5; // Scale factor for gradual effect
  
  return -currentEffect; // Negative because insulin lowers glucose
};

/**
 * Calculate carb absorption effect using gamma distribution-like curve
 */
const calculateCarbEffect = (
  carbs: number,
  carbType: 'fast' | 'medium' | 'slow',
  minutesSinceMeal: number
): number => {
  if (carbs <= 0 || minutesSinceMeal < 0) return 0;

  const { peakMinutes, durationMinutes } = CARB_ABSORPTION[carbType];
  
  // If past absorption window, no more effect
  if (minutesSinceMeal >= durationMinutes) return 0;
  
  // Gamma-like absorption curve
  // Peak at peakMinutes, then decline
  const progress = minutesSinceMeal / durationMinutes;
  const peakProgress = peakMinutes / durationMinutes;
  
  // Shape the curve: rise to peak, then fall
  let absorptionRate: number;
  if (progress <= peakProgress) {
    // Rising phase - use power curve for smooth rise
    absorptionRate = Math.pow(progress / peakProgress, 0.7);
  } else {
    // Falling phase - exponential decay
    const fallProgress = (progress - peakProgress) / (1 - peakProgress);
    absorptionRate = Math.exp(-3 * fallProgress);
  }
  
  // Typical glucose rise: ~4 mg/dL per 10g carbs (simplified)
  const glucoseImpact = (carbs / 10) * 4;
  
  // Apply rate to get incremental effect for this time point
  // This is a simplified model - real carb absorption is complex
  return glucoseImpact * absorptionRate * 0.3; // Scale factor
};

/**
 * Calculate dawn phenomenon effect
 */
const calculateDawnEffect = (
  currentTime: Date,
  minutesElapsed: number
): number => {
  const futureTime = new Date(currentTime.getTime() + minutesElapsed * 60 * 1000);
  const hour = futureTime.getHours();
  
  // Dawn phenomenon occurs between 4-8 AM
  if (hour < DAWN_PHENOMENON.startHour || hour >= DAWN_PHENOMENON.endHour) {
    return 0;
  }
  
  // Progressive rise during dawn hours
  const progressInWindow = (hour - DAWN_PHENOMENON.startHour) / 
    (DAWN_PHENOMENON.endHour - DAWN_PHENOMENON.startHour);
  
  // Rise increases as morning progresses
  const riseAmount = DAWN_PHENOMENON.minRise + 
    (DAWN_PHENOMENON.maxRise - DAWN_PHENOMENON.minRise) * progressInWindow;
  
  return riseAmount / 4; // Distribute over 4 15-min intervals
};

/**
 * Calculate confidence bands - widen over time
 */
const calculateConfidenceBands = (
  predictedValue: number,
  intervalsElapsed: number,
  totalIntervals: number
): { low: number; high: number } => {
  // Base uncertainty: 15%
  // Increases by 5% per hour (4 intervals = 1 hour)
  const uncertainty = 0.15 + (intervalsElapsed / 4) * 0.05;
  const maxUncertainty = 0.35; // Cap at 35%
  const finalUncertainty = Math.min(uncertainty, maxUncertainty);
  
  return {
    low: Math.round(predictedValue * (1 - finalUncertainty)),
    high: Math.round(predictedValue * (1 + finalUncertainty)),
  };
};

// ============================================
// Main Prediction Function
// ============================================

/**
 * Predict glucose trajectory over specified hours
 * Default 4 hours prediction at 15-min intervals
 * 
 * Model: glucose(t) = currentGlucose + trendEffect(t) - insulinEffect(t) + carbEffect(t) + dawnEffect(t)
 */
export const predictGlucose = (
  input: PredictionInput,
  hours: number = 4
): PredictionResult => {
  const settings = getPatientSettings();
  const currentTime = new Date();
  const points: PredictionPoint[] = [];
  const alerts: PredictionAlert[] = [];
  
  const intervals = hours * 4; // 15-minute intervals
  const minutesPerInterval = 15;
  
  // Get active IOB if not provided
  const activeIOB = input.activeIOB ?? calculateIOB(getInsulinDoses());
  
  // Calculate minutes since meal if provided
  const minutesSinceMeal = input.mealTime 
    ? (currentTime.getTime() - new Date(input.mealTime).getTime()) / (1000 * 60)
    : -1;
  
  let lowestPredicted = input.currentGlucose;
  let highestPredicted = input.currentGlucose;
  let timeToLow: number | undefined;
  let timeToHigh: number | undefined;
  
  // Check for dawn phenomenon
  const dawnPhenomenonDetected = detectDawnPhenomenon();
  
  // Generate prediction points
  for (let i = 0; i <= intervals; i++) {
    const minutesElapsed = i * minutesPerInterval;
    const time = new Date(currentTime.getTime() + minutesElapsed * 60 * 1000);
    
    // Calculate each component
    const trendEffect = calculateTrendEffect(
      input.trendDirection,
      input.trendRate,
      minutesElapsed
    );
    
    const insulinEffect = calculateInsulinEffect(
      activeIOB,
      minutesElapsed,
      settings.correctionFactor
    );
    
    const carbEffect = input.recentMealCarbs && input.carbType && minutesSinceMeal >= 0
      ? calculateCarbEffect(
          input.recentMealCarbs,
          input.carbType,
          minutesSinceMeal + minutesElapsed
        )
      : 0;
    
    const dawnEffect = dawnPhenomenonDetected 
      ? calculateDawnEffect(currentTime, minutesElapsed)
      : 0;
    
    // Combine effects
    let predictedGlucose = Math.round(
      input.currentGlucose + trendEffect + insulinEffect + carbEffect + dawnEffect
    );
    
    // Clamp to physiological range
    predictedGlucose = Math.max(40, Math.min(400, predictedGlucose));
    
    // Update min/max tracking
    if (predictedGlucose < lowestPredicted) {
      lowestPredicted = predictedGlucose;
    }
    if (predictedGlucose > highestPredicted) {
      highestPredicted = predictedGlucose;
    }
    
    // Calculate time to low/high
    if (!timeToLow && predictedGlucose < GLUCOSE_THRESHOLDS.LOW) {
      timeToLow = minutesElapsed;
    }
    if (!timeToHigh && predictedGlucose > GLUCOSE_THRESHOLDS.ELEVATED) {
      timeToHigh = minutesElapsed;
    }
    
    // Calculate confidence bands
    const confidence = calculateConfidenceBands(predictedGlucose, i, intervals);
    
    // Create prediction point
    const point: PredictionPoint = {
      time: time.toISOString(),
      predictedGlucose,
      confidenceLow: confidence.low,
      confidenceHigh: confidence.high,
      zone: getGlucoseZone(predictedGlucose),
    };
    
    points.push(point);
    
    // Generate alerts for significant events
    if (i > 0) {
      const prevPoint = points[i - 1];
      
      // Hypo risk alert
      if (predictedGlucose < GLUCOSE_THRESHOLDS.LOW && 
          prevPoint.predictedGlucose >= GLUCOSE_THRESHOLDS.LOW) {
        alerts.push({
          type: 'hypo_risk',
          triggerTime: time.toISOString(),
          predictedValue: predictedGlucose,
          message: `Your sugar may drop to ${predictedGlucose} mg/dL in ${Math.round(minutesElapsed / 60 * 10) / 10} hours`,
          actionRequired: predictedGlucose < GLUCOSE_THRESHOLDS.DANGER_LOW
            ? 'Consume 15g fast-acting carbs immediately and recheck in 15 minutes'
            : 'Eat a small snack now to prevent low blood sugar',
        });
      }
      
      // Hyper risk alert
      if (predictedGlucose > GLUCOSE_THRESHOLDS.ELEVATED && 
          prevPoint.predictedGlucose <= GLUCOSE_THRESHOLDS.ELEVATED) {
        alerts.push({
          type: 'hyper_risk',
          triggerTime: time.toISOString(),
          predictedValue: predictedGlucose,
          message: `Your sugar may rise to ${predictedGlucose} mg/dL in ${Math.round(minutesElapsed / 60 * 10) / 10} hours`,
          actionRequired: 'Consider correction insulin if approved by your healthcare provider',
        });
      }
    }
  }
  
  // Add dawn phenomenon alert if detected and in relevant time window
  if (dawnPhenomenonDetected) {
    const currentHour = currentTime.getHours();
    if (currentHour >= DAWN_PHENOMENON.startHour - 1 && currentHour < DAWN_PHENOMENON.endHour) {
      alerts.push({
        type: 'dawn_phenomenon',
        triggerTime: new Date(currentTime.getTime() + 60 * 60 * 1000).toISOString(),
        predictedValue: input.currentGlucose + 20,
        message: 'Dawn phenomenon may cause natural glucose rise in the morning',
        actionRequired: 'Monitor closely; consider discussing basal insulin adjustment with your doctor',
      });
    }
  }
  
  return {
    points,
    alerts,
    dawnPhenomenonDetected,
    lowestPredicted,
    highestPredicted,
    timeToLow,
    timeToHigh,
  };
};

// ============================================
// Dawn Phenomenon Detection
// ============================================

/**
 * Detect dawn phenomenon from historical readings
 * Looks for consistent 4-8 AM glucose rises
 */
export const detectDawnPhenomenon = (readings?: GlucoseReading[]): boolean => {
  const allReadings = readings || getAllGlucoseReadings();
  
  if (allReadings.length < 7) {
    return false; // Need at least a week of data
  }
  
  // Group readings by date
  const readingsByDate = new Map<string, GlucoseReading[]>();
  
  allReadings.forEach(reading => {
    const date = reading.date;
    if (!readingsByDate.has(date)) {
      readingsByDate.set(date, []);
    }
    readingsByDate.get(date)!.push(reading);
  });
  
  // Check for dawn rises on each day
  let dawnRiseDays = 0;
  let totalValidDays = 0;
  
  readingsByDate.forEach((dayReadings) => {
    // Sort by time
    dayReadings.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Find readings in dawn window (4-8 AM)
    const dawnReadings = dayReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= DAWN_PHENOMENON.startHour && hour < DAWN_PHENOMENON.endHour;
    });
    
    // Find readings before dawn (midnight to 4 AM)
    const preDawnReadings = dayReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 0 && hour < DAWN_PHENOMENON.startHour;
    });
    
    if (dawnReadings.length >= 1 && preDawnReadings.length >= 1) {
      totalValidDays++;
      
      // Compare average glucose
      const dawnAvg = dawnReadings.reduce((sum, r) => 
        sum + (r.fasting || r.postMeal || 0), 0) / dawnReadings.length;
      const preDawnAvg = preDawnReadings.reduce((sum, r) => 
        sum + (r.fasting || r.postMeal || 0), 0) / preDawnReadings.length;
      
      // Check if dawn glucose is significantly higher
      if (dawnAvg > preDawnAvg + DAWN_PHENOMENON.minRise) {
        dawnRiseDays++;
      }
    }
  });
  
  // Dawn phenomenon detected if > 50% of valid days show the pattern
  return totalValidDays >= 3 && dawnRiseDays / totalValidDays > 0.5;
};

// ============================================
// Historical Pattern Analysis
// ============================================

/**
 * Get historical glucose pattern for a specific hour of day
 * Returns average and standard deviation
 */
export const getHistoricalPattern = (
  hourOfDay: number
): { avgGlucose: number; stdDev: number } => {
  const readings = getAllGlucoseReadings();
  
  // Filter readings for the specified hour (±30 minutes)
  const hourReadings = readings.filter(r => {
    const readingHour = new Date(r.timestamp).getHours();
    const readingMinute = new Date(r.timestamp).getMinutes();
    const readingTime = readingHour + readingMinute / 60;
    const targetTime = hourOfDay;
    
    // Within 30 minutes of target hour
    return Math.abs(readingTime - targetTime) <= 0.5;
  });
  
  if (hourReadings.length === 0) {
    return { avgGlucose: 0, stdDev: 0 };
  }
  
  // Extract glucose values
  const values: number[] = [];
  hourReadings.forEach(r => {
    if (r.fasting !== undefined) values.push(r.fasting);
    if (r.postMeal !== undefined) values.push(r.postMeal);
  });
  
  if (values.length === 0) {
    return { avgGlucose: 0, stdDev: 0 };
  }
  
  // Calculate average
  const avgGlucose = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Calculate standard deviation
  const variance = values.reduce((sum, val) => 
    sum + Math.pow(val - avgGlucose, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    avgGlucose: Math.round(avgGlucose),
    stdDev: Math.round(stdDev * 10) / 10,
  };
};

/**
 * Get trend rate from recent readings
 * Calculates mg/dL change per hour
 */
export const getTrendRateFromReadings = (): number | undefined => {
  const readings = getAllGlucoseReadings();
  
  if (readings.length < 2) return undefined;
  
  // Get two most recent readings
  const sorted = [...readings].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const recent = sorted[0];
  const previous = sorted[1];
  
  const recentValue = recent.fasting || recent.postMeal;
  const previousValue = previous.fasting || previous.postMeal;
  
  if (!recentValue || !previousValue) return undefined;
  
  const timeDiffHours = 
    (new Date(recent.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 
    (1000 * 60 * 60);
  
  if (timeDiffHours <= 0) return undefined;
  
  const glucoseDiff = recentValue - previousValue;
  return glucoseDiff / timeDiffHours;
};

/**
 * Get latest glucose reading value
 */
export const getLatestGlucose = (): number | undefined => {
  const readings = getAllGlucoseReadings();
  if (readings.length === 0) return undefined;
  
  const latest = readings[0];
  return latest.fasting || latest.postMeal;
};
