import mongoose from 'mongoose';

/**
 * Gait Analysis Assessment Model
 * Comprehensive gait metrics with fall risk scoring algorithm
 * 
 * @references
 * - Perry J, Burnfield JM. Gait Analysis: Normal and Pathological Function. 2nd ed. 2010.
 * - Tinetti ME. Performance-Oriented Assessment of Mobility Problems in Elderly Patients. JAGS. 1986.
 * - Berg Balance Scale and Timed Up and Go (TUG) test standards
 */

/**
 * Normal reference ranges for gait parameters
 * @reference Perry & Burnfield, Gait Analysis, 2010
 */
const GAIT_REFERENCE_RANGES = {
  // Cadence: steps per minute
  cadence: {
    adult: { min: 100, max: 120, unit: 'steps/min' },
    elderly: { min: 90, max: 110, unit: 'steps/min' }
  },
  // Stride length: distance covered in one gait cycle (two steps)
  strideLength: {
    adult: { min: 1.2, max: 1.5, unit: 'm' },
    elderly: { min: 1.0, max: 1.4, unit: 'm' }
  },
  // Gait speed (velocity)
  speed: {
    adult: { min: 1.2, max: 1.4, unit: 'm/s' },
    elderly: { min: 0.8, max: 1.2, unit: 'm/s' },
    fallRiskThreshold: 0.8 // Below this indicates fall risk
  },
  // Step width (base of support)
  stepWidth: {
    normal: { min: 5, max: 13, unit: 'cm' }
  },
  // Stride symmetry (ratio of left to right stride)
  symmetry: {
    normal: { min: 95, max: 100, unit: '%' }
  },
  // Stance/swing phase ratio (normal is ~60/40)
  stanceSwingRatio: {
    normal: { stance: 60, swing: 40, tolerance: 5, unit: '%' }
  }
};

/**
 * Fall risk level thresholds
 * @reference Tinetti Assessment Tool, Berg Balance Scale
 */
const FALL_RISK_THRESHOLDS = {
  LOW: { maxScore: 25, description: 'Low fall risk' },
  MODERATE: { minScore: 26, maxScore: 50, description: 'Moderate fall risk' },
  HIGH: { minScore: 51, maxScore: 75, description: 'High fall risk' },
  VERY_HIGH: { minScore: 76, description: 'Very high fall risk - intervention recommended' }
};

/**
 * Gait quality index components
 */
const gaitQualitySchema = new mongoose.Schema({
  index: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  components: {
    rhythmicity: { type: Number, min: 0, max: 100 },
    symmetry: { type: Number, min: 0, max: 100 },
    stability: { type: Number, min: 0, max: 100 },
    consistency: { type: Number, min: 0, max: 100 }
  },
  interpretation: String
}, { _id: false });

/**
 * Fall risk assessment schema
 * Based on validated clinical assessment tools
 */
