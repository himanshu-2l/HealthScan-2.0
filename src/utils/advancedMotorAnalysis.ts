/**
 * Advanced Motor Analysis for Parkinson's Detection
 * Clinical-grade algorithms with enhanced accuracy
 * 
 * @references
 * - Movement Disorder Society (MDS) Unified Parkinson's Disease Rating Scale (UPDRS)
 * - Elble RJ, Deuschl G. Milestones in tremor research. Mov Disord. 2011
 * - Haubenberger D, et al. The Unified Parkinson's Disease Rating Scale
 */

import { robustStatistics, validateDataQuality, calculateAccuracyScore } from './statisticalAccuracy';

// Clinical thresholds based on peer-reviewed research
const CLINICAL_THRESHOLDS = {
  // Bradykinesia detection (finger tapping rate)
  // Normal: 5-8 taps/sec, Mild impairment: 3-5, Moderate: 2-3, Severe: <2
  BRADYKINESIA: {
    NORMAL: { min: 5, max: 12, severity: 0 },
    MILD: { min: 3, max: 5, severity: 1 },
    MODERATE: { min: 2, max: 3, severity: 2 },
    SEVERE: { max: 2, severity: 3 }
  },
  
  // Tremor frequency bands (Hz)
  // Parkinson's rest tremor: 4-6 Hz
  // Essential tremor: 6-12 Hz
  // Physiological: <4 Hz
  TREMOR: {
    PHYSIOLOGICAL: { max: 4, label: 'physiological' },
    PARKINSONS: { min: 4, max: 6, label: 'parkinsonian_rest' },
    ESSENTIAL: { min: 6, max: 12, label: 'essential' },
    HIGH_FREQUENCY: { min: 12, label: 'high_frequency' }
  },
  
  // Rhythm variability (Coefficient of Variation %)
  // Lower CV = more regular = healthier
  RHYTHM: {
    EXCELLENT: { max: 10 },
    GOOD: { min: 10, max: 20 },
    FAIR: { min: 20, max: 35 },
    POOR: { min: 35 }
  },
  
  // Fatigue index (deceleration during test)
  FATIGUE: {
    NORMAL: { max: 15 },
    MILD: { min: 15, max: 30 },
    MODERATE: { min: 30, max: 50 },
    SEVERE: { min: 50 }
  }
};

/**
 * Calculate finger tapping fatigue index
 * Measures deceleration during the test (early sign of Parkinson's)
 * @param tapIntervals Array of tap intervals in ms
 * @returns Fatigue index (0-100, higher = more fatigue)
 */
export function calculateFatigueIndex(tapIntervals: number[]): number {
  if (tapIntervals.length < 10) return 0;
  
  // Split test into first and second half
  const mid = Math.floor(tapIntervals.length / 2);
  const firstHalf = tapIntervals.slice(0, mid);
  const secondHalf = tapIntervals.slice(mid);
  
  const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  // Fatigue = percentage increase in interval (slower tapping)
  if (firstMean === 0) return 0;
  const fatigue = ((secondMean - firstMean) / firstMean) * 100;
  
  return Math.max(0, Math.min(100, fatigue));
}

/**
 * Calculate amplitude decay (another fatigue indicator)
 * @param tremorSamples Array of tremor amplitude samples
 * @returns Amplitude decay percentage
 */
export function calculateAmplitudeDecay(tremorSamples: { t: number; y: number }[]): number {
  if (tremorSamples.length < 20) return 0;
  
  const mid = Math.floor(tremorSamples.length / 2);
  const firstHalf = tremorSamples.slice(0, mid);
  const secondHalf = tremorSamples.slice(mid);
  
  // Calculate amplitude (standard deviation) for each half
  const calcAmp = (samples: typeof tremorSamples) => {
    const ys = samples.map(s => s.y);
    const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
    const variance = ys.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0) / ys.length;
    return Math.sqrt(variance);
  };
  
  const firstAmp = calcAmp(firstHalf);
  const secondAmp = calcAmp(secondHalf);
  
  if (firstAmp === 0) return 0;
  return Math.max(0, ((firstAmp - secondAmp) / firstAmp) * 100);
}

/**
 * Analyze tapping rhythm patterns
 * Detects arrhythmia (irregular timing) which indicates motor control issues
 * @param tapIntervals Array of tap intervals in ms
 * @returns Rhythm analysis result
 */
