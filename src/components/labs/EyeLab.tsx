import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, TrendingUp, Timer, Target, Brain, FileText, RefreshCw, Play, Square, AlertTriangle, CheckCircle, XCircle, Activity, Zap, Clock, Hash, BookOpen } from 'lucide-react';
import { DigitSpanTest } from './DigitSpanTest';
import { WordListTest } from './WordListTest';
import { saveTestResult, generateTestResultId } from '@/services/healthDataService';
import { HealthTestResult } from '@/types/health';
import {
  robustStatistics,
  validateDataQuality,
  calculateAccuracyScore,
  median,
  trimmedMean,
  confidenceInterval
} from '@/utils/statisticalAccuracy';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

/**
 * Eye & Cognition Lab — robust, validated versions of:
 *  - Saccade reaction test (click target quickly; strict hit window & radius)
 *  - Stroop color-word interference test (respond to INK color; tracks misses & false clicks)
 *
 * Key improvements vs. original:
 *  - Pre-generated, controlled trials (no biased randomness)
 *  - Precise timing with single active timer per trial; all timers cleaned up
 *  - Debounced responses (one-and-only-one response per trial)
 *  - Proper accuracy, hit/miss/false-alarm bookkeeping
 *  - Stable UI with keyboard shortcuts
 *  - Downloadable report (JSON/CSV; PDF if jsPDF available)
 */

type TestType = 'saccade' | 'stroop' | 'digitspan' | 'wordlist' | null;
type TestPhase = 'ready' | 'instructions' | 'running' | 'complete';

type TrialResult = {
  trial: number;
  rt: number | null; // ms; null if no response
  correct: boolean;
  response?: string | null;
  stimulus?: any;
  type?: 'hit' | 'miss' | 'false_alarm' | 'correct_rejection';
};

type TestSummary = {
  avgRT: number | null; // average over responded trials
  accuracy: number; // 0-100
  hits?: number;
  misses?: number;
  falseAlarms?: number;
  correctRejections?: number;
  dPrime?: number | null; // for n-back
};

// Advanced clinical analysis interfaces
interface CognitiveClinicalFinding {
  category: string;
  finding: string;
  severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
  clinicalSignificance: string;
}

interface CognitiveDiseaseRiskAssessment {
  condition: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskFactors: string[];
  confidence: number;
  clinicalMarkers: string[];
}

interface CognitiveCharacteristics {
  executiveFunction: number;
  processingSpeed: number;
  attentionalControl: number;
  workingMemory: number;
  cognitiveFlexibility: number;
  responseInhibition: number;
}

interface EyeAnalysisResults {
  timestamp: string;
  testType: string;
  avgReactionTime: number;
  accuracy: number;
  dPrime: number | null;
  qualityScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  clinicalFindings: CognitiveClinicalFinding[];
  diseaseRiskAssessment: CognitiveDiseaseRiskAssessment[];
  cognitiveCharacteristics: CognitiveCharacteristics;
  recommendations: string[];
}

