/**
 * Statistical Accuracy Utilities
 * Provides robust statistical methods, outlier detection, and data validation
 * to improve lab test accuracy
 * 
 * @references
 * - NIST/SEMATECH e-Handbook of Statistical Methods. https://www.itl.nist.gov/div898/handbook/
 * - Grubbs, F.E. (1969). Procedures for Detecting Outlying Observations in Samples. Technometrics.
 */

/**
 * T-distribution critical values for common confidence levels
 * Used for small sample confidence intervals (n < 30)
 * @reference Student's t-distribution tables
 */
export const T_CRITICAL_VALUES: { [df: number]: { [confidence: number]: number } } = {
  1: { 0.90: 6.314, 0.95: 12.706, 0.99: 63.657 },
  2: { 0.90: 2.920, 0.95: 4.303, 0.99: 9.925 },
  3: { 0.90: 2.353, 0.95: 3.182, 0.99: 5.841 },
  4: { 0.90: 2.132, 0.95: 2.776, 0.99: 4.604 },
  5: { 0.90: 2.015, 0.95: 2.571, 0.99: 4.032 },
  6: { 0.90: 1.943, 0.95: 2.447, 0.99: 3.707 },
  7: { 0.90: 1.895, 0.95: 2.365, 0.99: 3.499 },
  8: { 0.90: 1.860, 0.95: 2.306, 0.99: 3.355 },
  9: { 0.90: 1.833, 0.95: 2.262, 0.99: 3.250 },
  10: { 0.90: 1.812, 0.95: 2.228, 0.99: 3.169 },
  15: { 0.90: 1.753, 0.95: 2.131, 0.99: 2.947 },
  20: { 0.90: 1.725, 0.95: 2.086, 0.99: 2.845 },
  25: { 0.90: 1.708, 0.95: 2.060, 0.99: 2.787 },
  30: { 0.90: 1.697, 0.95: 2.042, 0.99: 2.750 },
  40: { 0.90: 1.684, 0.95: 2.021, 0.99: 2.704 },
  60: { 0.90: 1.671, 0.95: 2.000, 0.99: 2.660 },
  120: { 0.90: 1.658, 0.95: 1.980, 0.99: 2.617 },
  999: { 0.90: 1.645, 0.95: 1.960, 0.99: 2.576 } // Approximation for large n (z-score)
};

/**
 * Coefficient of Variation (CV) reliability thresholds
 * Used to assess measurement precision
 * @reference Clinical Laboratory Standards Institute (CLSI) guidelines
 */
export const CV_RELIABILITY_THRESHOLDS = {
  EXCELLENT: { max: 5, label: 'Excellent', description: 'Highly reliable measurements' },
  GOOD: { min: 5, max: 10, label: 'Good', description: 'Acceptable measurement reliability' },
  MODERATE: { min: 10, max: 15, label: 'Moderate', description: 'Moderate reliability - interpret with caution' },
  POOR: { min: 15, max: 25, label: 'Poor', description: 'Low reliability - consider repeating measurements' },
  UNACCEPTABLE: { min: 25, label: 'Unacceptable', description: 'Unreliable measurements - data quality issue' }
} as const;

/** CV reliability level type */
export type CVReliabilityLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'unacceptable';

/**
 * Get t-critical value for given degrees of freedom and confidence level
 * Uses interpolation for degrees of freedom not in table
 * 
 * @param df - Degrees of freedom (n - 1)
 * @param confidence - Confidence level (0.90, 0.95, or 0.99)
 * @returns t-critical value
 */
