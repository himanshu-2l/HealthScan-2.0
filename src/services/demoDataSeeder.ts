/**
 * Demo Data Seeder
 * Seeds localStorage with realistic health scan results so the dashboard
 * looks populated for hackathon demos. Called once on demo user creation.
 */

import { saveTestResult } from './healthDataService';
import { saveGlucoseReading } from './glucoseService';
import { saveBPReading } from './bpService';
import type { HealthTestResult } from '../types/health';

const DEMO_SEEDED_KEY = 'healthScan_demo_seeded';

/**
 * Seed demo health data if not already seeded.
 * Creates 5 days of realistic scan results.
 */
export function seedDemoData(): void {
  if (localStorage.getItem(DEMO_SEEDED_KEY)) return;

  const now = Date.now();
  const DAY = 86400000;

  const demoResults: HealthTestResult[] = [
    // Today's quick scan
    {
      id: `demo-scan-${now}`,
      testType: 'quick-scan',
      category: 'cardiovascular',
      testDate: new Date(now).toISOString(),
      timestamp: new Date(now).toISOString(),
      score: 82,
      maxScore: 100,
      scorePercentage: 82,
      riskLevel: 'low',
      interpretation: 'Good overall health. Vitals within normal clinical ranges.',
      data: {
        heartRate: 72,
        hrv: 48,
        hrvMetrics: { rmssd: 48, sdnn: 52 },
        tapSpeed: 5.8,
        voicePitch: 142,
        vitalityScore: 82,
      },
    },
    // Yesterday — cardiovascular lab
    {
      id: `demo-cardio-${now - DAY}`,
      testType: 'cardiovascular',
      category: 'cardiovascular',
      testDate: new Date(now - DAY).toISOString(),
      timestamp: new Date(now - DAY).toISOString(),
      score: 78,
      maxScore: 100,
      scorePercentage: 78,
      riskLevel: 'low',
      interpretation: 'Resting heart rate normal. HRV indicates moderate recovery.',
      data: {
        heartRate: 68,
        hrv: 52,
        hrvMetrics: { rmssd: 52, sdnn: 58, pnn50: 22 },
        stressIndex: 112,
      },
    },
    // 2 days ago — motor lab
    {
      id: `demo-motor-${now - 2 * DAY}`,
      testType: 'motor-assessment',
      category: 'neurological',
      testDate: new Date(now - 2 * DAY).toISOString(),
      timestamp: new Date(now - 2 * DAY).toISOString(),
      score: 85,
      maxScore: 100,
      scorePercentage: 85,
      riskLevel: 'low',
      interpretation: 'Motor function normal. No tremor detected.',
      data: {
        tapSpeed: 6.2,
        tapRate: 6.2,
        tremorFrequency: 0,
        fatigueIndex: 0.08,
      },
    },
    // 3 days ago — voice lab
    {
      id: `demo-voice-${now - 3 * DAY}`,
      testType: 'voice-analysis',
      category: 'neurological',
      testDate: new Date(now - 3 * DAY).toISOString(),
      timestamp: new Date(now - 3 * DAY).toISOString(),
      score: 90,
      maxScore: 100,
      scorePercentage: 90,
      riskLevel: 'low',
      interpretation: 'Voice quality normal. No dysphonia detected.',
      data: {
        voicePitch: 138,
        pitch: 138,
        jitter: 0.32,
        shimmer: 2.1,
      },
    },
    // 4 days ago — mental health
    {
      id: `demo-mental-${now - 4 * DAY}`,
      testType: 'mental-health',
      category: 'neurological',
      testDate: new Date(now - 4 * DAY).toISOString(),
      timestamp: new Date(now - 4 * DAY).toISOString(),
      score: 88,
      maxScore: 100,
      scorePercentage: 88,
      riskLevel: 'low',
      interpretation: 'PHQ-9: Minimal depression (3/27). GAD-7: Minimal anxiety (2/21).',
      data: {
        phq9Score: 3,
        gad7Score: 2,
      },
    },
  ];

  for (const result of demoResults) {
    saveTestResult(result);
  }

  // Seed realistic baseline glucose readings
  saveGlucoseReading({
    fasting: 94,
    postMeal: 128,
    hba1c: 5.4,
    timestamp: new Date(now - DAY).toISOString(),
    mealType: 'breakfast',
    notes: 'Normal post-prandial glycemic recovery'
  });
  saveGlucoseReading({
    fasting: 98,
    postMeal: 132,
    timestamp: new Date(now).toISOString(),
    mealType: 'breakfast',
    notes: 'Morning fasting baseline'
  });

  // Seed realistic baseline blood pressure readings
  saveBPReading({
    systolic: 118,
    diastolic: 76,
    pulse: 71,
    timestamp: new Date(now - DAY).toISOString(),
    notes: 'Optimal resting pressure'
  });
  saveBPReading({
    systolic: 120,
    diastolic: 78,
    pulse: 72,
    timestamp: new Date(now).toISOString(),
    notes: 'Normal adult range (AHA Stage 0)'
  });

  localStorage.setItem(DEMO_SEEDED_KEY, 'true');
}
