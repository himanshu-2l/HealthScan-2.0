/**
 * Anomaly Detection Service
 * Client-side anomaly detection for health readings analysis
 * Identifies unusual patterns using statistical methods and clinical thresholds
 */

// ============================================================================
// Interfaces
// ============================================================================

export interface HealthReading {
  value: number;
  timestamp: string;
  type: 'systolic' | 'diastolic' | 'heartRate' | 'glucose' | 'temperature' | 'oxygenLevel';
}

export interface Anomaly {
  id: string;
  type: string;
  value: number;
  expectedRange: { min: number; max: number };
  deviation: number; // percentage deviation from mean
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  context: string; // e.g., "32% higher than your 7-day average"
}

export interface AnomalyReport {
  anomalies: Anomaly[];
  summary: {
    totalChecked: number;
    anomaliesFound: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  lastAnalyzed: string;
}

// ============================================================================
// Clinical Reference Ranges
// ============================================================================

const CLINICAL_RANGES: Record<string, { normal: { min: number; max: number }; levels: { threshold: number; severity: 'low' | 'medium' | 'high' | 'critical' }[] }> = {
  systolic: {
    normal: { min: 90, max: 120 },
    levels: [
      { threshold: 180, severity: 'critical' }, // Crisis
      { threshold: 140, severity: 'high' },     // High Stage 2
      { threshold: 130, severity: 'medium' },   // High Stage 1
      { threshold: 121, severity: 'low' },      // Elevated
    ],
  },
  diastolic: {
    normal: { min: 60, max: 80 },
    levels: [
      { threshold: 120, severity: 'critical' }, // Crisis
      { threshold: 90, severity: 'high' },      // High Stage 2
      { threshold: 80, severity: 'medium' },    // High Stage 1
    ],
  },
  heartRate: {
    normal: { min: 60, max: 100 },
    levels: [
      { threshold: 150, severity: 'critical' }, // Severe tachycardia
      { threshold: 120, severity: 'high' },     // Tachycardia
      { threshold: 100, severity: 'medium' },   // Elevated
    ],
  },
  glucose: {
    normal: { min: 70, max: 100 },
    levels: [
      { threshold: 250, severity: 'critical' }, // Severe hyperglycemia
      { threshold: 126, severity: 'high' },     // Diabetic
      { threshold: 100, severity: 'medium' },   // Pre-diabetic
    ],
  },
  temperature: {
    normal: { min: 97.0, max: 99.5 },
    levels: [
      { threshold: 103.0, severity: 'critical' }, // High fever
      { threshold: 101.0, severity: 'high' },     // Fever
      { threshold: 100.4, severity: 'medium' },   // Low-grade fever
    ],
  },
  oxygenLevel: {
    normal: { min: 95, max: 100 },
    levels: [
      { threshold: 90, severity: 'critical' },  // Critical hypoxemia (below)
      { threshold: 92, severity: 'high' },      // Severe hypoxemia (below)
      { threshold: 95, severity: 'medium' },    // Low (below)
    ],
  },
};

// Low thresholds for readings that can be dangerously low
const LOW_THRESHOLDS: Record<string, { threshold: number; severity: 'low' | 'medium' | 'high' | 'critical' }[]> = {
  systolic: [
    { threshold: 70, severity: 'critical' },
    { threshold: 80, severity: 'high' },
    { threshold: 90, severity: 'medium' },
  ],
  diastolic: [
    { threshold: 40, severity: 'critical' },
    { threshold: 50, severity: 'high' },
    { threshold: 60, severity: 'medium' },
  ],
  heartRate: [
    { threshold: 40, severity: 'critical' },
    { threshold: 50, severity: 'high' },
    { threshold: 60, severity: 'medium' },
  ],
  glucose: [
    { threshold: 50, severity: 'critical' },
    { threshold: 60, severity: 'high' },
    { threshold: 70, severity: 'medium' },
  ],
  temperature: [
    { threshold: 95.0, severity: 'critical' },
    { threshold: 96.0, severity: 'high' },
    { threshold: 97.0, severity: 'medium' },
  ],
  oxygenLevel: [
    { threshold: 90, severity: 'critical' },
    { threshold: 92, severity: 'high' },
    { threshold: 95, severity: 'medium' },
  ],
};

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  BP_READINGS: 'healthScan_bp_readings',
  GLUCOSE_READINGS: 'healthScan_glucose_readings',
  HEALTH_RESULTS: 'healthScan_results',
};