export function analyzeRhythmPattern(tapIntervals: number[]): {
  regularity: 'regular' | 'mildly_irregular' | 'irregular' | 'severely_irregular';
  cv: number;
  consecutiveVariation: number;
  pauseCount: number;
  freezeEvents: number;
} {
  if (tapIntervals.length < 5) {
    return {
      regularity: 'regular',
      cv: 0,
      consecutiveVariation: 0,
      pauseCount: 0,
      freezeEvents: 0
    };
  }
  
  const stats = robustStatistics(tapIntervals, true);
  const cv = stats.cv;
  
  // Detect consecutive variations (sudden changes in rhythm)
  let consecutiveVariation = 0;
  for (let i = 1; i < tapIntervals.length; i++) {
    const prev = tapIntervals[i - 1];
    const curr = tapIntervals[i];
    if (prev > 0) {
      const variation = Math.abs(curr - prev) / prev;
      if (variation > 0.5) consecutiveVariation++;
    }
  }
  
  // Detect pauses (>2x normal interval)
  const meanInterval = stats.mean;
  const pauseCount = tapIntervals.filter(interval => interval > meanInterval * 2).length;
  
  // Detect freeze events (>3x normal interval)
  const freezeEvents = tapIntervals.filter(interval => interval > meanInterval * 3).length;
  
  // Classify regularity
  let regularity: 'regular' | 'mildly_irregular' | 'irregular' | 'severely_irregular';
  if (cv < 15 && consecutiveVariation < 3) {
    regularity = 'regular';
  } else if (cv < 25 && consecutiveVariation < 5) {
    regularity = 'mildly_irregular';
  } else if (cv < 40 && freezeEvents === 0) {
    regularity = 'irregular';
  } else {
    regularity = 'severely_irregular';
  }
  
  return {
    regularity,
    cv,
    consecutiveVariation,
    pauseCount,
    freezeEvents
  };
}

/**
 * Advanced tremor analysis with spectral decomposition
 * @param tremorSamples Array of {t, y} tremor samples
 * @param videoHeight Video height for normalization
 * @returns Detailed tremor analysis
 */
export function analyzeTremorAdvanced(
  tremorSamples: { t: number; y: number }[],
  videoHeight: number
): {
  dominantFrequency: number;
  amplitude: number;
  amplitudeNormalized: number;
  confidence: number;
  type: 'none' | 'physiological' | 'parkinsonian_rest' | 'essential' | 'high_frequency' | 'mixed';
  harmonicContent: number;
  stability: number;
} {
  if (tremorSamples.length < 30) {
    return {
      dominantFrequency: 0,
      amplitude: 0,
      amplitudeNormalized: 0,
      confidence: 0,
      type: 'none',
      harmonicContent: 0,
      stability: 0
    };
  }
  
  const ys = tremorSamples.map(s => s.y);
  const ts = tremorSamples.map(s => s.t);
  const n = ys.length;
  
  // Calculate sampling rate
  const durationMs = ts[n - 1] - ts[0];
  const fs = durationMs > 0 ? (n - 1) / (durationMs / 1000) : 30;
  
  // Perform FFT for frequency analysis
  const fft = performFFT(ys);
  const frequencies = fft.frequencies.filter(f => f >= 0.5 && f <= 25); // Focus on tremor range
  const magnitudes = fft.magnitudes.slice(0, frequencies.length);
  
  // Find dominant frequency
  let maxMag = 0;
  let dominantFreq = 0;
  for (let i = 0; i < frequencies.length; i++) {
    if (magnitudes[i] > maxMag) {
      maxMag = magnitudes[i];
      dominantFreq = frequencies[i];
    }
  }
  
  // Calculate amplitude
  const mean = ys.reduce((a, b) => a + b, 0) / n;
  const variance = ys.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0) / n;
  const amplitude = Math.sqrt(variance);
  const amplitudeNormalized = amplitude / videoHeight;
  
  // Calculate harmonic content (ratio of harmonic power to fundamental)
  const fundamentalIdx = frequencies.indexOf(dominantFreq);
  let harmonicPower = 0;
  if (fundamentalIdx >= 0) {
    for (let i = 2; i <= 4; i++) {
      const harmonicFreq = dominantFreq * i;
      const harmonicIdx = frequencies.findIndex(f => Math.abs(f - harmonicFreq) < 0.5);
      if (harmonicIdx >= 0) {
        harmonicPower += magnitudes[harmonicIdx];
      }
    }
  }
  const harmonicContent = maxMag > 0 ? harmonicPower / maxMag : 0;
  
  // Calculate stability (consistency of frequency over time)
  const windowSize = Math.floor(n / 4);
  const freqWindows: number[] = [];
  for (let i = 0; i < n - windowSize; i += windowSize / 2) {
    const windowYs = ys.slice(i, i + windowSize);
    const windowFft = performFFT(windowYs);
    const windowFs = windowFft.frequencies.filter(f => f >= 0.5 && f <= 25);
    const windowMs = windowFft.magnitudes.slice(0, windowFs.length);
    let maxM = 0;
    let domF = 0;
    for (let j = 0; j < windowFs.length; j++) {
      if (windowMs[j] > maxM) {
        maxM = windowMs[j];
        domF = windowFs[j];
      }
    }
    if (domF > 0) freqWindows.push(domF);
  }
  
  const stability = freqWindows.length > 1
    ? 1 - (standardDeviation(freqWindows) / (freqWindows.reduce((a, b) => a + b, 0) / freqWindows.length))
    : 0;
  
  // Determine tremor type
  let type: 'none' | 'physiological' | 'parkinsonian_rest' | 'essential' | 'high_frequency' | 'mixed';
  if (dominantFreq === 0 || amplitudeNormalized < 0.001) {
    type = 'none';
  } else if (dominantFreq >= 4 && dominantFreq <= 6 && stability > 0.7) {
    type = 'parkinsonian_rest';
  } else if (dominantFreq >= 6 && dominantFreq <= 12) {
    type = 'essential';
  } else if (dominantFreq > 12) {
    type = 'high_frequency';
  } else if (dominantFreq < 4) {
    type = 'physiological';
  } else {
    type = 'mixed';
  }
  
  // Calculate confidence based on signal quality
  const snr = maxMag / (magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length);
  const confidence = Math.min(100, (snr * 10) + (stability * 30) + (n / 10));
  
  return {
    dominantFrequency: dominantFreq,
    amplitude,
    amplitudeNormalized,
    confidence,
    type,
    harmonicContent,
    stability: Math.max(0, stability * 100)
  };
}

