/**
 * Night Safety Service
 * Advanced nighttime glucose safety assessment with predictions and historical analysis
 * Extends the basic assessNightSafety from iobService with more sophisticated logic
 */

import { calculateIOB, getInsulinDoses, getPatientSettings } from './iobService';
import { predictGlucose, PredictionResult, PredictionPoint } from './glucosePredictionService';
import { getAllGlucoseReadings, GlucoseReading } from './glucoseService';
import { saveAlert } from './earlyWarningService';

// ============================================
// Types
// ============================================

export interface NightSafetyResult {
  currentGlucose: number;
  currentIOB: number;
  predicted3AMGlucose: number;
  predictedLowestGlucose: number;
  predictedLowestTime: string;
  riskLevel: 'safe' | 'caution' | 'danger';
  recommendation: string;
  snackSuggestion?: string;
  shouldAlertCaregiver: boolean;
  sleepSafetyScore: number; // 0-100
}

export interface NightLowRecord {
  date: string;
  lowestGlucose: number;
  timeOfLow: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface OvernightStats {
  averageDropRate: number; // mg/dL per hour
  totalNightsAnalyzed: number;
  lowNightsCount: number;
  averageBedtimeGlucose: number;
  averageMorningGlucose: number;
}

// ============================================
// Constants
// ============================================

const NIGHT_HOURS = {
  START: 22, // 10 PM
  END: 8,    // 8 AM
};

const GLUCOSE_THRESHOLDS = {
  DANGER_LOW: 70,
  CAUTION_LOW: 90,
  OPTIMAL_MIN: 90,
  OPTIMAL_MAX: 180,
};

const STORAGE_KEY_NIGHT_LOWS = 'healthScan_night_lows';
const STORAGE_KEY_NIGHT_ASSESSMENTS = 'healthScan_night_assessments';

// ============================================
// Main Assessment Function
// ============================================

/**
 * Perform comprehensive night safety assessment
 * Uses glucose prediction engine for 8-hour overnight forecast
 */
export const performNightAssessment = (
  currentGlucose: number,
  bedtime?: Date
): NightSafetyResult => {
  const targetBedtime = bedtime || getDefaultBedtime();
  const settings = getPatientSettings();
  const doses = getInsulinDoses();
  
  // Get current IOB
  const currentIOB = calculateIOB(doses, new Date());
  
  // Determine trend direction based on recent readings
  const trendDirection = determineTrendDirection();
  const trendRate = calculateRecentTrendRate();
  
  // Generate 8-hour prediction for overnight period
  const prediction = predictGlucose(
    {
      currentGlucose,
      trendDirection,
      trendRate,
      activeIOB: currentIOB,
    },
    8 // 8 hours prediction
  );
  
  // Find predicted 3 AM glucose
  const predicted3AMGlucose = findPredictedGlucoseAtTime(prediction, 3);
  
  // Find lowest predicted glucose and its time
  const { lowestGlucose, lowestTime } = findLowestPredictedGlucose(prediction);
  
  // Determine risk level
  const riskLevel = determineRiskLevel(lowestGlucose, currentGlucose, currentIOB);
  
  // Calculate sleep safety score
  const sleepSafetyScore = calculateSleepSafetyScore(
    currentGlucose,
    lowestGlucose,
    currentIOB,
    riskLevel
  );
  
  // Generate recommendation and snack suggestion
  const { recommendation, snackSuggestion } = generateRecommendation(
    riskLevel,
    lowestGlucose,
    currentIOB,
    currentGlucose
  );
  
  // Determine if caregiver should be alerted
  const shouldAlertCaregiver = riskLevel === 'danger';
  
  // Save assessment for historical tracking
  saveNightAssessment({
    timestamp: new Date().toISOString(),
    currentGlucose,
    currentIOB,
    predictedLowestGlucose: lowestGlucose,
    riskLevel,
    sleepSafetyScore,
  });
  
  // Trigger caregiver alert if needed
  if (shouldAlertCaregiver) {
    triggerCaregiverAlert(currentGlucose, lowestGlucose);
  }
  
  return {
    currentGlucose,
    currentIOB: Math.round(currentIOB * 100) / 100,
    predicted3AMGlucose,
    predictedLowestGlucose: lowestGlucose,
    predictedLowestTime: lowestTime,
    riskLevel,
    recommendation,
    snackSuggestion,
    shouldAlertCaregiver,
    sleepSafetyScore,
  };
};

// ============================================
// Overnight Drop Rate Analysis
// ============================================

/**
 * Calculate average overnight glucose drop rate from historical readings
 * Analyzes bedtime vs morning glucose differences
 */
export const getOvernightDropRate = (): number => {
  const readings = getAllGlucoseReadings();
  
  if (readings.length < 14) {
    // Not enough data, return default estimate
    return -15; // Default: 15 mg/dL drop per hour
  }
  
  // Group readings by date
  const readingsByDate = groupReadingsByDate(readings);
  const dropRates: number[] = [];
  
  readingsByDate.forEach((dayReadings, date) => {
    // Find bedtime reading (9-11 PM)
    const bedtimeReadings = dayReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 21 && hour <= 23;
    });
    
    // Find morning reading (6-8 AM)
    const morningReadings = dayReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 6 && hour <= 8;
    });
    
    if (bedtimeReadings.length > 0 && morningReadings.length > 0) {
      const bedtimeGlucose = getAverageGlucoseValue(bedtimeReadings);
      const morningGlucose = getAverageGlucoseValue(morningReadings);
      
      // Calculate time difference (approximate 9 hours overnight)
      const bedtimeTime = new Date(bedtimeReadings[0].timestamp).getTime();
      const morningTime = new Date(morningReadings[0].timestamp).getTime();
      const hoursDiff = (morningTime - bedtimeTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 6 && hoursDiff < 12) {
        const dropRate = (morningGlucose - bedtimeGlucose) / hoursDiff;
        dropRates.push(dropRate);
      }
    }
  });
  
  if (dropRates.length === 0) {
    return -15; // Default drop rate
  }
  
  // Return average drop rate (negative means dropping)
  const avgDropRate = dropRates.reduce((sum, rate) => sum + rate, 0) / dropRates.length;
  return Math.round(avgDropRate * 10) / 10;
};

