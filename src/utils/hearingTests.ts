/**
 * Hearing Test Utilities
 * Frequency range detection, dB threshold assessment, and hearing loss classification
 * 
 * @references
 * - World Health Organization. Report of the Informal Working Group on Prevention of Deafness and Hearing Impairment. 1991.
 * - American Speech-Language-Hearing Association. Degree of Hearing Loss Classification.
 * - Clark JG. Uses and abuses of hearing loss classification. ASHA. 1981;23:493-500.
 */

/**
 * Hearing Loss Classification by decibel threshold (dB HL)
 * Based on pure-tone average (PTA) at 500, 1000, 2000 Hz
 * @reference WHO and ASHA classification standards
 */
export const HEARING_LOSS_RANGES = {
  NORMAL: { min: -10, max: 25, label: 'Normal', description: 'Normal hearing sensitivity' },
  MILD: { min: 26, max: 40, label: 'Mild', description: 'Mild hearing loss - difficulty with soft speech' },
  MODERATE: { min: 41, max: 55, label: 'Moderate', description: 'Moderate hearing loss - difficulty with normal conversation' },
  MODERATELY_SEVERE: { min: 56, max: 70, label: 'Moderately Severe', description: 'Moderately severe hearing loss - difficulty even with loud speech' },
  SEVERE: { min: 71, max: 90, label: 'Severe', description: 'Severe hearing loss - can only hear very loud sounds' },
  PROFOUND: { min: 91, label: 'Profound', description: 'Profound hearing loss - may not hear most sounds' }
} as const;

/**
 * Standard audiometric test frequencies (Hz)
 */
export const STANDARD_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000] as const;

/**
 * Speech frequency range for pure-tone average calculation
 */
export const SPEECH_FREQUENCIES = [500, 1000, 2000] as const;

/** Hearing loss level classification */
export type HearingLossLevel = 'normal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe' | 'profound';

export interface HearingTestResult {
  frequencyRange: {
    lowFreq: number;      // Lowest detectable frequency (Hz)
    highFreq: number;     // Highest detectable frequency (Hz)
    score: number;        // 0-100
    interpretation: string;
  };
  sensitivity: {
    leftEar: number;      // 0-100 (inverted from dB - higher score = better hearing)
    rightEar: number;     // 0-100
    average: number;      // 0-100
    leftEarDBHL: number;  // Pure-tone average in dB HL
    rightEarDBHL: number; // Pure-tone average in dB HL
    hearingLossLevel: HearingLossLevel;
    interpretation: string;
  };
  overallScore: number;
  recommendations: string[];
  asymmetry: {
    present: boolean;
    difference: number;   // dB difference between ears
    requiresReferral: boolean;
  };
}

/**
 * Classify hearing loss level based on pure-tone average
 * @param ptaDBHL - Pure-tone average in dB HL
 * @returns Hearing loss classification with description
 * 
 * @reference WHO Grades of Hearing Impairment
 */
export function classifyHearingLoss(ptaDBHL: number): {
  level: HearingLossLevel;
  label: string;
  description: string;
} {
  if (ptaDBHL <= HEARING_LOSS_RANGES.NORMAL.max) {
    return { level: 'normal', ...HEARING_LOSS_RANGES.NORMAL };
  }
  if (ptaDBHL <= HEARING_LOSS_RANGES.MILD.max) {
    return { level: 'mild', ...HEARING_LOSS_RANGES.MILD };
  }
  if (ptaDBHL <= HEARING_LOSS_RANGES.MODERATE.max) {
    return { level: 'moderate', ...HEARING_LOSS_RANGES.MODERATE };
  }
  if (ptaDBHL <= HEARING_LOSS_RANGES.MODERATELY_SEVERE.max) {
    return { level: 'moderately-severe', ...HEARING_LOSS_RANGES.MODERATELY_SEVERE };
  }
  if (ptaDBHL <= HEARING_LOSS_RANGES.SEVERE.max) {
    return { level: 'severe', ...HEARING_LOSS_RANGES.SEVERE };
  }
  return { level: 'profound', ...HEARING_LOSS_RANGES.PROFOUND };
}

/**
 * Convert dB HL threshold to sensitivity score (0-100)
 * Lower dB threshold = better hearing = higher score
 * @param dbHL - Threshold in dB HL
 */
export function dbHLToSensitivityScore(dbHL: number): number {
  // Normal hearing: -10 to 25 dB = 100-75 score
  // Profound loss: 90+ dB = 0-10 score
  const score = Math.max(0, Math.min(100, 100 - ((dbHL + 10) / 100) * 100));
  return Math.round(score);
}

/**
 * Calculate pure-tone average (PTA) from threshold values
 * Uses speech frequencies (500, 1000, 2000 Hz)
 * 
 * @param thresholds - Object mapping frequency to dB threshold
 * @returns Pure-tone average in dB HL
 */
