/**
 * Vision Test Utilities
 * Visual acuity, color blindness, and peripheral vision tests
 * 
 * @references
 * - International Council of Ophthalmology. Visual Standards for Driving. 2016.
 * - American Academy of Ophthalmology. Visual Acuity Testing Standards.
 * - World Health Organization. International Classification of Diseases (ICD-11) - Visual Impairment Categories.
 */

import {
  validateDataQuality,
  confidenceInterval
} from './statisticalAccuracy';

/**
 * Visual Acuity Reference Standards (Snellen notation)
 * @reference WHO ICD-11 Visual Impairment Categories
 */
export const VISUAL_ACUITY_STANDARDS = {
  NORMAL: { snellen: '20/20', decimal: 1.0, logMAR: 0.0, description: 'Normal vision' },
  NEAR_NORMAL: { snellen: '20/25', decimal: 0.8, logMAR: 0.1, description: 'Near normal vision' },
  MILD_IMPAIRMENT: { snellen: '20/40', decimal: 0.5, logMAR: 0.3, description: 'Mild vision impairment' },
  MODERATE_IMPAIRMENT: { snellen: '20/70', decimal: 0.29, logMAR: 0.54, description: 'Moderate vision impairment' },
  SEVERE_IMPAIRMENT: { snellen: '20/200', decimal: 0.1, logMAR: 1.0, description: 'Severe vision impairment (legally blind threshold in US)' },
  PROFOUND_IMPAIRMENT: { snellen: '20/400', decimal: 0.05, logMAR: 1.3, description: 'Profound vision impairment' },
  NEAR_BLINDNESS: { snellen: '20/1200', decimal: 0.017, logMAR: 1.78, description: 'Near total blindness' }
} as const;

/**
 * Color Vision Deficiency Types
 * @reference Ishihara test classification
 */
export const COLOR_VISION_TYPES = {
  NORMAL: 'normal',
  PROTANOPIA: 'protanopia',      // Red-blind (missing L-cones)
  PROTANOMALY: 'protanomaly',    // Red-weak (abnormal L-cones)
  DEUTERANOPIA: 'deuteranopia',  // Green-blind (missing M-cones)
  DEUTERANOMALY: 'deuteranomaly', // Green-weak (abnormal M-cones)
  TRITANOPIA: 'tritanopia',      // Blue-blind (missing S-cones)
  TRITANOMALY: 'tritanomaly',    // Blue-weak (abnormal S-cones)
  ACHROMATOPSIA: 'achromatopsia', // Total color blindness
  UNKNOWN: 'unknown'
} as const;

/** Visual impairment level classification */
export type VisualImpairmentLevel = 'normal' | 'near-normal' | 'mild' | 'moderate' | 'severe' | 'profound' | 'near-blindness';

export interface VisionTestResult {
  visualAcuity: {
    score: number; // 0-100
    snellenEquivalent: string; // e.g., "20/20"
    snellenFraction: { numerator: number; denominator: number };
    decimalAcuity: number; // 0.0-1.0+
    logMAR: number; // Log of Minimum Angle of Resolution
    impairmentLevel: VisualImpairmentLevel;
    interpretation: string;
    meetsDriverStandard: boolean; // 20/40 or better typically required
  };
  colorBlindness: {
    score: number; // 0-100
    type: keyof typeof COLOR_VISION_TYPES;
    severity: 'none' | 'mild' | 'moderate' | 'severe';
    interpretation: string;
  };
  peripheralVision: {
    score: number; // 0-100
    blindSpots: number;
    fieldOfVision: number; // degrees
    interpretation: string;
  };
  overallScore: number;
  recommendations: string[];
}

/**
 * Convert Snellen fraction to decimal acuity
 * @param numerator - Top number (usually 20 or 6)
 * @param denominator - Bottom number
 */
export function snellenToDecimal(numerator: number, denominator: number): number {
  return numerator / denominator;
}

/**
 * Convert decimal acuity to logMAR (Log of Minimum Angle of Resolution)
 * @param decimalAcuity - Decimal visual acuity (e.g., 1.0 for 20/20)
 */