// ============================================================================
// Statistical Helper Functions
// ============================================================================

/**
 * Calculate the mean of an array of numbers
 */
const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Calculate the standard deviation of an array of numbers
 */
const calculateStandardDeviation = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
};

/**
 * Calculate the Z-score for a value given mean and standard deviation
 */
const calculateZScore = (value: number, mean: number, stdDev: number): number => {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

// ============================================================================
// Detection Algorithm Functions
// ============================================================================

/**
 * Detect anomalies using Z-Score method
 * Returns indices of values that exceed the threshold (default: 2 standard deviations)
 */
export const detectZScoreAnomalies = (values: number[], threshold: number = 2): number[] => {
  if (values.length < 3) return []; // Need at least 3 values for meaningful analysis

  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);

  const anomalousIndices: number[] = [];
  
  values.forEach((value, index) => {
    const zScore = calculateZScore(value, mean, stdDev);
    if (Math.abs(zScore) > threshold) {
      anomalousIndices.push(index);
    }
  });

  return anomalousIndices;
};

/**
 * Calculate moving average for a window of values
 * Default window is 7 (7-day moving average)
 */
export const calculateMovingAverage = (values: number[], window: number = 7): number[] => {
  if (values.length === 0) return [];
  if (values.length < window) {
    // If not enough values, return average of all available
    const avg = calculateMean(values);
    return values.map(() => avg);
  }

  const movingAverages: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    movingAverages.push(calculateMean(windowValues));
  }

  return movingAverages;
};

/**
 * Calculate percentage deviation from average
 */
export const getDeviationFromAverage = (value: number, average: number): number => {
  if (average === 0) return 0;
  return ((value - average) / average) * 100;
};

/**
 * Classify severity based on reading type and value
 */
export const classifySeverity = (type: string, value: number): 'low' | 'medium' | 'high' | 'critical' => {
  const range = CLINICAL_RANGES[type];
  const lowThresholds = LOW_THRESHOLDS[type];
  
  if (!range) return 'low';

  // Check for oxygen level - lower values are worse
  if (type === 'oxygenLevel') {
    for (const level of range.levels) {
      if (value < level.threshold) {
        return level.severity;
      }
    }
    return 'low'; // Normal
  }

  // Check for low values first
  if (lowThresholds) {
    for (const level of lowThresholds) {
      if (value < level.threshold) {
        return level.severity;
      }
    }
  }

  // Check for high values
  for (const level of range.levels) {
    if (value >= level.threshold) {
      return level.severity;
    }
  }

  // Check if within normal range
  if (value >= range.normal.min && value <= range.normal.max) {
    return 'low'; // Normal, no severity
  }

  return 'low';
};

/**
 * Generate human-readable message for an anomaly
 */
export const generateAnomalyMessage = (anomaly: Anomaly): string => {
  const typeLabels: Record<string, string> = {
    systolic: 'Systolic blood pressure',
    diastolic: 'Diastolic blood pressure',
    heartRate: 'Heart rate',
    glucose: 'Blood glucose',
    temperature: 'Body temperature',
    oxygenLevel: 'Blood oxygen level',
  };

  const typeUnits: Record<string, string> = {
    systolic: 'mmHg',
    diastolic: 'mmHg',
    heartRate: 'bpm',
    glucose: 'mg/dL',
    temperature: '°F',
    oxygenLevel: '%',
  };

  const label = typeLabels[anomaly.type] || anomaly.type;
  const unit = typeUnits[anomaly.type] || '';
  
  const severityMessages: Record<string, string> = {
    critical: 'requires immediate medical attention',
    high: 'is significantly abnormal',
    medium: 'is outside the normal range',
    low: 'is slightly unusual',
  };

  const severityMsg = severityMessages[anomaly.severity];
  
  return `${label} reading of ${anomaly.value} ${unit} ${severityMsg}. Expected range: ${anomaly.expectedRange.min}-${anomaly.expectedRange.max} ${unit}. ${anomaly.context}`;
};

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Get readings from localStorage keys used by BPTracker and GlucoseTracker
 */
