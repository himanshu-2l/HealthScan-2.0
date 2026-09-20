/**
 * Mental Health Scoring Utilities
 * Standardized scoring algorithms for PHQ-9 (Depression) and GAD-7 (Anxiety)
 * 
 * @references
 * - PHQ-9: Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-613.
 * - GAD-7: Spitzer RL, Kroenke K, Williams JB, Löwe B. A brief measure for assessing generalized anxiety disorder. Arch Intern Med. 2006;166(10):1092-1097.
 */

/** Risk level categorization for clinical decision support */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** PHQ-9 severity levels per standardized scoring (0-27 scale) */
export type PHQ9Severity = 'minimal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe';

/** GAD-7 severity levels per standardized scoring (0-21 scale) */
export type GAD7Severity = 'minimal' | 'mild' | 'moderate' | 'severe';

/**
 * PHQ-9 scoring thresholds (evidence-based)
 * @see https://www.phqscreeners.com/
 */
export const PHQ9_THRESHOLDS = {
  MINIMAL: { min: 0, max: 4 },
  MILD: { min: 5, max: 9 },
  MODERATE: { min: 10, max: 14 },
  MODERATELY_SEVERE: { min: 15, max: 19 },
  SEVERE: { min: 20, max: 27 }
} as const;

/**
 * GAD-7 scoring thresholds (evidence-based)
 * @see https://www.phqscreeners.com/
 */
export const GAD7_THRESHOLDS = {
  MINIMAL: { min: 0, max: 4 },
  MILD: { min: 5, max: 9 },
  MODERATE: { min: 10, max: 14 },
  SEVERE: { min: 15, max: 21 }
} as const;

export interface PHQ9Result {
  score: number;
  severity: PHQ9Severity;
  interpretation: string;
  recommendations: string[];
  riskLevel: RiskLevel;
  suicidalIdeationFlag: boolean;
  clinicalAction: string;
}

export interface GAD7Result {
  score: number;
  severity: GAD7Severity;
  interpretation: string;
  recommendations: string[];
  riskLevel: RiskLevel;
  clinicalAction: string;
}

/**
 * Score PHQ-9 questionnaire (0-27 scale)
 * Each item scored 0-3: 0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day
 * 
 * @param answers - Array of 9 answers, each value 0-3
 * @param suicidalIdeationAnswer - Optional: specifically question 9 answer (thoughts of self-harm)
 * @returns PHQ9Result with score, severity, and clinical recommendations
 * 
 * @reference Kroenke K, Spitzer RL, Williams JB. The PHQ-9. J Gen Intern Med. 2001;16(9):606-613
 */
