import mongoose from 'mongoose';

/**
 * Tremor Assessment Model
 * Comprehensive tremor metrics with severity scoring based on Fahn-Tolosa-Marin Tremor Rating Scale
 * 
 * @references
 * - Fahn S, Tolosa E, Marin C. Clinical rating scale for tremor. In: Jankovic J, Tolosa E, eds. Parkinson's Disease and Movement Disorders. 1993.
 * - Elble RJ. Tremor: Clinical Features, Pathophysiology, and Treatment. Neurologic Clinics. 2009.
 * - Bain PG et al. Assessing tremor severity. J Neurol Neurosurg Psychiatry. 1993.
 */

/**
 * Tremor frequency ranges by type
 * @reference Elble RJ, Tremor characteristics by etiology
 */
const TREMOR_FREQUENCY_RANGES = {
  // Parkinsonian tremor (rest tremor)
  PARKINSONIAN: { min: 3, max: 7, unit: 'Hz', description: 'Rest tremor, "pill-rolling"' },
  // Essential tremor (action/postural tremor)
  ESSENTIAL: { min: 4, max: 12, unit: 'Hz', description: 'Postural/kinetic tremor' },
  // Cerebellar tremor (intention tremor)
  CEREBELLAR: { min: 3, max: 5, unit: 'Hz', description: 'Intention tremor, worsens approaching target' },
  // Physiologic tremor (normal)
  PHYSIOLOGIC: { min: 8, max: 13, unit: 'Hz', description: 'Normal tremor, usually not visible' },
  // Enhanced physiologic tremor (anxiety, caffeine, etc.)
  ENHANCED_PHYSIOLOGIC: { min: 8, max: 12, unit: 'Hz', description: 'Enhanced normal tremor' },
  // Dystonic tremor
  DYSTONIC: { min: 4, max: 7, unit: 'Hz', description: 'Irregular, jerky tremor' }
};

/**
 * Fahn-Tolosa-Marin (FTM) Tremor Rating Scale severity levels
 * Part A: Tremor location and severity
 * @reference Fahn et al., 1993
 */
const FTM_SEVERITY_SCALE = {
  0: { score: 0, label: 'None', description: 'No tremor' },
  1: { score: 1, label: 'Slight', description: 'Amplitude <0.5cm, may be intermittent' },
  2: { score: 2, label: 'Mild', description: 'Amplitude 0.5-1cm, intermittent but present' },
  3: { score: 3, label: 'Moderate', description: 'Amplitude 1-2cm, constant, affects function' },
  4: { score: 4, label: 'Severe', description: 'Amplitude >2cm, constant, significantly disabling' }
};

/**
 * Tremor amplitude classification
 */
const AMPLITUDE_CLASSIFICATION = {
  MINIMAL: { max: 0.5, severity: 'minimal', ftmScore: 1 },
  MILD: { min: 0.5, max: 1, severity: 'mild', ftmScore: 2 },
  MODERATE: { min: 1, max: 2, severity: 'moderate', ftmScore: 3 },
  SEVERE: { min: 2, severity: 'severe', ftmScore: 4 }
};

/**
 * Tremor type classification schema
 */
const tremorTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['rest', 'postural', 'kinetic', 'intention', 'task-specific', 'isometric', 'unknown'],
    required: true
  },
  activationCondition: String,
  bodyPart: {
    type: String,
    enum: ['hands', 'arms', 'head', 'jaw', 'voice', 'trunk', 'legs', 'multiple'],
    required: true
  },
  laterality: {
    type: String,
    enum: ['left', 'right', 'bilateral', 'asymmetric-left', 'asymmetric-right'],
    default: 'bilateral'
  }
}, { _id: false });

/**
 * Fahn-Tolosa-Marin severity scoring schema
 */