export function getTCriticalValue(df: number, confidence: number = 0.95): number {
  if (df <= 0) return T_CRITICAL_VALUES[999][confidence] || 1.96;
  
  const availableDFs = Object.keys(T_CRITICAL_VALUES).map(Number).sort((a, b) => a - b);
  
  // Find exact match or interpolate
  if (T_CRITICAL_VALUES[df] && T_CRITICAL_VALUES[df][confidence]) {
    return T_CRITICAL_VALUES[df][confidence];
  }
  
  // Find surrounding values for interpolation
  let lowerDF = availableDFs[0];
  let upperDF = availableDFs[availableDFs.length - 1];
  
  for (let i = 0; i < availableDFs.length - 1; i++) {
    if (availableDFs[i] <= df && availableDFs[i + 1] > df) {
      lowerDF = availableDFs[i];
      upperDF = availableDFs[i + 1];
      break;
    }
  }
  
  // Use upper bound for large df
  if (df >= 999) return T_CRITICAL_VALUES[999][confidence] || 1.96;
  
  const lowerT = T_CRITICAL_VALUES[lowerDF][confidence];
  const upperT = T_CRITICAL_VALUES[upperDF][confidence];
  
  // Linear interpolation
  const fraction = (df - lowerDF) / (upperDF - lowerDF);
  return lowerT + fraction * (upperT - lowerT);
}

/**
 * Assess CV reliability level
 * @param cv - Coefficient of variation (as percentage)
 * @returns Reliability assessment
 */
export function assessCVReliability(cv: number): {
  level: CVReliabilityLevel;
  label: string;
  description: string;
  isAcceptable: boolean;
} {
  if (cv < CV_RELIABILITY_THRESHOLDS.EXCELLENT.max) {
    return {
      level: 'excellent',
      label: CV_RELIABILITY_THRESHOLDS.EXCELLENT.label,
      description: CV_RELIABILITY_THRESHOLDS.EXCELLENT.description,
      isAcceptable: true
    };
  }
  if (cv < CV_RELIABILITY_THRESHOLDS.GOOD.max) {
    return {
      level: 'good',
      label: CV_RELIABILITY_THRESHOLDS.GOOD.label,
      description: CV_RELIABILITY_THRESHOLDS.GOOD.description,
      isAcceptable: true
    };
  }
  if (cv < CV_RELIABILITY_THRESHOLDS.MODERATE.max) {
    return {
      level: 'moderate',
      label: CV_RELIABILITY_THRESHOLDS.MODERATE.label,
      description: CV_RELIABILITY_THRESHOLDS.MODERATE.description,
      isAcceptable: true
    };
  }
  if (cv < CV_RELIABILITY_THRESHOLDS.POOR.max) {
    return {
      level: 'poor',
      label: CV_RELIABILITY_THRESHOLDS.POOR.label,
      description: CV_RELIABILITY_THRESHOLDS.POOR.description,
      isAcceptable: false
    };
  }
  return {
    level: 'unacceptable',
    label: CV_RELIABILITY_THRESHOLDS.UNACCEPTABLE.label,
    description: CV_RELIABILITY_THRESHOLDS.UNACCEPTABLE.description,
    isAcceptable: false
  };
}

/**
 * Remove outliers using IQR (Interquartile Range) method
 * @param data Array of numbers
 * @param factor IQR multiplier (default 1.5, higher = more aggressive filtering)
 * @returns Filtered data array
 */
export function removeOutliers(data: number[], factor: number = 1.5): number[] {
  if (data.length < 4) return data; // Need at least 4 points for IQR
  
  const sorted = [...data].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - factor * iqr;
  const upperBound = q3 + factor * iqr;
  
  return data.filter(x => x >= lowerBound && x <= upperBound);
}

/**
 * Calculate robust mean (median of means from subsets)
 * @param data Array of numbers
 * @param subsetSize Size of subsets (default 5)
 * @returns Robust mean value
 */
export function robustMean(data: number[], subsetSize: number = 5): number {
  if (data.length === 0) return 0;
  if (data.length <= subsetSize) return median(data);
  
  const means: number[] = [];
  for (let i = 0; i < data.length; i += subsetSize) {
    const subset = data.slice(i, i + subsetSize);
    means.push(subset.reduce((a, b) => a + b, 0) / subset.length);
  }
  
  return median(means);
}

/**
 * Calculate median value
 * @param data Array of numbers
 * @returns Median value
 */
