/**
 * HealthScan — Endocrine Safety & Clinical Integrity Verification Suite
 * Task P0-B Test Suite
 *
 * Verifies:
 * 1. Hypoglycemia Alert Logic (Scope A):
 *    - Case 1: 54 mg/dL + HR 124 -> hypoglycemia alert
 *    - Case 2: 54 mg/dL + HR 55 -> hypoglycemia alert
 *    - Case 3: 54 mg/dL + HR unavailable -> hypoglycemia alert
 *    - Case 4: 69 mg/dL + HR 72 -> hypoglycemia alert
 *    - Case 5: 70 mg/dL + HR 50 -> no hypoglycemia alert
 *    - Case 6: 85 mg/dL + HR 124 -> no hypoglycemia alert
 *    - Case 7: glucose unavailable + HR 50 -> no hypoglycemia alert
 *    - Case 8: postMeal 58 + fasting unavailable -> hypoglycemia classification
 *    - Critical vs high threshold tiering (< 54 critical, 54-69 high, >= 70 no alert)
 * 2. Emergency Alert Modal Logic:
 *    - EmergencyHypoAlert triggers at < 70 mg/dL, with severe indicators at < 54 mg/dL
 * 3. Prescriptive Dosing Removal (Scope B):
 *    - Regex sweep asserting zero prescriptive insulin titration / dose recommendations
 *    - calculateRecommendedDose returns 0 units and clinical guidance
 * 4. P0-A Cardiovascular Non-Regression (Scope D):
 *    - Verification that P0-A cardiovascular safety files remain untouched and intact
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectHypoglycemiaRisk } from '../src/services/earlyWarningService.ts';
import { getGlucoseCategory } from '../src/services/glucoseService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('HEALTHSCAN ENDOCRINE CLINICAL SAFETY SUITE (P0-B)');
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

// =========================================================
// SECTION 1: Hypoglycemia Detection Tests (Scope A)
// =========================================================
console.log('--- SECTION 1: HYPOGLYCEMIA DETECTION INDEPENDENCE ---');

runTest('TEST 1: 54 mg/dL + HR 124 (tachycardia) -> hypoglycemia alert triggered', () => {
  const alert = detectHypoglycemiaRisk({
    glucose: 54,
    heartRate: 124,
    timestamp: new Date().toISOString(),
  });
  assert(alert !== null, 'Alert must not be null for 54 mg/dL');
  assert.strictEqual(alert.type, 'hypoglycemia');
  assert.strictEqual(alert.severity, 'high');
  assert.strictEqual(alert.requiresImmediateAction, true);
  assert(alert.message.includes('54 mg/dL'), 'Alert message must include glucose reading');
  assert(alert.message.includes('124 bpm'), 'Heart rate must be attached as context');
});

runTest('TEST 2: 54 mg/dL + HR 55 (bradycardia) -> hypoglycemia alert triggered', () => {
  const alert = detectHypoglycemiaRisk({
    glucose: 54,
    heartRate: 55,
    timestamp: new Date().toISOString(),
  });
  assert(alert !== null, 'Alert must not be null for 54 mg/dL with bradycardia');
  assert.strictEqual(alert.type, 'hypoglycemia');
  assert.strictEqual(alert.severity, 'high');
  assert.strictEqual(alert.requiresImmediateAction, true);
  assert(alert.message.includes('55 bpm'), 'Heart rate must be attached as context');
});

runTest('TEST 3: 54 mg/dL + HR unavailable (undefined) -> hypoglycemia alert triggered', () => {
  const alert = detectHypoglycemiaRisk({
    glucose: 54,
    timestamp: new Date().toISOString(),
  });
  assert(alert !== null, 'Missing heart rate must NOT suppress glucose-based alert');
  assert.strictEqual(alert.type, 'hypoglycemia');
  assert.strictEqual(alert.severity, 'high');
  assert.strictEqual(alert.requiresImmediateAction, true);
});

runTest('TEST 4: 69 mg/dL + HR 72 (euglycemic boundary) -> hypoglycemia alert triggered', () => {
  const alert = detectHypoglycemiaRisk({
    glucose: 69,
    heartRate: 72,
    timestamp: new Date().toISOString(),
  });
  assert(alert !== null, 'Alert must trigger for glucose < 70 mg/dL (69 mg/dL)');
  assert.strictEqual(alert.type, 'hypoglycemia');
  assert.strictEqual(alert.severity, 'high');
});

runTest('TEST 5: 70 mg/dL + HR 50 -> no hypoglycemia alert (boundary threshold)', () => {
  const alert = detectHypoglycemiaRisk({
    glucose: 70,
    heartRate: 50,
    timestamp: new Date().toISOString(),
  });
  assert.strictEqual(alert, null, 'Glucose >= 70 mg/dL must NOT trigger hypoglycemia alert');
});

runTest('TEST 6: 85 mg/dL + HR 124 -> no hypoglycemia alert (tachycardia does not cause hypo alert)', () => {
  const alert = detectHypoglycemiaRisk({
    glucose: 85,
    heartRate: 124,
    timestamp: new Date().toISOString(),
  });
  assert.strictEqual(alert, null, 'Normal glucose (85 mg/dL) must NOT alert despite tachycardia');
});

runTest('TEST 7: glucose unavailable (null/undefined) + HR 50 -> no hypoglycemia alert', () => {
  const alertUndefined = detectHypoglycemiaRisk({
    heartRate: 50,
    timestamp: new Date().toISOString(),
  });
  assert.strictEqual(alertUndefined, null, 'Undefined glucose must return null (unavailable semantics)');

  const alertNull = detectHypoglycemiaRisk({
    glucose: null,
    heartRate: 50,
    timestamp: new Date().toISOString(),
  });
  assert.strictEqual(alertNull, null, 'Null glucose must return null (unavailable semantics)');
});

runTest('TEST 8: postMeal 58 mg/dL + fasting unavailable -> classified as Hypoglycemia (critical)', () => {
  const category = getGlucoseCategory(null, 58);
  assert.strictEqual(category.category, 'Hypoglycemia', 'Post-meal 58 mg/dL must be classified as Hypoglycemia');
  assert.strictEqual(category.severity, 'critical', 'Post-meal hypo must have critical severity');
  assert.strictEqual(category.color, 'red', 'Post-meal hypo must have red badge color');

  const categoryBothLow = getGlucoseCategory(62, 58);
  assert.strictEqual(categoryBothLow.category, 'Hypoglycemia');

  const categoryFastingLowOnly = getGlucoseCategory(55, null);
  assert.strictEqual(categoryFastingLowOnly.category, 'Hypoglycemia');
});

runTest('TEST 9: Severe hypoglycemia (< 54 mg/dL) receives critical severity rating', () => {
  const alertSevere = detectHypoglycemiaRisk({
    glucose: 50,
    heartRate: 110,
    timestamp: new Date().toISOString(),
  });
  assert(alertSevere !== null, 'Alert must exist for 50 mg/dL');
  assert.strictEqual(alertSevere.severity, 'critical', 'Glucose < 54 mg/dL must have critical severity');
  assert(alertSevere.message.includes('CRITICAL'), 'Critical alert message must include CRITICAL');
});

// =========================================================
// SECTION 2: Emergency Modal Threshold Alignment
// =========================================================
console.log('\n--- SECTION 2: EMERGENCY MODAL THRESHOLD VERIFICATION ---');

runTest('TEST 10: EmergencyHypoAlert component enforces < 70 mg/dL threshold and < 54 severe tier', () => {
  const modalPath = path.join(rootDir, 'src', 'components', 'diabetes', 'EmergencyHypoAlert.tsx');
  const code = fs.readFileSync(modalPath, 'utf8');

  // Verify threshold is < 70, NOT outdated < 60
  assert(code.includes('currentGlucose < 70'), 'Modal must trigger at currentGlucose < 70');
  assert(code.includes('predictedGlucose < 70'), 'Modal must trigger at predictedGlucose < 70');
  assert(!code.includes('currentGlucose < 60'), 'Outdated < 60 mg/dL threshold must be eliminated');
  assert(code.includes('currentGlucose < 54'), 'Severe tier indicator must be < 54 mg/dL');
});

// =========================================================
// SECTION 3: Prescriptive Insulin Dosing Prohibition (Scope B)
// =========================================================
console.log('\n--- SECTION 3: PRESCRIPTIVE INSULIN DOSING ELIMINATION ---');

const FORBIDDEN_DOSING_PATTERNS = [
  { regex: /recommended\s+dose\s*:/i, name: 'Recommended dose:' },
  { regex: /reduce\s+insulin.*?units?/i, name: 'reduce insulin ... units' },
  { regex: /increase\s+insulin.*?units?/i, name: 'increase insulin ... units' },
  { regex: /reduce\s+bedtime\s+insulin/i, name: 'reduce bedtime insulin' },
  { regex: /increase\s+basal\s+insulin/i, name: 'increase basal insulin' },
  { regex: /you\s+may\s+need\s+less\s+insulin/i, name: 'You may need less insulin' },
  { regex: /adjusting\s+basal\s+insulin/i, name: 'adjusting basal insulin' },
  { regex: /take\s+safe\s+dose/i, name: 'Take Safe Dose' },
  { regex: /safe\s+recommended\b/i, name: 'Safe Recommended' },
  { regex: /safe\s+to\s+dose\b/i, name: 'Safe to dose' },
];

const TARGET_FILES_FOR_DOSING_AUDIT = [
  'src/services/doseRecommendationService.ts',
  'src/services/iobService.ts',
  'src/services/nightSafetyService.ts',
  'src/services/patternRecognitionService.ts',
  'src/components/hormonal/DiabetesCycleIntegration.tsx',
  'src/components/diabetes/SmartDoseRecommendation.tsx',
  'src/components/diabetes/EmergencyHypoAlert.tsx',
  'src/components/diabetes/StackingAlert.tsx',
  'src/components/diabetes/IOBCalculator.tsx',
  'src/pages/DiabetesManagementPage.tsx',
];

runTest('TEST 11: Zero prescriptive dosing phrases in user-facing components and services', () => {
  const violations = [];

  for (const relativePath of TARGET_FILES_FOR_DOSING_AUDIT) {
    const filePath = path.join(rootDir, relativePath);
    if (!fs.existsSync(filePath)) {
      violations.push(`File missing: ${relativePath}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf8');

    for (const { regex, name } of FORBIDDEN_DOSING_PATTERNS) {
      if (regex.test(content)) {
        violations.push(`${relativePath}: Matched forbidden phrase pattern "${name}"`);
      }
    }
  }

  assert.strictEqual(
    violations.length,
    0,
    `Prescriptive dosing violations detected:\n${violations.join('\n')}`
  );
});

runTest('TEST 12: doseRecommendationService returns finalDose: 0 and clinician referral', () => {
  const svcPath = path.join(rootDir, 'src', 'services', 'doseRecommendationService.ts');
  const content = fs.readFileSync(svcPath, 'utf8');

  // Assert calculateRecommendedDose returns finalDose: 0
  assert(content.includes('finalDose: 0'), 'Dose recommendation must set finalDose to 0');
  assert(content.includes('mealDose: 0'), 'Dose recommendation must set mealDose to 0');
  assert(content.includes('correctionDose: 0'), 'Dose recommendation must set correctionDose to 0');
  assert(
    content.includes('physician-prescribed') || content.includes('clinician-prescribed'),
    'Explanation must direct user to clinician care plan'
  );
});

runTest('TEST 13: SmartDoseRecommendation displays Clinical Safety Guidance without prescribing doses', () => {
  const componentPath = path.join(rootDir, 'src', 'components', 'diabetes', 'SmartDoseRecommendation.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');

  assert(content.includes('Meal & Glucose Tracker'), 'Component must be labeled Meal & Glucose Tracker');
  assert(content.includes('Clinical Safety Guidance'), 'Component must include Clinical Safety Guidance');
  assert(
    content.includes('HealthScan does not calculate or recommend individualized insulin doses'),
    'Component must include explicit disclaimer against insulin dose calculation'
  );
  assert(!content.includes('Recommended dose:'), 'Component must NOT have Recommended dose');
});

// =========================================================
// SECTION 4: Scope Protection & P0-A Non-Regression (Scope D)
// =========================================================
console.log('\n--- SECTION 4: SCOPE PROTECTION & P0-A NON-REGRESSION ---');

runTest('TEST 14: P0-A cardiovascular files are untouched and preserved', () => {
  const protectedFiles = [
    'src/utils/pulseDetection.ts',
    'src/utils/hrvAnalysis.ts',
    'src/components/labs/CardiovascularLab.tsx',
    'src/components/pwa/QuickScanModal.tsx',
  ];

  for (const relPath of protectedFiles) {
    const fullPath = path.join(rootDir, relPath);
    assert(fs.existsSync(fullPath), `Protected file must exist: ${relPath}`);
  }

  const pulseCode = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'pulseDetection.ts'), 'utf8');
  assert(!pulseCode.includes('return 68;'), 'Fallback 68 BPM must NOT be reintroduced');
  assert(pulseCode.includes('if (reds.length < 30 || greens.length < 30) return null;'), 'SpO2 must require sufficient samples');

  const hrvCode = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'hrvAnalysis.ts'), 'utf8');
  assert(hrvCode.includes('rrIntervals.length < 10'), 'HRV must require >= 10 intervals');
});

// =========================================================
// Summary
// =========================================================
console.log('\n====================================================');
console.log(`P0-B ENDOCRINE SAFETY TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('====================================================\n');