const ftmSeveritySchema = new mongoose.Schema({
  partAScore: {
    // Tremor amplitude at rest (0-4 for each body part)
    rest: {
      face: { type: Number, min: 0, max: 4, default: 0 },
      rightHand: { type: Number, min: 0, max: 4, default: 0 },
      leftHand: { type: Number, min: 0, max: 4, default: 0 },
      rightArm: { type: Number, min: 0, max: 4, default: 0 },
      leftArm: { type: Number, min: 0, max: 4, default: 0 },
      trunk: { type: Number, min: 0, max: 4, default: 0 },
      rightLeg: { type: Number, min: 0, max: 4, default: 0 },
      leftLeg: { type: Number, min: 0, max: 4, default: 0 }
    },
    // Tremor amplitude during posture/action
    postureAction: {
      rightHand: { type: Number, min: 0, max: 4, default: 0 },
      leftHand: { type: Number, min: 0, max: 4, default: 0 },
      head: { type: Number, min: 0, max: 4, default: 0 },
      voice: { type: Number, min: 0, max: 4, default: 0 }
    }
  },
  partBScore: {
    // Specific motor tasks (0-4 scale)
    handwriting: { type: Number, min: 0, max: 4, default: 0 },
    drawing: { type: Number, min: 0, max: 4, default: 0 },
    pouring: { type: Number, min: 0, max: 4, default: 0 }
  },
  partCScore: {
    // Functional disability (0-4 scale)
    speaking: { type: Number, min: 0, max: 4, default: 0 },
    feeding: { type: Number, min: 0, max: 4, default: 0 },
    drinking: { type: Number, min: 0, max: 4, default: 0 },
    hygiene: { type: Number, min: 0, max: 4, default: 0 },
    dressing: { type: Number, min: 0, max: 4, default: 0 },
    writing: { type: Number, min: 0, max: 4, default: 0 },
    work: { type: Number, min: 0, max: 4, default: 0 },
    socialActivities: { type: Number, min: 0, max: 4, default: 0 }
  },
  totalScore: {
    type: Number,
    min: 0
  },
  overallSeverity: {
    type: String,
    enum: ['none', 'slight', 'mild', 'moderate', 'severe']
  }
}, { _id: false });