export function scorePHQ9(answers: number[], suicidalIdeationAnswer?: number): PHQ9Result {
  if (answers.length !== 9) {
    throw new Error('PHQ-9 requires exactly 9 answers');
  }

  // Validate each answer is in valid range (0-3)
  answers.forEach((answer, index) => {
    if (answer < 0 || answer > 3 || !Number.isInteger(answer)) {
      throw new Error(`Invalid answer at position ${index + 1}: must be 0, 1, 2, or 3`);
    }
  });

  const score = answers.reduce((sum, val) => sum + val, 0);
  
  // Question 9 specifically asks about suicidal ideation
  const q9Score = suicidalIdeationAnswer ?? answers[8];
  const suicidalIdeationFlag = q9Score > 0;
  
  let severity: PHQ9Severity;
  let interpretation: string;
  let riskLevel: RiskLevel;
  let clinicalAction: string;
  const recommendations: string[] = [];

  if (score <= PHQ9_THRESHOLDS.MINIMAL.max) {
    severity = 'minimal';
    riskLevel = 'low';
    interpretation = 'Minimal or no depression symptoms (score 0-4). Your responses suggest good mental well-being.';
    clinicalAction = 'None required. Continue supportive care and watchful monitoring.';
    recommendations.push('Maintain current healthy habits');
    recommendations.push('Continue regular exercise and social activities');
  } else if (score <= PHQ9_THRESHOLDS.MILD.max) {
    severity = 'mild';
    riskLevel = 'low';
    interpretation = 'Mild depression symptoms (score 5-9). You may benefit from self-care strategies and monitoring.';
    clinicalAction = 'Watchful waiting; repeat PHQ-9 at follow-up. Consider lifestyle modifications.';
    recommendations.push('Practice stress management techniques');
    recommendations.push('Maintain regular sleep schedule (7-9 hours)');
    recommendations.push('Engage in physical activity (30 min/day)');
    recommendations.push('Consider talking to a mental health professional');
  } else if (score <= PHQ9_THRESHOLDS.MODERATE.max) {
    severity = 'moderate';
    riskLevel = 'medium';
    interpretation = 'Moderate depression symptoms (score 10-14). Professional support is recommended.';
    clinicalAction = 'Treatment plan recommended: consider counseling, psychotherapy, and/or pharmacotherapy.';
    recommendations.push('Consult with a mental health professional');
    recommendations.push('Consider cognitive behavioral therapy (CBT)');
    recommendations.push('Practice self-care and stress reduction');
    recommendations.push('Maintain social connections');
  } else if (score <= PHQ9_THRESHOLDS.MODERATELY_SEVERE.max) {
    severity = 'moderately-severe';
    riskLevel = 'high';
    interpretation = 'Moderately severe depression symptoms (score 15-19). Active treatment is strongly recommended.';
    clinicalAction = 'Active treatment with pharmacotherapy and/or psychotherapy required.';
    recommendations.push('Seek professional mental health support promptly');
    recommendations.push('Consider combined therapy and medication evaluation');
    recommendations.push('Reach out to trusted friends or family');
    recommendations.push('Consider crisis support resources if needed');
  } else {
    severity = 'severe';
    riskLevel = 'critical';
    interpretation = 'Severe depression symptoms (score 20-27). Immediate professional support is essential.';
    clinicalAction = 'Immediate initiation of pharmacotherapy and expedited referral to mental health specialist.';
    recommendations.push('Seek immediate professional mental health support');
    recommendations.push('Contact a mental health crisis line if needed');
    recommendations.push('Reach out to healthcare provider immediately');
    recommendations.push('Consider emergency services if experiencing suicidal thoughts');
  }

  // Elevate risk level if suicidal ideation is present
  if (suicidalIdeationFlag) {
    if (riskLevel === 'low') riskLevel = 'medium';
    else if (riskLevel === 'medium') riskLevel = 'high';
    else if (riskLevel === 'high') riskLevel = 'critical';
    recommendations.unshift('Suicidal ideation indicated - immediate safety assessment recommended');
    clinicalAction = clinicalAction + ' URGENT: Conduct suicide risk assessment.';
  }

  return { score, severity, interpretation, recommendations, riskLevel, suicidalIdeationFlag, clinicalAction };
}

/**
 * Score GAD-7 questionnaire (0-21 scale)
 * Each item scored 0-3: 0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day
 * 
 * @param answers - Array of 7 answers, each value 0-3
 * @returns GAD7Result with score, severity, and clinical recommendations
 * 
 * @reference Spitzer RL, Kroenke K, Williams JB, Löwe B. Arch Intern Med. 2006;166(10):1092-1097
 */
