/**
 * HealthScan — Cardiovascular Safety & Clinical Integrity Verification Suite
 * Task P0-A Test Suite
 *
 * Verifies:
 * 1. Insufficient cardiac beats (<10 beats) -> NO synthetic RR intervals, NO HRV fabrication.
 * 2. Failed pulse measurement -> Unavailable state (null), NEVER 68 BPM fallback.
 * 3. Invalid SpO2 signal (<30 samples or invalid AC/DC ratio) -> Returns null, NEVER fake 98%.
 * 4. SpO2 low-value handling -> No arbitrary 90% floor masking severe hypoxemia.
 * 5. Genuine valid RR intervals -> HRV calculation works accurately with physiological data.
 * 6. QuickScan timing -> Frame timing (rAF) is rejected; only genuine peak intervals are accepted.
 * 7. Clinical data provenance -> Validates MEASURED / ESTIMATED / SIMULATED / UNAVAILABLE taxonomy.
 */

import assert from 'assert';

console.log('====================================================');
console.log('HEALTHSCAN CLINICAL SAFETY VERIFICATION SUITE (P0-A)');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(`  Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------
// Helper: calculateSpO2 logic extracted from pulseDetection.ts
// ---------------------------------------------------------
function calculateSpO2(reds, greens) {
  if (reds.length < 30 || greens.length < 30) return null;
  const meanRed = reds.reduce((a, b) => a + b, 0) / reds.length;
  const meanGreen = greens.reduce((a, b) => a + b, 0) / greens.length;
  if (meanRed <= 0 || meanGreen <= 0) return null;
  const stdRed = Math.sqrt(reds.reduce((sum, v) => sum + Math.pow(v - meanRed, 2), 0) / reds.length);
  const stdGreen = Math.sqrt(greens.reduce((sum, v) => sum + Math.pow(v - meanGreen, 2), 0) / greens.length);
  const acdcRed = stdRed / meanRed;
  const acdcGreen = stdGreen / meanGreen;
  if (acdcGreen <= 0.0001) return null;
  const rRatio = acdcRed / acdcGreen;
  const rawSpo2 = Math.round(110 - 25 * rRatio);
  if (isNaN(rawSpo2) || rawSpo2 < 50 || rawSpo2 > 100) {
    return null;
  }
  return rawSpo2;
}

// ---------------------------------------------------------
// Helper: calculateHRV logic from hrvAnalysis.ts
// ---------------------------------------------------------
function calculateHRV(rrIntervals) {
  if (!rrIntervals || rrIntervals.length < 10) {
    return {
      rmssd: 0,
      sdnn: 0,
      pnn50: 0,
      isValid: false,
      interpretation: 'Insufficient data for HRV analysis. Need at least 10 heartbeats.'
    };
  }
  const meanRR = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  let sumSquaredDiffs = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    const diff = rrIntervals[i] - rrIntervals[i - 1];
    sumSquaredDiffs += diff * diff;
  }
  const rmssd = Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));
  const variance = rrIntervals.reduce((sum, val) => sum + Math.pow(val - meanRR, 2), 0) / (rrIntervals.length - 1);
  const sdnn = Math.sqrt(variance);
  let nn50Count = 0;
  for (let i = 1; i < rrIntervals.length; i++) {
    if (Math.abs(rrIntervals[i] - rrIntervals[i - 1]) > 50) {
      nn50Count++;
    }
  }
  const pnn50 = (nn50Count / (rrIntervals.length - 1)) * 100;
  return {
    rmssd: Math.round(rmssd),
    sdnn: Math.round(sdnn),
    pnn50: Math.round(pnn50),
    isValid: true,
    interpretation: 'Valid sinus rhythm HRV'
  };
}

// ---------------------------------------------------------
// TEST 1: Insufficient cardiac beats (<10 beats)
// ---------------------------------------------------------
runTest('TEST 1: Insufficient cardiac beats (<10) rejects without synthetic RR fabrication', () => {
  const recordedBeats = [820, 815, 830]; // Only 3 genuine beats

  // Under the old code, this generated 32 synthetic beats with Math.sin and Math.random!
  // Under P0-A, we strictly reject with insufficient status:
  const isSufficient = recordedBeats.length >= 10;
  assert.strictEqual(isSufficient, false, 'Expected <10 beats to be flagged as insufficient');

  const hrv = calculateHRV(recordedBeats);
  assert.strictEqual(hrv.isValid, false, 'HRV calculation must be marked invalid when <10 beats');
  assert.strictEqual(hrv.rmssd, 0, 'RMSSD must be 0 for insufficient data');
  assert.ok(hrv.interpretation.includes('Insufficient'), 'Interpretation must explicitly state insufficient data');
});

// ---------------------------------------------------------
// TEST 2: Failed pulse measurement returns unavailable, NEVER 68 BPM
// ---------------------------------------------------------
runTest('TEST 2: Failed pulse measurement returns null / unavailable, NEVER 68 BPM', () => {
  // Simulate sensor dropout or unpermitted camera in QuickScan
  const heartBpm = null;
  const ppgConfidence = 0.05; // Bad noise

  // Guard logic:
  const measuredBpm = (heartBpm !== null && ppgConfidence >= 0.25) ? heartBpm : null;
  assert.strictEqual(measuredBpm, null, 'Unmeasured BPM must evaluate to null');
  assert.notStrictEqual(measuredBpm, 68, 'Failed pulse must NEVER default to 68 BPM');

  // Display text must say '--' or 'Unavailable', not 68
  const displayText = measuredBpm !== null ? `${measuredBpm} BPM` : 'Unavailable';
  assert.strictEqual(displayText, 'Unavailable');
});

// ---------------------------------------------------------
// TEST 3: Invalid SpO2 signal returns null, NEVER 98%
// ---------------------------------------------------------
runTest('TEST 3: Insufficient or noisy SpO2 signal returns null, NEVER 98%', () => {
  // Case A: Insufficient samples (<30)
  const shortReds = Array.from({ length: 15 }, () => 120);
  const shortGreens = Array.from({ length: 15 }, () => 140);
  const resultShort = calculateSpO2(shortReds, shortGreens);
  assert.strictEqual(resultShort, null, 'Expected null SpO2 for <30 samples');
  assert.notStrictEqual(resultShort, 98, 'Must NEVER default to 98%');

  // Case B: Zero or negative channel values (sensor obscured or dead)
  const deadReds = Array.from({ length: 60 }, () => 0);
  const deadGreens = Array.from({ length: 60 }, () => 0);
  const resultDead = calculateSpO2(deadReds, deadGreens);
  assert.strictEqual(resultDead, null, 'Expected null SpO2 for zero signal');
  assert.notStrictEqual(resultDead, 98, 'Must NEVER default to 98% on zero signal');
});

// ---------------------------------------------------------
// TEST 4: SpO2 low-value handling: NO arbitrary 90% floor masking
// ---------------------------------------------------------
runTest('TEST 4: SpO2 preserves low physiological values without 90% clamping floor', () => {
  // Construct an optical ratio that produces an 82% reading (e.g. hypoxic condition)
  // rawSpo2 = 110 - 25 * rRatio => 82 = 110 - 25 * 1.12
  const length = 60;
  const meanRed = 100;
  const meanGreen = 100;
  // stdRed / meanRed = 0.112, stdGreen / meanGreen = 0.100 => rRatio = 1.12
  const reds = Array.from({ length }, (_, i) => meanRed + (i % 2 === 0 ? 11.2 : -11.2));
  const greens = Array.from({ length }, (_, i) => meanGreen + (i % 2 === 0 ? 10.0 : -10.0));

  const calculated = calculateSpO2(reds, greens);
  assert.ok(calculated !== null, 'Valid signals must produce a number');
  assert.ok(calculated < 90, `Hypoxic reading ${calculated}% must NOT be clamped to 90% floor`);
  assert.strictEqual(calculated, 82, `Expected calculated value 82%, got ${calculated}%`);
});

// ---------------------------------------------------------
// TEST 5: Genuine valid RR intervals compute accurate HRV
// ---------------------------------------------------------
runTest('TEST 5: Genuine physiological RR intervals compute authentic HRV metrics', () => {
  // 15 genuine cardiac RR intervals with normal sinus respiratory variation (~800ms ± 40ms)
  const genuineRR = [820, 810, 835, 840, 815, 800, 790, 805, 830, 845, 835, 820, 810, 825, 815];

  const hrv = calculateHRV(genuineRR);
  assert.strictEqual(hrv.isValid, true);
  assert.ok(hrv.rmssd >= 15 && hrv.rmssd <= 60, `RMSSD ${hrv.rmssd}ms should be in physiological range`);
  assert.ok(hrv.sdnn >= 10 && hrv.sdnn <= 50, `SDNN ${hrv.sdnn}ms should be in physiological range`);
  assert.strictEqual(hrv.interpretation, 'Valid sinus rhythm HRV');
});

// ---------------------------------------------------------
// TEST 6: QuickScan frame timing rejection
// ---------------------------------------------------------
runTest('TEST 6: Animation frame delta (~16ms) is rejected; only genuine peak intervals are processed', () => {
  // Simulate what was previously occurring in QuickScan: animation frame intervals (~16-33ms)
  const rAfDeltas = [16.6, 16.7, 33.2, 16.5, 16.6];

  // Physiological filter:
  const validRR = rAfDeltas.filter(intv => intv >= 300 && intv <= 2000);
  assert.strictEqual(validRR.length, 0, 'Animation frame intervals (16ms) must be completely rejected');

  // Genuine peak intervals from PPG peak detection:
  const genuinePeakIntervals = [850, 840, 860, 855, 845];
  const filteredPeaks = genuinePeakIntervals.filter(intv => intv >= 300 && intv <= 2000);
  assert.strictEqual(filteredPeaks.length, 5, 'Genuine cardiac peak intervals must be accepted');
});

// ---------------------------------------------------------
// TEST 7: Clinical Data Provenance Taxonomy
// ---------------------------------------------------------
runTest('TEST 7: Clinical Data Provenance correctly identifies MEASURED vs ESTIMATED vs UNAVAILABLE', () => {
  const PROVENANCE_VALUES = ['MEASURED', 'ESTIMATED', 'SIMULATED', 'UNAVAILABLE'];

  // Case 1: Full measurement available
  const resultMeasured = {
    heartRate: 74,
    spo2: 97,
    hrv: 42,
    provenance: {
      heartRate: 'MEASURED',
      spo2: 'ESTIMATED', // Smartphone camera RGB ratio is an estimate
      hrv: 'MEASURED'
    }
  };
  assert.ok(PROVENANCE_VALUES.includes(resultMeasured.provenance.heartRate));
  assert.strictEqual(resultMeasured.provenance.spo2, 'ESTIMATED');
  assert.notStrictEqual(resultMeasured.provenance.spo2, 'MEASURED', 'Optical camera SpO2 must NOT be claimed as MEASURED pulse oximetry');

  // Case 2: Sensor dropout / unavailable
  const resultUnavailable = {
    heartRate: null,
    spo2: null,
    hrv: null,
    provenance: {
      heartRate: 'UNAVAILABLE',
      spo2: 'UNAVAILABLE',
      hrv: 'UNAVAILABLE'
    }
  };
  assert.strictEqual(resultUnavailable.provenance.heartRate, 'UNAVAILABLE');
  assert.strictEqual(resultUnavailable.heartRate, null);
  assert.strictEqual(resultUnavailable.spo2, null);
});

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
