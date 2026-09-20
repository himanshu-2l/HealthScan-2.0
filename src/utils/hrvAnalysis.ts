/**
 * Heart Rate Variability (HRV) Analysis Utility
 * Calculates HRV metrics from RR intervals (time between heartbeats)
 * 
 * @references
 * - Task Force of ESC and NASPE. Heart rate variability: standards of measurement. Circulation. 1996;93(5):1043-1065.
 * - Shaffer F, Ginsberg JP. An Overview of Heart Rate Variability Metrics and Norms. Front Public Health. 2017;5:258.
 */

/** 
 * RMSSD Reference Ranges (milliseconds)
 * Based on age-adjusted norms from clinical literature
 * @see Shaffer & Ginsberg, 2017
 */
export const RMSSD_RANGES = {
  POOR: { max: 20, label: 'Poor', description: 'Very low parasympathetic activity' },
  BELOW_AVERAGE: { min: 20, max: 40, label: 'Below Average', description: 'Reduced parasympathetic activity' },
  AVERAGE: { min: 40, max: 100, label: 'Average', description: 'Normal parasympathetic activity' },
  ABOVE_AVERAGE: { min: 100, label: 'Above Average', description: 'Excellent parasympathetic activity' }
} as const;

/**
 * SDNN Reference Ranges (milliseconds)
 * @see Task Force of ESC and NASPE, 1996
 */
export const SDNN_RANGES = {
  UNHEALTHY: { max: 50, label: 'Unhealthy', description: 'Poor overall HRV - health concern' },
  COMPROMISED: { min: 50, max: 100, label: 'Compromised', description: 'Below optimal HRV' },
  ACCEPTABLE: { min: 100, max: 150, label: 'Acceptable', description: 'Adequate overall HRV' },
  HEALTHY: { min: 150, label: 'Healthy', description: 'Excellent overall HRV' }
} as const;

/** Stress level categorization */
export type StressLevel = 'low' | 'moderate' | 'high' | 'very-high';

/** Autonomic balance interpretation */
export type AutonomicBalance = 'parasympathetic-dominant' | 'balanced' | 'sympathetic-dominant' | 'severely-imbalanced';

export interface HRVMetrics {
  rmssd: number;           // Root Mean Square of Successive Differences (ms)
  sdnn: number;            // Standard Deviation of NN intervals (ms)
  pnn50: number;           // Percentage of NN50 intervals (%)
  meanRR: number;          // Mean RR interval (ms)
  minRR: number;           // Minimum RR interval (ms)
  maxRR: number;           // Maximum RR interval (ms)
  stressLevel: StressLevel;
  stressIndex: number;     // Baevsky stress index
  hrvScore: number;        // 0-100 score
  rmssdCategory: string;   // RMSSD interpretation category
  sdnnCategory: string;    // SDNN interpretation category
  autonomicBalance: AutonomicBalance;
  interpretation: string;
  recommendations: string[];
}

/**
 * Calculate Baevsky Stress Index (SI)
 * SI = AMo / (2 * Mo * MxDMn)
 * Where: AMo = amplitude of mode, Mo = mode, MxDMn = range
 * 
 * @param rrIntervals - Array of RR intervals in milliseconds
 * @returns Stress index value (higher = more stress)
 * @reference Baevsky RM, Chernikova AG. Heart rate variability analysis. J Arrhythm. 2017;33(6):539-545.
 */
export function calculateBaevskyStressIndex(rrIntervals: number[]): number {
  if (rrIntervals.length < 10) return 0;
  
  // Create histogram with 50ms bins
  const binSize = 50;
  const histogram: Map<number, number> = new Map();
  
  rrIntervals.forEach(rr => {
    const bin = Math.floor(rr / binSize) * binSize;
    histogram.set(bin, (histogram.get(bin) || 0) + 1);
  });
  
  // Find mode (Mo) - most frequent bin
  let maxCount = 0;
  let mode = 0;
  histogram.forEach((count, bin) => {
    if (count > maxCount) {
      maxCount = count;
      mode = bin;
    }
  });
  
  // AMo = percentage of intervals in mode bin
  const aMo = (maxCount / rrIntervals.length) * 100;
  
  // MxDMn = range (max - min)
  const mxDMn = Math.max(...rrIntervals) - Math.min(...rrIntervals);
  
  if (mode === 0 || mxDMn === 0) return 0;
  
  // Calculate stress index
  const stressIndex = (aMo) / (2 * (mode / 1000) * (mxDMn / 1000));
  
  return Math.round(stressIndex);
}