export function median(data: number[]): number {
  if (data.length === 0) return 0;
  
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate trimmed mean (removes top and bottom percentiles)
 * @param data Array of numbers
 * @param trimPercent Percentage to trim from each end (default 10%)
 * @returns Trimmed mean
 */
export function trimmedMean(data: number[], trimPercent: number = 10): number {
  if (data.length === 0) return 0;
  
  const sorted = [...data].sort((a, b) => a - b);
  const trimCount = Math.floor(data.length * trimPercent / 100);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  
  if (trimmed.length === 0) return median(data);
  
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

/**
 * Calculate standard deviation
 * @param data Array of numbers
 * @param useSample Use sample standard deviation (n-1) vs population (n)
 * @returns Standard deviation
 */
export function standardDeviation(data: number[], useSample: boolean = true): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return 0;
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 
    (useSample ? data.length - 1 : data.length);
  
  return Math.sqrt(variance);
}

/**
 * Calculate coefficient of variation (CV) - relative measure of variability
 * @param data Array of numbers
 * @returns Coefficient of variation as percentage
 */
export function coefficientOfVariation(data: number[]): number {
  if (data.length === 0) return 0;
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  if (mean === 0) return 0;
  
  const stdDev = standardDeviation(data);
  return (stdDev / mean) * 100;
}

/**
 * Calculate confidence interval for mean using t-distribution for small samples
 * Uses z-score approximation for large samples (n >= 30)
 * 
 * @param data Array of numbers
 * @param confidenceLevel Confidence level (default 0.95 for 95%)
 * @returns Object with mean, lower bound, upper bound, and margin of error
 * 
 * @reference Student's t-distribution for small sample inference
 */
export function confidenceInterval(
  data: number[],
  confidenceLevel: number = 0.95
): { mean: number; lower: number; upper: number; margin: number; method: 't-distribution' | 'z-score' } {
  if (data.length === 0) {
    return { mean: 0, lower: 0, upper: 0, margin: 0, method: 'z-score' };
  }
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const stdDev = standardDeviation(data, true);
  const n = data.length;
  const df = n - 1;
  
  // Use t-distribution for small samples, z-score for large samples
  const method: 't-distribution' | 'z-score' = n < 30 ? 't-distribution' : 'z-score';
  const criticalValue = getTCriticalValue(df, confidenceLevel);
  
  const margin = (criticalValue * stdDev) / Math.sqrt(n);
  
  return {
    mean,
    lower: mean - margin,
    upper: mean + margin,
    margin,
    method
  };
}

/**
 * Validate data quality
 * @param data Array of numbers
 * @param minSamples Minimum number of samples required
 * @param maxCV Maximum coefficient of variation allowed (as percentage)
 * @returns Validation result with quality score and issues
 */
export function validateDataQuality(
  data: number[],
  minSamples: number = 10,
  maxCV: number = 50
): {
  isValid: boolean;
  qualityScore: number; // 0-100
  issues: string[];
  sampleCount: number;
  cv: number;
} {
  const issues: string[] = [];
  let qualityScore = 100;
  
  // Check sample count
  if (data.length < minSamples) {
    issues.push(`Insufficient samples: ${data.length} < ${minSamples}`);
    qualityScore -= 30;
  }
  
  // Check for invalid values
  const invalidCount = data.filter(x => !isFinite(x) || isNaN(x)).length;
  if (invalidCount > 0) {
    issues.push(`Invalid values detected: ${invalidCount}`);
    qualityScore -= 20;
  }
  
  // Check coefficient of variation
  const cv = coefficientOfVariation(data.filter(x => isFinite(x) && !isNaN(x)));
  if (cv > maxCV) {
    issues.push(`High variability detected: CV = ${cv.toFixed(1)}%`);
    qualityScore -= 15;
  }
  
  // Check for constant values (no variation)
  const uniqueValues = new Set(data.filter(x => isFinite(x) && !isNaN(x)));
  if (uniqueValues.size === 1 && data.length > 1) {
    issues.push('No variation in data - possible sensor issue');
    qualityScore -= 25;
  }
  
  return {
    isValid: issues.length === 0 && data.length >= minSamples,
    qualityScore: Math.max(0, qualityScore),
    issues,
    sampleCount: data.length,
    cv
  };
}

/**
 * Smooth data using moving average
 * @param data Array of numbers
 * @param windowSize Size of moving average window
 * @returns Smoothed data array
 */
export function movingAverage(data: number[], windowSize: number = 5): number[] {
  if (data.length === 0) return [];
  if (windowSize >= data.length) return [data.reduce((a, b) => a + b, 0) / data.length];
  
  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(data.length, i + halfWindow + 1);
    const window = data.slice(start, end);
    smoothed.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  
  return smoothed;
}

/**
 * Calculate robust statistics summary with reliability assessment
 * @param data Array of numbers
 * @param removeOutliersFlag Whether to remove outliers before calculation
 * @returns Comprehensive statistics summary with reliability metrics
 */
export function robustStatistics(
  data: number[],
  removeOutliersFlag: boolean = true
): {
  mean: number;
  median: number;
  trimmedMean: number;
  robustMean: number;
  stdDev: number;
  cv: number;
  cvReliability: ReturnType<typeof assessCVReliability>;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  outlierCount: number;
  sampleCount: number;
  confidenceInterval: ReturnType<typeof confidenceInterval>;
} {
  if (data.length === 0) {
    return {
      mean: 0,
      median: 0,
      trimmedMean: 0,
      robustMean: 0,
      stdDev: 0,
      cv: 0,
      cvReliability: assessCVReliability(0),
      min: 0,
      max: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      outlierCount: 0,
      sampleCount: 0,
      confidenceInterval: confidenceInterval([])
    };
  }
  
  const validData = data.filter(x => isFinite(x) && !isNaN(x));
  const originalLength = validData.length;
  
  let processedData = validData;
  let outlierCount = 0;
  
  if (removeOutliersFlag && validData.length >= 4) {
    const filtered = removeOutliers(validData);
    outlierCount = originalLength - filtered.length;
    processedData = filtered;
  }
  
  const sorted = [...processedData].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const cv = coefficientOfVariation(processedData);
  
  return {
    mean: processedData.reduce((a, b) => a + b, 0) / processedData.length,
    median: median(processedData),
    trimmedMean: trimmedMean(processedData),
    robustMean: robustMean(processedData),
    stdDev: standardDeviation(processedData),
    cv,
    cvReliability: assessCVReliability(cv),
    min: Math.min(...processedData),
    max: Math.max(...processedData),
    q1: sorted[q1Index] || 0,
    q3: sorted[q3Index] || 0,
    iqr: (sorted[q3Index] || 0) - (sorted[q1Index] || 0),
    outlierCount,
    sampleCount: processedData.length,
    confidenceInterval: confidenceInterval(processedData)
  };
}

/**
 * Calculate accuracy score based on data quality metrics
 * @param stats Robust statistics object
 * @param qualityValidation Data quality validation result
 * @returns Accuracy score (0-100)
 */
export function calculateAccuracyScore(
  stats: ReturnType<typeof robustStatistics>,
  qualityValidation: ReturnType<typeof validateDataQuality>
): number {
  let score = qualityValidation.qualityScore;
  
  // Boost score for sufficient samples
  if (stats.sampleCount >= 30) score += 5;
  else if (stats.sampleCount >= 20) score += 3;
  else if (stats.sampleCount >= 10) score += 1;
  
  // Reduce score for high variability
  if (stats.cv > 30) score -= 10;
  else if (stats.cv > 20) score -= 5;
  
  // Reduce score for many outliers
  const outlierPercent = (stats.outlierCount / stats.sampleCount) * 100;
  if (outlierPercent > 20) score -= 10;
  else if (outlierPercent > 10) score -= 5;
  
  // Boost score for tight confidence interval (relative to mean)
  if (stats.mean !== 0) {
    const relativeMargin = (stats.confidenceInterval.margin / Math.abs(stats.mean)) * 100;
    if (relativeMargin < 5) score += 5;
    else if (relativeMargin < 10) score += 2;
  }
  
  return Math.max(0, Math.min(100, score));
}