export function decimalToLogMAR(decimalAcuity: number): number {
  if (decimalAcuity <= 0) return 3.0; // Represents very poor vision
  return -Math.log10(decimalAcuity);
}

/**
 * Determine visual impairment level based on decimal acuity
 * @param decimalAcuity - Decimal visual acuity
 * @reference WHO ICD-11 Visual Impairment Categories
 */
export function getVisualImpairmentLevel(decimalAcuity: number): {
  level: VisualImpairmentLevel;
  description: string;
  meetsDriverStandard: boolean;
} {
  if (decimalAcuity >= 0.8) {
    return { level: 'normal', description: 'Normal or near-normal vision', meetsDriverStandard: true };
  }
  if (decimalAcuity >= 0.5) {
    return { level: 'near-normal', description: 'Near-normal vision with mild limitation', meetsDriverStandard: true };
  }
  if (decimalAcuity >= 0.3) {
    return { level: 'mild', description: 'Mild visual impairment', meetsDriverStandard: false };
  }
  if (decimalAcuity >= 0.12) {
    return { level: 'moderate', description: 'Moderate visual impairment', meetsDriverStandard: false };
  }
  if (decimalAcuity >= 0.05) {
    return { level: 'severe', description: 'Severe visual impairment (legally blind threshold)', meetsDriverStandard: false };
  }
  if (decimalAcuity >= 0.02) {
    return { level: 'profound', description: 'Profound visual impairment', meetsDriverStandard: false };
  }
  return { level: 'near-blindness', description: 'Near total blindness', meetsDriverStandard: false };
}

/**
 * Calculate visual acuity score from test results
 * Uses standardized Snellen equivalent mapping
 * 
 * @param correctAnswers - Number of correctly identified optotypes
 * @param totalQuestions - Total number of optotypes presented
 * @param distance - Test distance in feet (default 20 for Snellen)
 * @returns Visual acuity result with Snellen equivalent and impairment classification
 * 
 * @reference American Academy of Ophthalmology visual acuity testing standards
 */
export function calculateVisualAcuity(
  correctAnswers: number,
  totalQuestions: number,
  distance: number = 20 // feet
): VisionTestResult['visualAcuity'] {
  // Validate input data
  if (totalQuestions <= 0 || correctAnswers < 0 || correctAnswers > totalQuestions) {
    return {
      score: 0,
      snellenEquivalent: '20/200 or worse',
      snellenFraction: { numerator: 20, denominator: 200 },
      decimalAcuity: 0.1,
      logMAR: 1.0,
      impairmentLevel: 'severe',
      interpretation: 'Invalid test data. Please retake the test.',
      meetsDriverStandard: false
    };
  }
  
  const accuracy = (correctAnswers / totalQuestions) * 100;
  
  // Map accuracy to Snellen denominator (inverse relationship)
  // 100% accuracy = 20/20, decreasing accuracy = higher denominator
  let snellenDenominator: number;
  let snellenEquivalent: string;
  
  if (accuracy >= 95) {
    snellenDenominator = 20;
    snellenEquivalent = '20/20';
  } else if (accuracy >= 90) {
    snellenDenominator = 25;
    snellenEquivalent = '20/25';
  } else if (accuracy >= 80) {
    snellenDenominator = 30;
    snellenEquivalent = '20/30';
  } else if (accuracy >= 70) {
    snellenDenominator = 40;
    snellenEquivalent = '20/40';
  } else if (accuracy >= 60) {
    snellenDenominator = 50;
    snellenEquivalent = '20/50';
  } else if (accuracy >= 50) {
    snellenDenominator = 70;
    snellenEquivalent = '20/70';
  } else if (accuracy >= 40) {
    snellenDenominator = 100;
    snellenEquivalent = '20/100';
  } else if (accuracy >= 25) {
    snellenDenominator = 200;
    snellenEquivalent = '20/200';
  } else {
    snellenDenominator = 400;
    snellenEquivalent = '20/400 or worse';
  }

  const decimalAcuity = snellenToDecimal(distance, snellenDenominator);
  const logMAR = decimalToLogMAR(decimalAcuity);
  const impairmentInfo = getVisualImpairmentLevel(decimalAcuity);

  let interpretation: string;
  if (decimalAcuity >= 0.8) {
    interpretation = `Excellent visual acuity (${snellenEquivalent}). Your vision is within normal range.`;
  } else if (decimalAcuity >= 0.5) {
    interpretation = `Good visual acuity (${snellenEquivalent}) with minor limitations. Regular eye exams recommended.`;
  } else if (decimalAcuity >= 0.3) {
    interpretation = `Mild visual impairment (${snellenEquivalent}). Professional eye examination recommended.`;
  } else if (decimalAcuity >= 0.1) {
    interpretation = `Moderate to severe visual impairment (${snellenEquivalent}). Professional eye examination strongly recommended.`;
  } else {
    interpretation = `Significant visual impairment (${snellenEquivalent}). Immediate professional eye examination required.`;
  }

  return {
    score: Math.round(accuracy),
    snellenEquivalent,
    snellenFraction: { numerator: distance, denominator: snellenDenominator },
    decimalAcuity: Math.round(decimalAcuity * 100) / 100,
    logMAR: Math.round(logMAR * 100) / 100,
    impairmentLevel: impairmentInfo.level,
    interpretation,
    meetsDriverStandard: impairmentInfo.meetsDriverStandard
  };
}