export function calculatePTA(thresholds: { [frequency: number]: number }): number {
  const speechThresholds: number[] = [];
  
  for (const freq of SPEECH_FREQUENCIES) {
    if (thresholds[freq] !== undefined) {
      speechThresholds.push(thresholds[freq]);
    }
  }
  
  if (speechThresholds.length === 0) {
    // Fallback to all available thresholds
    const allThresholds = Object.values(thresholds).filter(v => typeof v === 'number');
    if (allThresholds.length === 0) return 0;
    return allThresholds.reduce((a, b) => a + b, 0) / allThresholds.length;
  }
  
  return speechThresholds.reduce((a, b) => a + b, 0) / speechThresholds.length;
}

/**
 * Check for significant asymmetry between ears
 * Asymmetry > 15-20 dB typically requires medical referral
 * 
 * @param leftPTA - Left ear pure-tone average
 * @param rightPTA - Right ear pure-tone average
 */
export function checkAsymmetry(leftPTA: number, rightPTA: number): {
  present: boolean;
  difference: number;
  requiresReferral: boolean;
} {
  const difference = Math.abs(leftPTA - rightPTA);
  return {
    present: difference > 10,
    difference: Math.round(difference),
    requiresReferral: difference > 15 // ASHA guideline for referral
  };
}

/**
 * Analyze hearing test results with dB threshold scoring
 * 
 * @param detectedFrequencies - Array of detected frequencies in Hz
 * @param leftEarResponses - Boolean array of left ear responses (true = detected)
 * @param rightEarResponses - Boolean array of right ear responses (true = detected)
 * @param leftEarThresholds - Optional: dB thresholds for left ear by frequency
 * @param rightEarThresholds - Optional: dB thresholds for right ear by frequency
 * @returns Complete hearing test analysis with dB-based classification
 * 
 * @reference ASHA Guidelines for Audiologic Screening
 */
