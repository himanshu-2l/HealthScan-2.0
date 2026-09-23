import { describe, it, expect } from 'vitest';
import {
  calculateHRV,
  calculateBaevskyStressIndex,
  interpretRMSSD,
  interpretSDNN,
  determineAutonomicBalance
} from '../hrvAnalysis';
import {
  snellenToDecimal,
  decimalToLogMAR,
  getVisualImpairmentLevel,
  calculateVisualAcuity,
  deriveColorErrorPattern
} from '../visionTests';
import {
  calculateFatigueIndex,
  analyzeRhythmPattern,
  analyzeTremorAdvanced
} from '../advancedMotorAnalysis';
import {
  removeOutliers,
  robustMean,
  median,
  assessCVReliability,
  getTCriticalValue
} from '../statisticalAccuracy';

describe('HRV Analysis Utility', () => {
  it('returns default zero state when fewer than 10 RR intervals are provided', () => {
    const shortIntervals = [800, 810, 790];
    const hrv = calculateHRV(shortIntervals);
    expect(hrv.rmssd).toBe(0);
    expect(hrv.sdnn).toBe(0);
    expect(hrv.interpretation).toContain('Insufficient data');
  });

  it('calculates accurate RMSSD, SDNN, and pNN50 for steady resting rhythm', () => {
    // 20 intervals with known differences
    const rrIntervals = [
      800, 820, 810, 830, 800, 810, 825, 815, 805, 820,
      810, 830, 800, 820, 815, 825, 805, 810, 820, 815
    ];
    const hrv = calculateHRV(rrIntervals);

    expect(hrv.meanRR).toBeGreaterThan(800);
    expect(hrv.meanRR).toBeLessThan(830);
    expect(hrv.rmssd).toBeGreaterThan(10);
    expect(hrv.rmssd).toBeLessThan(35);
    expect(hrv.sdnn).toBeGreaterThan(5);
    expect(hrv.minRR).toBe(800);
    expect(hrv.maxRR).toBe(830);
    expect(hrv.pnn50).toBe(0); // none of successive diffs exceed 50ms
  });

  it('detects pNN50 when successive intervals differ by >50ms', () => {
    const rrIntervals = [
      800, 880, 800, 890, 810, 875, 805, 880, 815, 895, 820
    ];
    const hrv = calculateHRV(rrIntervals);
    expect(hrv.pnn50).toBeGreaterThan(50);
  });

  it('calculates Baevsky Stress Index and clinical interpretations correctly', () => {
    const uniformIntervals = Array(20).fill(800);
    expect(calculateBaevskyStressIndex(uniformIntervals)).toBe(0); // mxDMn is 0

    expect(interpretRMSSD(15).category).toBe('Poor');
    expect(interpretRMSSD(30).category).toBe('Below Average');
    expect(interpretRMSSD(55).category).toBe('Average');
    expect(interpretRMSSD(120).category).toBe('Above Average');

    expect(interpretSDNN(40).category).toBe('Unhealthy');
    expect(interpretSDNN(80).category).toBe('Compromised');
    expect(interpretSDNN(120).category).toBe('Acceptable');
    expect(interpretSDNN(160).category).toBe('Healthy');

    expect(determineAutonomicBalance(70, 50, 55)).toBe('parasympathetic-dominant');
    expect(determineAutonomicBalance(20, 50, 100)).toBe('sympathetic-dominant');
  });
});