export const getReadingsFromStorage = (): HealthReading[] => {
  const readings: HealthReading[] = [];

  try {
    // Get BP readings
    const bpData = localStorage.getItem(STORAGE_KEYS.BP_READINGS);
    if (bpData) {
      const bpReadings = JSON.parse(bpData) as Array<{
        systolic: number;
        diastolic: number;
        pulse?: number;
        timestamp: string;
      }>;

      bpReadings.forEach((reading) => {
        if (reading.systolic) {
          readings.push({
            value: reading.systolic,
            timestamp: reading.timestamp,
            type: 'systolic',
          });
        }
        if (reading.diastolic) {
          readings.push({
            value: reading.diastolic,
            timestamp: reading.timestamp,
            type: 'diastolic',
          });
        }
        if (reading.pulse) {
          readings.push({
            value: reading.pulse,
            timestamp: reading.timestamp,
            type: 'heartRate',
          });
        }
      });
    }
  } catch (error) {
    console.error('Error reading BP data:', error);
  }

  try {
    // Get Glucose readings
    const glucoseData = localStorage.getItem(STORAGE_KEYS.GLUCOSE_READINGS);
    if (glucoseData) {
      const glucoseReadings = JSON.parse(glucoseData) as Array<{
        fasting?: number;
        postMeal?: number;
        timestamp: string;
      }>;

      glucoseReadings.forEach((reading) => {
        // Use fasting glucose as primary glucose reading
        if (reading.fasting) {
          readings.push({
            value: reading.fasting,
            timestamp: reading.timestamp,
            type: 'glucose',
          });
        }
      });
    }
  } catch (error) {
    console.error('Error reading glucose data:', error);
  }

  try {
    // Get other health results that might contain temperature or oxygen levels
    const healthData = localStorage.getItem(STORAGE_KEYS.HEALTH_RESULTS);
    if (healthData) {
      const healthResults = JSON.parse(healthData) as Array<{
        data?: {
          temperature?: number;
          oxygenLevel?: number;
          heartRate?: number;
        };
        timestamp: string;
      }>;

      healthResults.forEach((result) => {
        if (result.data?.temperature) {
          readings.push({
            value: result.data.temperature,
            timestamp: result.timestamp,
            type: 'temperature',
          });
        }
        if (result.data?.oxygenLevel) {
          readings.push({
            value: result.data.oxygenLevel,
            timestamp: result.timestamp,
            type: 'oxygenLevel',
          });
        }
        if (result.data?.heartRate) {
          readings.push({
            value: result.data.heartRate,
            timestamp: result.timestamp,
            type: 'heartRate',
          });
        }
      });
    }
  } catch (error) {
    console.error('Error reading health results:', error);
  }

  // Sort by timestamp (newest first)
  readings.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return readings;
};

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze health readings for anomalies
 * Uses multiple detection methods: Z-Score, Moving Average Deviation, and Clinical Thresholds
 */