export function scoreGAD7(answers: number[]): GAD7Result {
  if (answers.length !== 7) {
    throw new Error('GAD-7 requires exactly 7 answers');
  }

  // Validate each answer is in valid range (0-3)
  answers.forEach((answer, index) => {
    if (answer < 0 || answer > 3 || !Number.isInteger(answer)) {
      throw new Error(`Invalid answer at position ${index + 1}: must be 0, 1, 2, or 3`);
    }
  });

  const score = answers.reduce((sum, val) => sum + val, 0);
  
  let severity: GAD7Severity;
  let interpretation: string;
  let riskLevel: RiskLevel;
  let clinicalAction: string;
  const recommendations: string[] = [];

  if (score <= GAD7_THRESHOLDS.MINIMAL.max) {
    severity = 'minimal';
    riskLevel = 'low';
    interpretation = 'Minimal or no anxiety symptoms (score 0-4). Your responses suggest good mental well-being.';
    clinicalAction = 'None required. Continue supportive care.';
    recommendations.push('Maintain current healthy habits');
    recommendations.push('Continue stress management practices');
  } else if (score <= GAD7_THRESHOLDS.MILD.max) {
    severity = 'mild';
    riskLevel = 'low';
    interpretation = 'Mild anxiety symptoms (score 5-9). Self-care strategies may be helpful.';
    clinicalAction = 'Watchful waiting; repeat GAD-7 at follow-up. Consider lifestyle modifications.';
    recommendations.push('Practice relaxation techniques (deep breathing, meditation)');
    recommendations.push('Maintain regular sleep schedule (7-9 hours)');
    recommendations.push('Limit caffeine and alcohol intake');
    recommendations.push('Consider talking to a mental health professional');
  } else if (score <= GAD7_THRESHOLDS.MODERATE.max) {
    severity = 'moderate';
    riskLevel = 'medium';
    interpretation = 'Moderate anxiety symptoms (score 10-14). Professional support is recommended.';
    clinicalAction = 'Consider counseling, psychotherapy, and/or pharmacotherapy evaluation.';
    recommendations.push('Consult with a mental health professional');
    recommendations.push('Consider cognitive behavioral therapy (CBT)');
    recommendations.push('Practice mindfulness and relaxation techniques');
    recommendations.push('Maintain healthy lifestyle habits');
  } else {
    severity = 'severe';
    riskLevel = 'high';
    interpretation = 'Severe anxiety symptoms (score 15-21). Active treatment is strongly recommended.';
    clinicalAction = 'Active treatment with pharmacotherapy and/or psychotherapy required.';
    recommendations.push('Seek professional mental health support promptly');
    recommendations.push('Consider combined therapy and medication evaluation');
    recommendations.push('Practice stress reduction techniques daily');
    recommendations.push('Reach out to trusted support network');
  }

  return { score, severity, interpretation, recommendations, riskLevel, clinicalAction };
}

/**
 * Calculate overall mental health score (0-100)
 */
export function calculateMentalHealthScore(
  phq9Result: PHQ9Result,
  gad7Result: GAD7Result
): {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  interpretation: string;
  recommendations: string[];
} {
  // Invert scores (higher PHQ-9/GAD-7 = lower health score)
  const phq9HealthScore = Math.max(0, 100 - (phq9Result.score / 27) * 100);
  const gad7HealthScore = Math.max(0, 100 - (gad7Result.score / 21) * 100);
  
  // Weighted average (PHQ-9 slightly more weight)
  const overallScore = Math.round((phq9HealthScore * 0.55) + (gad7HealthScore * 0.45));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  const recommendations: string[] = [];

  if (overallScore >= 80) {
    riskLevel = 'low';
  } else if (overallScore >= 60) {
    riskLevel = 'medium';
  } else if (overallScore >= 40) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  // Combine recommendations
  const allRecommendations = [...phq9Result.recommendations, ...gad7Result.recommendations];
  const uniqueRecommendations = [...new Set(allRecommendations)];
  recommendations.push(...uniqueRecommendations);

  let interpretation = `Overall Mental Health Score: ${overallScore}/100. `;
  interpretation += `Depression (PHQ-9): ${phq9Result.severity}, Anxiety (GAD-7): ${gad7Result.severity}. `;
  
  if (riskLevel === 'low') {
    interpretation += 'Your mental health appears to be in good condition.';
  } else if (riskLevel === 'medium') {
    interpretation += 'Some mental health concerns detected. Consider self-care and monitoring.';
  } else if (riskLevel === 'high') {
    interpretation += 'Significant mental health concerns detected. Professional support is recommended.';
  } else {
    interpretation += 'Severe mental health concerns detected. Immediate professional support is strongly recommended.';
  }

  return {
    overallScore,
    riskLevel,
    interpretation,
    recommendations
  };
}

/**
 * Get severity description for PHQ-9 score
 * @param score - PHQ-9 score (0-27)
 * @returns Human-readable severity description
 */
export function getPHQ9SeverityDescription(score: number): string {
  if (score <= PHQ9_THRESHOLDS.MINIMAL.max) return 'Minimal depression (0-4)';
  if (score <= PHQ9_THRESHOLDS.MILD.max) return 'Mild depression (5-9)';
  if (score <= PHQ9_THRESHOLDS.MODERATE.max) return 'Moderate depression (10-14)';
  if (score <= PHQ9_THRESHOLDS.MODERATELY_SEVERE.max) return 'Moderately severe depression (15-19)';
  return 'Severe depression (20-27)';
}

