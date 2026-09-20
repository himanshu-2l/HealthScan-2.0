import mongoose from 'mongoose';

/**
 * Hyperventilation Assessment Model
 * Comprehensive respiratory metrics with hyperventilation severity scoring
 * 
 * @references
 * - Gardner WN. The pathophysiology of hyperventilation disorders. Chest. 1996;109(2):516-534.
 * - Nijmegen Questionnaire for hyperventilation syndrome assessment.
 * - American Thoracic Society. Standards for the diagnosis of patients with COPD. 2004.
 */

/**
 * Normal respiratory reference ranges
 * @reference American Thoracic Society standards
 */
const RESPIRATORY_REFERENCE_RANGES = {
  // Respiratory rate (breaths per minute)
  respiratoryRate: {
    adult: { min: 12, max: 20, unit: 'breaths/min' },
    hyperventilation: { threshold: 20, severe: 30, unit: 'breaths/min' },
    bradypnea: { threshold: 12, unit: 'breaths/min' }
  },
  // SpO2 (oxygen saturation)
  spO2: {
    normal: { min: 95, max: 100, unit: '%' },
    mild_hypoxemia: { min: 91, max: 94, unit: '%' },
    moderate_hypoxemia: { min: 86, max: 90, unit: '%' },
    severe_hypoxemia: { max: 85, unit: '%' }
  },
  // End-tidal CO2 (EtCO2) - not directly measurable but approximated
  etCO2: {
    normal: { min: 35, max: 45, unit: 'mmHg' },
    hypocapnia: { max: 35, unit: 'mmHg' }, // Indicates hyperventilation
    hypercapnia: { min: 45, unit: 'mmHg' }
  },
  // Breath-hold time
  breathHoldTime: {
    normal: { min: 25, max: 60, unit: 'seconds' },
    reduced: { max: 25, unit: 'seconds' } // Indicates low CO2 tolerance
  },
  // Tidal volume approximation
  tidalVolume: {
    normal: { min: 400, max: 600, unit: 'mL' }
  }
};

/**
 * Hyperventilation severity classification
 * @reference Nijmegen Questionnaire scoring
 */
const HYPERVENTILATION_SEVERITY = {
  NONE: { maxScore: 10, label: 'Normal', description: 'No hyperventilation detected' },
  MILD: { minScore: 11, maxScore: 22, label: 'Mild', description: 'Mild hyperventilation - may be situational' },
  MODERATE: { minScore: 23, maxScore: 35, label: 'Moderate', description: 'Moderate hyperventilation syndrome likely' },
  SEVERE: { minScore: 36, label: 'Severe', description: 'Severe hyperventilation syndrome - intervention recommended' }
};

/**
 * Common hyperventilation symptoms
 */
const HYPERVENTILATION_SYMPTOMS = [
  'chest_pain',
  'shortness_of_breath',
  'dizziness',
  'tingling_fingers',
  'tingling_lips',
  'stiff_fingers',
  'tight_chest',
  'blurred_vision',
  'confusion',
  'palpitations',
  'anxiety',
  'trembling',
  'cold_hands',
  'numbness',
  'difficulty_concentrating',
  'bloated_feeling'
];

/**
 * Respiratory pattern analysis schema
 */
const respiratoryPatternSchema = new mongoose.Schema({
  pattern: {
    type: String,
    enum: ['normal', 'tachypnea', 'bradypnea', 'kussmaul', 'cheyne-stokes', 'biot', 'apneustic', 'irregular'],
    default: 'normal'
  },
  regularity: {
    type: Number,
    min: 0,
    max: 100 // 100 = perfectly regular
  },
  depthVariability: {
    type: Number,
    min: 0,
    max: 100 // Coefficient of variation of breath depth
  },
  breathingEffort: {
    type: String,
    enum: ['normal', 'labored', 'shallow', 'deep'],
    default: 'normal'
  }
}, { _id: false });

/**
 * Nijmegen Questionnaire scoring schema
 * 16 items scored 0-4 (0=never, 4=very often)
 */
const nijmegenScoreSchema = new mongoose.Schema({
  items: {
    chestPain: { type: Number, min: 0, max: 4, default: 0 },
    confusion: { type: Number, min: 0, max: 4, default: 0 },
    dizziness: { type: Number, min: 0, max: 4, default: 0 },
    fastDeepBreathing: { type: Number, min: 0, max: 4, default: 0 },
    shortnessOfBreath: { type: Number, min: 0, max: 4, default: 0 },
    tightChest: { type: Number, min: 0, max: 4, default: 0 },
    bloatedFeeling: { type: Number, min: 0, max: 4, default: 0 },
    tinglingFingers: { type: Number, min: 0, max: 4, default: 0 },
    difficultyBreathing: { type: Number, min: 0, max: 4, default: 0 },
    stiffFingers: { type: Number, min: 0, max: 4, default: 0 },
    tightnessAroundMouth: { type: Number, min: 0, max: 4, default: 0 },
    coldHands: { type: Number, min: 0, max: 4, default: 0 },
    palpitations: { type: Number, min: 0, max: 4, default: 0 },
    anxiousFeelings: { type: Number, min: 0, max: 4, default: 0 },
    blurredVision: { type: Number, min: 0, max: 4, default: 0 },
    tenseFeelings: { type: Number, min: 0, max: 4, default: 0 }
  },
  totalScore: {
    type: Number,
    min: 0,
    max: 64 // 16 items × 4 max score
  },
  interpretation: String,
  hyperventilationLikely: {
    type: Boolean,
    default: false
  }
}, { _id: false });