/**
 * Interpret RMSSD value according to clinical reference ranges
 * @param rmssd - RMSSD value in milliseconds
 */
export function interpretRMSSD(rmssd: number): { category: string; description: string; isNormal: boolean } {
  if (rmssd < RMSSD_RANGES.POOR.max) {
    return { category: 'Poor', description: RMSSD_RANGES.POOR.description, isNormal: false };
  }
  if (rmssd < RMSSD_RANGES.BELOW_AVERAGE.max) {
    return { category: 'Below Average', description: RMSSD_RANGES.BELOW_AVERAGE.description, isNormal: false };
  }
  if (rmssd < RMSSD_RANGES.AVERAGE.max) {
    return { category: 'Average', description: RMSSD_RANGES.AVERAGE.description, isNormal: true };
  }
  return { category: 'Above Average', description: RMSSD_RANGES.ABOVE_AVERAGE.description, isNormal: true };
}

/**
 * Interpret SDNN value according to clinical reference ranges
 * @param sdnn - SDNN value in milliseconds
 */
export function interpretSDNN(sdnn: number): { category: string; description: string; isNormal: boolean } {
  if (sdnn < SDNN_RANGES.UNHEALTHY.max) {
    return { category: 'Unhealthy', description: SDNN_RANGES.UNHEALTHY.description, isNormal: false };
  }
  if (sdnn < SDNN_RANGES.COMPROMISED.max) {
    return { category: 'Compromised', description: SDNN_RANGES.COMPROMISED.description, isNormal: false };
  }
  if (sdnn < SDNN_RANGES.ACCEPTABLE.max) {
    return { category: 'Acceptable', description: SDNN_RANGES.ACCEPTABLE.description, isNormal: true };
  }
  return { category: 'Healthy', description: SDNN_RANGES.HEALTHY.description, isNormal: true };
}

/**
 * Determine autonomic balance based on HRV metrics
 * @param rmssd - RMSSD value (parasympathetic indicator)
 * @param sdnn - SDNN value (overall HRV)
 * @param meanHR - Mean heart rate in BPM
 */
export function determineAutonomicBalance(rmssd: number, sdnn: number, meanHR: number): AutonomicBalance {
  // Calculate LF/HF ratio approximation using RMSSD (HF proxy) and SDNN relationship
  const parasympatheticTone = rmssd / (sdnn || 1);
  
  // Low resting HR with high RMSSD suggests parasympathetic dominance
  if (meanHR < 60 && rmssd > 60) {
    return 'parasympathetic-dominant';
  }
  
  // High resting HR with low RMSSD suggests sympathetic dominance
  if (meanHR > 90 && rmssd < 30) {
    return 'sympathetic-dominant';
  }
  
  // Very low overall HRV indicates severely imbalanced ANS
  if (sdnn < 30 || rmssd < 15) {
    return 'severely-imbalanced';
  }
  
  return 'balanced';
}

/**
 * Calculate HRV metrics from RR intervals
 * Uses time-domain analysis methods per Task Force standards
 * 
 * @param rrIntervals Array of RR intervals in milliseconds
 * @returns HRV metrics with clinical interpretations
 * 
 * @reference Task Force of ESC and NASPE. Circulation. 1996;93(5):1043-1065.
 */
