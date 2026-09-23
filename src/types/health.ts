/**
 * Unified Health Data Types
 * Centralized types for all health test results and health scoring
 */

import { HealthScanTestResult } from './ehr';

// Test result categories
export type TestCategory =
  | 'neurological'
  | 'cardiovascular'
  | 'respiratory'
  | 'mental-health'
  | 'vision-hearing'
  | 'lifestyle';

// Test types
export type TestType =
  | 'digit-span'
  | 'word-list-recall'
  | 'saccade'
  | 'stroop'
  | 'alzheimers'
  | 'parkinsons'
  | 'epilepsy'
  | 'cognitive'
  | 'neuro-assessment'
  | 'voice'
  | 'eye'
  | 'motor'
  | 'blood-pressure-check'
  | 'cardiovascular-test'
  | 'heart-rate-test'
  | 'respiratory-test'
  | 'mental-health-assessment'
  | 'vision-test'
  | 'hearing-test'
  | 'lifestyle-survey'
  | 'gait-kinematics';

// Risk levels
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Health trend direction
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'fluctuating';

// Clinical data provenance classification
export type ClinicalDataProvenance = 'MEASURED' | 'ESTIMATED' | 'SIMULATED' | 'UNAVAILABLE';

// Unified Health Test Result Interface
export interface HealthTestResult {
  id: string;
  testType: TestType;
  category: TestCategory;
  testDate: string;
  timestamp: string;

  // Test-specific data (flexible structure)
  data: Record<string, any>;

  // Scores
  score?: number;
  maxScore?: number;
  scorePercentage?: number;

  // Risk assessment
  riskLevel?: RiskLevel;

  // Interpretation
  interpretation?: string;
  recommendations?: string[];

  // Metadata
  duration?: number; // in milliseconds
  status?: 'preliminary' | 'final' | 'amended';

  // Legacy support for HealthScanTestResult
  healthScanResult?: HealthScanTestResult;
}

// Health Score Interface
export interface HealthScore {
  overall: number; // 0-100
  breakdown: {
    neurological: number;
    cardiovascular: number;
    respiratory: number;
    mentalHealth: number;
    visionHearing: number;
    lifestyle: number;
  };
  riskLevel: RiskLevel;
  trend: TrendDirection;
  lastUpdated: string;
  recommendations: string[];
}

// Health Trend Data Point
export interface HealthTrendPoint {
  date: string;
  score: number;
  category?: TestCategory;
  testType?: TestType;
}

// Health History Entry
export interface HealthHistoryEntry {
  date: string;
  tests: HealthTestResult[];
  overallScore: number;
  notes?: string;
}

// Category Score Calculation
export interface CategoryScore {
  category: TestCategory;
  score: number; // 0-100
  weight: number; // weight in overall calculation
  testCount: number;
  lastTestDate?: string;
  trend: TrendDirection;
}

// ============================================
// Insulin on Board (IOB) Types
// ============================================

export interface InsulinDose {
  id: string;
  units: number;
  type: 'rapid' | 'long';
  insulinName: string; // e.g., 'Novorapid', 'Humalog', 'Lantus', 'Levemir'
  timestamp: string; // ISO date string
  notes?: string;
}

export interface IOBPoint {
  time: string; // ISO date string
  iob: number;  // units of insulin
}

export interface PatientSettings {
  insulinToCarbRatio: number;  // 1 unit per X grams carbs (e.g., 10)
  correctionFactor: number;    // 1 unit drops glucose by X mg/dL (e.g., 50)
  targetGlucose: number;       // target glucose mg/dL (e.g., 120)
  rapidInsulinDuration: number; // hours (default 4)
  longInsulinDuration: number;  // hours (default 24)
  rapidInsulinPeak: number;     // minutes (default 75)
}

export interface DoseRecommendation {
  mealDose: number;
  correctionDose: number;
  currentIOB: number;
  finalDose: number;
  explanation: string;
}

export interface StackingWarning {
  isAtRisk: boolean;
  currentIOB: number;
  timeSinceLastDose: number; // minutes
  predictedGlucoseIn2Hours: number;
  safeMaxDose: number;
  warningMessage: string;
}

export interface NightAssessment {
  currentGlucose: number;
  currentIOB: number;
  predicted3AMGlucose: number;
  riskLevel: 'safe' | 'caution' | 'danger';
  recommendation: string;
  snackSuggestion?: string;
}