const tremorSchema = new mongoose.Schema({
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
    default: 'TREMOR'
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED', 'IN_PROGRESS'],
    default: 'COMPLETED'
  },
  // Tremor classification
  tremorClassification: tremorTypeSchema,
  metrics: {
    // Dominant frequency of tremor oscillation (Hz)
    tremor_frequency: {
      type: Number,
      min: 0,
      max: 30, // Physiologic max ~15Hz, allow margin
      validate: {
        validator: function(v) { return v >= 0 && v <= 30; },
        message: 'Tremor frequency must be between 0-30 Hz'
      }
    },
    // Peak-to-peak amplitude (mm)
    tremor_amplitude: {
      type: Number,
      min: 0,
      // Amplitude in mm, severe tremor can be >20mm
      max: 100
    },
    // Amplitude at different percentiles for variability
    amplitude_percentiles: {
      p25: Number,
      p50: Number, // median
      p75: Number,
      p95: Number
    },
    // Tremor type classification
    tremor_type: {
      type: String,
      enum: ['rest', 'postural', 'kinetic', 'intention', 'task-specific', 'mixed', 'unknown']
    },
    // Probable etiology based on characteristics
    probable_etiology: {
      type: String,
      enum: ['essential', 'parkinsonian', 'cerebellar', 'physiologic', 'enhanced-physiologic', 'dystonic', 'psychogenic', 'drug-induced', 'unknown']
    },
    // Regularity score (0-100, 100 = perfectly regular)
    regularity: {
      type: Number,
      min: 0,
      max: 100
    },
    // Stability/consistency of tremor over recording
    stability: {
      type: Number,
      min: 0,
      max: 100
    },
    // Intermittency (percentage of time tremor is absent)
    intermittency: {
      type: Number,
      min: 0,
      max: 100
    },
    // Simple severity classification for quick reference
    severity: {
      type: String,
      enum: ['none', 'minimal', 'mild', 'moderate', 'severe'],
      default: 'none'
    },
    overall: {
      tremorScore: {
        type: Number,
        min: 0,
        max: 100
      }
    }
  },
  // Fahn-Tolosa-Marin scale scoring
  ftmScoring: ftmSeveritySchema,
  // Recording metadata
  recordingInfo: {
    duration: Number, // seconds
    sampleRate: Number, // Hz
    bodyPartRecorded: String,
    recordingCondition: {
      type: String,
      enum: ['rest', 'arms-extended', 'finger-to-nose', 'drawing', 'writing', 'pouring'],
      default: 'rest'
    }
  },
  // Clinical interpretation
  interpretation: {
    summary: String,
    differentialConsiderations: [String],
    recommendedFollowUp: String,
    clinicalSignificance: String
  },
  data: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

/**
 * Calculate FTM severity score from metrics
 */
tremorSchema.methods.calculateFTMScore = function() {
  const metrics = this.metrics || {};
  const amplitude = metrics.tremor_amplitude || 0;
  
  // Map amplitude to FTM score (0-4)
  let ftmAmplitudeScore;
  if (amplitude < 0.5) ftmAmplitudeScore = amplitude > 0 ? 1 : 0;
  else if (amplitude < 10) ftmAmplitudeScore = 2; // 0.5-10mm = mild
  else if (amplitude < 20) ftmAmplitudeScore = 3; // 10-20mm = moderate
  else ftmAmplitudeScore = 4; // >20mm = severe

  // Calculate overall severity
  let overallSeverity;
  if (ftmAmplitudeScore === 0) overallSeverity = 'none';
  else if (ftmAmplitudeScore === 1) overallSeverity = 'slight';
  else if (ftmAmplitudeScore === 2) overallSeverity = 'mild';
  else if (ftmAmplitudeScore === 3) overallSeverity = 'moderate';
  else overallSeverity = 'severe';

  return {
    totalScore: ftmAmplitudeScore * 10, // Simple score 0-40
    overallSeverity
  };
};

/**
 * Classify probable tremor etiology based on characteristics
 */
tremorSchema.methods.classifyTremorType = function() {
  const metrics = this.metrics || {};
  const freq = metrics.tremor_frequency;
  const tremorType = metrics.tremor_type;
  const regularity = metrics.regularity || 50;
  
  if (!freq) return 'unknown';
  
  // Rest tremor with 3-7Hz suggests Parkinsonian
  if (tremorType === 'rest' && freq >= 3 && freq <= 7) {
    return 'parkinsonian';
  }
  
  // Postural/action tremor with 4-12Hz suggests essential tremor
  if ((tremorType === 'postural' || tremorType === 'kinetic') && freq >= 4 && freq <= 12) {
    return 'essential';
  }
  
  // Intention tremor with 3-5Hz suggests cerebellar
  if (tremorType === 'intention' && freq >= 3 && freq <= 5) {
    return 'cerebellar';
  }
  
  // High frequency (8-13Hz) with low amplitude suggests physiologic
  if (freq >= 8 && freq <= 13 && metrics.tremor_amplitude < 5) {
    return regularity > 70 ? 'physiologic' : 'enhanced-physiologic';
  }
  
  // Irregular tremor with variable frequency suggests dystonic or psychogenic
  if (regularity < 40) {
    return 'dystonic';
  }
  
  return 'unknown';
};

/**
 * Calculate severity based on amplitude and functional impact
 */
tremorSchema.methods.calculateSeverity = function() {
  const amplitude = this.metrics?.tremor_amplitude || 0;
  
  if (amplitude === 0) return 'none';
  if (amplitude < 5) return 'minimal';
  if (amplitude < 10) return 'mild';
  if (amplitude < 20) return 'moderate';
  return 'severe';
};

// Pre-save hook to calculate derived values
tremorSchema.pre('save', function(next) {
  // Calculate severity if not set
  if (!this.metrics.severity) {
    this.metrics.severity = this.calculateSeverity();
  }
  
  // Calculate probable etiology if not set
  if (!this.metrics.probable_etiology) {
    this.metrics.probable_etiology = this.classifyTremorType();
  }
  
  // Calculate FTM score if not provided
  if (!this.ftmScoring || !this.ftmScoring.totalScore) {
    const ftmResult = this.calculateFTMScore();
    this.ftmScoring = this.ftmScoring || {};
    this.ftmScoring.totalScore = ftmResult.totalScore;
    this.ftmScoring.overallSeverity = ftmResult.overallSeverity;
  }
  
  // Calculate overall tremor score
  if (!this.metrics.overall || !this.metrics.overall.tremorScore) {
    const amplitude = this.metrics.tremor_amplitude || 0;
    const regularity = this.metrics.regularity || 50;
    // Inverse score: higher tremor = lower health score
    const tremorScore = Math.max(0, 100 - (amplitude * 2) - ((100 - regularity) * 0.5));
    this.metrics.overall = this.metrics.overall || {};
    this.metrics.overall.tremorScore = Math.round(tremorScore);
  }
  
  next();
});

// Export constants for external use
export { TREMOR_FREQUENCY_RANGES, FTM_SEVERITY_SCALE, AMPLITUDE_CLASSIFICATION };

const TremorAssessment = mongoose.model('TremorAssessment', tremorSchema);
export default TremorAssessment;