describe('Vision Tests Utility', () => {
  it('converts Snellen fraction to decimal acuity', () => {
    expect(snellenToDecimal(20, 20)).toBe(1.0);
    expect(snellenToDecimal(20, 40)).toBe(0.5);
    expect(snellenToDecimal(20, 200)).toBe(0.1);
  });

  it('converts decimal acuity to logMAR', () => {
    expect(decimalToLogMAR(1.0)).toBeCloseTo(0.0, 2);
    expect(decimalToLogMAR(0.1)).toBeCloseTo(1.0, 2);
    expect(decimalToLogMAR(0)).toBe(3.0);
  });

  it('classifies visual impairment levels according to WHO standards', () => {
    const normal = getVisualImpairmentLevel(1.0);
    expect(normal.level).toBe('normal');
    expect(normal.meetsDriverStandard).toBe(true);

    const mild = getVisualImpairmentLevel(0.4);
    expect(mild.level).toBe('mild');
    expect(mild.meetsDriverStandard).toBe(false);

    const severe = getVisualImpairmentLevel(0.08);
    expect(severe.level).toBe('severe');
    expect(severe.meetsDriverStandard).toBe(false);
  });

  it('calculates visual acuity scores and Snellen equivalents', () => {
    const perfectScore = calculateVisualAcuity(20, 20);
    expect(perfectScore.snellenEquivalent).toBe('20/20');
    expect(perfectScore.decimalAcuity).toBe(1.0);

    const invalid = calculateVisualAcuity(-1, 10);
    expect(invalid.score).toBe(0);
    expect(invalid.meetsDriverStandard).toBe(false);
  });

  it('derives color vision error patterns', () => {
    const answers = [true, false, false, true];
    const categories: ('redGreen' | 'blueYellow')[] = ['redGreen', 'redGreen', 'blueYellow', 'blueYellow'];
    const errors = deriveColorErrorPattern(answers, categories);
    expect(errors.redGreen).toBe(1);
    expect(errors.blueYellow).toBe(1);
  });
});

describe('Advanced Motor Analysis Utility', () => {
  it('calculates fatigue index based on tapping deceleration', () => {
    // Steady tapping: 150ms intervals across both halves
    const steadyTaps = Array(20).fill(150);
    expect(calculateFatigueIndex(steadyTaps)).toBe(0);

    // Fatigued tapping: first half 100ms, second half 150ms (50% slowdown)
    const fatiguedTaps = [...Array(10).fill(100), ...Array(10).fill(150)];
    expect(calculateFatigueIndex(fatiguedTaps)).toBeCloseTo(50, 1);
  });

  it('analyzes rhythm pattern and detects irregularity and freezes', () => {
    const regularTaps = [200, 205, 198, 202, 201, 199, 203, 200, 202, 198];
    const regularResult = analyzeRhythmPattern(regularTaps);
    expect(regularResult.regularity).toBe('regular');
    expect(regularResult.freezeEvents).toBe(0);

    // Rhythm with freeze events (>3x mean)
    const irregularTaps = [200, 210, 205, 800, 210, 200, 950, 205, 200, 205];
    const irregularResult = analyzeRhythmPattern(irregularTaps);
    expect(irregularResult.freezeEvents).toBeGreaterThan(0);
  });

  it('identifies dominant tremor frequency via spectral decomposition', () => {
    // Synthetic 5 Hz Parkinsonian rest tremor sampled at 30 Hz for 2 seconds (60 samples)
    const samples: { t: number; y: number }[] = [];
    const sampleRate = 30;
    const freq = 5; // 5 Hz
    for (let i = 0; i < 60; i++) {
      const t = (i / sampleRate) * 1000;
      const y = 50 + 20 * Math.sin(2 * Math.PI * freq * (i / sampleRate));
      samples.push({ t, y });
    }

    const tremor = analyzeTremorAdvanced(samples, 480);
    expect(tremor.dominantFrequency).toBeGreaterThanOrEqual(4.5);
    expect(tremor.dominantFrequency).toBeLessThanOrEqual(5.5);
  });
});

describe('Statistical Accuracy Utility', () => {
  it('removes outliers using IQR method', () => {
    const data = [10, 12, 11, 13, 12, 11, 100]; // 100 is an extreme outlier
    const cleaned = removeOutliers(data);
    expect(cleaned).not.toContain(100);
    expect(cleaned.length).toBe(6);
  });

  it('computes robust mean and median values', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(median(data)).toBe(5);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(robustMean(data, 3)).toBe(5);
  });

  it('assesses CV reliability against clinical lab criteria', () => {
    expect(assessCVReliability(3).level).toBe('excellent');
    expect(assessCVReliability(8).level).toBe('good');
    expect(assessCVReliability(12).level).toBe('moderate');
    expect(assessCVReliability(20).level).toBe('poor');
    expect(assessCVReliability(30).level).toBe('unacceptable');
  });

  it('returns valid Student-t critical values', () => {
    const tVal = getTCriticalValue(10, 0.95);
    expect(tVal).toBeCloseTo(2.228, 2);
  });
});
