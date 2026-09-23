import { describe, it, expect } from 'vitest';
import {
  calculateBPMFromSignal,
  classifyHeartRate,
  validateBPM,
  getConfidenceLevel,
  pulseDetector
} from '../pulseDetection';

describe('pulseDetection utility', () => {
  it('detects 72 BPM from a synthetic PPG sine wave sampled at 30Hz within ±2 BPM', () => {
    const sampleRate = 30; // 30 Hz
    const targetBpm = 72;
    const frequency = targetBpm / 60; // 1.2 Hz
    const durationSeconds = 10;
    const totalSamples = sampleRate * durationSeconds; // 300 samples

    const signal: number[] = [];
    const timestamps: number[] = [];
    const startTime = 1000000;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate; // time in seconds
      const value = Math.sin(2 * Math.PI * frequency * t);
      signal.push(value);
      timestamps.push(startTime + Math.round(t * 1000)); // timestamp in ms
    }

    const result = calculateBPMFromSignal(signal, timestamps);

    expect(result.bpm).toBeGreaterThanOrEqual(70);
    expect(result.bpm).toBeLessThanOrEqual(74);
    expect(Math.abs(result.bpm - targetBpm)).toBeLessThanOrEqual(2);
  });

  it('classifies heart rates according to clinical standards', () => {
    expect(classifyHeartRate(35).classification).toBe('critical-low');
    expect(classifyHeartRate(35).isAbnormal).toBe(true);

    expect(classifyHeartRate(50, false).classification).toBe('bradycardia');
    expect(classifyHeartRate(50, false).isAbnormal).toBe(true);

    expect(classifyHeartRate(50, true).classification).toBe('athlete-normal');
    expect(classifyHeartRate(50, true).isAbnormal).toBe(false);

    expect(classifyHeartRate(72).classification).toBe('normal');
    expect(classifyHeartRate(72).isAbnormal).toBe(false);

    expect(classifyHeartRate(110).classification).toBe('tachycardia');
    expect(classifyHeartRate(110).isAbnormal).toBe(true);

    expect(classifyHeartRate(165).classification).toBe('critical-high');
    expect(classifyHeartRate(165).isAbnormal).toBe(true);
  });

  it('validates physiological limits for BPM values', () => {
    expect(validateBPM(72).valid).toBe(true);
    expect(validateBPM(15).valid).toBe(false);
    expect(validateBPM(260).valid).toBe(false);
  });

  it('computes confidence levels based on numeric score', () => {
    expect(getConfidenceLevel(0.95)).toBe('very-high');
    expect(getConfidenceLevel(0.75)).toBe('high');
    expect(getConfidenceLevel(0.55)).toBe('moderate');
    expect(getConfidenceLevel(0.3)).toBe('low');
  });

  it('returns 0 BPM when signal has fewer than 60 samples', () => {
    const shortSignal = [1, 2, 3, 4, 5];
    const shortTimestamps = [100, 200, 300, 400, 500];
    const res = calculateBPMFromSignal(shortSignal, shortTimestamps);
    expect(res.bpm).toBe(0);
    expect(res.isBeat).toBe(false);
  });
});
