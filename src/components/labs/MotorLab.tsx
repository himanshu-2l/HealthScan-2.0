// MotorLabWithReport_Fixed.tsx
import React, { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera as CameraIcon, Play, Square, FileText, Activity, RotateCcw } from "lucide-react";
import { saveTestResult, generateTestResultId } from '@/services/healthDataService';
import { HealthTestResult } from '@/types/health';
import { robustStatistics } from '@/utils/statisticalAccuracy';
import {
  calculateFatigueIndex,
  analyzeRhythmPattern,
  analyzeTremorAdvanced,
  calculateParkinsonsRiskScore,
  calculateMotorQualityScore,
  type AdvancedTremorResult,
  type RhythmPatternResult,
  type ParkinsonsRiskResult,
  type MotorQualityResult
} from '@/utils/advancedMotorAnalysis';

const WASM_PATH = "/models/mediapipe/wasm";
const MODEL_PATH = "/models/hand_landmarker.task";
const CDN_WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const CDN_MODEL_PATH = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let globalHandLandmarker: HandLandmarker | undefined;
let globalLastVideoTime = -1;

type TremorSample = { t: number; y: number };

interface MotorAnalysisResults {
  timestamp: string;
  fingerTaps: number;
  testDuration: number;
  tapRate: number;
  coordinationScore: number;
  tremorFrequency: number;
  tremorAmplitude: number;
  qualityScore: number;
  riskLevel: string;
  clinicalFindings: ClinicalFinding[];
  diseaseRiskAssessment: MotorDiseaseRiskAssessment;
  motorCharacteristics: MotorCharacteristics;
  recommendations: string[];
}

interface ClinicalFinding {
  parameter: string;
  value: string;
  normalRange: string;
  status: 'normal' | 'borderline' | 'abnormal';
  clinicalSignificance: string;
}

interface MotorDiseaseRiskAssessment {
  parkinsons: {
    riskLevel: 'low' | 'moderate' | 'high';
    confidence: number;
    indicators: string[];
    symptoms: string[];
  };
  essentialTremor: {
    riskLevel: 'low' | 'moderate' | 'high';
    confidence: number;
    indicators: string[];
    symptoms: string[];
  };
  cerebellarDisorders: {
    riskLevel: 'low' | 'moderate' | 'high';
    confidence: number;
    indicators: string[];
    symptoms: string[];
  };
}

interface MotorCharacteristics {
  movementSpeed: 'normal' | 'bradykinetic' | 'hyperkinetic';
  coordinationLevel: 'excellent' | 'good' | 'fair' | 'poor';
  tremorType: 'none' | 'physiological' | 'pathological' | 'severe';
  rhythmicity: 'regular' | 'irregular' | 'variable';
  overallAssessment: string;
}

// Advanced clinical analysis functions
function generateMotorClinicalFindings(
  fingerTaps: number,
  testDuration: number,
  tapRate: number,
  coordinationScore: number,
  tremorFrequency: number,
  tremorAmplitude: number
): ClinicalFinding[] {
  const findings: ClinicalFinding[] = [];

  // Finger Tapping Rate Analysis
  const tapRateStatus = tapRate < 3 ? 'abnormal' : tapRate < 5 ? 'borderline' : 'normal';
  findings.push({
    parameter: 'Finger Tapping Rate',
    value: `${tapRate.toFixed(2)} taps/sec (${fingerTaps} taps in ${testDuration.toFixed(1)}s)`,
    normalRange: '5-10 taps/sec (healthy adults)',
    status: tapRateStatus,
    clinicalSignificance: tapRateStatus === 'abnormal'
      ? 'Significantly reduced tapping rate may indicate bradykinesia or motor slowing associated with neurological conditions'
      : tapRateStatus === 'borderline'
        ? 'Mildly reduced tapping rate that may warrant monitoring for early motor changes'
        : 'Normal finger tapping rate indicating adequate motor speed and dexterity'
  });

  // Coordination Score Analysis
  const coordStatus = coordinationScore < 60 ? 'abnormal' : coordinationScore < 80 ? 'borderline' : 'normal';
  findings.push({
    parameter: 'Motor Coordination',
    value: `${coordinationScore}%`,
    normalRange: '80-100% (healthy adults)',
    status: coordStatus,
    clinicalSignificance: coordStatus === 'abnormal'
      ? 'Poor coordination may indicate cerebellar dysfunction or motor control difficulties'
      : coordStatus === 'borderline'
        ? 'Mild coordination impairment that may indicate early motor changes'
        : 'Excellent motor coordination suggesting intact cerebellar and motor cortex function'
  });

  // Tremor Analysis
  if (tremorFrequency > 0) {
    const tremorStatus = tremorFrequency >= 4 && tremorFrequency <= 12 ? 'abnormal' : tremorFrequency > 12 ? 'borderline' : 'normal';
    findings.push({
      parameter: 'Tremor Assessment',
      value: `${tremorFrequency.toFixed(2)} Hz, Amplitude: ${tremorAmplitude.toFixed(2)}%`,
      normalRange: '0-3 Hz (physiological tremor)',
      status: tremorStatus,
      clinicalSignificance: tremorStatus === 'abnormal'
        ? 'Tremor frequency in pathological range (4-12 Hz) may indicate Parkinson\'s disease or essential tremor'
        : tremorStatus === 'borderline'
          ? 'High frequency tremor may indicate anxiety or caffeine-induced physiological tremor'
          : 'Tremor within normal physiological range'
    });
  }

  return findings;
}