export const analyzeReadings = (readings: HealthReading[]): AnomalyReport => {
  const anomalies: Anomaly[] = [];
  const processedIds = new Set<string>();

  // Group readings by type
  const readingsByType: Record<string, HealthReading[]> = {};
  readings.forEach((reading) => {
    if (!readingsByType[reading.type]) {
      readingsByType[reading.type] = [];
    }
    readingsByType[reading.type].push(reading);
  });

  // Analyze each type of reading
  Object.entries(readingsByType).forEach(([type, typeReadings]) => {
    const values = typeReadings.map((r) => r.value);
    const range = CLINICAL_RANGES[type];

    if (!range || values.length === 0) return;

    const mean = calculateMean(values);
    const stdDev = calculateStandardDeviation(values);
    const movingAvg = calculateMovingAverage(values);

    // Analyze each reading
    typeReadings.forEach((reading, index) => {
      const anomalyId = `${type}-${reading.timestamp}-${reading.value}`;
      
      // Skip if already processed
      if (processedIds.has(anomalyId)) return;
      processedIds.add(anomalyId);

      let isAnomaly = false;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let contextMessages: string[] = [];

      // 1. Clinical Threshold Check
      const thresholdSeverity = classifySeverity(type, reading.value);
      if (thresholdSeverity !== 'low' || 
          reading.value < range.normal.min || 
          reading.value > range.normal.max) {
        isAnomaly = true;
        severity = thresholdSeverity;
        
        if (reading.value < range.normal.min) {
          const diff = range.normal.min - reading.value;
          contextMessages.push(`${Math.round(diff)} ${getUnit(type)} below normal range`);
        } else if (reading.value > range.normal.max) {
          const diff = reading.value - range.normal.max;
          contextMessages.push(`${Math.round(diff)} ${getUnit(type)} above normal range`);
        }
      }

      // 2. Z-Score Check (only if enough data points)
      if (values.length >= 3) {
        const zScore = calculateZScore(reading.value, mean, stdDev);
        if (Math.abs(zScore) > 2) {
          isAnomaly = true;
          if (!severity || severity === 'low') {
            severity = Math.abs(zScore) > 3 ? 'high' : 'medium';
          }
          const direction = zScore > 0 ? 'above' : 'below';
          contextMessages.push(`${Math.abs(zScore).toFixed(1)} standard deviations ${direction} your average`);
        }
      }

      // 3. Moving Average Deviation Check (only if enough data points)
      if (values.length >= 7 && movingAvg[index] !== undefined) {
        const deviation = getDeviationFromAverage(reading.value, movingAvg[index]);
        if (Math.abs(deviation) > 20) {
          isAnomaly = true;
          if (!severity || severity === 'low') {
            severity = Math.abs(deviation) > 40 ? 'high' : 'medium';
          }
          const direction = deviation > 0 ? 'higher than' : 'lower than';
          contextMessages.push(`${Math.abs(Math.round(deviation))}% ${direction} your 7-day average`);
        }
      }

      // Create anomaly if detected
      if (isAnomaly) {
        const anomaly: Anomaly = {
          id: anomalyId,
          type,
          value: reading.value,
          expectedRange: range.normal,
          deviation: getDeviationFromAverage(reading.value, mean),
          severity,
          message: '',
          timestamp: reading.timestamp,
          context: contextMessages.join('. ') || 'Outside expected parameters',
        };
        
        anomaly.message = generateAnomalyMessage(anomaly);
        anomalies.push(anomaly);
      }
    });
  });

  // Sort anomalies by severity and timestamp
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  anomalies.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Generate summary
  const summary = {
    totalChecked: readings.length,
    anomaliesFound: anomalies.length,
    criticalCount: anomalies.filter((a) => a.severity === 'critical').length,
    highCount: anomalies.filter((a) => a.severity === 'high').length,
    mediumCount: anomalies.filter((a) => a.severity === 'medium').length,
    lowCount: anomalies.filter((a) => a.severity === 'low').length,
  };

  return {
    anomalies,
    summary,
    lastAnalyzed: new Date().toISOString(),
  };
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the unit for a reading type
 */
const getUnit = (type: string): string => {
  const units: Record<string, string> = {
    systolic: 'mmHg',
    diastolic: 'mmHg',
    heartRate: 'bpm',
    glucose: 'mg/dL',
    temperature: '°F',
    oxygenLevel: '%',
  };
  return units[type] || '';
};