/**
 * Simple FFT implementation for tremor analysis
 * @param signal Input signal array
 * @returns Frequencies and magnitudes
 */
function performFFT(signal: number[]): { frequencies: number[]; magnitudes: number[] } {
  const n = signal.length;
  if (n === 0) return { frequencies: [], magnitudes: [] };
  
  // Remove DC component (mean)
  const mean = signal.reduce((a, b) => a + b, 0) / n;
  const centered = signal.map(x => x - mean);
  
  // Simple DFT (sufficient for small samples)
  const magnitudes: number[] = [];
  const frequencies: number[] = [];
  
  const sampleRate = 30; // Approximate webcam frame rate
  const maxFreq = sampleRate / 2; // Nyquist
  
  for (let k = 0; k < n / 2; k++) {
    let real = 0;
    let imag = 0;
    for (let t = 0; t < n; t++) {
      const angle = -2 * Math.PI * k * t / n;
      real += centered[t] * Math.cos(angle);
      imag += centered[t] * Math.sin(angle);
    }
    
    const magnitude = Math.sqrt(real * real + imag * imag) / n;
    const frequency = k * sampleRate / n;
    
    if (frequency <= maxFreq) {
      magnitudes.push(magnitude);
      frequencies.push(frequency);
    }
  }
  
  return { frequencies, magnitudes };
}