const fallRiskSchema = new mongoose.Schema({
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  level: {
    type: String,
    enum: ['low', 'moderate', 'high', 'very-high'],
    required: true
  },
  factors: [{
    factor: String,
    contribution: Number, // 0-100 contribution to overall risk
    description: String
  }],
  recommendations: [String],
  requiresIntervention: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const gaitAnalysisSchema = new mongoose.Schema({
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
    default: 'GAIT_ANALYSIS'
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED', 'IN_PROGRESS'],
    default: 'COMPLETED'
  },
  // Patient demographics for age-adjusted analysis
  patientInfo: {
    ageGroup: {
      type: String,
      enum: ['adult', 'elderly'],
      default: 'adult'
    },
    hasAssistiveDevice: {
      type: Boolean,
      default: false
    },
    assistiveDeviceType: String
  },
  metrics: {
    stability: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      lateralSway: {
        type: Number,
        min: 0,
        // Lateral sway in cm - normal <5cm during walking
        validate: {
          validator: function(v) { return v >= 0; },
          message: 'Lateral sway must be non-negative'
        }
      },
      verticalSway: Number,
      anteroposteriorSway: Number,
      swayVelocity: Number // cm/s
    },
    balance: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      leftRightDistribution: {
        type: Number,
        min: 0,
        max: 100,
        // 50 = perfectly balanced, deviation indicates asymmetry
        default: 50
      },
      singleLegStance: {
        left: Number, // seconds
        right: Number
      },
      tandemStance: Number // seconds
    },
    symmetry: {
      overall: {
        type: Number,
        min: 0,
        max: 100
      },
      legSymmetry: {
        type: Number,
        min: 0,
        max: 100
      },
      armSymmetry: {
        type: Number,
        min: 0,
        max: 100
      },
      strideSymmetryRatio: {
        type: Number,
        // Ratio of left/right stride length - 1.0 = perfect symmetry
        min: 0,
        max: 2
      }
    },
    gait: {
      // Speed in m/s (normal adult: 1.2-1.4 m/s)
      speed: {
        type: Number,
        min: 0,
        max: 5
      },
      // Stride length in meters (normal adult: 1.2-1.5m)
      strideLength: {
        type: Number,
        min: 0,
        max: 3
      },
      stepLength: {
        left: Number,
        right: Number
      },
      // Cadence in steps/min (normal adult: 100-120)
      cadence: {
        type: Number,
        min: 0,
        max: 200
      },
      // Step width (base of support) in cm
      stepWidth: {
        type: Number,
        min: 0,
        max: 50
      },
      // Walking time in seconds
      walkingTime: Number,
      // Distance covered in meters
      distance: Number,
      // Stance phase percentage (normal ~60%)
      stancePhasePercent: {
        type: Number,
        min: 0,
        max: 100
      },
      // Swing phase percentage (normal ~40%)
      swingPhasePercent: {
        type: Number,
        min: 0,
        max: 100
      },
      // Double support time (both feet on ground)
      doubleSupportPercent: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    overall: {
      mobilityScore: {
        type: Number,
        min: 0,
        max: 100
      },
      stabilityScore: {
        type: Number,
        min: 0,
        max: 100
      },
      symmetryScore: {
        type: Number,
        min: 0,
        max: 100
      }
    }
  },
  gaitQuality: gaitQualitySchema,
  fallRisk: fallRiskSchema,
  // Raw sensor/video data reference
  data: mongoose.Schema.Types.Mixed,
  // Clinical interpretation
  interpretation: {
    summary: String,
    abnormalities: [String],
    clinicalSignificance: String
  },
  // Quality of captured data
  dataQuality: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    issues: [String],
    sampleCount: Number,
    confidence: Number
  }
}, {
  timestamps: true
});

// Index for efficient fall risk queries
gaitAnalysisSchema.index({ 'fallRisk.level': 1, timestamp: -1 });

/**
 * Calculate fall risk score based on gait metrics
 * Algorithm based on Tinetti Assessment Tool and clinical research
 */