/**
 * Analyze color blindness test results (Ishihara-style test)
 * 
 * @param correctAnswers - Number of correctly identified plates
 * @param totalQuestions - Total number of test plates
 * @param errorPattern - Pattern of errors by color type
 * @returns Color vision analysis with type classification and severity
 * 
 * @reference Ishihara Test interpretation guidelines
 */
export function analyzeColorBlindness(
  correctAnswers: number,
  totalQuestions: number,
  errorPattern: { redGreen: number; blueYellow: number }
): VisionTestResult['colorBlindness'] {
  if (totalQuestions <= 0) {
    return {
      score: 0,
      type: 'UNKNOWN',
      severity: 'severe',
      interpretation: 'Invalid test data. Please retake the test.'
    };
  }

  const accuracy = (correctAnswers / totalQuestions) * 100;
  const totalErrors = errorPattern.redGreen + errorPattern.blueYellow;
  
  let type: keyof typeof COLOR_VISION_TYPES;
  let severity: 'none' | 'mild' | 'moderate' | 'severe';
  let interpretation: string;

  // Normal color vision: 90%+ accuracy with few errors
  if (accuracy >= 90 && totalErrors <= 2) {
    type = 'NORMAL';
    severity = 'none';
    interpretation = 'Normal color vision detected. No color blindness identified.';
  }
  // Red-green deficiency is most common (~8% of males)
  else if (errorPattern.redGreen > errorPattern.blueYellow * 1.5) {
    // Determine specific type based on error severity
    if (errorPattern.redGreen > 8) {
      type = 'PROTANOPIA'; // Complete red blindness
      severity = 'severe';
    } else if (errorPattern.redGreen > 5) {
      type = 'DEUTERANOPIA'; // Complete green blindness
      severity = 'moderate';
    } else {
      type = 'DEUTERANOMALY'; // Partial green deficiency (most common)
      severity = 'mild';
    }
    interpretation = `Red-green color vision deficiency detected (${type}). This is the most common form of color blindness, affecting ~8% of males and ~0.5% of females.`;
  }
  // Blue-yellow deficiency (tritanopia) - rare (~0.01%)
  else if (errorPattern.blueYellow > errorPattern.redGreen * 1.5) {
    if (errorPattern.blueYellow > 5) {
      type = 'TRITANOPIA';
      severity = 'moderate';
    } else {
      type = 'TRITANOMALY';
      severity = 'mild';
    }
    interpretation = `Blue-yellow color vision deficiency detected (${type}). This is a less common form of color blindness.`;
  }
  // Total color blindness (very rare)
  else if (accuracy < 30) {
    type = 'ACHROMATOPSIA';
    severity = 'severe';
    interpretation = 'Significant color vision abnormality detected. Complete color blindness is rare and should be confirmed by an eye care professional.';
  }
  // Unknown/mixed pattern
  else {
    type = 'UNKNOWN';
    severity = totalErrors > 5 ? 'moderate' : 'mild';
    interpretation = 'Color vision abnormalities detected but pattern is unclear. Further professional evaluation recommended.';
  }

  return {
    score: Math.round(accuracy),
    type,
    severity,
    interpretation
  };
}