// ============================================
// Historical Night Lows
// ============================================

/**
 * Get historical nighttime low glucose events
 * Returns past instances of nighttime lows (glucose < 70)
 */
export const getHistoricalNightLows = (): NightLowRecord[] => {
  const readings = getAllGlucoseReadings();
  const nightLows: NightLowRecord[] = [];
  
  // Get stored night lows from localStorage
  const storedLows = getStoredNightLows();
  
  // Analyze readings for night lows
  const readingsByDate = groupReadingsByDate(readings);
  
  readingsByDate.forEach((dayReadings, date) => {
    // Filter to nighttime readings (10 PM - 8 AM)
    const nightReadings = dayReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= NIGHT_HOURS.START || hour < NIGHT_HOURS.END;
    });
    
    if (nightReadings.length > 0) {
      // Find lowest reading
      let lowestReading = nightReadings[0];
      let lowestValue = getGlucoseValue(lowestReading);
      
      nightReadings.forEach(reading => {
        const value = getGlucoseValue(reading);
        if (value < lowestValue) {
          lowestValue = value;
          lowestReading = reading;
        }
      });
      
      // If low detected, add to records
      if (lowestValue < GLUCOSE_THRESHOLDS.DANGER_LOW) {
        const severity: NightLowRecord['severity'] = 
          lowestValue < 54 ? 'severe' : lowestValue < 65 ? 'moderate' : 'mild';
        
        nightLows.push({
          date,
          lowestGlucose: lowestValue,
          timeOfLow: new Date(lowestReading.timestamp).toISOString(),
          severity,
        });
      }
    }
  });
  
  // Merge with stored lows and sort by date (newest first)
  const allLows = [...nightLows, ...storedLows];
  allLows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Keep only last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return allLows.filter(low => new Date(low.date) >= thirtyDaysAgo);
};