function assessMotorDiseaseRisk(
  tapRate: number,
  coordinationScore: number,
  tremorFrequency: number,
  tremorAmplitude: number,
  tapIntervals: number[]
): MotorDiseaseRiskAssessment {
  // Calculate rhythm variability using robust statistics
  let rhythmVariability = 0;
  if (tapIntervals.length > 1) {
    const intervalStats = robustStatistics(tapIntervals, true);
    rhythmVariability = intervalStats.stdDev; // Use robust standard deviation
  }

  // Parkinson's Disease Assessment
  const parkinsonsIndicators: string[] = [];
  const parkinsonsSymptoms: string[] = [];
  let parkinsonsRisk: 'low' | 'moderate' | 'high' = 'low';
  let parkinsonsConfidence = 0;

  if (tapRate < 4) {
    parkinsonsIndicators.push('Severe bradykinesia (slow movement)');
    parkinsonsSymptoms.push('Difficulty with rapid alternating movements');
    parkinsonsConfidence += 0.3;
  } else if (tapRate < 5) {
    parkinsonsIndicators.push('Mild bradykinesia');
    parkinsonsSymptoms.push('Slight slowing of finger movements');
    parkinsonsConfidence += 0.15;
  }

  if (tremorFrequency >= 4 && tremorFrequency <= 6) {
    parkinsonsIndicators.push('Rest tremor frequency (4-6 Hz)');
    parkinsonsSymptoms.push('Tremor at rest, pill-rolling motion');
    parkinsonsConfidence += 0.25;
  }

  if (coordinationScore < 70) {
    parkinsonsIndicators.push('Reduced motor coordination');
    parkinsonsSymptoms.push('Difficulty with precise movements');
    parkinsonsConfidence += 0.2;
  }

  if (rhythmVariability > 200) {
    parkinsonsIndicators.push('Irregular movement rhythm');
    parkinsonsSymptoms.push('Inconsistent timing between movements');
    parkinsonsConfidence += 0.15;
  }

  if (parkinsonsConfidence > 0.5) parkinsonsRisk = 'high';
  else if (parkinsonsConfidence > 0.25) parkinsonsRisk = 'moderate';

  // Essential Tremor Assessment
  const essentialTremorIndicators: string[] = [];
  const essentialTremorSymptoms: string[] = [];
  let essentialTremorRisk: 'low' | 'moderate' | 'high' = 'low';
  let essentialTremorConfidence = 0;

  if (tremorFrequency >= 6 && tremorFrequency <= 12) {
    essentialTremorIndicators.push('Action tremor frequency (6-12 Hz)');
    essentialTremorSymptoms.push('Tremor during voluntary movement');
    essentialTremorConfidence += 0.3;
  }

  if (tremorAmplitude > 15) {
    essentialTremorIndicators.push('High amplitude tremor');
    essentialTremorSymptoms.push('Visible shaking during tasks');
    essentialTremorConfidence += 0.2;
  }

  if (tapRate >= 5 && coordinationScore >= 70) {
    essentialTremorIndicators.push('Preserved motor speed and coordination');
    essentialTremorSymptoms.push('Normal movement speed despite tremor');
    essentialTremorConfidence += 0.15;
  }

  if (essentialTremorConfidence > 0.4) essentialTremorRisk = 'high';
  else if (essentialTremorConfidence > 0.2) essentialTremorRisk = 'moderate';

  // Cerebellar Disorders Assessment
  const cerebellarIndicators: string[] = [];
  const cerebellarSymptoms: string[] = [];
  let cerebellarRisk: 'low' | 'moderate' | 'high' = 'low';
  let cerebellarConfidence = 0;

  if (coordinationScore < 60) {
    cerebellarIndicators.push('Severe coordination impairment');
    cerebellarSymptoms.push('Ataxic movements, dysmetria');
    cerebellarConfidence += 0.35;
  } else if (coordinationScore < 70) {
    cerebellarIndicators.push('Mild coordination impairment');
    cerebellarSymptoms.push('Slight inaccuracy in targeted movements');
    cerebellarConfidence += 0.2;
  }

  if (rhythmVariability > 300) {
    cerebellarIndicators.push('Severe rhythm irregularity');
    cerebellarSymptoms.push('Inability to maintain steady rhythm');
    cerebellarConfidence += 0.25;
  }

  if (tremorFrequency > 0 && tremorFrequency < 4) {
    cerebellarIndicators.push('Intention tremor pattern');
    cerebellarSymptoms.push('Tremor worsening with goal-directed movement');
    cerebellarConfidence += 0.2;
  }

  if (cerebellarConfidence > 0.5) cerebellarRisk = 'high';
  else if (cerebellarConfidence > 0.25) cerebellarRisk = 'moderate';

  return {
    parkinsons: {
      riskLevel: parkinsonsRisk,
      confidence: Math.min(parkinsonsConfidence, 1),
      indicators: parkinsonsIndicators,
      symptoms: parkinsonsSymptoms
    },
    essentialTremor: {
      riskLevel: essentialTremorRisk,
      confidence: Math.min(essentialTremorConfidence, 1),
      indicators: essentialTremorIndicators,
      symptoms: essentialTremorSymptoms
    },
    cerebellarDisorders: {
      riskLevel: cerebellarRisk,
      confidence: Math.min(cerebellarConfidence, 1),
      indicators: cerebellarIndicators,
      symptoms: cerebellarSymptoms
    }
  };
}

function analyzeMotorCharacteristics(
  tapRate: number,
  coordinationScore: number,
  tremorFrequency: number,
  tremorAmplitude: number,
  tapIntervals: number[]
): MotorCharacteristics {
  // Assess movement speed
  let movementSpeed: 'normal' | 'bradykinetic' | 'hyperkinetic' = 'normal';
  if (tapRate < 5) movementSpeed = 'bradykinetic';
  else if (tapRate > 12) movementSpeed = 'hyperkinetic';

  // Assess coordination level
  let coordinationLevel: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  if (coordinationScore < 60) coordinationLevel = 'poor';
  else if (coordinationScore < 70) coordinationLevel = 'fair';
  else if (coordinationScore < 85) coordinationLevel = 'good';

  // Assess tremor type
  let tremorType: 'none' | 'physiological' | 'pathological' | 'severe' = 'none';
  if (tremorFrequency > 0) {
    if (tremorFrequency <= 3) tremorType = 'physiological';
    else if (tremorFrequency <= 12) tremorType = 'pathological';
    else tremorType = 'severe';
  }

  // Assess rhythmicity using robust statistics
  let rhythmVariability = 0;
  if (tapIntervals.length > 1) {
    const intervalStats = robustStatistics(tapIntervals, true);
    rhythmVariability = intervalStats.stdDev; // Use robust standard deviation
  }

  let rhythmicity: 'regular' | 'irregular' | 'variable' = 'regular';
  if (rhythmVariability > 300) rhythmicity = 'irregular';
  else if (rhythmVariability > 150) rhythmicity = 'variable';

  // Overall assessment
  let overallAssessment = 'Motor function within normal limits';
  if (movementSpeed === 'bradykinetic' || coordinationLevel === 'poor' || tremorType === 'pathological' || tremorType === 'severe') {
    overallAssessment = 'Motor function shows signs of impairment requiring clinical evaluation';
  } else if (coordinationLevel === 'fair' || tremorType === 'physiological' || rhythmicity === 'irregular') {
    overallAssessment = 'Motor function shows mild changes that may warrant monitoring';
  }

  return {
    movementSpeed,
    coordinationLevel,
    tremorType,
    rhythmicity,
    overallAssessment
  };
}