/**
 * Get severity description for GAD-7 score
 * @param score - GAD-7 score (0-21)
 * @returns Human-readable severity description
 */
export function getGAD7SeverityDescription(score: number): string {
  if (score <= GAD7_THRESHOLDS.MINIMAL.max) return 'Minimal anxiety (0-4)';
  if (score <= GAD7_THRESHOLDS.MILD.max) return 'Mild anxiety (5-9)';
  if (score <= GAD7_THRESHOLDS.MODERATE.max) return 'Moderate anxiety (10-14)';
  return 'Severe anxiety (15-21)';
}

/**
 * Determine if clinical intervention is recommended based on scores
 * @param phq9Score - PHQ-9 score
 * @param gad7Score - GAD-7 score (optional)
 * @returns Clinical intervention recommendation
 */
export function getClinicalInterventionLevel(
  phq9Score: number,
  gad7Score?: number
): 'none' | 'watchful-waiting' | 'treatment-recommended' | 'urgent-treatment' {
  const maxScore = Math.max(phq9Score, gad7Score ?? 0);
  
  if (phq9Score >= 20 || (gad7Score && gad7Score >= 15)) {
    return 'urgent-treatment';
  }
  if (phq9Score >= 10 || (gad7Score && gad7Score >= 10)) {
    return 'treatment-recommended';
  }
  if (phq9Score >= 5 || (gad7Score && gad7Score >= 5)) {
    return 'watchful-waiting';
  }
  return 'none';
}

/**
 * Calculate combined risk score for depression and anxiety
 * @param phq9Score - PHQ-9 score (0-27)
 * @param gad7Score - GAD-7 score (0-21)
 * @returns Combined risk level and description
 */
export function getCombinedMentalHealthRisk(
  phq9Score: number,
  gad7Score: number
): { riskLevel: RiskLevel; description: string; requiresImmediateAttention: boolean } {
  // Normalize scores to 0-100 scale
  const normalizedPHQ9 = (phq9Score / 27) * 100;
  const normalizedGAD7 = (gad7Score / 21) * 100;
  const combinedRisk = Math.max(normalizedPHQ9, normalizedGAD7);
  
  let riskLevel: RiskLevel;
  let description: string;
  let requiresImmediateAttention = false;

  if (combinedRisk >= 74) { // Severe range
    riskLevel = 'critical';
    description = 'Critical mental health concerns detected. Immediate professional evaluation recommended.';
    requiresImmediateAttention = true;
  } else if (combinedRisk >= 52) { // Moderate-severe range
    riskLevel = 'high';
    description = 'Significant mental health concerns detected. Professional treatment is strongly recommended.';
  } else if (combinedRisk >= 33) { // Moderate range
    riskLevel = 'medium';
    description = 'Moderate mental health concerns detected. Professional support is advisable.';
  } else {
    riskLevel = 'low';
    description = 'Minimal to mild mental health concerns. Continue self-care and monitoring.';
  }

  return { riskLevel, description, requiresImmediateAttention };
}

/**
 * Validate that answers are in the correct format for PHQ-9/GAD-7
 * @param answers - Array of answer values
 * @param expectedLength - Expected number of answers (9 for PHQ-9, 7 for GAD-7)
 * @returns Validation result
 */
export function validateAnswers(
  answers: number[],
  expectedLength: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(answers)) {
    errors.push('Answers must be an array');
    return { valid: false, errors };
  }
  
  if (answers.length !== expectedLength) {
    errors.push(`Expected ${expectedLength} answers, received ${answers.length}`);
  }
  
  answers.forEach((answer, index) => {
    if (typeof answer !== 'number' || isNaN(answer)) {
      errors.push(`Answer ${index + 1} is not a valid number`);
    } else if (answer < 0 || answer > 3 || !Number.isInteger(answer)) {
      errors.push(`Answer ${index + 1} must be 0, 1, 2, or 3`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}