/**
 * Get overnight statistics for the past week
 */
export const getOvernightStats = (): OvernightStats => {
  const readings = getAllGlucoseReadings();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const recentReadings = readings.filter(r => 
    new Date(r.timestamp) >= weekAgo
  );
  
  const readingsByDate = groupReadingsByDate(recentReadings);
  let totalDropRate = 0;
  let validNights = 0;
  let lowNightsCount = 0;
  let totalBedtimeGlucose = 0;
  let totalMorningGlucose = 0;
  let bedtimeCount = 0;
  let morningCount = 0;
  
  readingsByDate.forEach((dayReadings) => {
    const nightReadings = dayReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= NIGHT_HOURS.START || hour < NIGHT_HOURS.END;
    });
    
    if (nightReadings.length >= 2) {
      validNights++;
      
      // Check for lows
      const hasLow = nightReadings.some(r => {
        const val = getGlucoseValue(r);
        return val < GLUCOSE_THRESHOLDS.DANGER_LOW;
      });
      if (hasLow) lowNightsCount++;
      
      // Bedtime vs morning comparison
      const bedtimeReadings = nightReadings.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= 21 && hour <= 23;
      });
      
      const morningReadings = nightReadings.filter(r => {
        const hour = new Date(r.timestamp).getHours();
        return hour >= 6 && hour <= 8;
      });
      
      if (bedtimeReadings.length > 0) {
        totalBedtimeGlucose += getAverageGlucoseValue(bedtimeReadings);
        bedtimeCount++;
      }
      
      if (morningReadings.length > 0) {
        totalMorningGlucose += getAverageGlucoseValue(morningReadings);
        morningCount++;
      }
    }
  });
  
  const avgBedtime = bedtimeCount > 0 ? totalBedtimeGlucose / bedtimeCount : 0;
  const avgMorning = morningCount > 0 ? totalMorningGlucose / morningCount : 0;
  
  // Calculate average drop rate
  if (avgBedtime > 0 && avgMorning > 0) {
    totalDropRate = (avgMorning - avgBedtime) / 9; // Approximate 9 hours
  }
  
  return {
    averageDropRate: Math.round(totalDropRate * 10) / 10,
    totalNightsAnalyzed: validNights,
    lowNightsCount,
    averageBedtimeGlucose: Math.round(avgBedtime),
    averageMorningGlucose: Math.round(avgMorning),
  };
};

// ============================================
// Helper Functions
// ============================================

function getDefaultBedtime(): Date {
  const now = new Date();
  const bedtime = new Date(now);
  bedtime.setHours(22, 0, 0, 0);
  
  // If it's already past 10 PM, use tomorrow
  if (now.getHours() >= 22) {
    bedtime.setDate(bedtime.getDate() + 1);
  }
  
  return bedtime;
}

function determineTrendDirection(): 'rising' | 'falling' | 'stable' {
  const trendRate = calculateRecentTrendRate();
  
  if (trendRate === undefined) return 'stable';
  if (trendRate > 5) return 'rising';
  if (trendRate < -5) return 'falling';
  return 'stable';
}