/**
 * Severity assessment schema
 */
const severityAssessmentSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['none', 'mild', 'moderate', 'severe'],
    default: 'none'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  factors: [{
    factor: String,
    contribution: Number,
    value: mongoose.Schema.Types.Mixed
  }],
  requiresIntervention: {
    type: Boolean,
    default: false
  },
  recommendations: [String]
}, { _id: false });

const hyperventilationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  type: {
    type: String,
    default: 'HYPERVENTILATION_TEST'
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED', 'IN_PROGRESS'],
    default: 'COMPLETED'
  },
  metrics: {
    // Test duration in seconds
    duration: {
      type: Number,
      min: 0,
      max: 600 // Max 10 minutes
    },
    // Respiratory rate (breaths per minute)
    respiratoryRate: {
      baseline: Number,
      during: Number,
      recovery: Number,
      peak: Number
    },
    // Breath hold time in seconds (Nijmegen provocation test)
    breathHoldTime: {
      baseline: {
        type: Number,
        min: 0,
        max: 120
      },
      postHyperventilation: Number,
      recovery: Number
    },
    // Approximate SpO2 equivalent (if available from device)
    spO2Equivalent: {
      baseline: {
        type: Number,
        min: 70,
        max: 100
      },
      minimum: Number,
      recovery: Number
    },
    // Symptom scoring during test
    symptomScore: {
      type: Number,
      min: 0,
      max: 100
    },
    // Time to recover normal breathing (seconds)
    recoveryTime: {
      type: Number,
      min: 0
    },
    // Symptoms observed during test
    observedSymptoms: [{
      type: String,
      enum: HYPERVENTILATION_SYMPTOMS
    }],
    // Peak symptom severity (0-10)
    peakSymptomSeverity: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  // Respiratory pattern analysis
  respiratoryPattern: respiratoryPatternSchema,
  // Nijmegen Questionnaire results (if administered)
  nijmegenScore: nijmegenScoreSchema,
  // Overall severity assessment
  severityAssessment: severityAssessmentSchema,
  // Clinical context
  clinicalContext: {
    triggerIdentified: {
      type: Boolean,
      default: false
    },
    trigger: {
      type: String,
      enum: ['anxiety', 'panic', 'exercise', 'pain', 'medical-procedure', 'unknown', 'none']
    },
    historyOfHyperventilation: Boolean,
    anxietyDisorderDiagnosis: Boolean,
    currentMedications: [String]
  },
  // Interpretation and recommendations
  interpretation: {
    summary: String,
    clinicalSignificance: String,
    differentialConsiderations: [String]
  },
  recommendations: [String],
  data: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

/**
 * Calculate hyperventilation severity score
 */
hyperventilationSchema.methods.calculateSeverityScore = function() {
  let severityScore = 0;
  const factors = [];
  const recommendations = [];
  const metrics = this.metrics || {};
  const ranges = RESPIRATORY_REFERENCE_RANGES;

  // Factor 1: Respiratory rate elevation
  const rrDuring = metrics.respiratoryRate?.during;
  const rrBaseline = metrics.respiratoryRate?.baseline || 14;
  if (rrDuring) {
    if (rrDuring > ranges.respiratoryRate.hyperventilation.severe) {
      severityScore += 30;
      factors.push({
        factor: 'Severely elevated respiratory rate',
        contribution: 30,
        value: `${rrDuring} breaths/min`
      });
      recommendations.push('Breathing retraining techniques recommended');
    } else if (rrDuring > ranges.respiratoryRate.hyperventilation.threshold) {
      const elevation = rrDuring - ranges.respiratoryRate.hyperventilation.threshold;
      const contribution = Math.min(20, elevation * 2);
      severityScore += contribution;
      factors.push({
        factor: 'Elevated respiratory rate',
        contribution,
        value: `${rrDuring} breaths/min (normal: 12-20)`
      });
    }
  }

  // Factor 2: Reduced breath hold time (indicates low CO2 tolerance)
  const breathHold = metrics.breathHoldTime?.baseline;
  if (breathHold && breathHold < ranges.breathHoldTime.reduced.max) {
    const reduction = ranges.breathHoldTime.reduced.max - breathHold;
    const contribution = Math.min(25, reduction);
    severityScore += contribution;
    factors.push({
      factor: 'Reduced breath hold capacity',
      contribution,
      value: `${breathHold} seconds (normal: >25s)`
    });
    recommendations.push('CO2 tolerance training may be beneficial');
  }

  // Factor 3: Symptom count and severity
  const symptomCount = (metrics.observedSymptoms || []).length;
  const peakSeverity = metrics.peakSymptomSeverity || 0;
  if (symptomCount > 0) {
    const symptomContribution = Math.min(25, (symptomCount * 2) + peakSeverity);
    severityScore += symptomContribution;
    factors.push({
      factor: 'Hyperventilation symptoms',
      contribution: symptomContribution,
      value: `${symptomCount} symptoms, peak severity ${peakSeverity}/10`
    });
  }

  // Factor 4: Prolonged recovery time
  const recoveryTime = metrics.recoveryTime || 0;
  if (recoveryTime > 120) { // >2 minutes to recover
    const contribution = Math.min(15, Math.floor((recoveryTime - 120) / 30) * 5);
    severityScore += contribution;
    factors.push({
      factor: 'Prolonged recovery',
      contribution,
      value: `${recoveryTime} seconds to recover`
    });
    recommendations.push('Practice slow, diaphragmatic breathing techniques');
  }

  // Factor 5: SpO2 changes (if available)
  const spO2Min = metrics.spO2Equivalent?.minimum;
  if (spO2Min && spO2Min < ranges.spO2.mild_hypoxemia.min) {
    const contribution = Math.min(15, (ranges.spO2.mild_hypoxemia.min - spO2Min) * 2);
    severityScore += contribution;
    factors.push({
      factor: 'Oxygen saturation concerns',
      contribution,
      value: `Minimum SpO2: ${spO2Min}%`
    });
  }

  // Determine severity level
  let level;
  if (severityScore >= HYPERVENTILATION_SEVERITY.SEVERE.minScore) {
    level = 'severe';
    recommendations.unshift('Consider evaluation for hyperventilation syndrome');
    recommendations.push('Psychological support or CBT may be beneficial');
  } else if (severityScore >= HYPERVENTILATION_SEVERITY.MODERATE.minScore) {
    level = 'moderate';
    recommendations.push('Monitor symptoms and practice breathing exercises');
  } else if (severityScore >= HYPERVENTILATION_SEVERITY.MILD.minScore) {
    level = 'mild';
    recommendations.push('Practice relaxation techniques during stressful situations');
  } else {
    level = 'none';
    recommendations.push('No intervention needed at this time');
  }

  return {
    level,
    score: Math.min(100, severityScore),
    factors,
    requiresIntervention: level === 'moderate' || level === 'severe',
    recommendations: [...new Set(recommendations)]
  };
};

/**
 * Calculate Nijmegen score from questionnaire items
 */
hyperventilationSchema.methods.calculateNijmegenScore = function() {
  if (!this.nijmegenScore?.items) return null;
  
  const items = this.nijmegenScore.items;
  const totalScore = Object.values(items).reduce((sum, val) => sum + (val || 0), 0);
  
  // Nijmegen score ≥23 suggests hyperventilation syndrome
  const hyperventilationLikely = totalScore >= 23;
  
  let interpretation;
  if (totalScore < 11) {
    interpretation = 'Score within normal range. Hyperventilation syndrome unlikely.';
  } else if (totalScore < 23) {
    interpretation = 'Borderline score. Some symptoms present but not diagnostic.';
  } else if (totalScore < 36) {
    interpretation = 'Score suggests possible hyperventilation syndrome. Further evaluation recommended.';
  } else {
    interpretation = 'High score indicates probable hyperventilation syndrome. Intervention recommended.';
  }

  return {
    totalScore,
    interpretation,
    hyperventilationLikely
  };
};

// Pre-save hook to calculate derived values
hyperventilationSchema.pre('save', function(next) {
  // Calculate severity assessment if not provided
  if (!this.severityAssessment || !this.severityAssessment.score) {
    this.severityAssessment = this.calculateSeverityScore();
  }
  
  // Calculate Nijmegen score if items provided
  if (this.nijmegenScore?.items) {
    const nijmegenResult = this.calculateNijmegenScore();
    if (nijmegenResult) {
      this.nijmegenScore.totalScore = nijmegenResult.totalScore;
      this.nijmegenScore.interpretation = nijmegenResult.interpretation;
      this.nijmegenScore.hyperventilationLikely = nijmegenResult.hyperventilationLikely;
    }
  }
  
  // Auto-add recommendations based on findings
  if (!this.recommendations || this.recommendations.length === 0) {
    this.recommendations = this.severityAssessment?.recommendations || [];
  }
  
  next();
});

// Export constants
export { RESPIRATORY_REFERENCE_RANGES, HYPERVENTILATION_SEVERITY, HYPERVENTILATION_SYMPTOMS };

const HyperventilationAssessment = mongoose.model('HyperventilationAssessment', hyperventilationSchema);
export default HyperventilationAssessment;