function standardDeviation(data: number[]): number {
  if (data.length < 2) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculate comprehensive Parkinson's risk score
 * Uses weighted multi-factor analysis
 * @param metrics Motor metrics object
 * @returns Risk assessment with confidence
 */
export function calculateParkinsonsRiskScore(metrics: {
  tapRate: number;
  coordinationScore: number;
  tremorFrequency: number;
  tremorAmplitude: number;
  tremorType: string;
  fatigueIndex: number;
  rhythmRegularity: string;
  freezeEvents: number;
}): {
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  confidence: number;
  score: number; // 0-100
  indicators: string[];
  primaryIndicators: string[];
} {
  let score = 0;
  const indicators: string[] = [];
  const primaryIndicators: string[] = [];
  
  // Bradykinesia scoring (weight: 35%)
  if (metrics.tapRate < 2) {
    score += 35;
    indicators.push('Severe bradykinesia (<' + metrics.tapRate.toFixed(1) + ' taps/sec)');
    primaryIndicators.push('Severe bradykinesia');
  } else if (metrics.tapRate < 3) {
    score += 25;
    indicators.push('Moderate bradykinesia');
    primaryIndicators.push('Moderate bradykinesia');
  } else if (metrics.tapRate < 4) {
    score += 15;
    indicators.push('Mild bradykinesia');
  } else if (metrics.tapRate < 5) {
    score += 8;
    indicators.push('Borderline bradykinesia');
  }
  
  // Tremor analysis (weight: 25%)
  if (metrics.tremorType === 'parkinsonian_rest' && metrics.tremorFrequency >= 4 && metrics.tremorFrequency <= 6) {
    score += 25;
    indicators.push(`Parkinsonian rest tremor (${metrics.tremorFrequency.toFixed(1)} Hz)`);
    primaryIndicators.push('Parkinsonian rest tremor');
  } else if (metrics.tremorType === 'essential') {
    score += 10;
    indicators.push('Essential tremor pattern');
  }
  
  // Coordination impairment (weight: 15%)
  if (metrics.coordinationScore < 40) {
    score += 15;
    indicators.push('Severe coordination impairment');
    primaryIndicators.push('Severe coordination impairment');
  } else if (metrics.coordinationScore < 60) {
    score += 10;
    indicators.push('Moderate coordination impairment');
  } else if (metrics.coordinationScore < 75) {
    score += 5;
    indicators.push('Mild coordination impairment');
  }
  
  // Fatigue index (weight: 15%)
  if (metrics.fatigueIndex > 40) {
    score += 15;
    indicators.push('Severe motor fatigue');
    primaryIndicators.push('Severe motor fatigue');
  } else if (metrics.fatigueIndex > 25) {
    score += 10;
    indicators.push('Moderate motor fatigue');
  } else if (metrics.fatigueIndex > 15) {
    score += 5;
    indicators.push('Mild motor fatigue');
  }
  
  // Rhythm irregularity (weight: 10%)
  if (metrics.rhythmRegularity === 'severely_irregular' || metrics.freezeEvents > 2) {
    score += 10;
    indicators.push('Severe rhythm irregularity / Motor freezing');
    primaryIndicators.push('Motor freezing episodes');
  } else if (metrics.rhythmRegularity === 'irregular') {
    score += 7;
    indicators.push('Irregular rhythm');
  } else if (metrics.rhythmRegularity === 'mildly_irregular') {
    score += 3;
    indicators.push('Mildly irregular rhythm');
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  if (score >= 60) {
    riskLevel = 'very_high';
  } else if (score >= 40) {
    riskLevel = 'high';
  } else if (score >= 20) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }
  
  // Calculate confidence based on data quality
  const confidence = Math.min(95, 50 + 
    (metrics.tapRate > 0 ? 15 : 0) +
    (metrics.tremorFrequency > 0 ? 15 : 0) +
    (primaryIndicators.length > 0 ? 15 : 0)
  );
  
  return {
    riskLevel,
    confidence,
    score: Math.min(100, score),
    indicators,
    primaryIndicators
  };
}

/**
 * Calculate overall motor function quality score
 * @param metrics All motor metrics
 * @returns Quality score (0-100) and grade
 */
export function calculateMotorQualityScore(metrics: {
  tapRate: number;
  coordinationScore: number;
  tremorAmplitude: number;
  fatigueIndex: number;
  rhythmCV: number;
}): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  category: 'excellent' | 'good' | 'fair' | 'poor' | 'impaired';
  percentiles: {
    speed: number;
    coordination: number;
    stability: number;
    endurance: number;
  };
} {
  // Calculate individual component scores (0-100)
  const speedScore = Math.min(100, (metrics.tapRate / 8) * 100); // 8 taps/sec = 100%
  const coordinationScore = metrics.coordinationScore;
  const stabilityScore = Math.max(0, 100 - metrics.rhythmCV);
  const enduranceScore = Math.max(0, 100 - metrics.fatigueIndex);
  
  // Weighted average
  const overallScore = Math.round(
    speedScore * 0.25 +
    coordinationScore * 0.30 +
    stabilityScore * 0.25 +
    enduranceScore * 0.20
  );
  
  // Determine grade and category
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let category: 'excellent' | 'good' | 'fair' | 'poor' | 'impaired';
  
  if (overallScore >= 90) {
    grade = 'A';
    category = 'excellent';
  } else if (overallScore >= 80) {
    grade = 'B';
    category = 'good';
  } else if (overallScore >= 70) {
    grade = 'C';
    category = 'fair';
  } else if (overallScore >= 60) {
    grade = 'D';
    category = 'poor';
  } else {
    grade = 'F';
    category = 'impaired';
  }
  
  return {
    score: overallScore,
    grade,
    category,
    percentiles: {
      speed: Math.round(speedScore),
      coordination: Math.round(coordinationScore),
      stability: Math.round(stabilityScore),
      endurance: Math.round(enduranceScore)
    }
  };
}

export default {
  calculateFatigueIndex,
  calculateAmplitudeDecay,
  analyzeRhythmPattern,
  analyzeTremorAdvanced,
  calculateParkinsonsRiskScore,
  calculateMotorQualityScore,
  CLINICAL_THRESHOLDS
};

// Type exports for consumers
export type AdvancedTremorResult = ReturnType<typeof analyzeTremorAdvanced>;
export type RhythmPatternResult = ReturnType<typeof analyzeRhythmPattern>;
export type ParkinsonsRiskResult = ReturnType<typeof calculateParkinsonsRiskScore>;
export type MotorQualityResult = ReturnType<typeof calculateMotorQualityScore>;