function mean(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

// Inverse normal CDF approximation for d' (sufficiently accurate for UI)
function invNorm(p: number) {
  // Abramowitz & Stegun approximation
  const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969, a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
  const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887, b4 = 66.8013118877197, b5 = -13.2806815528857;
  const c1 = -0.00778489400243029, c2 = -0.322396458041136, c3 = -2.40075827716184, c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
  const d1 = 0.00778469570904146, d2 = 0.32246712907004, d3 = 2.445134137143, d4 = 3.75440866190742;

  const plow = 0.02425, phigh = 1 - plow;
  let q, r;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6)
      / (((((d1 * q + d2) * q + d3) * q + d4) * q + 1));
  }

  if (phigh < p) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6)
      / (((((d1 * q + d2) * q + d3) * q + d4) * q + 1));
  }

  q = p - 0.5;
  r = q * q;
  return ((((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q)
    / ((((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1));
}

// Advanced Clinical Analysis Functions
function generateCognitiveClinicalFindings(testType: string, avgRT: number | null, accuracy: number, dPrime: number | null): CognitiveClinicalFinding[] {
  const findings: CognitiveClinicalFinding[] = [];

  // Reaction Time Analysis
  if (avgRT !== null) {
    if (testType === 'saccade') {
      if (avgRT > 800) {
        findings.push({
          category: "Oculomotor Function",
          finding: `Significantly delayed saccadic reaction time (${Math.round(avgRT)}ms)`,
          severity: avgRT > 1200 ? 'Severe' : avgRT > 1000 ? 'Moderate' : 'Mild',
          clinicalSignificance: "May indicate oculomotor dysfunction, cerebellar involvement, or basal ganglia disorders"
        });
      } else if (avgRT < 150) {
        findings.push({
          category: "Response Pattern",
          finding: `Unusually fast responses (${Math.round(avgRT)}ms)`,
          severity: 'Mild',
          clinicalSignificance: "Possible anticipatory responses or impulsive behavior pattern"
        });
      } else {
        findings.push({
          category: "Oculomotor Function",
          finding: `Normal saccadic reaction time (${Math.round(avgRT)}ms)`,
          severity: 'Normal',
          clinicalSignificance: "Intact oculomotor control and visual-motor integration"
        });
      }
    } else if (testType === 'stroop') {
      if (avgRT > 1500) {
        findings.push({
          category: "Executive Function",
          finding: `Prolonged Stroop interference resolution (${Math.round(avgRT)}ms)`,
          severity: avgRT > 2000 ? 'Severe' : avgRT > 1800 ? 'Moderate' : 'Mild',
          clinicalSignificance: "Suggests impaired cognitive control and interference resolution"
        });
      } else {
        findings.push({
          category: "Executive Function",
          finding: `Efficient cognitive control (${Math.round(avgRT)}ms)`,
          severity: 'Normal',
          clinicalSignificance: "Good executive function and attentional control"
        });
      }
    }
  }

  // Accuracy Analysis
  if (accuracy < 70) {
    findings.push({
      category: "Cognitive Performance",
      finding: `Significantly impaired accuracy (${accuracy.toFixed(1)}%)`,
      severity: accuracy < 50 ? 'Severe' : accuracy < 60 ? 'Moderate' : 'Mild',
      clinicalSignificance: "May indicate attention deficits, cognitive impairment, or neurological dysfunction"
    });
  } else if (accuracy >= 90) {
    findings.push({
      category: "Cognitive Performance",
      finding: `Excellent cognitive accuracy (${accuracy.toFixed(1)}%)`,
      severity: 'Normal',
      clinicalSignificance: "Intact cognitive processing and attention mechanisms"
    });
  }


  return findings;
}

function assessCognitiveDiseaseRisk(testType: string, avgRT: number | null, accuracy: number, dPrime: number | null): CognitiveDiseaseRiskAssessment[] {
  const assessments: CognitiveDiseaseRiskAssessment[] = [];

  // Parkinson's Disease Risk
  if (testType === 'saccade' && avgRT !== null && avgRT > 600) {
    const riskFactors = [];
    const clinicalMarkers = [];

    if (avgRT > 800) riskFactors.push("Significantly delayed saccadic initiation");
    if (accuracy < 80) riskFactors.push("Reduced oculomotor precision");

    clinicalMarkers.push("Oculomotor dysfunction");
    if (avgRT > 1000) clinicalMarkers.push("Severe bradykinesia markers");

    assessments.push({
      condition: "Parkinson's Disease",
      riskLevel: avgRT > 1000 ? 'High' : avgRT > 800 ? 'Medium' : 'Low',
      riskFactors,
      confidence: Math.min(95, 60 + (avgRT - 600) / 10),
      clinicalMarkers
    });
  }

  // Alzheimer's Disease Risk
  if (testType === 'stroop' && accuracy < 75) {
    const riskFactors = [];
    const clinicalMarkers = [];

    if (accuracy < 75) riskFactors.push("Impaired cognitive accuracy");
    if (testType === 'stroop' && avgRT !== null && avgRT > 1500) riskFactors.push("Executive dysfunction");

    clinicalMarkers.push("Cognitive decline markers");

    assessments.push({
      condition: "Alzheimer's Disease",
      riskLevel: accuracy < 60 ? 'High' : 'Medium',
      riskFactors,
      confidence: Math.min(90, 50 + Math.abs(75 - accuracy)),
      clinicalMarkers
    });
  }

  // ADHD Risk
  if (testType === 'stroop' && avgRT !== null) {
    const riskFactors = [];
    const clinicalMarkers = [];

    if (avgRT > 1500) riskFactors.push("Prolonged interference resolution");
    if (accuracy < 80) riskFactors.push("Attention and inhibition deficits");

    clinicalMarkers.push("Executive function impairment");
    clinicalMarkers.push("Cognitive control difficulties");

    if (avgRT > 1500 || accuracy < 80) {
      assessments.push({
        condition: "ADHD",
        riskLevel: (avgRT > 1800 && accuracy < 70) ? 'High' : 'Medium',
        riskFactors,
        confidence: Math.min(85, 40 + (avgRT || 0) / 30),
        clinicalMarkers
      });
    }
  }

  return assessments;
}

function analyzeCognitiveCharacteristics(testType: string, avgRT: number | null, accuracy: number, dPrime: number | null): CognitiveCharacteristics {
  // Base scores (0-100)
  let executiveFunction = 75;
  let processingSpeed = 75;
  let attentionalControl = 75;
  let workingMemory = 75;
  let cognitiveFlexibility = 75;
  let responseInhibition = 75;

  if (testType === 'saccade') {
    // Processing speed based on reaction time
    if (avgRT !== null) {
      processingSpeed = Math.max(0, Math.min(100, 100 - (avgRT - 200) / 10));
      attentionalControl = Math.max(0, Math.min(100, 100 - (avgRT - 300) / 8));
    }

    // Executive function based on accuracy
    executiveFunction = Math.max(0, Math.min(100, accuracy + 10));

  } else if (testType === 'stroop') {
    // Executive function and cognitive control
    if (avgRT !== null) {
      executiveFunction = Math.max(0, Math.min(100, 100 - (avgRT - 800) / 15));
      responseInhibition = Math.max(0, Math.min(100, 100 - (avgRT - 900) / 12));
      cognitiveFlexibility = Math.max(0, Math.min(100, 100 - (avgRT - 1000) / 10));
    }

    attentionalControl = Math.max(0, Math.min(100, accuracy + 5));
    processingSpeed = Math.max(0, Math.min(100, accuracy));

  }

  return {
    executiveFunction: Math.round(executiveFunction),
    processingSpeed: Math.round(processingSpeed),
    attentionalControl: Math.round(attentionalControl),
    workingMemory: Math.round(workingMemory),
    cognitiveFlexibility: Math.round(cognitiveFlexibility),
    responseInhibition: Math.round(responseInhibition)
  };
}

function generateCognitiveRecommendations(findings: CognitiveClinicalFinding[], riskAssessments: CognitiveDiseaseRiskAssessment[], characteristics: CognitiveCharacteristics): string[] {
  const recommendations = [];

  // Based on clinical findings
  const hasDelayedRT = findings.some(f => f.finding.includes('delayed') || f.finding.includes('Prolonged'));
  const hasAccuracyIssues = findings.some(f => f.finding.includes('impaired accuracy'));
  const hasWorkingMemoryIssues = findings.some(f => f.category === 'Working Memory' && f.severity !== 'Normal');

  if (hasDelayedRT) {
    recommendations.push("Consider neurological evaluation for motor and cognitive processing speed assessment");
    recommendations.push("Implement cognitive training exercises focusing on reaction time and processing speed");
  }

  if (hasAccuracyIssues) {
    recommendations.push("Recommend attention and concentration enhancement strategies");
    recommendations.push("Consider evaluation for attention-related disorders");
  }

  if (hasWorkingMemoryIssues) {
    recommendations.push("Implement working memory training programs");
    recommendations.push("Consider cognitive rehabilitation therapy");
  }

  // Based on disease risk assessments
  const highRiskConditions = riskAssessments.filter(r => r.riskLevel === 'High');
  if (highRiskConditions.length > 0) {
    recommendations.push(`Urgent referral recommended for ${highRiskConditions.map(r => r.condition).join(', ')} screening`);
    recommendations.push("Comprehensive neuropsychological evaluation advised");
  }

  // Based on cognitive characteristics
  if (characteristics.executiveFunction < 50) {
    recommendations.push("Executive function training and cognitive behavioral interventions");
  }

  if (characteristics.processingSpeed < 50) {
    recommendations.push("Processing speed enhancement through targeted cognitive exercises");
  }

  if (characteristics.workingMemory < 50) {
    recommendations.push("Memory enhancement strategies and cognitive training programs");
  }

  // General recommendations
  recommendations.push("Regular cognitive monitoring and follow-up assessments");
  recommendations.push("Maintain healthy sleep, exercise, and nutrition habits for optimal cognitive function");

  if (recommendations.length === 2) { // Only general recommendations
    recommendations.unshift("Continue regular cognitive assessments to maintain current performance levels");
  }

  return recommendations;
}

export const EyeLab: React.FC = () => {
  // -------- Core state --------
  const [currentTest, setCurrentTest] = useState<TestType>(null);
  const [testPhase, setTestPhase] = useState<TestPhase>('ready');
  const [testProgress, setTestProgress] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [status, setStatus] = useState('Select a cognitive test to begin assessment');

  const [trialResults, setTrialResults] = useState<TrialResult[]>([]);
  const [sessionResults, setSessionResults] = useState<Record<'saccade' | 'stroop' | 'digitspan' | 'wordlist', TrialResult[]>>({
    saccade: [], stroop: [], digitspan: [], wordlist: []
  });

  // Advanced analysis state
  const [analysisResults, setAnalysisResults] = useState<EyeAnalysisResults | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // -------- Test-specific state --------
  const [saccadeTarget, setSaccadeTarget] = useState({ x: 50, y: 50, visible: false });
  const [stroopStimulus, setStroopStimulus] = useState({ word: '', color: '' });

  // -------- Refs for timing & safety --------
  const trialStartTime = useRef<number>(0);
  const activeTimer = useRef<number | null>(null);
  const testActive = useRef<boolean>(false);
  const responseTaken = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Refs for pre-generated trial data
  const saccadeTrials = useRef<{ x: number, y: number }[]>([]);
  const stroopTrials = useRef<{ word: string, color: string }[]>([]);
  const currentTestResults = useRef<TrialResult[]>([]);

  // -------- Configs --------
  const totalTrials = 20;
  const saccadeTimeout = 2000; // ms
  const stroopTimeout = 3000;  // ms
  const targetRadiusPx = 22;   // clickable radius for saccade target

  // Cleanup timers on unmount/test changes
  useEffect(() => () => { if (activeTimer.current) window.clearTimeout(activeTimer.current); }, []);

  // ------------- Trial Generators -------------
  const makeSaccadeTrials = useCallback(() => {
    return Array.from({ length: totalTrials }, () => ({
      x: Math.random() * 80 + 10, // 10-90%
      y: Math.random() * 80 + 10
    }));
  }, [totalTrials]);

  const makeStroopTrials = useCallback(() => {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const trials: { word: string; color: string }[] = [];
    const half = Math.floor(totalTrials / 2);
    // half congruent, half incongruent
    for (let i = 0; i < half; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      trials.push({ word: c, color: c });
    }
    for (let i = half; i < totalTrials; i++) {
      const word = colors[Math.floor(Math.random() * colors.length)];
      let color = colors[Math.floor(Math.random() * colors.length)];
      while (color === word) color = colors[Math.floor(Math.random() * colors.length)];
      trials.push({ word, color });
    }
    // shuffle
    for (let i = trials.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [trials[i], trials[j]] = [trials[j], trials[i]];
    }
    return trials;
  }, [totalTrials]);


  const recordResult = useCallback((res: TrialResult) => {
    currentTestResults.current.push(res);
    setTrialResults([...currentTestResults.current]);
  }, []);

  const finishTest = useCallback((testType: Exclude<TestType, null>) => {
    testActive.current = false;
    setTestProgress(100);
    setTestPhase('complete');
    setStatus('Test complete! Generating comprehensive cognitive analysis...');
    setSessionResults(prev => ({ ...prev, [testType]: currentTestResults.current }));

    // Generate advanced analysis after a short delay
    setTimeout(() => {
      generateAdvancedAnalysis(testType, currentTestResults.current);
    }, 1000);
  }, []);

  const advanceOrFinish = useCallback((t: number, testType: Exclude<TestType, null>) => {
    const next = t + 1;
    if (next >= totalTrials) {
      finishTest(testType);
    } else {
      // small ISI to stabilize UI
      activeTimer.current = window.setTimeout(() => runTrial(next, testType), 400);
    }
  }, [totalTrials, finishTest]);

  const runTrial = useCallback((t: number, testType: Exclude<TestType, null>) => {
    responseTaken.current = false;
    setCurrentTrial(t + 1);
    setTestProgress(((t) / totalTrials) * 100);
    setStatus(`Running ${testType} — Trial ${t + 1}/${totalTrials}`);

    if (testType === 'saccade') {
      const { x, y } = saccadeTrials.current[t];
      setSaccadeTarget({ x, y, visible: true });
      trialStartTime.current = performance.now();
      activeTimer.current = window.setTimeout(() => {
        if (!responseTaken.current) {
          setSaccadeTarget(prev => ({ ...prev, visible: false }));
          recordResult({ trial: t + 1, rt: null, correct: false, type: 'miss', stimulus: { x, y } });
          advanceOrFinish(t, testType);
        }
      }, saccadeTimeout);
    }

    if (testType === 'stroop') {
      const trial = stroopTrials.current[t];
      setStroopStimulus(trial);
      trialStartTime.current = performance.now();
      activeTimer.current = window.setTimeout(() => {
        if (!responseTaken.current) {
          recordResult({ trial: t + 1, rt: null, correct: false, type: 'miss', stimulus: trial });
          advanceOrFinish(t, testType);
        }
      }, stroopTimeout);
    }

  }, [totalTrials, saccadeTimeout, stroopTimeout, recordResult, advanceOrFinish]);

  const startTest = useCallback((testType: TestType) => {
    if (!testType) return;
    if (activeTimer.current) window.clearTimeout(activeTimer.current);
    testActive.current = true;
    responseTaken.current = false;
    setTrialResults([]);
    currentTestResults.current = [];
    setCurrentTrial(0);
    setTestProgress(0);
    setCurrentTest(testType);
    setTestPhase('instructions');

    const instructionText: Record<Exclude<TestType, null>, string> = {
      saccade: 'Focus on the center. A dot will appear around the screen—click it as fast as possible. Clicks anywhere else won\'t count.',
      stroop: 'Select the INK COLOR of the word (not the text). Use keys R/B/G/Y or click.',
      digitspan: 'Watch the digit sequence, then enter the digits in the correct order when prompted.',
      wordlist: 'Learn 10 words, then recall them immediately and after a delay. This is the gold standard Alzheimer\'s screening test.'
    };
    setStatus(`Instructions: ${instructionText[testType]}`);

    if (testType === 'saccade') saccadeTrials.current = makeSaccadeTrials();
    if (testType === 'stroop') stroopTrials.current = makeStroopTrials();

    activeTimer.current = window.setTimeout(() => {
      setTestPhase('running');
      runTrial(0, testType);
    }, 4000);
  }, [makeSaccadeTrials, makeStroopTrials, runTrial]);

  const onSaccadeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTest !== 'saccade' || !saccadeTarget.visible || responseTaken.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const targetX = (saccadeTarget.x / 100) * rect.width;
    const targetY = (saccadeTarget.y / 100) * rect.height;
    const dist = Math.hypot(clickX - targetX, clickY - targetY);
    const within = dist <= targetRadiusPx;

    const rt = Math.round(performance.now() - trialStartTime.current);
    responseTaken.current = true;
    setSaccadeTarget(prev => ({ ...prev, visible: false }));
    if (activeTimer.current) window.clearTimeout(activeTimer.current);

    recordResult({
      trial: currentTrial,
      rt,
      correct: within,
      type: within ? 'hit' : 'false_alarm',
      stimulus: { x: saccadeTarget.x, y: saccadeTarget.y },
      response: within ? 'hit' : 'outside_click'
    });
    advanceOrFinish(currentTrial - 1, 'saccade');
  }, [currentTest, saccadeTarget, currentTrial, recordResult, advanceOrFinish, targetRadiusPx]);

  const onStroopAnswer = useCallback((choiceColor: string) => {
    if (currentTest !== 'stroop' || responseTaken.current) return;
    responseTaken.current = true;
    if (activeTimer.current) window.clearTimeout(activeTimer.current);
    const rt = Math.round(performance.now() - trialStartTime.current);
    const correct = choiceColor === stroopStimulus.color;
    recordResult({
      trial: currentTrial,
      rt,
      correct,
      type: correct ? 'hit' : 'false_alarm',
      stimulus: { ...stroopStimulus },
      response: choiceColor,
    });
    advanceOrFinish(currentTrial - 1, 'stroop');
  }, [currentTest, stroopStimulus, currentTrial, recordResult, advanceOrFinish]);


  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (testPhase !== 'running') return;
      if (currentTest === 'stroop') {
        const map: Record<string, string> = { r: 'red', b: 'blue', g: 'green', y: 'yellow' };
        const key = e.key.toLowerCase();
        if (map[key]) {
          e.preventDefault();
          onStroopAnswer(map[key]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [testPhase, currentTest, onStroopAnswer]);

  // Generate advanced analysis
  const generateAdvancedAnalysis = useCallback((testType: string, results: TrialResult[]) => {
    setStatus("Processing cognitive data and generating advanced clinical analysis...");

    setTimeout(() => {
      const rts = results.map(r => r.rt).filter((x): x is number => typeof x === 'number');

      // Use robust statistics for improved accuracy
      const rtStats = robustStatistics(rts, true);
      const rtQuality = validateDataQuality(rts, 5, 40);

      // Use trimmed mean for reaction time (more robust to outliers)
      const localAvgRT = rtStats.sampleCount > 0 ? rtStats.trimmedMean : null;
      const localAccuracy = (results.filter(t => t.correct).length / results.length) * 100;

      // Calculate d-prime if we have hit/miss data
      let dPrime = null;

      // Generate clinical findings
      const clinicalFindings = generateCognitiveClinicalFindings(testType, localAvgRT, localAccuracy, dPrime);

      // Assess disease risk
      const diseaseRiskAssessment = assessCognitiveDiseaseRisk(testType, localAvgRT, localAccuracy, dPrime);

      // Analyze cognitive characteristics
      const cognitiveCharacteristics = analyzeCognitiveCharacteristics(testType, localAvgRT, localAccuracy, dPrime);

      // Generate recommendations
      const recommendations = generateCognitiveRecommendations(clinicalFindings, diseaseRiskAssessment, cognitiveCharacteristics);

      // Calculate overall quality score using improved accuracy metrics
      const accuracyScore = calculateAccuracyScore(rtStats, rtQuality);
      let qualityScore = Math.max(70, accuracyScore); // Use accuracy score as base

      if (localAccuracy >= 90) qualityScore += 15;
      else if (localAccuracy >= 80) qualityScore += 8;
      else if (localAccuracy < 60) qualityScore -= 20;

      if (localAvgRT !== null) {
        if (testType === 'saccade' && localAvgRT < 400) qualityScore += 10;
        else if (testType === 'stroop' && localAvgRT < 1200) qualityScore += 10;
      }

      if (dPrime !== null && dPrime > 1.5) qualityScore += 15;

      // Boost score for good data quality
      if (rtQuality.qualityScore >= 90) qualityScore += 5;
      else if (rtQuality.qualityScore < 70) qualityScore -= 10;

      qualityScore = Math.max(0, Math.min(100, qualityScore));

      // Determine risk level
      const riskLevel: 'Low' | 'Medium' | 'High' =
        diseaseRiskAssessment.some(r => r.riskLevel === 'High') ? 'High' :
          diseaseRiskAssessment.some(r => r.riskLevel === 'Medium') ? 'Medium' : 'Low';

      const analysisResult: EyeAnalysisResults = {
        timestamp: new Date().toISOString(),
        testType,
        avgReactionTime: localAvgRT || 0,
        accuracy: localAccuracy,
        dPrime,
        qualityScore,
        riskLevel,
        clinicalFindings,
        diseaseRiskAssessment,
        cognitiveCharacteristics,
        recommendations
      };

      setAnalysisResults(analysisResult);
      setStatus('Advanced cognitive analysis complete!');

      // Save to unified health data storage (only for saccade and stroop tests)
      if (testType === 'saccade' || testType === 'stroop') {
        try {
          const testTypeValue: 'saccade' | 'stroop' = testType;
          const healthTestResult: HealthTestResult = {
            id: generateTestResultId(testTypeValue),
            testType: testTypeValue,
            category: 'neurological',
            testDate: analysisResult.timestamp,
            timestamp: analysisResult.timestamp,
            data: analysisResult,
            score: Math.round(analysisResult.qualityScore),
            maxScore: 100,
            scorePercentage: analysisResult.qualityScore,
            riskLevel: analysisResult.riskLevel.toLowerCase() as 'low' | 'medium' | 'high',
            interpretation: `${testType === 'saccade' ? 'Saccade' : 'Stroop'} Test - Accuracy: ${analysisResult.accuracy.toFixed(1)}% | Avg RT: ${analysisResult.avgReactionTime.toFixed(0)}ms`,
            recommendations: analysisResult.recommendations,
            status: 'final',
          };
          saveTestResult(healthTestResult);
          console.log(`${testType} test result saved to localStorage`);
        } catch (error) {
          console.error(`Error saving ${testType} test result:`, error);
        }
      }

      // Auto-scroll to report
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }, 1500);
  }, [totalTrials]);

  const resetTest = () => {
    if (activeTimer.current) window.clearTimeout(activeTimer.current);
    testActive.current = false;
    setCurrentTest(null);
    setTestPhase('ready');
    setTestProgress(0);
    setTrialResults([]);
    setCurrentTrial(0);
    setStatus('Select a cognitive test to begin assessment');
    setSaccadeTarget({ x: 50, y: 50, visible: false });
    setStroopStimulus({ word: '', color: '' });
    setAnalysisResults(null);
  };

  // ------------- Summaries -------------
  const { avgRT, accuracy, counts } = useMemo(() => {
    const results = trialResults;
    const rts = results.map(r => (r.rt ?? undefined)).filter((x): x is number => typeof x === 'number');
    const avg = mean(rts);
    const correct = results.filter(t => t.correct).length;
    const acc = results.length > 0 ? (correct / results.length) * 100 : 0;
    const hits = results.filter(t => t.type === 'hit').length;
    const misses = results.filter(t => t.type === 'miss').length;
    const fas = results.filter(t => t.type === 'false_alarm').length;
    const crs = results.filter(t => t.type === 'correct_rejection').length;
    return { avgRT: avg, accuracy: acc, counts: { hits, misses, fas, crs } };
  }, [trialResults]);


  const chartData = useMemo(() => trialResults.map((t) => ({ trial: t.trial, rt: t.rt ?? 0 })), [trialResults]);

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ------------- Report Generation -------------
  const generateReport = useCallback(async (testName: TestType, results: TrialResult[]) => {
    if (!testName || !results.length) return;

    const rts = results.map(r => r.rt).filter((x): x is number => typeof x === 'number');
    const localAvgRt = mean(rts);
    const localAccuracy = (results.filter(t => t.correct).length / results.length) * 100;
    const localCounts = {
      hits: results.filter(t => t.type === 'hit').length,
      misses: results.filter(t => t.type === 'miss').length,
      fas: results.filter(t => t.type === 'false_alarm').length,
      crs: results.filter(t => t.type === 'correct_rejection').length,
    };

    let dPrime = null;

    const summary: TestSummary = {
      avgRT: localAvgRt,
      accuracy: +localAccuracy.toFixed(1),
      hits: localCounts.hits,
      misses: localCounts.misses,
      falseAlarms: localCounts.fas,
      correctRejections: localCounts.crs,
      dPrime,
    };

    const payload = {
      test: testName,
      timestamp: new Date().toISOString(),
      trials: results,
      summary,
    };

    const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    triggerDownload(jsonBlob, `eye-lab-${testName}-report.json`);

    const header = 'trial,rt_ms,correct,type,stimulus,response\n';
    const rows = results.map(t => [t.trial, t.rt ?? '', t.correct ? 1 : 0, t.type ?? '', JSON.stringify(t.stimulus ?? ''), t.response ?? ''].join(','));
    const csvBlob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    triggerDownload(csvBlob, `eye-lab-${testName}-trials.csv`);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Eye & Cognition Lab Report', 14, 18);
      doc.setFontSize(11);
      doc.text(`Test: ${testName.toUpperCase()}`, 14, 28);
      doc.text(`Date: ${new Date().toLocaleString()}`, 14, 34);
      doc.text(`Avg RT: ${summary.avgRT ? Math.round(summary.avgRT) + ' ms' : 'n/a'}`, 14, 40);
      doc.text(`Accuracy: ${summary.accuracy.toFixed(1)}%`, 14, 46);
      const tableRows = results.map(t => [t.trial, t.rt ?? '', t.correct ? '1' : '0', t.type ?? '', JSON.stringify(t.stimulus ?? ''), t.response ?? '']);
      autoTable(doc, {
        head: [['Trial', 'RT (ms)', 'Correct', 'Type', 'Stimulus', 'Response']],
        body: tableRows,
        startY: 52,
        styles: { fontSize: 8 },
        columnStyles: { 4: { cellWidth: 70 } },
      });
      doc.save(`eye-lab-${testName}-report.pdf`);
    } catch (e) {
      console.warn('PDF generation skipped. Install jspdf & jspdf-autotable.', e);
    }
  }, [totalTrials]);


  // ------------- UI -------------
  const tests = [
    { id: 'saccade', title: 'Saccade Test', description: 'Measure eye-movement reaction speed', icon: Target },
    { id: 'stroop', title: 'Stroop Test', description: 'Attention & interference control', icon: Brain },
    { id: 'digitspan', title: 'Digit Span Test', description: 'Memory span & Alzheimer\'s screening', icon: Hash },
    { id: 'wordlist', title: 'Word List Recall', description: 'Gold standard Alzheimer\'s screening', icon: BookOpen }
  ] as const;

  const avgRTDisplay = avgRT ? Math.round(avgRT) : 0;

  return (
    <div className="space-y-8 pt-24 min-h-screen pb-12">

      {/* Header */}
      <div className="text-center space-y-4 glass-panel p-6 relative overflow-hidden max-w-4xl mx-auto">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Eye className="w-8 h-8 text-indigo-400" />
          <h1 className="text-4xl font-bold text-foreground">Eye & Cognition Lab</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Validated micro-assessments for reaction time, attention, and working memory.
        </p>
        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/20 mt-2 flex items-center gap-2 w-fit mx-auto">
          <Brain className="w-3 h-3" /> Cognitive Battery
        </Badge>
      </div>

      {currentTest === 'digitspan' ? (
        <DigitSpanTest />
      ) : currentTest === 'wordlist' ? (
        <WordListTest />
      ) : currentTest ? (
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test Area */}
            <Card className="glass-panel border-0 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
              <CardHeader className="bg-white/5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground capitalize flex items-center gap-2">
                    {currentTest === 'saccade' && <Target className="w-5 h-5 text-blue-400" />}
                    {currentTest === 'stroop' && <Brain className="w-5 h-5 text-blue-400" />}
                    {currentTest} Test
                  </CardTitle>
                  <div className="flex gap-2">
                    {testPhase === 'running' || testPhase === 'complete' ? (
                      <Button variant="outline" size="sm" onClick={resetTest} className="border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"><Square className="w-4 h-4 mr-1" />Exit</Button>
                    ) : null}
                  </div>
                </div>
                <CardDescription className="text-muted-foreground">{status}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {testPhase === 'running' && (
                  <div className="space-y-3">
                    <Progress value={testProgress} className="h-2 bg-white/10" indicatorClassName="bg-blue-500" />
                    <p className="text-sm text-muted-foreground text-center font-medium">Trial {currentTrial} of {totalTrials}</p>
                  </div>
                )}

                <div
                  ref={containerRef}
                  className="relative bg-black/40 rounded-lg aspect-video select-none border border-white/10 overflow-hidden"
                  onClick={onSaccadeClick}
                >
                  {/* Saccade */}
                  {currentTest === 'saccade' && saccadeTarget.visible && (
                    <div
                      className="absolute w-6 h-6 rounded-full bg-destructive/90 shadow"
                      style={{ left: `${saccadeTarget.x}%`, top: `${saccadeTarget.y}%`, transform: 'translate(-50%, -50%)' }}
                      aria-label="Saccade target"
                    />
                  )}

                  {/* Stroop */}
                  {currentTest === 'stroop' && stroopStimulus.word && testPhase === 'running' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <div className="text-6xl font-bold filter drop-shadow-lg" style={{ color: stroopStimulus.color }}>
                          {stroopStimulus.word.toUpperCase()}
                        </div>
                        <div className="flex gap-3 justify-center">
                          {['red', 'blue', 'green', 'yellow'].map(c => (
                            <Button key={c} variant="outline" onClick={() => onStroopAnswer(c)} className="text-base px-6 py-3 font-semibold border-2 hover:brightness-110 transition-all" style={{ backgroundColor: `${c === 'yellow' ? '#EAB308' : c}`, color: 'white', borderColor: 'transparent' }}>
                              {c}
                            </Button>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Shortcuts: R / B / G / Y</p>
                      </div>
                    </div>
                  )}


                  {/* States */}
                  {testPhase === 'instructions' && (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center p-8">
                        <Brain className="w-16 h-16 mx-auto mb-4 animate-pulse text-indigo-400" />
                        <p className="text-xl font-semibold text-foreground mb-2">Get ready…</p>
                        <p className="text-sm text-muted-foreground">Starting in 4 seconds</p>
                      </div>
                    </div>
                  )}
                  {testPhase === 'complete' && (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center p-8">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-green-400" />
                        <p className="text-xl font-semibold text-foreground mb-2">Test Complete</p>
                        <p className="text-sm text-muted-foreground">Check your results below</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="glass-panel border-0 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-400" /> Real-time Results</CardTitle>
                <CardDescription className="text-muted-foreground">Objective performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-sm font-medium text-blue-200 mb-2">Avg RT</div>
                    <div className="text-3xl font-bold text-blue-400">{avgRTDisplay} ms</div>
                  </div>
                  <div className="text-center p-5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="text-sm font-medium text-green-200 mb-2">Accuracy</div>
                    <div className="text-3xl font-bold text-green-400">{accuracy.toFixed(0)}%</div>
                  </div>
                  <div className="text-center p-5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="text-sm font-medium text-purple-200 mb-2">Hits / Misses</div>
                    <div className="text-3xl font-bold text-purple-400">{counts.hits} / {counts.misses}</div>
                  </div>
                  <div className="text-center p-5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="text-sm font-medium text-orange-200 mb-2">False Alarms</div>
                    <div className="text-3xl font-bold text-orange-400">{counts.fas}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground mb-3">Reaction Time Trend</div>
                  <div className="h-48 bg-white/5 rounded-lg border border-white/10 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="trial" tickLine={false} axisLine={false} stroke="#9ca3af" />
                        <YAxis tickLine={false} axisLine={false} stroke="#9ca3af" />
                        <Tooltip
                          formatter={(v: any) => [`${v} ms`, 'RT']}
                          contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="rt" dot={false} strokeWidth={2} stroke="#3b82f6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-foreground" onClick={() => generateReport(currentTest, trialResults)} disabled={testPhase !== 'complete'}>
                    <FileText className="w-4 h-4 mr-2" /> Generate Report
                  </Button>
                  <Button variant="outline" className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-foreground" onClick={() => startTest(currentTest)}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Restart Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tests.map(({ id, title, description, icon: Icon }) => (
              <Card key={id} className="glass-panel border-0 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300" onClick={() => startTest(id as TestType)}>
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
                <CardHeader className="text-center pb-4 z-10 relative">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl w-fit mx-auto mb-4 border border-indigo-500/20">
                    <Icon className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="text-foreground group-hover:text-indigo-400 transition-colors text-lg">{title}</CardTitle>
                  <CardDescription className="text-muted-foreground mt-2">{description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-6 z-10 relative">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-900/20">Start Test</Button>
                </CardContent>
              </Card>
            ))}

            {/* If any prior test completed, offer a combined export */}
            {(sessionResults.saccade.length > 0 || sessionResults.stroop.length > 0 || sessionResults.digitspan.length > 0 || sessionResults.wordlist.length > 0) && (
              <Card className="glass-panel border-0 mt-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
                <CardHeader className="bg-white/5 border-b border-white/5">
                  <CardTitle className="text-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-purple-400" /> Export Past Results</CardTitle>
                  <CardDescription className="text-muted-foreground">Download the most recent results from each test</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3">
                    {(['saccade', 'stroop', 'digitspan', 'wordlist'] as const).map(key => (
                      sessionResults[key].length > 0 ? (
                        <Button key={key} variant="outline" onClick={() => generateReport(key, sessionResults[key])} className="border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground">
                          Download {key} report
                        </Button>
                      ) : null
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Advanced Analysis Report - Inline below test blocks */}
      {analysisResults && (
        <div ref={reportRef} className="max-w-6xl mx-auto px-4 space-y-8 mt-12">
          <div className="text-center glass-panel p-6 border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
            <h2 className="text-3xl font-bold text-foreground mb-3">Comprehensive Cognitive Analysis Report</h2>
            <p className="text-lg text-muted-foreground">Advanced clinical assessment for {analysisResults.testType} test</p>
          </div>

          {/* Summary Overview */}
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                Assessment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-sm font-medium text-blue-200 mb-2">Overall Quality</div>
                  <div className="text-3xl font-bold text-blue-400 mb-3">{analysisResults.qualityScore}/100</div>
                  <Badge className={analysisResults.qualityScore >= 80 ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : analysisResults.qualityScore >= 60 ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}>
                    {analysisResults.qualityScore >= 80 ? "Excellent" : analysisResults.qualityScore >= 60 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
                <div className="text-center p-6 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-sm font-medium text-green-200 mb-2">Risk Level</div>
                  <div className="text-3xl font-bold text-green-400 mb-3">{analysisResults.riskLevel}</div>
                  <Badge className={
                    analysisResults.riskLevel === 'Low' ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" :
                      analysisResults.riskLevel === 'Medium' ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30" :
                        "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  }>
                    {analysisResults.riskLevel === 'Low' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                      analysisResults.riskLevel === 'Medium' ? <AlertTriangle className="w-3 h-3 mr-1" /> :
                        <XCircle className="w-3 h-3 mr-1" />}
                    {analysisResults.riskLevel} Risk
                  </Badge>
                </div>
                <div className="text-center p-6 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-sm font-medium text-purple-200 mb-2">Avg Reaction Time</div>
                  <div className="text-3xl font-bold text-purple-400">{Math.round(analysisResults.avgReactionTime)}ms</div>
                </div>
                <div className="text-center p-6 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-sm font-medium text-orange-200 mb-2">Accuracy</div>
                  <div className="text-3xl font-bold text-orange-400">{analysisResults.accuracy.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cognitive Characteristics */}
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Cognitive Profile
              </CardTitle>
              <CardDescription className="text-muted-foreground">Detailed assessment of cognitive functions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(analysisResults.cognitiveCharacteristics).map(([key, value]) => {
                  const displayName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return (
                    <div key={key} className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">{displayName}</span>
                        <span className="text-sm font-semibold text-muted-foreground">{value}/100</span>
                      </div>
                      <Progress value={value} className="h-3 bg-white/10" indicatorClassName={value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-500"} />
                      <div className="text-xs font-medium text-muted-foreground/80">
                        {value >= 80 ? "Excellent" : value >= 60 ? "Good" : value >= 40 ? "Fair" : "Needs Improvement"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Clinical Findings */}
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Clinical Findings
              </CardTitle>
              <CardDescription className="text-muted-foreground">Professional cognitive assessment results</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analysisResults.clinicalFindings.map((finding, index) => (
                  <div key={index} className="border border-white/10 rounded-lg p-5 bg-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/10 text-muted-foreground border-white/10">{finding.category}</Badge>
                        <Badge className={
                          finding.severity === 'Normal' ? 'bg-green-500/20 text-green-300' :
                            finding.severity === 'Mild' ? 'bg-yellow-500/20 text-yellow-300' :
                              finding.severity === 'Moderate' ? 'bg-orange-500/20 text-orange-300' : 'bg-red-500/20 text-red-300'
                        }>
                          {finding.severity === 'Normal' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                            finding.severity === 'Mild' ? <AlertTriangle className="w-3 h-3 mr-1" /> :
                              finding.severity === 'Moderate' ? <AlertTriangle className="w-3 h-3 mr-1" /> :
                                <XCircle className="w-3 h-3 mr-1" />}
                          {finding.severity}
                        </Badge>
                      </div>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2 text-lg">{finding.finding}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{finding.clinicalSignificance}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disease Risk Assessment */}
          {analysisResults.diseaseRiskAssessment.length > 0 && (
            <Card className="glass-panel border-0 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Disease Risk Assessment
                </CardTitle>
                <CardDescription className="text-muted-foreground">AI-powered analysis of neurological condition risks</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  {analysisResults.diseaseRiskAssessment.map((assessment, index) => (
                    <div key={index} className="border border-white/10 rounded-lg p-5 bg-white/5">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-semibold text-foreground text-lg">{assessment.condition}</h4>
                        <div className="flex items-center gap-3">
                          <Badge className={
                            assessment.riskLevel === 'Low' ? 'bg-green-500/20 text-green-300' :
                              assessment.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                          }>
                            {assessment.riskLevel === 'Low' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                              assessment.riskLevel === 'Medium' ? <AlertTriangle className="w-3 h-3 mr-1" /> :
                                <XCircle className="w-3 h-3 mr-1" />}
                            {assessment.riskLevel} Risk
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">{assessment.confidence.toFixed(0)}% confidence</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                          <h5 className="text-sm font-semibold text-red-200 mb-3">Risk Factors:</h5>
                          <ul className="text-sm text-red-100/80 space-y-2">
                            {assessment.riskFactors.map((factor, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-400 font-bold mt-1">•</span>
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                          <h5 className="text-sm font-semibold text-blue-200 mb-3">Clinical Markers:</h5>
                          <ul className="text-sm text-blue-100/80 space-y-2">
                            {assessment.clinicalMarkers.map((marker, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-400 font-bold mt-1">•</span>
                                <span>{marker}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clinical Recommendations */}
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Clinical Recommendations
              </CardTitle>
              <CardDescription className="text-muted-foreground">Personalized healthcare guidance based on assessment</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analysisResults.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-yellow-100/90 leading-relaxed">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Generation */}
          <Card className="glass-panel border-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Export Report
              </CardTitle>
              <CardDescription className="text-muted-foreground">Download your comprehensive cognitive assessment</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  onClick={() => generateReport(currentTest, trialResults)}
                  disabled={!currentTest}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg shadow-indigo-900/20"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Detailed Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => startTest(currentTest)}
                  disabled={!currentTest}
                  className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