function generateMotorRecommendations(
  diseaseRisk: MotorDiseaseRiskAssessment,
  motorCharacteristics: MotorCharacteristics,
  clinicalFindings: ClinicalFinding[]
): string[] {
  const recommendations: string[] = [];

  // General recommendations based on findings
  const abnormalFindings = clinicalFindings.filter(f => f.status === 'abnormal');
  const borderlineFindings = clinicalFindings.filter(f => f.status === 'borderline');

  if (abnormalFindings.length > 0) {
    recommendations.push('Recommend comprehensive neurological evaluation by movement disorder specialist');
    recommendations.push('Consider detailed motor assessment including DaTscan if Parkinson\'s suspected');
  }

  if (borderlineFindings.length > 0) {
    recommendations.push('Monitor motor function changes over time with regular assessments');
    recommendations.push('Consider physical therapy consultation for motor optimization');
  }

  // Disease-specific recommendations
  if (diseaseRisk.parkinsons.riskLevel === 'high') {
    recommendations.push('Urgent referral to movement disorder neurologist for Parkinson\'s evaluation');
    recommendations.push('Consider dopamine transporter imaging (DaTscan) for differential diagnosis');
    recommendations.push('Monitor for other Parkinson\'s symptoms: rigidity, postural instability, non-motor symptoms');
    recommendations.push('Consider early intervention with physical therapy and exercise programs');
  } else if (diseaseRisk.parkinsons.riskLevel === 'moderate') {
    recommendations.push('Schedule baseline neurological screening for movement disorders');
    recommendations.push('Implement regular exercise program focusing on large amplitude movements');
  }

  if (diseaseRisk.essentialTremor.riskLevel === 'high') {
    recommendations.push('Referral to neurologist for essential tremor evaluation and management');
    recommendations.push('Consider propranolol or primidone therapy if tremor is functionally limiting');
    recommendations.push('Evaluate for occupational therapy to improve daily function');
  } else if (diseaseRisk.essentialTremor.riskLevel === 'moderate') {
    recommendations.push('Monitor tremor progression and functional impact');
    recommendations.push('Consider lifestyle modifications: reduce caffeine, manage stress');
  }

  if (diseaseRisk.cerebellarDisorders.riskLevel === 'high') {
    recommendations.push('Urgent neurological evaluation for cerebellar dysfunction');
    recommendations.push('Consider brain MRI to evaluate cerebellar structure');
    recommendations.push('Referral to physical therapy for balance and coordination training');
  } else if (diseaseRisk.cerebellarDisorders.riskLevel === 'moderate') {
    recommendations.push('Monitor coordination and balance with regular assessments');
    recommendations.push('Consider balance training and coordination exercises');
  }

  // Motor characteristics specific recommendations
  if (motorCharacteristics.movementSpeed === 'bradykinetic') {
    recommendations.push('Focus on large amplitude, high-intensity exercises (LSVT BIG protocol)');
  }

  if (motorCharacteristics.coordinationLevel === 'poor') {
    recommendations.push('Implement targeted coordination and dexterity training exercises');
  }

  if (motorCharacteristics.tremorType === 'pathological' || motorCharacteristics.tremorType === 'severe') {
    recommendations.push('Consider tremor-specific interventions and adaptive equipment');
  }

  // General motor health recommendations
  if (recommendations.length === 0) {
    recommendations.push('Maintain regular physical activity to preserve motor function');
    recommendations.push('Continue periodic motor function monitoring for early detection of changes');
  }

  recommendations.push('Results should be interpreted by qualified healthcare professionals');
  recommendations.push('This screening tool is not a substitute for professional medical diagnosis');

  return recommendations;
}

// ===== ADVANCED ANALYSIS HELPERS =====

function generateAdvancedClinicalFindings(
  fingerTaps: number,
  testDuration: number,
  tapRate: number,
  coordinationScore: number,
  advancedTremor: AdvancedTremorResult,
  fatigueIndex: number,
  rhythmAnalysis: RhythmPatternResult,
  motorQuality: MotorQualityResult
): ClinicalFinding[] {
  const findings: ClinicalFinding[] = [];

  // Finger Tapping Rate
  const tapRateStatus = tapRate < 3 ? 'abnormal' : tapRate < 5 ? 'borderline' : 'normal';
  findings.push({
    parameter: 'Finger Tapping Rate',
    value: `${tapRate.toFixed(2)} taps/sec (${fingerTaps} taps)`,
    normalRange: '5-10 taps/sec',
    status: tapRateStatus,
    clinicalSignificance: tapRateStatus === 'abnormal'
      ? 'Severe bradykinesia - hallmark sign of Parkinson\'s disease'
      : tapRateStatus === 'borderline'
        ? 'Mild bradykinesia - early motor slowing'
        : 'Normal finger tapping speed'
  });

  // Motor Fatigue Index
  const fatigueStatus = fatigueIndex > 30 ? 'abnormal' : fatigueIndex > 15 ? 'borderline' : 'normal';
  findings.push({
    parameter: 'Motor Fatigue Index',
    value: `${fatigueIndex.toFixed(1)}% decay`,
    normalRange: '< 15%',
    status: fatigueStatus,
    clinicalSignificance: fatigueStatus === 'abnormal'
      ? 'Severe motor fatigue - significant decrement in performance during test'
      : fatigueStatus === 'borderline'
        ? 'Mild motor fatigue - some decrement in sustained movement'
        : 'Good motor endurance maintained throughout test'
  });

  // Rhythm Regularity
  const rhythmStatus = rhythmAnalysis.regularity === 'severely_irregular' ? 'abnormal' :
                       rhythmAnalysis.regularity === 'irregular' ? 'borderline' : 'normal';
  findings.push({
    parameter: 'Movement Rhythm',
    value: `${rhythmAnalysis.regularity} (CV: ${rhythmAnalysis.cv.toFixed(1)}%)`,
    normalRange: 'Regular (CV < 20%)',
    status: rhythmStatus,
    clinicalSignificance: rhythmStatus === 'abnormal'
      ? `Severely irregular rhythm with ${rhythmAnalysis.freezeEvents} freeze events - indicates motor control breakdown`
      : rhythmStatus === 'borderline'
        ? 'Irregular rhythm - some inconsistency in motor timing'
        : 'Regular rhythmic movement pattern'
  });

  // Tremor Analysis
  if (advancedTremor.dominantFrequency > 0) {
    const tremorStatus = advancedTremor.type === 'parkinsonian_rest' ? 'abnormal' :
                         advancedTremor.type === 'essential' ? 'borderline' : 'normal';
    findings.push({
      parameter: 'Tremor Analysis',
      value: `${advancedTremor.dominantFrequency.toFixed(1)} Hz, ${advancedTremor.type.replace('_', ' ')}`,
      normalRange: 'None or < 4 Hz physiological',
      status: tremorStatus,
      clinicalSignificance: advancedTremor.type === 'parkinsonian_rest'
        ? `Parkinsonian rest tremor at ${advancedTremor.dominantFrequency.toFixed(1)} Hz - classic Parkinson's sign`
        : advancedTremor.type === 'essential'
          ? 'Essential tremor pattern - action tremor during movement'
          : 'Tremor within physiological range'
    });
  }

  // Coordination
  const coordStatus = coordinationScore < 60 ? 'abnormal' : coordinationScore < 80 ? 'borderline' : 'normal';
  findings.push({
    parameter: 'Motor Coordination',
    value: `${coordinationScore}% (${motorQuality.grade} grade)`,
    normalRange: '80-100%',
    status: coordStatus,
    clinicalSignificance: coordStatus === 'abnormal'
      ? 'Poor coordination - may indicate cerebellar or motor pathway dysfunction'
      : coordStatus === 'borderline'
        ? 'Fair coordination - some impairment in motor precision'
        : 'Good motor coordination'
  });

  return findings;
}

function generateAdvancedRiskAssessment(
  parkinsonsRisk: ParkinsonsRiskResult,
  advancedTremor: AdvancedTremorResult
): MotorAnalysisResults['diseaseRiskAssessment'] {
  return {
    parkinsons: {
      riskLevel: parkinsonsRisk.riskLevel === 'very_high' ? 'high' : parkinsonsRisk.riskLevel,
      confidence: parkinsonsRisk.confidence / 100,
      indicators: parkinsonsRisk.indicators,
      symptoms: parkinsonsRisk.primaryIndicators
    },
    essentialTremor: {
      riskLevel: advancedTremor.type === 'essential' ? 
        (advancedTremor.confidence > 70 ? 'high' : 'moderate') : 'low',
      confidence: advancedTremor.type === 'essential' ? advancedTremor.confidence / 100 : 0,
      indicators: advancedTremor.type === 'essential' ? 
        [`${advancedTremor.dominantFrequency.toFixed(1)} Hz action tremor`, 'Tremor during voluntary movement'] : [],
      symptoms: advancedTremor.type === 'essential' ? 
        ['Tremor with intention', 'Preserved coordination despite tremor'] : []
    },
    cerebellarDisorders: {
      riskLevel: 'low',
      confidence: 0,
      indicators: [],
      symptoms: []
    }
  };
}