export function calculateHRV(rrIntervals: number[]): HRVMetrics {
  if (rrIntervals.length < 10) {
    return {
      rmssd: 0,
      sdnn: 0,
      pnn50: 0,
      meanRR: 0,
      minRR: 0,
      maxRR: 0,
      stressLevel: 'very-high',
      stressIndex: 0,
      hrvScore: 0,
      rmssdCategory: 'Insufficient Data',
      sdnnCategory: 'Insufficient Data',
      autonomicBalance: 'severely-imbalanced',
      interpretation: 'Insufficient data for HRV analysis. Need at least 10 heartbeats.',
      recommendations: ['Record for longer duration', 'Ensure stable lighting', 'Keep face still']
    };
  }

  // Calculate mean RR interval
  const meanRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  const meanHR = 60000 / meanRR; // Convert to BPM

  // Calculate RMSSD (Root Mean Square of Successive Differences)
  // Gold standard for parasympathetic activity assessment
  let sumSquaredDiffs = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSquaredDiffs += diff * diff;
  }
  const rmssd = Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));

  // Calculate SDNN (Standard Deviation of NN intervals)
  // Reflects overall HRV including both sympathetic and parasympathetic activity
  const variance = rrIntervals.reduce((sum, val) => sum + Math.pow(val - meanRR, 2), 0) / (rrIntervals.length - 1);
  const sdnn = Math.sqrt(variance);

  // Calculate pNN50 (Percentage of successive RR intervals differing by >50ms)
  // Another parasympathetic indicator
  let nn50Count = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = Math.abs(rrIntervals[i] - rrIntervals[i - 1]);
    if (diff > 50) {
      nn50Count++;
    }
  }
  const pnn50 = (nn50Count / (rrIntervals.length - 1)) * 100;

  // Find min and max RR intervals
  const minRR = Math.min(...rrIntervals);
  const maxRR = Math.max(...rrIntervals);

  // Calculate Baevsky Stress Index
  const stressIndex = calculateBaevskyStressIndex(rrIntervals);

  // Interpret RMSSD and SDNN using clinical reference ranges
  const rmssdInterpretation = interpretRMSSD(rmssd);
  const sdnnInterpretation = interpretSDNN(sdnn);
  
  // Determine autonomic balance
  const autonomicBalance = determineAutonomicBalance(rmssd, sdnn, meanHR);

  // Determine stress level based on RMSSD (primary) and stress index
  let stressLevel: StressLevel;
  let hrvScore: number;
  let interpretation: string;
  const recommendations: string[] = [];

  // RMSSD-based stress assessment with proper reference ranges
  if (rmssd >= RMSSD_RANGES.AVERAGE.min) { // ≥40ms
    stressLevel = 'low';
    hrvScore = 75 + Math.min(25, (rmssd - 40) / 60 * 25);
    interpretation = `Excellent HRV (RMSSD: ${rmssd.toFixed(1)}ms - ${rmssdInterpretation.category}). Your autonomic nervous system shows good balance and recovery capacity.`;
    recommendations.push('Maintain current lifestyle habits');
    recommendations.push('Continue regular exercise');
  } else if (rmssd >= RMSSD_RANGES.BELOW_AVERAGE.min) { // 20-40ms
    stressLevel = 'moderate';
    hrvScore = 50 + ((rmssd - 20) / 20) * 25;
    interpretation = `Moderate HRV (RMSSD: ${rmssd.toFixed(1)}ms - ${rmssdInterpretation.category}). Your body shows reasonable stress recovery capacity.`;
    recommendations.push('Consider stress management techniques');
    recommendations.push('Ensure adequate sleep (7-9 hours)');
    recommendations.push('Practice deep breathing exercises');
  } else if (rmssd >= 10) { // 10-20ms
    stressLevel = 'high';
    hrvScore = 25 + ((rmssd - 10) / 10) * 25;
    interpretation = `Reduced HRV (RMSSD: ${rmssd.toFixed(1)}ms - ${rmssdInterpretation.category}). Your body may be experiencing elevated stress levels.`;
    recommendations.push('Prioritize stress reduction activities');
    recommendations.push('Improve sleep quality and duration');
    recommendations.push('Consider meditation or mindfulness practices');
    recommendations.push('Review work-life balance');
  } else {
    stressLevel = 'very-high';
    hrvScore = Math.max(0, (rmssd / 10) * 25);
    interpretation = `Very low HRV (RMSSD: ${rmssd.toFixed(1)}ms - ${rmssdInterpretation.category}). This may indicate high stress, fatigue, or health concerns.`;
    recommendations.push('Consult with healthcare provider');
    recommendations.push('Focus on rest and recovery');
    recommendations.push('Reduce stressors where possible');
    recommendations.push('Consider professional stress management support');
  }

  // Additional recommendations based on SDNN with proper reference ranges
  if (sdnn < SDNN_RANGES.UNHEALTHY.max) {
    recommendations.push(`Low SDNN (${sdnn.toFixed(1)}ms - ${sdnnInterpretation.category}) - consider cardiovascular health check`);
  } else if (sdnn < SDNN_RANGES.COMPROMISED.max) {
    recommendations.push(`Below-optimal SDNN (${sdnn.toFixed(1)}ms) - focus on improving overall HRV through lifestyle changes`);
  }

  // Add autonomic balance interpretation
  if (autonomicBalance === 'sympathetic-dominant') {
    interpretation += ' Autonomic balance shows sympathetic dominance (fight-or-flight response elevated).';
    recommendations.push('Practice parasympathetic activation techniques (slow breathing, meditation)');
  } else if (autonomicBalance === 'severely-imbalanced') {
    interpretation += ' Autonomic nervous system appears significantly imbalanced.';
    recommendations.push('Consider comprehensive cardiovascular and stress assessment');
  }

  // Add stress index context
  if (stressIndex > 200) {
    interpretation += ` Elevated stress index (${stressIndex}).`;
  }

  return {
    rmssd: Math.round(rmssd * 100) / 100,
    sdnn: Math.round(sdnn * 100) / 100,
    pnn50: Math.round(pnn50 * 100) / 100,
    meanRR: Math.round(meanRR),
    minRR,
    maxRR,
    stressLevel,
    stressIndex,
    hrvScore: Math.min(100, Math.max(0, Math.round(hrvScore))),
    rmssdCategory: rmssdInterpretation.category,
    sdnnCategory: sdnnInterpretation.category,
    autonomicBalance,
    interpretation,
    recommendations
  };
}

