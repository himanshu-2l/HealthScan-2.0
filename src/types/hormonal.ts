/**
 * Hormonal Health Types
 * TypeScript interfaces for the AI-Powered Women's Hormonal Health & Period Intelligence System
 */

// Mood emoji options
export type MoodLevel = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
export type SeverityLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type CyclePhaseName = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface HormonalProfile {
  avgCycleLength: number;
  avgPeriodLength: number;
  knownConditions: string[];
  birthDate?: string;
  lastUpdated: string;
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  cycleDay: number;
  phase: CyclePhaseName;
  mood: MoodLevel;
  energy: number; // 1-5
  anxiety: number; // 1-5
  irritability: number; // 1-5
  concentration: number; // 1-5
  depressiveFeeling: number; // 1-5
  painLevel: number; // 0-10
  painLocations: string[];
  skinCondition: SeverityLevel;
  bloating: SeverityLevel;
  sleepQuality: number; // 1-5
  exerciseType?: string;
  libido: number; // 1-5
  cervicalMucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg-white';
  basalBodyTemp?: number;
  notes: string;
  timestamp: string;
}

export interface HormoneLevels {
  estrogen: number; // 0-100 normalized
  progesterone: number;
  lh: number;
  fsh: number;
  testosterone: number;
}

export interface CyclePhaseInfo {
  phase: CyclePhaseName;
  dayInPhase: number;
  totalPhaseDays: number;
  cycleDay: number;
  totalCycleDays: number;
  hormoneLevels: HormoneLevels;
  expectedSymptoms: string[];
  recommendations: PhaseRecommendation;
}

export interface PhaseRecommendation {
  nutrition: string[];
  exercise: string[];
  skincare: string[];
  rest: string[];
  general: string[];
}

export interface PCOSRiskAssessment {
  score: number; // 0-9
  totalIndicators: number;
  indicators: PCOSIndicator[];
  riskLevel: RiskLevel;
  cyclesAnalyzed: number;
  recommendation: string;
  generatedAt: string;
}

export interface PCOSIndicator {
  name: string;
  detected: boolean;
  evidence: string;
  dates?: string[];
}

export interface PainEntry {
  id: string;
  date: string;
  cycleDay: number;
  painLevel: number; // 1-10
  locations: string[];
  radiatesTo: string[];
  duringBowelMovement: boolean;
  duringUrination: boolean;
  durationHours: number;
  medicationTaken: string[];
  preventsActivities: boolean;
  notes: string;
  timestamp: string;
}

export interface MoodEntry {
  id: string;
  date: string;
  cycleDay: number;
  phase: CyclePhaseName;
  mood: MoodLevel;
  energy: number;
  anxiety: number;
  irritability: number;
  concentration: number;
  depressiveFeeling: number;
  timestamp: string;
}

export interface SkinPrediction {
  currentDay: number;
  breakoutWindowStart: number;
  breakoutWindowEnd: number;
  daysUntilBreakout: number;
  predictedSeverity: SeverityLevel;
  proactiveSteps: string[];
  currentPhaseSkincareAdvice: string[];
}

export interface CycleGlucoseCorrelation {
  cycleDay: number;
  phase: CyclePhaseName;
  avgGlucoseFasting: number;
  avgGlucosePostMeal: number;
  glucoseDeviation: number; // deviation from overall average
  insulinResistanceRisk: 'normal' | 'elevated' | 'high';
}

export interface EndometriosisFlag {
  flagType: string;
  severity: RiskLevel;
  evidencePoints: { date: string; detail: string }[];
  recommendation: string;
  consecutivePainkillerDays: number;
}

export interface FertilityWindow {
  fertileStart: string; // date
  fertileEnd: string;
  ovulationDate: string;
  confidence: number; // 0-100
  method: string; // 'calendar' | 'bbt' | 'mucus' | 'combined'
}

export interface DailyBriefing {
  date: string;
  cycleDay: number;
  phase: CyclePhaseName;
  phaseInfo: CyclePhaseInfo;
  predictedEnergy: number;
  predictedMood: number;
  predictedFocus: number;
  predictedStrength: number;
  predictedSkinCondition: SeverityLevel;
  predictedLibido: number;
  hormonalSummary: string;
  expectedSymptoms: string[];
  recommendations: PhaseRecommendation;
}

export interface HormonalHealthData {
  profile: HormonalProfile;
  dailyLogs: DailyLog[];
  painEntries: PainEntry[];
  moodEntries: MoodEntry[];
}

// 7-day forecast item
export interface ForecastDay {
  date: string;
  cycleDay: number;
  phase: CyclePhaseName;
  predictedEnergy: number;
  predictedMood: number;
  keyFlags: string[];
}

// Mood pattern analysis result
export interface MoodPatternAnalysis {
  patternType: 'cyclical' | 'persistent' | 'insufficient_data';
  cyclesAnalyzed: number;
  lutealPhaseMoodDrop: boolean;
  averageMoodByPhase: Record<CyclePhaseName, number>;
  pmddLikelihood: RiskLevel;
  description: string;
  chartData: { cycleDay: number; mood: number; energy: number; anxiety: number; phase: CyclePhaseName }[];
}