export function analyzeHearingTest(
  detectedFrequencies: number[], // Hz
  leftEarResponses: boolean[],
  rightEarResponses: boolean[],
  leftEarThresholds?: { [frequency: number]: number },
  rightEarThresholds?: { [frequency: number]: number }
): HearingTestResult {
  // Calculate frequency range
  const lowFreq = detectedFrequencies.length > 0 ? Math.min(...detectedFrequencies) : 0;
  const highFreq = detectedFrequencies.length > 0 ? Math.max(...detectedFrequencies) : 0;
  
  // Normal human hearing: 20 Hz to 20,000 Hz (decreases with age)
  // Practical audiometric range: 250 Hz to 8,000 Hz
  const normalRange = 8000 - 250; // Clinical range
  const detectedRange = Math.max(0, highFreq - lowFreq);
  const frequencyScore = Math.min(100, (detectedRange / normalRange) * 100);

  let frequencyInterpretation: string;
  if (highFreq >= 8000 && lowFreq <= 500) {
    frequencyInterpretation = 'Excellent frequency range (250-8000 Hz). Full speech frequency coverage.';
  } else if (highFreq >= 4000 && lowFreq <= 500) {
    frequencyInterpretation = 'Good frequency range covering most speech frequencies.';
  } else if (highFreq >= 2000) {
    frequencyInterpretation = 'Moderate frequency range. Some high-frequency loss may be present (common with age or noise exposure).';
  } else {
    frequencyInterpretation = 'Reduced frequency range. Significant high-frequency hearing loss detected. Professional audiological evaluation strongly recommended.';
  }

  // Calculate ear sensitivity scores from response arrays
  const leftEarResponseScore = leftEarResponses.length > 0 
    ? (leftEarResponses.filter(r => r).length / leftEarResponses.length) * 100 
    : 0;
  const rightEarResponseScore = rightEarResponses.length > 0 
    ? (rightEarResponses.filter(r => r).length / rightEarResponses.length) * 100 
    : 0;

  // Calculate PTA if threshold data is available, otherwise estimate from response scores
  const leftPTA = leftEarThresholds 
    ? calculatePTA(leftEarThresholds)
    : Math.round((100 - leftEarResponseScore) * 0.9); // Estimate: poor response score = higher threshold
  const rightPTA = rightEarThresholds 
    ? calculatePTA(rightEarThresholds)
    : Math.round((100 - rightEarResponseScore) * 0.9);
  
  // Convert to sensitivity scores (higher = better hearing)
  const leftEarScore = leftEarThresholds 
    ? dbHLToSensitivityScore(leftPTA)
    : Math.round(leftEarResponseScore);
  const rightEarScore = rightEarThresholds 
    ? dbHLToSensitivityScore(rightPTA)
    : Math.round(rightEarResponseScore);
  const averageSensitivity = (leftEarScore + rightEarScore) / 2;
  const averagePTA = (leftPTA + rightPTA) / 2;

  // Classify hearing loss based on average PTA
  const hearingLossClassification = classifyHearingLoss(averagePTA);
  
  // Check for asymmetry
  const asymmetry = checkAsymmetry(leftPTA, rightPTA);

  let sensitivityInterpretation: string;
  if (hearingLossClassification.level === 'normal') {
    sensitivityInterpretation = `Normal hearing sensitivity (PTA: ${averagePTA.toFixed(0)} dB HL). Both ears within normal limits (≤25 dB HL).`;
  } else if (hearingLossClassification.level === 'mild') {
    sensitivityInterpretation = `Mild hearing loss detected (PTA: ${averagePTA.toFixed(0)} dB HL, 26-40 dB). May have difficulty hearing soft speech. Professional evaluation recommended.`;
  } else if (hearingLossClassification.level === 'moderate') {
    sensitivityInterpretation = `Moderate hearing loss detected (PTA: ${averagePTA.toFixed(0)} dB HL, 41-55 dB). Difficulty with normal conversation volume. Audiological evaluation recommended.`;
  } else if (hearingLossClassification.level === 'moderately-severe') {
    sensitivityInterpretation = `Moderately severe hearing loss (PTA: ${averagePTA.toFixed(0)} dB HL, 56-70 dB). Significant difficulty with speech. Hearing aids likely beneficial.`;
  } else if (hearingLossClassification.level === 'severe') {
    sensitivityInterpretation = `Severe hearing loss detected (PTA: ${averagePTA.toFixed(0)} dB HL, 71-90 dB). Can only hear loud sounds. Audiological intervention strongly recommended.`;
  } else {
    sensitivityInterpretation = `Profound hearing loss (PTA: ${averagePTA.toFixed(0)} dB HL, >90 dB). Very limited hearing. Immediate audiological evaluation essential.`;
  }

  // Add asymmetry note if significant
  if (asymmetry.requiresReferral) {
    sensitivityInterpretation += ` IMPORTANT: Significant asymmetry detected (${asymmetry.difference} dB difference between ears). Medical referral recommended to rule out underlying conditions.`;
  }

  // Calculate overall score (weighted: frequency range 30%, sensitivity 70%)
  const overallScore = Math.round((frequencyScore * 0.3) + (averageSensitivity * 0.7));

  // Generate recommendations based on findings
  const recommendations: string[] = [];

  if (overallScore >= 80 && hearingLossClassification.level === 'normal') {
    recommendations.push('Maintain hearing health practices');
    recommendations.push('Use hearing protection in noisy environments (>85 dB)');
    recommendations.push('Schedule hearing checkups every 1-2 years');
  } else if (hearingLossClassification.level === 'mild') {
    recommendations.push('Schedule professional audiological evaluation');
    recommendations.push('Use hearing protection consistently in noisy environments');
    recommendations.push('Consider preferential seating in meetings/classrooms');
    recommendations.push('Ask speakers to face you and speak clearly');
  } else if (hearingLossClassification.level === 'moderate' || hearingLossClassification.level === 'moderately-severe') {
    recommendations.push('Professional audiological evaluation strongly recommended');
    recommendations.push('Discuss hearing aid options with an audiologist');
    recommendations.push('Use assistive listening devices when available');
    recommendations.push('Consider communication strategies training');
  } else if (hearingLossClassification.level === 'severe' || hearingLossClassification.level === 'profound') {
    recommendations.push('Immediate audiological evaluation recommended');
    recommendations.push('Hearing aids or cochlear implant evaluation');
    recommendations.push('Learn visual communication strategies');
    recommendations.push('Consider hearing assistive technology');
  }

  // Add asymmetry-specific recommendation
  if (asymmetry.requiresReferral) {
    recommendations.unshift('Medical referral recommended: Significant hearing difference between ears requires evaluation');
  }

  // Add high-frequency loss recommendation
  if (highFreq < 4000) {
    recommendations.push('High-frequency hearing loss detected - avoid further noise exposure');
  }

  return {
    frequencyRange: {
      lowFreq: Math.round(lowFreq),
      highFreq: Math.round(highFreq),
      score: Math.round(frequencyScore),
      interpretation: frequencyInterpretation
    },
    sensitivity: {
      leftEar: Math.round(leftEarScore),
      rightEar: Math.round(rightEarScore),
      average: Math.round(averageSensitivity),
      leftEarDBHL: Math.round(leftPTA),
      rightEarDBHL: Math.round(rightPTA),
      hearingLossLevel: hearingLossClassification.level,
      interpretation: sensitivityInterpretation
    },
    overallScore,
    recommendations: [...new Set(recommendations)],
    asymmetry
  };
}