function generateAdvancedMotorCharacteristics(
  tapRate: number,
  coordinationScore: number,
  advancedTremor: AdvancedTremorResult,
  rhythmAnalysis: RhythmPatternResult,
  fatigueIndex: number,
  motorQuality: MotorQualityResult
): MotorCharacteristics {
  // Movement speed
  let movementSpeed: 'normal' | 'bradykinetic' | 'hyperkinetic' = 'normal';
  if (tapRate < 5) movementSpeed = 'bradykinetic';
  else if (tapRate > 12) movementSpeed = 'hyperkinetic';

  // Coordination level
  let coordinationLevel: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  if (coordinationScore < 60) coordinationLevel = 'poor';
  else if (coordinationScore < 75) coordinationLevel = 'fair';
  else if (coordinationScore < 90) coordinationLevel = 'good';

  // Tremor type
  let tremorType: 'none' | 'physiological' | 'pathological' | 'severe' = 'none';
  if (advancedTremor.dominantFrequency > 0) {
    if (advancedTremor.type === 'parkinsonian_rest') tremorType = 'pathological';
    else if (advancedTremor.type === 'essential') tremorType = 'pathological';
    else if (advancedTremor.amplitudeNormalized > 0.05) tremorType = 'severe';
    else tremorType = 'physiological';
  }

  // Rhythmicity
  let rhythmicity: 'regular' | 'irregular' | 'variable' = 'regular';
  if (rhythmAnalysis.regularity === 'severely_irregular') rhythmicity = 'irregular';
  else if (rhythmAnalysis.regularity === 'irregular' || rhythmAnalysis.regularity === 'mildly_irregular') {
    rhythmicity = 'variable';
  }

  // Overall assessment
  let overallAssessment = '';
  if (motorQuality.grade === 'A' || motorQuality.grade === 'B') {
    overallAssessment = `Motor function is ${motorQuality.category} with grade ${motorQuality.grade}. `;
    overallAssessment += `Speed: ${motorQuality.percentiles.speed}%, Coordination: ${motorQuality.percentiles.coordination}%. `;
    overallAssessment += 'No significant motor impairment detected.';
  } else {
    overallAssessment = `Motor function shows ${motorQuality.category} performance with grade ${motorQuality.grade}. `;
    if (movementSpeed === 'bradykinetic') overallAssessment += 'Bradykinesia detected. ';
    if (tremorType === 'pathological') overallAssessment += 'Pathological tremor pattern present. ';
    if (fatigueIndex > 25) overallAssessment += 'Significant motor fatigue observed. ';
    overallAssessment += 'Clinical evaluation recommended.';
  }

  return {
    movementSpeed,
    coordinationLevel,
    tremorType,
    rhythmicity,
    overallAssessment
  };
}

function generateAdvancedRecommendations(
  parkinsonsRisk: ParkinsonsRiskResult,
  motorQuality: MotorQualityResult,
  advancedTremor: AdvancedTremorResult
): string[] {
  const recommendations: string[] = [];

  // Risk-based recommendations
  if (parkinsonsRisk.riskLevel === 'very_high' || parkinsonsRisk.riskLevel === 'high') {
    recommendations.push('URGENT: Consult a movement disorder neurologist for comprehensive evaluation');
    recommendations.push('Consider DaTscan imaging for differential diagnosis');
    recommendations.push('Monitor for additional Parkinson\'s symptoms: rigidity, postural instability');
  } else if (parkinsonsRisk.riskLevel === 'moderate') {
    recommendations.push('Schedule neurological consultation for baseline assessment');
    recommendations.push('Repeat motor assessment in 3-6 months to monitor progression');
    recommendations.push('Consider LSVT BIG exercise program for motor optimization');
  }

  // Tremor-specific recommendations
  if (advancedTremor.type === 'essential') {
    recommendations.push('Essential tremor management: Consider propranolol if functionally limiting');
    recommendations.push('Avoid caffeine and stress which may exacerbate tremor');
  }

  // Quality-based recommendations
  if (motorQuality.grade === 'D' || motorQuality.grade === 'F') {
    recommendations.push('Physical therapy referral recommended for motor rehabilitation');
    recommendations.push('Focus on large amplitude movement exercises (LSVT BIG protocol)');
  }

  if (motorQuality.percentiles.endurance < 60) {
    recommendations.push('Motor endurance training recommended - practice sustained movements');
  }

  if (motorQuality.percentiles.stability < 60) {
    recommendations.push('Rhythm training exercises may help improve movement consistency');
  }

  // General recommendations
  recommendations.push('Maintain regular physical activity and exercise');
  recommendations.push('Track motor function over time with periodic reassessments');
  recommendations.push('Results should be interpreted by qualified healthcare professionals');

  return recommendations;
}