gaitAnalysisSchema.methods.calculateFallRisk = function() {
  let riskScore = 0;
  const factors = [];
  const recommendations = [];
  const metrics = this.metrics || {};
  const gait = metrics.gait || {};
  const balance = metrics.balance || {};
  const stability = metrics.stability || {};
  const ageGroup = this.patientInfo?.ageGroup || 'adult';
  const ranges = GAIT_REFERENCE_RANGES;

  // Factor 1: Gait speed (major predictor of fall risk)
  if (gait.speed !== undefined) {
    if (gait.speed < 0.6) {
      riskScore += 30;
      factors.push({
        factor: 'Very slow gait speed',
        contribution: 30,
        description: `Gait speed ${gait.speed.toFixed(2)} m/s is significantly below normal (>${ranges.speed.fallRiskThreshold} m/s)`
      });
      recommendations.push('Gait speed training with physical therapist recommended');
    } else if (gait.speed < ranges.speed.fallRiskThreshold) {
      riskScore += 20;
      factors.push({
        factor: 'Reduced gait speed',
        contribution: 20,
        description: `Gait speed ${gait.speed.toFixed(2)} m/s is below fall risk threshold`
      });
      recommendations.push('Consider gait speed improvement exercises');
    }
  }

  // Factor 2: Stride length
  const strideRange = ranges.strideLength[ageGroup];
  if (gait.strideLength !== undefined && gait.strideLength < strideRange.min) {
    riskScore += 15;
    factors.push({
      factor: 'Short stride length',
      contribution: 15,
      description: `Stride length ${gait.strideLength.toFixed(2)} m is below normal (${strideRange.min}-${strideRange.max} m)`
    });
    recommendations.push('Balance and stride training exercises recommended');
  }

  // Factor 3: Cadence abnormality
  const cadenceRange = ranges.cadence[ageGroup];
  if (gait.cadence !== undefined) {
    if (gait.cadence < cadenceRange.min - 20) {
      riskScore += 10;
      factors.push({
        factor: 'Very low cadence',
        contribution: 10,
        description: `Cadence ${gait.cadence} steps/min is significantly below normal`
      });
    }
  }

  // Factor 4: Asymmetry (indicates weakness or injury)
  if (metrics.symmetry?.overall !== undefined && metrics.symmetry.overall < 90) {
    const asymmetryContribution = Math.round((100 - metrics.symmetry.overall) * 0.2);
    riskScore += asymmetryContribution;
    factors.push({
      factor: 'Gait asymmetry',
      contribution: asymmetryContribution,
      description: `Symmetry score ${metrics.symmetry.overall}% indicates uneven gait pattern`
    });
    recommendations.push('Evaluate for underlying musculoskeletal issues');
  }

  // Factor 5: Lateral sway (instability indicator)
  if (stability.lateralSway !== undefined && stability.lateralSway > 5) {
    const swayContribution = Math.min(20, Math.round(stability.lateralSway * 2));
    riskScore += swayContribution;
    factors.push({
      factor: 'Excessive lateral sway',
      contribution: swayContribution,
      description: `Lateral sway ${stability.lateralSway} cm exceeds normal (<5 cm)`
    });
    recommendations.push('Balance training and core strengthening recommended');
  }

  // Factor 6: Balance score
  if (balance.score !== undefined && balance.score < 70) {
    const balanceContribution = Math.round((70 - balance.score) * 0.3);
    riskScore += balanceContribution;
    factors.push({
      factor: 'Poor balance',
      contribution: balanceContribution,
      description: `Balance score ${balance.score}% indicates compromised balance`
    });
    recommendations.push('Balance assessment and intervention recommended');
  }

  // Determine risk level
  let level;
  if (riskScore >= FALL_RISK_THRESHOLDS.VERY_HIGH.minScore) {
    level = 'very-high';
    recommendations.unshift('URGENT: Comprehensive fall prevention assessment required');
  } else if (riskScore >= FALL_RISK_THRESHOLDS.HIGH.minScore) {
    level = 'high';
    recommendations.unshift('Fall prevention intervention recommended');
  } else if (riskScore >= FALL_RISK_THRESHOLDS.MODERATE.minScore) {
    level = 'moderate';
    recommendations.push('Regular monitoring and preventive exercises advised');
  } else {
    level = 'low';
    recommendations.push('Continue current activity level');
  }

  return {
    score: Math.min(100, riskScore),
    level,
    factors,
    recommendations: [...new Set(recommendations)],
    requiresIntervention: level === 'high' || level === 'very-high'
  };
};

/**
 * Calculate gait quality index
 */
gaitAnalysisSchema.methods.calculateGaitQuality = function() {
  const metrics = this.metrics || {};
  const gait = metrics.gait || {};
  const stability = metrics.stability || {};
  const symmetry = metrics.symmetry || {};

  // Component scores (each 0-100)
  const rhythmicity = gait.cadence ? Math.min(100, (gait.cadence / 110) * 100) : 50;
  const symmetryScore = symmetry.overall || 50;
  const stabilityScore = stability.score || 50;
  const consistency = metrics.overall?.mobilityScore || 50;

  // Weighted average for overall quality index
  const index = Math.round(
    (rhythmicity * 0.25) +
    (symmetryScore * 0.30) +
    (stabilityScore * 0.30) +
    (consistency * 0.15)
  );

  let interpretation;
  if (index >= 85) interpretation = 'Excellent gait quality';
  else if (index >= 70) interpretation = 'Good gait quality with minor issues';
  else if (index >= 50) interpretation = 'Moderate gait quality - improvement possible';
  else interpretation = 'Poor gait quality - intervention recommended';

  return {
    index,
    components: {
      rhythmicity: Math.round(rhythmicity),
      symmetry: Math.round(symmetryScore),
      stability: Math.round(stabilityScore),
      consistency: Math.round(consistency)
    },
    interpretation
  };
};

// Pre-save hook to calculate derived metrics
gaitAnalysisSchema.pre('save', function(next) {
  // Calculate fall risk if not provided
  if (!this.fallRisk || !this.fallRisk.score) {
    this.fallRisk = this.calculateFallRisk();
  }
  
  // Calculate gait quality if not provided
  if (!this.gaitQuality || !this.gaitQuality.index) {
    this.gaitQuality = this.calculateGaitQuality();
  }
  
  next();
});

// Export reference ranges for use in other modules
export { GAIT_REFERENCE_RANGES, FALL_RISK_THRESHOLDS };

const GaitAnalysisAssessment = mongoose.model('GaitAnalysisAssessment', gaitAnalysisSchema);
export default GaitAnalysisAssessment;