/**
 * Estimate blood pressure from pulse wave characteristics
 * Note: This is a rough estimation and not a replacement for medical-grade BP measurement
 */
export function estimateBloodPressure(
  meanRR: number,
  pulseAmplitude: number,
  age: number = 35
): { systolic: number; diastolic: number; confidence: number } {
  // Basic estimation based on pulse characteristics
  // Note: This is an approximate estimation and should be used as a screening tool
  
  const baseSystolic = 110 + (age - 20) * 0.5;
  const baseDiastolic = 70 + (age - 20) * 0.3;
  
  // Adjust based on RR interval (shorter RR = higher BP)
  const rrFactor = 60000 / meanRR; // Convert to BPM
  const bpmAdjustment = (rrFactor - 70) * 0.2;
  
  // Adjust based on pulse amplitude (lower amplitude might indicate higher BP)
  const amplitudeFactor = (1 - pulseAmplitude) * 10;
  
  const systolic = Math.round(baseSystolic + bpmAdjustment + amplitudeFactor);
  const diastolic = Math.round(baseDiastolic + bpmAdjustment * 0.6 + amplitudeFactor * 0.6);
  
  // Low confidence - this is just an estimation
  const confidence = 0.3;
  
  return {
    systolic: Math.max(90, Math.min(180, systolic)),
    diastolic: Math.max(60, Math.min(120, diastolic)),
    confidence
  };
}

/**
 * Calculate cardiovascular risk score (0-100)
 */
export function calculateCardiovascularRisk(
  bpm: number,
  hrvMetrics: HRVMetrics,
  estimatedBP: { systolic: number; diastolic: number },
  age: number = 35
): {
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  factors: string[];
  recommendations: string[];
} {
  let riskScore = 50; // Base score
  const factors: string[] = [];
  const recommendations: string[] = [];

  // Heart rate assessment
  if (bpm > 100) {
    riskScore += 15;
    factors.push('Elevated resting heart rate');
    recommendations.push('Consider cardiovascular exercise to improve heart health');
  } else if (bpm < 60) {
    riskScore += 5;
    factors.push('Low resting heart rate (may be normal for athletes)');
  } else {
    riskScore -= 5;
  }

  // HRV assessment
  if (hrvMetrics.stressLevel === 'very-high' || hrvMetrics.stressLevel === 'high') {
    riskScore += 20;
    factors.push('Reduced heart rate variability');
    recommendations.push('Focus on stress management');
  } else if (hrvMetrics.stressLevel === 'low') {
    riskScore -= 10;
  }

  // Blood pressure assessment
  if (estimatedBP.systolic > 140 || estimatedBP.diastolic > 90) {
    riskScore += 25;
    factors.push('Elevated blood pressure');
    recommendations.push('Monitor blood pressure regularly');
    recommendations.push('Consider lifestyle modifications');
  } else if (estimatedBP.systolic > 120 || estimatedBP.diastolic > 80) {
    riskScore += 10;
    factors.push('Pre-hypertensive range');
    recommendations.push('Maintain healthy lifestyle');
  }

  // Age factor
  if (age > 50) {
    riskScore += 10;
    factors.push('Age-related risk factor');
  }

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  if (riskScore < 30) {
    riskLevel = 'low';
  } else if (riskScore < 50) {
    riskLevel = 'moderate';
  } else if (riskScore < 70) {
    riskLevel = 'high';
  } else {
    riskLevel = 'very-high';
  }

  // General recommendations
  if (riskLevel === 'high' || riskLevel === 'very-high') {
    recommendations.push('Consult with healthcare provider for comprehensive cardiovascular assessment');
    recommendations.push('Consider regular cardiovascular monitoring');
  }

  return {
    riskScore: Math.min(100, Math.max(0, Math.round(riskScore))),
    riskLevel,
    factors,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  };
}