export const MotorLab: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied">("idle");
  const [testDuration, setTestDuration] = useState(0);
  const [fingerTaps, setFingerTaps] = useState(0);
  const [tapIntervals, setTapIntervals] = useState<number[]>([]);
  const [status, setStatus] = useState('Click "Enable Camera" to begin motor assessment');
  const [thresholdFraction] = useState(0.05);
  const [handsDetected, setHandsDetected] = useState(0);
  const [lastDistancePx, setLastDistancePx] = useState<number | null>(null);
  const [analysisResults, setAnalysisResults] = useState<MotorAnalysisResults | null>(null);

  // Ref for the report section to enable auto-scroll
  const reportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to report when analysis results are generated
  useEffect(() => {
    if (analysisResults && reportRef.current) {
      setTimeout(() => {
        reportRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }, 300);
    }
  }, [analysisResults]);

  const fingerTapsRef = useRef(0);
  const tapIntervalsRef = useRef<number[]>([]);
  const tremorSamplesRef = useRef<TremorSample[]>([]);
  const lastTapTimeRef = useRef<number | null>(null);
  const lastHandsDetectedRef = useRef(0);
  const lastDistanceUpdateRef = useRef(0);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const drawingUtilsCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timerRef = useRef<number | null>(null);
  const renderLoopStartedRef = useRef(false);
  const isRecordingRef = useRef(false);
  const testDurationRef = useRef(0);
  const liveMetricsRef = useRef({
    tapRate: 0,
    coordinationScore: 0,
    tremorMetrics: { ampNorm: 0, freqHz: 0 },
    movementQuality: 0
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // --- Load model ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setStatus("Loading ML runtime + model...");
        let vision;
        let landmarker;
        try {
          vision = await FilesetResolver.forVisionTasks(WASM_PATH);
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_PATH },
            runningMode: "VIDEO",
            numHands: 2,
          });
        } catch (localErr) {
          console.warn("Local model loading failed, trying CDN fallback:", localErr);
          vision = await FilesetResolver.forVisionTasks(CDN_WASM_PATH);
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: CDN_MODEL_PATH },
            runningMode: "VIDEO",
            numHands: 2,
          });
        }
        globalHandLandmarker = landmarker;
        if (!mounted) return;
        setStatus('Model loaded. Click "Enable Camera" to begin motor assessment');
      } catch (err) {
        console.error("Model init error:", err);
        setStatus("Failed to load motor-analysis model. Please check network and reload.");
      }
    })();
    return () => {
      mounted = false;
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (animationFrameIdRef.current !== null) cancelAnimationFrame(animationFrameIdRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      try { globalHandLandmarker?.close(); } catch { /* Model may already be closed. */ }
      globalHandLandmarker = undefined;
      globalLastVideoTime = -1;
    };
  }, []);

  // --- Camera init ---
  async function initCamera() {
    if (!videoRef.current) return;

    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Camera API not available");
      setPermission("denied");
      setStatus("Camera API not available. Please use HTTPS or a modern browser.");
      return;
    }

    try {
      setStatus("Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setPermission("granted");
      setStatus("Camera ready. Click Start Test to begin measurement.");

      if (!renderLoopStartedRef.current) {
        renderLoopStartedRef.current = true;
        animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setPermission("denied");

      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setStatus("Camera permission denied. Please allow camera access and try again.");
        } else if (err.name === 'NotFoundError') {
          setStatus("No camera found. Please connect a camera and try again.");
        } else if (err.name === 'NotSupportedError') {
          setStatus("Camera not supported. Please use HTTPS or a modern browser.");
        } else {
          setStatus(`Camera error: ${err.message}`);
        }
      } else {
        setStatus("Camera access failed. Please check permissions and try again.");
      }
    }
  }

  // --- Start/stop recording ---
  function beginRecording() {
    setIsRecording(true);
    isRecordingRef.current = true;
    setTestDuration(0);
    testDurationRef.current = 0;
    setFingerTaps(0);
    fingerTapsRef.current = 0;
    setTapIntervals([]);
    tapIntervalsRef.current = [];
    tremorSamplesRef.current = [];
    setAnalysisResults(null);
    lastTapTimeRef.current = null;
    setStatus("Test running — tap index & thumb rapidly for 5s");

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      // Increment via ref first — never call stopTest() inside a setState updater
      const next = +(testDurationRef.current + 0.1).toFixed(1);
      testDurationRef.current = next;
      setTestDuration(next);
      if (next >= 5.0) {
        // Stop OUTSIDE the updater — direct call is safe here
        stopTest();
      }
    }, 100);
  }

  function startTest() {
    if (permission !== "granted") { setStatus("Please enable camera first."); return; }
    if (isRecordingRef.current) return;
    beginRecording();
  }

  function generateAnalysis() {
    setStatus("Processing motor data with advanced clinical algorithms...");

    setTimeout(() => {
      const { coordinationScore } = liveMetricsRef.current;
      const video = videoRef.current;
      const finalTaps = fingerTapsRef.current;
      const finalDuration = testDurationRef.current;
      const finalTapIntervals = tapIntervalsRef.current;
      const finalTremorSamples = tremorSamplesRef.current;

      const hasSufficientMotorData =
        (finalDuration >= 2.5 || finalTaps >= 3) &&
        finalTaps >= 2 &&
        finalTapIntervals.length >= 1;

      if (!hasSufficientMotorData) {
        setAnalysisResults(null);
        setStatus('Not enough motor data for a report. Perform at least 2 clear finger taps during the test, then retry.');
        return;
      }

      const computedTapRate = +(finalTaps / finalDuration).toFixed(2);
      
      console.log('Advanced analysis using:', {
        finalTaps,
        finalDuration,
        computedTapRate,
        tapIntervals: finalTapIntervals.length,
        tremorSamples: finalTremorSamples.length
      });

      // ===== ADVANCED ANALYSIS =====
      
      // 1. Advanced Tremor Analysis with FFT
      const videoHeight = video?.videoHeight || 480;
      const advancedTremor = analyzeTremorAdvanced(finalTremorSamples, videoHeight);

      // 2. Rhythm Pattern Analysis
      const rhythmAnalysis = analyzeRhythmPattern(finalTapIntervals);

      // 3. Fatigue Index (key Parkinson's indicator)
      const fatigueIndex = calculateFatigueIndex(finalTapIntervals);
      // 4. Motor Quality Score
      const motorQuality = calculateMotorQualityScore({
        tapRate: computedTapRate,
        coordinationScore,
        tremorAmplitude: advancedTremor.amplitudeNormalized,
        fatigueIndex,
        rhythmCV: rhythmAnalysis.cv
      });

      // 5. Advanced Parkinson's Risk Assessment
      const parkinsonsRisk = calculateParkinsonsRiskScore({
        tapRate: computedTapRate,
        coordinationScore,
        tremorFrequency: advancedTremor.dominantFrequency,
        tremorAmplitude: advancedTremor.amplitudeNormalized,
        tremorType: advancedTremor.type,
        fatigueIndex,
        rhythmRegularity: rhythmAnalysis.regularity,
        freezeEvents: rhythmAnalysis.freezeEvents
      });

      // Create comprehensive results
      const results: MotorAnalysisResults = {
        timestamp: new Date().toISOString(),
        fingerTaps: finalTaps,
        testDuration: finalDuration,
        tapRate: computedTapRate,
        coordinationScore,
        tremorFrequency: advancedTremor.dominantFrequency,
        tremorAmplitude: advancedTremor.amplitudeNormalized * 100,
        qualityScore: motorQuality.score,
        riskLevel: parkinsonsRisk.riskLevel === 'very_high' ? 'High' : 
                   parkinsonsRisk.riskLevel === 'high' ? 'High' :
                   parkinsonsRisk.riskLevel === 'moderate' ? 'Medium' : 'Low',
        clinicalFindings: generateAdvancedClinicalFindings(
          finalTaps, finalDuration, computedTapRate, coordinationScore, advancedTremor, 
          fatigueIndex, rhythmAnalysis, motorQuality
        ),
        diseaseRiskAssessment: generateAdvancedRiskAssessment(parkinsonsRisk, advancedTremor),
        motorCharacteristics: generateAdvancedMotorCharacteristics(
          computedTapRate, coordinationScore, advancedTremor, rhythmAnalysis, fatigueIndex, motorQuality
        ),
        recommendations: generateAdvancedRecommendations(parkinsonsRisk, motorQuality, advancedTremor)
      };

      setAnalysisResults(results);
      setStatus("Analysis complete. Your motor screening assessment is ready.");

      // Save to unified health data storage
      try {
        const safeScore = Math.max(0, Math.min(100, Math.round(motorQuality.score)));
        const healthTestResult: HealthTestResult = {
          id: generateTestResultId('motor'),
          testType: 'motor',
          category: 'neurological',
          testDate: new Date().toISOString(),
          timestamp: results.timestamp,
          data: {
            ...results,
            tapSpeed: computedTapRate,
            tapRate: computedTapRate,
            motorScore: safeScore,
          },
          score: safeScore,
          maxScore: 100,
          scorePercentage: safeScore,
          riskLevel: results.riskLevel.toLowerCase() as 'low' | 'medium' | 'high',
          interpretation: `Motor Quality Score: ${safeScore}% | Tap Rate: ${computedTapRate.toFixed(2)}/sec | Coordination: ${coordinationScore}%`,
          recommendations: results.recommendations,
          duration: finalDuration * 1000, // Convert to milliseconds
          status: 'final',
        };
        saveTestResult(healthTestResult);
        console.log('Motor test result saved to localStorage');
      } catch (error) {
        console.error('Error saving motor test result:', error);
      }
    }, 500); // Shorter delay since we're calling it separately
  }

  function stopTest() {
    if (!isRecordingRef.current) return;

    setIsRecording(false);
    isRecordingRef.current = false;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    setStatus("Test complete. Analyzing data and generating comprehensive report...");

    // Wait longer for all state updates to complete and UI to refresh
    setTimeout(() => {
      generateAnalysis();
    }, 1500); // Increased delay to ensure all state is synchronized
  }

  // --- Helpers ---
  function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label?: string) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    if (label) { ctx.font = "12px Arial"; ctx.fillStyle = "white"; ctx.fillText(label, x + 8, y - 8); }
  }

  function registerTap() {
    const now = Date.now();
    const last = lastTapTimeRef.current ?? 0;
    if (now - last <= 200) return false;
    lastTapTimeRef.current = now;

    setFingerTaps(prev => { const next = prev + 1; fingerTapsRef.current = next; return next; });
    if (last > 0) {
      setTapIntervals(prev => {
        const next = [...prev, now - last];
        if (next.length > 600) next.splice(0, next.length - 600);
        tapIntervalsRef.current = next;
        return next;
      });
    }
    return true;
  }

  // --- Prediction/render loop ---
  function predictWebcam() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !globalHandLandmarker) {
      animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Reuse DrawingUtils instance across frames to prevent memory churn
    if (!drawingUtilsRef.current || drawingUtilsCtxRef.current !== ctx) {
      drawingUtilsRef.current = new DrawingUtils(ctx);
      drawingUtilsCtxRef.current = ctx;
    }
    const drawingUtils = drawingUtilsRef.current;

    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      // Always run detection to show hand landmarks, even when not recording
      if (video.currentTime !== globalLastVideoTime) {
        globalLastVideoTime = video.currentTime;
        const results = globalHandLandmarker.detectForVideo(video, performance.now());
        const landmarksArray = results?.landmarks ?? [];
        if (lastHandsDetectedRef.current !== landmarksArray.length) {
          lastHandsDetectedRef.current = landmarksArray.length;
          setHandsDetected(landmarksArray.length);
        }

        if (landmarksArray.length > 0) {
          let minDist = Infinity;
          for (let i = 0; i < landmarksArray.length; i++) {
            const lm = landmarksArray[i];

            drawingUtils.drawLandmarks(lm, {
              color: "#FF0000",
              lineWidth: 2,
              radius: 5,
            });
            drawingUtils.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 5,
            });

            if (lm[8] && lm[4]) {
              const x8 = lm[8].x * video.videoWidth, y8 = lm[8].y * video.videoHeight;
              const x4 = lm[4].x * video.videoWidth, y4 = lm[4].y * video.videoHeight;
              const d = Math.hypot(x8 - x4, y8 - y4);
              if (d < minDist) minDist = d;
              drawDot(ctx, x8, y8, "lime", `h${i} idx`);
              drawDot(ctx, x4, y4, "orange", `h${i} thb`);
            }

            // Only collect tremor data and process taps when recording
            if (isRecordingRef.current && lm[0]) {
              tremorSamplesRef.current.push({ t: Date.now(), y: lm[0].y * video.videoHeight });
            }
          }

          // Only process tap detection when recording
          if (isRecordingRef.current) {
            if (tremorSamplesRef.current.length > 300) {
              tremorSamplesRef.current.splice(0, tremorSamplesRef.current.length - 300);
            }

            if (minDist !== Infinity) {
              const now = Date.now();
              if (now - lastDistanceUpdateRef.current >= 150) {
                lastDistanceUpdateRef.current = now;
                setLastDistancePx(Math.round(minDist));
              }

              const TAP_THRESHOLD_PX = Math.min(video.videoWidth, video.videoHeight) * thresholdFraction;
              if (minDist < TAP_THRESHOLD_PX) {
                registerTap();
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Detection loop error:", err);
      setStatus("Vision tracking paused: Ensure good lighting and keep your hand clearly in frame.");
    }

    animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
  }

  // --- Metrics ---
  function computeTremorMetrics(samples: TremorSample[]) {
    if (!videoRef.current || samples.length < 6) return { ampNorm: 0, freqHz: 0 };
    const ys = samples.map(s => s.y), ts = samples.map(s => s.t);
    const n = ys.length, mean = ys.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(ys.map(y => (y - mean) ** 2).reduce((a, b) => a + b, 0) / n);
    const ampNorm = std / videoRef.current.videoHeight;
    const durationMs = ts[n - 1] - ts[0];
    if (durationMs <= 0) return { ampNorm, freqHz: 0 };
    const fs = (n - 1) / (durationMs / 1000.0);
    let bestK = -1, bestMag = 0;
    for (let k = 1; k <= Math.floor(n / 2); k++) { let re = 0, im = 0; for (let j = 0; j < n; j++) { const angle = (-2 * Math.PI * k * j) / n; re += ys[j] * Math.cos(angle); im += ys[j] * Math.sin(angle); } const mag = Math.sqrt(re * re + im * im); if (mag > bestMag) { bestMag = mag; bestK = k; } }
    const freqHz = bestK > 0 ? (bestK * fs) / n : 0;
    return { ampNorm, freqHz };
  }

  function computeCoordinationScore(intervals: number[]) {
    if (intervals.length <= 1) return 0;
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (mean === 0) return 0;
    const std = Math.sqrt(intervals.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / intervals.length);
    const cv = std / mean;
    return Math.round(Math.max(0, Math.min(100, (1 / (1 + cv)) * 100)));
  }

  function computeMovementQuality(coordination: number, tremorAmpNorm: number) {
    const tremorPenalty = Math.min(100, tremorAmpNorm * 300 * 100) / 100;
    return Math.round(Math.max(0, Math.min(100, coordination * 0.7 + (100 - tremorPenalty) * 0.3)));
  }

  const tremorMetrics = computeTremorMetrics(tremorSamplesRef.current);
  const coordinationScore = computeCoordinationScore(tapIntervals);
  const movementQuality = computeMovementQuality(coordinationScore, tremorMetrics.ampNorm);
  const tapRate = testDuration > 0 ? fingerTaps / testDuration : 0;

  // Store live metrics in ref for analysis to use
  liveMetricsRef.current = {
    tapRate,
    coordinationScore,
    tremorMetrics,
    movementQuality
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center space-y-3 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 shadow-sm max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Motor & Tremor Lab</h1>
        </div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">{status}</p>
        <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs px-3 py-1 rounded-full">
          Computer Vision Hand Tracking
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
        <div className="flex-1 text-center sm:text-left"><p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{status}</p></div>
        <div className="flex items-center gap-2.5">
          <Button onClick={initCamera} variant="outline" disabled={isRecording} className="border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 rounded-xl">
            <CameraIcon className="w-4 h-4 mr-2" /> Enable Camera
          </Button>
          {isRecording ? (
            <Button onClick={stopTest} className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm">
              <Square className="w-4 h-4 mr-2" /> Stop &amp; Get Results ({(5 - testDuration).toFixed(1)}s left)
            </Button>
          ) : (
            <Button onClick={startTest} disabled={permission !== "granted"} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm">
              <Play className="w-4 h-4 mr-2" /> Start 5s Tap Test
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar while recording */}
      {isRecording && (
        <div className="max-w-4xl mx-auto">
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-teal-500 h-2.5 rounded-full transition-all duration-100"
              style={{ width: `${Math.min(100, (testDuration / 5) * 100)}%` }}
            />
          </div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-1">
            {testDuration.toFixed(1)}s / 5.0s — Tap your index finger &amp; thumb rapidly!
          </p>
        </div>
      )}

      {/* Tap Target Pad when recording */}
      {isRecording && (
        <div className="max-w-4xl mx-auto">
          <div
            onClick={registerTap}
            onTouchStart={(e) => { e.preventDefault(); registerTap(); }}
            className="cursor-pointer select-none bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-dashed border-teal-500/50 hover:border-teal-500 active:scale-[0.98] transition-all rounded-2xl p-5 text-center shadow-sm"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl animate-bounce">👆</span>
              <div>
                <p className="text-sm sm:text-base font-bold text-teal-700 dark:text-teal-300">
                  Interactive Tap Pad • Click or Touch Rapidly
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pinch fingers in front of camera OR tap this pad directly ({fingerTaps} taps registered)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video + Metrics */}
      <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Camera Feed */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <CardTitle className="text-slate-900 dark:text-white text-base font-semibold">Movement Capture</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">MediaPipe landmark tracking & finger tapping telemetry</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video border border-slate-200/80 dark:border-white/10 shadow-inner">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay style={{ transform: "scaleX(-1)" }} />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: "scaleX(-1)" }} />
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">Hands detected: <strong className="text-teal-600 dark:text-teal-400">{handsDetected}</strong></div>
              <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">Tap count: <strong className="text-teal-600 dark:text-teal-400">{fingerTaps}</strong></div>
              <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">Distance (px): <strong className="text-slate-900 dark:text-white">{lastDistancePx ?? "-"}</strong></div>
              <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">Tap rate: <strong className="text-emerald-600 dark:text-emerald-400">{tapRate.toFixed(2)} taps/s</strong></div>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection Status */}
        <Card className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
            <CardTitle className="text-slate-900 dark:text-white text-base font-semibold">Data Collection Status</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Real-time sampling and tremor stability</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="block text-xs text-slate-500">Tremor Samples</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold text-base">{tremorSamplesRef.current.length}</span>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="block text-xs text-slate-500">Tap Intervals</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold text-base">{tapIntervals.length}</span>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="block text-xs text-slate-500">Test Duration</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">{testDuration.toFixed(1)}s</span>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="block text-xs text-slate-500">Recording</span>
                  <span className={`font-bold text-base ${isRecording ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>{isRecording ? "Active" : "Ready"}</span>
                </div>
              </div>

              {/* Computed metrics preview */}
              <div className="border-t border-slate-200/80 dark:border-white/10 pt-3 text-xs text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white block mb-1.5 font-semibold">Live Computed Metrics:</strong>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                    Tremor Freq: <span className="text-teal-600 dark:text-teal-400 font-semibold">{computeTremorMetrics(tremorSamplesRef.current).freqHz.toFixed(2)} Hz</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                    Coordination: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{computeCoordinationScore(tapIntervals)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Inline Analysis Report - Only shown when analysis is complete */}
      {analysisResults && (
        <div className="max-w-4xl mx-auto">
          <Card ref={reportRef} className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-lg">
                    <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    Advanced Motor Function Report
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Quantitative motor control, frequency spectrum, and tremor evaluation
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setAnalysisResults(null);
                    startTest();
                  }}
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl self-start sm:self-auto font-medium text-xs shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Retake Assessment
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-5 sm:p-6">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Generated: {new Date(analysisResults.timestamp).toLocaleString()}
              </div>

              {/* Key Metrics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="text-center p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30">
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Tap Rate</div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{analysisResults.tapRate.toFixed(2)} /s</div>
                  <div className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                    {analysisResults.tapRate >= 5 ? 'Optimal' : analysisResults.tapRate >= 3 ? 'Mild Reduction' : 'Severely Reduced'}
                  </div>
                </div>
                <div className="text-center p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Coordination</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{analysisResults.coordinationScore}%</div>
                  <div className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                    {analysisResults.coordinationScore >= 80 ? 'High Precision' : analysisResults.coordinationScore >= 60 ? 'Moderate' : 'Variable'}
                  </div>
                </div>
                <div className="text-center p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Tremor Freq</div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    {analysisResults.tremorFrequency > 0 ? `${analysisResults.tremorFrequency.toFixed(1)} Hz` : '0 Hz'}
                  </div>
                  <div className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                    {analysisResults.tremorFrequency === 0 ? 'Undetected' :
                      analysisResults.tremorFrequency <= 3 ? 'Physiological' :
                        analysisResults.tremorFrequency <= 12 ? 'Pathological Indication' : 'High Frequency'}
                  </div>
                </div>
                <div className="text-center p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30">
                  <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">Quality Index</div>
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{analysisResults.qualityScore}%</div>
                  <div className="text-[11px] text-purple-600/70 dark:text-purple-400/70 mt-0.5">
                    {analysisResults.qualityScore >= 80 ? 'Reliable' : analysisResults.qualityScore >= 60 ? 'Moderate' : 'Checkup Suggested'}
                  </div>
                </div>
              </div>

              {/* Clinical Findings */}
              {analysisResults.clinicalFindings && analysisResults.clinicalFindings.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white">Motor Control Findings</h3>
                  <div className="space-y-3">
                    {analysisResults.clinicalFindings.map((finding, index) => (
                      <div key={index} className="border border-slate-200/80 dark:border-white/10 rounded-xl p-4 bg-slate-50/50 dark:bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{finding.parameter}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${finding.status === 'normal' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' :
                              finding.status === 'borderline' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' :
                                'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                            }`}>
                            {finding.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm mb-2 text-slate-600 dark:text-slate-400">
                          <div><strong className="text-slate-900 dark:text-white">Measured:</strong> {finding.value}</div>
                          <div><strong className="text-slate-900 dark:text-white">Reference Range:</strong> {finding.normalRange}</div>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-white">Significance:</strong> {finding.clinicalSignificance}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Disease Risk Assessment */}
            {analysisResults.diseaseRiskAssessment && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">Disease Risk Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Parkinson's Disease */}
                  <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">Parkinson's Disease</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${analysisResults.diseaseRiskAssessment.parkinsons.riskLevel === 'low' ? 'bg-green-500/20 text-green-300' :
                          analysisResults.diseaseRiskAssessment.parkinsons.riskLevel === 'moderate' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                        }`}>
                        {analysisResults.diseaseRiskAssessment.parkinsons.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="text-sm mb-2 text-muted-foreground">
                      <strong>Confidence:</strong> {(analysisResults.diseaseRiskAssessment.parkinsons.confidence * 100).toFixed(0)}%
                    </div>
                    {analysisResults.diseaseRiskAssessment.parkinsons.indicators.length > 0 && (
                      <div className="text-sm mb-2 text-muted-foreground">
                        <strong>Indicators:</strong>
                        <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground/80">
                          {analysisResults.diseaseRiskAssessment.parkinsons.indicators.map((indicator, idx) => (
                            <li key={idx}>{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResults.diseaseRiskAssessment.parkinsons.symptoms.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Associated Symptoms:</strong>
                        <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground/80">
                          {analysisResults.diseaseRiskAssessment.parkinsons.symptoms.map((symptom, idx) => (
                            <li key={idx}>{symptom}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Essential Tremor */}
                  <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">Essential Tremor</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${analysisResults.diseaseRiskAssessment.essentialTremor.riskLevel === 'low' ? 'bg-green-500/20 text-green-300' :
                          analysisResults.diseaseRiskAssessment.essentialTremor.riskLevel === 'moderate' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                        }`}>
                        {analysisResults.diseaseRiskAssessment.essentialTremor.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="text-sm mb-2 text-muted-foreground">
                      <strong>Confidence:</strong> {(analysisResults.diseaseRiskAssessment.essentialTremor.confidence * 100).toFixed(0)}%
                    </div>
                    {analysisResults.diseaseRiskAssessment.essentialTremor.indicators.length > 0 && (
                      <div className="text-sm mb-2 text-muted-foreground">
                        <strong>Indicators:</strong>
                        <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground/80">
                          {analysisResults.diseaseRiskAssessment.essentialTremor.indicators.map((indicator, idx) => (
                            <li key={idx}>{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResults.diseaseRiskAssessment.essentialTremor.symptoms.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Associated Symptoms:</strong>
                        <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground/80">
                          {analysisResults.diseaseRiskAssessment.essentialTremor.symptoms.map((symptom, idx) => (
                            <li key={idx}>{symptom}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Cerebellar Disorders */}
                  <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">Cerebellar Disorders</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${analysisResults.diseaseRiskAssessment.cerebellarDisorders.riskLevel === 'low' ? 'bg-green-500/20 text-green-300' :
                          analysisResults.diseaseRiskAssessment.cerebellarDisorders.riskLevel === 'moderate' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                        }`}>
                        {analysisResults.diseaseRiskAssessment.cerebellarDisorders.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="text-sm mb-2 text-muted-foreground">
                      <strong>Confidence:</strong> {(analysisResults.diseaseRiskAssessment.cerebellarDisorders.confidence * 100).toFixed(0)}%
                    </div>
                    {analysisResults.diseaseRiskAssessment.cerebellarDisorders.indicators.length > 0 && (
                      <div className="text-sm mb-2 text-muted-foreground">
                        <strong>Indicators:</strong>
                        <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground/80">
                          {analysisResults.diseaseRiskAssessment.cerebellarDisorders.indicators.map((indicator, idx) => (
                            <li key={idx}>{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResults.diseaseRiskAssessment.cerebellarDisorders.symptoms.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Associated Symptoms:</strong>
                        <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground/80">
                          {analysisResults.diseaseRiskAssessment.cerebellarDisorders.symptoms.map((symptom, idx) => (
                            <li key={idx}>{symptom}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Motor Characteristics */}
            {analysisResults.motorCharacteristics && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-foreground">Motor Characteristics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong>Movement Speed:</strong> {analysisResults.motorCharacteristics.movementSpeed.replace('_', ' ')}
                  </div>
                  <div>
                    <strong>Coordination Level:</strong> {analysisResults.motorCharacteristics.coordinationLevel}
                  </div>
                  <div>
                    <strong>Tremor Type:</strong> {analysisResults.motorCharacteristics.tremorType}
                  </div>
                  <div>
                    <strong>Rhythmicity:</strong> {analysisResults.motorCharacteristics.rhythmicity}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <strong className="text-foreground">Overall Assessment:</strong> <span className="text-muted-foreground">{analysisResults.motorCharacteristics.overallAssessment}</span>
                </div>
              </div>
            )}

            {/* Clinical Recommendations */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground">Clinical Recommendations</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                {analysisResults.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Download Report Button */}
            <div className="flex justify-center">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  const report = `
ADVANCED MOTOR ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

=== KEY METRICS ===
- Finger Taps: ${analysisResults.fingerTaps} taps in ${analysisResults.testDuration.toFixed(1)} seconds
- Tap Rate: ${analysisResults.tapRate.toFixed(2)} taps/sec
- Coordination Score: ${analysisResults.coordinationScore}%
- Tremor Frequency: ${analysisResults.tremorFrequency.toFixed(2)} Hz
- Tremor Amplitude: ${analysisResults.tremorAmplitude.toFixed(2)}%
- Quality Score: ${analysisResults.qualityScore}%

=== CLINICAL FINDINGS ===
${analysisResults.clinicalFindings?.map(finding =>
                    `${finding.parameter}: ${finding.value} (${finding.status.toUpperCase()})
  Normal Range: ${finding.normalRange}
  Clinical Significance: ${finding.clinicalSignificance}`
                  ).join('\n\n') || 'No clinical findings available'}

=== DISEASE RISK ASSESSMENT ===

Parkinson's Disease: ${analysisResults.diseaseRiskAssessment?.parkinsons.riskLevel.toUpperCase()} RISK (${(analysisResults.diseaseRiskAssessment?.parkinsons.confidence * 100).toFixed(0)}% confidence)
${analysisResults.diseaseRiskAssessment?.parkinsons.indicators.length > 0 ?
                      `Indicators: ${analysisResults.diseaseRiskAssessment.parkinsons.indicators.join(', ')}
  Symptoms: ${analysisResults.diseaseRiskAssessment.parkinsons.symptoms.join(', ')}` : 'No specific indicators detected'}

Essential Tremor: ${analysisResults.diseaseRiskAssessment?.essentialTremor.riskLevel.toUpperCase()} RISK (${(analysisResults.diseaseRiskAssessment?.essentialTremor.confidence * 100).toFixed(0)}% confidence)
${analysisResults.diseaseRiskAssessment?.essentialTremor.indicators.length > 0 ?
                      `Indicators: ${analysisResults.diseaseRiskAssessment.essentialTremor.indicators.join(', ')}
  Symptoms: ${analysisResults.diseaseRiskAssessment.essentialTremor.symptoms.join(', ')}` : 'No specific indicators detected'}

Cerebellar Disorders: ${analysisResults.diseaseRiskAssessment?.cerebellarDisorders.riskLevel.toUpperCase()} RISK (${(analysisResults.diseaseRiskAssessment?.cerebellarDisorders.confidence * 100).toFixed(0)}% confidence)
${analysisResults.diseaseRiskAssessment?.cerebellarDisorders.indicators.length > 0 ?
                      `Indicators: ${analysisResults.diseaseRiskAssessment.cerebellarDisorders.indicators.join(', ')}
  Symptoms: ${analysisResults.diseaseRiskAssessment.cerebellarDisorders.symptoms.join(', ')}` : 'No specific indicators detected'}

=== MOTOR CHARACTERISTICS ===
- Movement Speed: ${analysisResults.motorCharacteristics?.movementSpeed.replace('_', ' ')}
- Coordination Level: ${analysisResults.motorCharacteristics?.coordinationLevel}
- Tremor Type: ${analysisResults.motorCharacteristics?.tremorType}
- Rhythmicity: ${analysisResults.motorCharacteristics?.rhythmicity}
- Overall Assessment: ${analysisResults.motorCharacteristics?.overallAssessment}

=== CLINICAL RECOMMENDATIONS ===
${analysisResults.recommendations.map(rec => `• ${rec}`).join('\n')}

=== DISCLAIMER ===
This is an AI-powered screening tool for research and educational purposes only. 
Results are not diagnostic and should not replace professional medical evaluation. 
Always consult with qualified healthcare professionals for proper diagnosis and treatment.
                  `;

                  const blob = new Blob([report], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `advanced-motor-report-${new Date().toISOString().split('T')[0]}.txt`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Advanced Report
              </Button>
            </div>

            <div className="text-xs text-amber-800 dark:text-amber-300 p-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 leading-relaxed">
              <strong className="text-amber-900 dark:text-amber-200">⚠️ Clinical Notice:</strong> This is an AI-powered screening tool for research and educational purposes only.
              Results are not diagnostic and should not replace professional medical evaluation. Always consult with qualified healthcare
              professionals for proper diagnosis and treatment.
            </div>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
};

export default MotorLab;