function calculateRecentTrendRate(): number | undefined {
  const readings = getAllGlucoseReadings();
  
  if (readings.length < 2) return undefined;
  
  // Get two most recent readings
  const sorted = [...readings].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const recent = sorted[0];
  const previous = sorted[1];
  
  const recentValue = getGlucoseValue(recent);
  const previousValue = getGlucoseValue(previous);
  
  const timeDiffHours = 
    (new Date(recent.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 
    (1000 * 60 * 60);
  
  if (timeDiffHours <= 0) return undefined;
  
  return (recentValue - previousValue) / timeDiffHours;
}

function findPredictedGlucoseAtTime(prediction: PredictionResult, targetHour: number): number {
  const targetTime = new Date();
  targetTime.setHours(targetHour, 0, 0, 0);
  
  // If target hour has passed today, look at tomorrow
  if (targetTime.getHours() <= new Date().getHours()) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  // Find closest prediction point
  let closestPoint = prediction.points[0];
  let minDiff = Infinity;
  
  prediction.points.forEach(point => {
    const pointTime = new Date(point.time);
    const diff = Math.abs(pointTime.getTime() - targetTime.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closestPoint = point;
    }
  });
  
  return closestPoint.predictedGlucose;
}

function findLowestPredictedGlucose(prediction: PredictionResult): { 
  lowestGlucose: number; 
  lowestTime: string;
} {
  let lowestPoint = prediction.points[0];
  
  prediction.points.forEach(point => {
    if (point.predictedGlucose < lowestPoint.predictedGlucose) {
      lowestPoint = point;
    }
  });
  
  const time = new Date(lowestPoint.time);
  return {
    lowestGlucose: lowestPoint.predictedGlucose,
    lowestTime: time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
  };
}

function determineRiskLevel(
  lowestGlucose: number,
  currentGlucose: number,
  currentIOB: number
): 'safe' | 'caution' | 'danger' {
  // Danger conditions
  if (lowestGlucose < 70) return 'danger';
  if (currentGlucose < 100 && currentIOB > 3) return 'danger';
  if (currentGlucose < 80) return 'danger';
  
  // Caution conditions
  if (lowestGlucose < 90) return 'caution';
  if (currentGlucose < 120 && currentIOB > 2) return 'caution';
  if (currentGlucose > 250) return 'caution';
  
  // Safe
  return 'safe';
}

function calculateSleepSafetyScore(
  currentGlucose: number,
  lowestGlucose: number,
  currentIOB: number,
  riskLevel: 'safe' | 'caution' | 'danger'
): number {
  let score = 100;
  
  // Deduct for low predicted glucose
  if (lowestGlucose < 70) {
    score -= 50;
  } else if (lowestGlucose < 90) {
    score -= 25;
  } else if (lowestGlucose < 110) {
    score -= 10;
  }
  
  // Deduct for high IOB
  if (currentIOB > 5) {
    score -= 20;
  } else if (currentIOB > 3) {
    score -= 10;
  } else if (currentIOB > 1.5) {
    score -= 5;
  }
  
  // Deduct for current glucose being too low or too high
  if (currentGlucose < 80) {
    score -= 20;
  } else if (currentGlucose < 100) {
    score -= 10;
  } else if (currentGlucose > 250) {
    score -= 15;
  } else if (currentGlucose > 200) {
    score -= 5;
  }
  
  // Apply risk level adjustments
  if (riskLevel === 'danger') {
    score = Math.min(score, 40);
  } else if (riskLevel === 'caution') {
    score = Math.min(score, 70);
  }
  
  return Math.max(0, Math.min(100, score));
}

function generateRecommendation(
  riskLevel: 'safe' | 'caution' | 'danger',
  lowestGlucose: number,
  currentIOB: number,
  currentGlucose: number
): { recommendation: string; snackSuggestion?: string } {
  switch (riskLevel) {
    case 'danger':
      return {
        recommendation: 'Your glucose may drop dangerously low tonight. Take action before sleeping.',
        snackSuggestion: 'Eat 2 digestive biscuits and a glass of milk before sleeping. Keep glucose tablets on your bedside table.',
      };
      
    case 'caution':
      if (currentGlucose > 250) {
        return {
          recommendation: 'Your glucose is high before bed. Check ketones and stay hydrated.',
        };
      }
      return {
        recommendation: 'Your glucose may dip during the night. Consider a small preventive snack.',
        snackSuggestion: 'Consider a small snack: 1 banana or a glass of milk.',
      };
      
    case 'safe':
    default:
      if (currentGlucose > 180) {
        return {
          recommendation: 'Your levels are elevated but stable for sleep. Monitor in the morning.',
        };
      }
      return {
        recommendation: 'Your glucose levels look safe for tonight. Sweet dreams!',
        snackSuggestion: 'Your levels look safe for tonight - no snack needed.',
      };
  }
}

function groupReadingsByDate(readings: GlucoseReading[]): Map<string, GlucoseReading[]> {
  const grouped = new Map<string, GlucoseReading[]>();
  
  readings.forEach(reading => {
    const date = reading.date;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(reading);
  });
  
  return grouped;
}

function getGlucoseValue(reading: GlucoseReading): number {
  return reading.fasting || reading.postMeal || 0;
}

function getAverageGlucoseValue(readings: GlucoseReading[]): number {
  const values = readings.map(getGlucoseValue).filter(v => v > 0);
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function getStoredNightLows(): NightLowRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NIGHT_LOWS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNightAssessment(assessment: {
  timestamp: string;
  currentGlucose: number;
  currentIOB: number;
  predictedLowestGlucose: number;
  riskLevel: string;
  sleepSafetyScore: number;
}): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NIGHT_ASSESSMENTS);
    const assessments = stored ? JSON.parse(stored) : [];
    
    assessments.unshift(assessment);
    
    // Keep only last 30 assessments
    const trimmed = assessments.slice(0, 30);
    localStorage.setItem(STORAGE_KEY_NIGHT_ASSESSMENTS, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving night assessment:', error);
  }
}

function triggerCaregiverAlert(currentGlucose: number, predictedLow: number): void {
  try {
    saveAlert({
      id: `night-safety-${Date.now()}`,
      type: 'hypoglycemia-risk',
      severity: 'high',
      message: `Night safety alert: Predicted low of ${predictedLow} mg/dL. Current: ${currentGlucose} mg/dL.`,
      timestamp: new Date().toISOString(),
      sensorData: {
        glucose: currentGlucose,
        timestamp: new Date().toISOString(),
      },
      recommendations: [
        'Check on the patient before they sleep',
        'Ensure they have fast-acting carbs nearby',
        'Consider setting an alarm for a 2 AM glucose check',
      ],
      requiresImmediateAction: predictedLow < 60,
    });
  } catch (error) {
    console.error('Error triggering caregiver alert:', error);
  }
}

// ============================================
// Additional Utility Functions
// ============================================

/**
 * Get the last night assessment from storage
 */
export const getLastNightAssessment = (): {
  timestamp: string;
  currentGlucose: number;
  currentIOB: number;
  predictedLowestGlucose: number;
  riskLevel: string;
  sleepSafetyScore: number;
} | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NIGHT_ASSESSMENTS);
    if (!stored) return null;
    
    const assessments = JSON.parse(stored);
    return assessments.length > 0 ? assessments[0] : null;
  } catch {
    return null;
  }
};

/**
 * Check if night safety check is due (after 8 PM)
 */
export const isNightSafetyCheckDue = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6;
};

/**
 * Get recommended bedtime snack based on glucose and IOB
 */
export const getRecommendedSnack = (
  currentGlucose: number,
  currentIOB: number
): { snack: string; carbs: number; reason: string } | null => {
  if (currentGlucose < 90 || (currentGlucose < 120 && currentIOB > 2)) {
    return {
      snack: '2 digestive biscuits + 1 glass milk',
      carbs: 25,
      reason: 'Prevent overnight hypoglycemia',
    };
  }
  
  if (currentGlucose < 110 && currentIOB > 1.5) {
    return {
      snack: '1 banana or 1 glass milk',
      carbs: 15,
      reason: 'Stabilize glucose through the night',
    };
  }
  
  if (currentGlucose > 250) {
    return {
      snack: 'Water only - avoid carbs',
      carbs: 0,
      reason: 'Glucose is high - focus on hydration',
    };
  }
  
  return null;
};

export default {
  performNightAssessment,
  getOvernightDropRate,
  getHistoricalNightLows,
  getOvernightStats,
  getLastNightAssessment,
  isNightSafetyCheckDue,
  getRecommendedSnack,
};
