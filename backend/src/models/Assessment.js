import mongoose from 'mongoose';

/**
 * Base Assessment Model
 * Comprehensive validation schemas for all assessment types with risk level categorization
 * 
 * @references
 * - Clinical assessment standards for motor, cognitive, and physiological evaluations
 * - Medical reference ranges from peer-reviewed literature
 */

/**
 * Risk level enum for clinical decision support
 */
const RISK_LEVELS = ['low', 'moderate', 'high', 'critical'];

/**
 * Assessment status enum
 */
const ASSESSMENT_STATUSES = ['COMPLETED', 'FAILED', 'IN_PROGRESS', 'PENDING_REVIEW'];

/**
 * Assessment type enum with descriptions
 */
const ASSESSMENT_TYPES = [
  'GAIT_ANALYSIS',
  'BALANCE_ANALYSIS',
  'POSTURAL_ANALYSIS',
  'EYE_MOVEMENT',
  'NECK_MOBILITY',
  'FACIAL_SYMMETRY',
  'TREMOR',
  'RESPONSE_TIME',
  'SPEECH_PATTERN',
  'FINGER_TAPPING',
  'HYPERVENTILATION_TEST',
  'COGNITIVE_ASSESSMENT',
  'VISION_TEST',
  'HEARING_TEST',
  'CARDIOVASCULAR_ASSESSMENT',
  'MENTAL_HEALTH_SCREENING'
];

/**
 * Common metric range validators
 */
const metricRangeSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  normalMin: Number,
  normalMax: Number,
  isWithinNormal: Boolean,
  percentile: {
    type: Number,
    min: 0,
    max: 100
  }
}, { _id: false });

/**
 * Risk assessment sub-schema
 */
const riskAssessmentSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: RISK_LEVELS,
    required: true,
    default: 'low'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  factors: [{
    factor: String,
    contribution: Number,
    description: String
  }],
  interpretation: String,
  recommendedActions: [String],
  requiresFollowUp: {
    type: Boolean,
    default: false
  },
  urgency: {
    type: String,
    enum: ['routine', 'soon', 'urgent', 'immediate'],
    default: 'routine'
  }
}, { _id: false });

/**
 * Quality assurance sub-schema for data validation
 */
const qualityMetricsSchema = new mongoose.Schema({
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
    default: 0
  },
  dataQuality: {
    type: String,
    enum: ['excellent', 'good', 'acceptable', 'poor', 'invalid'],
    default: 'acceptable'
  },
  sampleSize: Number,
  outlierCount: Number,
  coefficientOfVariation: Number,
  validationIssues: [String]
}, { _id: false });

/**
 * Metadata sub-schema for audit trail and context
 */
const assessmentMetadataSchema = new mongoose.Schema({
  deviceInfo: {
    type: String
  },
  appVersion: String,
  environmentConditions: {
    lighting: String,
    noise: String,
    temperature: Number
  },
  userNotes: String,
  clinicianNotes: String,
  reviewedBy: String,
  reviewedAt: Date,
  flaggedForReview: {
    type: Boolean,
    default: false
  },
  flagReason: String
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Assessment type is required'],
    enum: {
      values: ASSESSMENT_TYPES,
      message: '{VALUE} is not a valid assessment type'
    }
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date
  },
  duration: {
    type: Number, // Duration in seconds
    min: 0
  },
  data: {
    type: Object,
    required: [true, 'Assessment data is required'],
    validate: {
      validator: function(v) {
        return v && Object.keys(v).length > 0;
      },
      message: 'Assessment data cannot be empty'
    }
  },
  metrics: {
    type: Object,
    required: [true, 'Assessment metrics are required']
  },
  riskAssessment: {
    type: riskAssessmentSchema,
    default: () => ({ level: 'low', requiresFollowUp: false, urgency: 'routine' })
  },
  qualityMetrics: {
    type: qualityMetricsSchema,
    default: () => ({ confidenceScore: 0, dataQuality: 'acceptable' })
  },
  metadata: {
    type: assessmentMetadataSchema,
    default: () => ({})
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ASSESSMENT_STATUSES,
      message: '{VALUE} is not a valid status'
    },
    default: 'COMPLETED'
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  interpretation: {
    summary: String,
    details: String,
    clinicalSignificance: String
  },
  recommendations: [{
    type: String
  }],
  comparedToBaseline: {
    hasBaseline: {
      type: Boolean,
      default: false
    },
    percentChange: Number,
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining', 'unknown'],
      default: 'unknown'
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
assessmentSchema.index({ userId: 1, type: 1, timestamp: -1 });
assessmentSchema.index({ userId: 1, status: 1 });
assessmentSchema.index({ 'riskAssessment.level': 1, timestamp: -1 });
assessmentSchema.index({ 'metadata.flaggedForReview': 1 });

// Virtual for age of assessment
assessmentSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware for validation and computed fields
assessmentSchema.pre('save', function(next) {
  // Set completedAt if status is COMPLETED and not already set
  if (this.status === 'COMPLETED' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Auto-flag for review if risk level is high or critical
  if (this.riskAssessment && 
      (this.riskAssessment.level === 'high' || this.riskAssessment.level === 'critical')) {
    this.metadata = this.metadata || {};
    this.metadata.flaggedForReview = true;
    if (!this.metadata.flagReason) {
      this.metadata.flagReason = `Auto-flagged: ${this.riskAssessment.level} risk level detected`;
    }
  }
  
  next();
});

// Static method to get assessments by risk level
assessmentSchema.statics.findByRiskLevel = function(level, limit = 50) {
  return this.find({ 'riskAssessment.level': level })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get user's assessment history
assessmentSchema.statics.getUserHistory = function(userId, type, limit = 10) {
  const query = { userId };
  if (type) query.type = type;
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Instance method to calculate trend from history
assessmentSchema.methods.calculateTrend = async function() {
  const history = await this.constructor.find({
    userId: this.userId,
    type: this.type,
    timestamp: { $lt: this.timestamp }
  })
    .sort({ timestamp: -1 })
    .limit(5);
  
  if (history.length === 0) {
    return { trend: 'unknown', hasBaseline: false };
  }
  
  const currentScore = this.overallScore || 0;
  const historicalAvg = history.reduce((sum, a) => sum + (a.overallScore || 0), 0) / history.length;
  const percentChange = ((currentScore - historicalAvg) / historicalAvg) * 100;
  
  let trend = 'stable';
  if (percentChange > 10) trend = 'improving';
  else if (percentChange < -10) trend = 'declining';
  
  return {
    trend,
    hasBaseline: true,
    percentChange: Math.round(percentChange * 10) / 10,
    baselineAverage: Math.round(historicalAvg * 10) / 10
  };
};

const Assessment = mongoose.model('Assessment', assessmentSchema);

// Export constants for use in other modules
export { RISK_LEVELS, ASSESSMENT_STATUSES, ASSESSMENT_TYPES };
export default Assessment;