/**
 * Analyze peripheral vision test results
 * Normal peripheral vision extends approximately 60° nasally, 100° temporally, 60° superiorly, and 75° inferiorly
 * 
 * @param detectedTargets - Number of targets detected in peripheral field
 * @param totalTargets - Total number of targets presented
 * @param blindSpots - Number of blind spots detected
 * @param fieldOfVisionDegrees - Optional: measured field of vision in degrees (default estimated from targets)
 * @returns Peripheral vision analysis
 * 
 * @reference Goldmann visual field testing standards
 */
export function analyzePeripheralVision(
  detectedTargets: number,
  totalTargets: number,
  blindSpots: number,
  fieldOfVisionDegrees?: number
): VisionTestResult['peripheralVision'] {
  // Validate input data
  if (totalTargets <= 0 || detectedTargets < 0 || detectedTargets > totalTargets) {
    return {
      score: 0,
      blindSpots: blindSpots,
      fieldOfVision: 0,
      interpretation: 'Invalid test data. Please retake the test.'
    };
  }
  
  const score = (detectedTargets / totalTargets) * 100;
  
  // Estimate field of vision based on detection rate if not provided
  // Normal field is approximately 180° horizontal (both eyes)
  const estimatedFieldOfVision = fieldOfVisionDegrees ?? Math.round(score * 1.8);
  
  let interpretation: string;
  if (score >= 90 && blindSpots === 0) {
    interpretation = `Normal peripheral vision detected. Field of vision approximately ${estimatedFieldOfVision}°. No significant blind spots.`;
  } else if (score >= 75 && blindSpots <= 1) {
    interpretation = `Good peripheral vision (${estimatedFieldOfVision}° field) with minor limitations. The physiological blind spot is normal.`;
  } else if (score >= 60) {
    interpretation = `Moderate peripheral vision reduction (${estimatedFieldOfVision}° field, ${blindSpots} blind spots). Professional eye examination recommended to rule out glaucoma or other conditions.`;
  } else {
    interpretation = `Significant peripheral vision reduction (${estimatedFieldOfVision}° field, ${blindSpots} blind spots). Immediate professional eye examination strongly recommended. May indicate glaucoma, retinal detachment, or neurological condition.`;
  }

  return {
    score: Math.round(score),
    blindSpots,
    fieldOfVision: estimatedFieldOfVision,
    interpretation
  };
}

/**
 * Calculate overall vision score
 */
export function calculateOverallVisionScore(
  visualAcuity: VisionTestResult['visualAcuity'],
  colorBlindness: VisionTestResult['colorBlindness'],
  peripheralVision: VisionTestResult['peripheralVision']
): {
  overallScore: number;
  recommendations: string[];
} {
  // Weighted average
  const overallScore = Math.round(
    (visualAcuity.score * 0.5) +
    (colorBlindness.score * 0.2) +
    (peripheralVision.score * 0.3)
  );

  const recommendations: string[] = [];

  if (visualAcuity.score < 80) {
    recommendations.push('Schedule a comprehensive eye examination');
    recommendations.push('Consider updating prescription if you wear glasses or contacts');
  }

  if (colorBlindness.type !== 'normal') {
    recommendations.push('Consult with an eye care professional for color vision assessment');
    recommendations.push('Be aware of color-dependent tasks in daily life');
  }

  if (peripheralVision.score < 75) {
    recommendations.push('Professional peripheral vision assessment recommended');
    recommendations.push('Be cautious when driving or operating machinery');
  }

  if (overallScore >= 80) {
    recommendations.push('Maintain regular eye health practices');
    recommendations.push('Schedule annual eye examinations');
  }

  return {
    overallScore,
    recommendations: [...new Set(recommendations)]
  };
}

