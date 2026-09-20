import mongoose from 'mongoose';

/**
 * Feature Data Model
 * Generic model for storing various feature-specific data
 * Supports symptom checks, period logs, vaccinations, health predictions,
 * recommendations, voice entries, doctor reports, and anomaly reports
 */

/**
 * Feature type enum
 */
const FEATURE_TYPES = [
  'symptom_check',
  'period_log',
  'vaccination',
  'health_prediction',
  'recommendation',
  'voice_entry',
  'doctor_report',
  'anomaly_report'
];

const featureDataSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  featureType: {
    type: String,
    required: [true, 'Feature type is required'],
    enum: {
      values: FEATURE_TYPES,
      message: '{VALUE} is not a valid feature type'
    },
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Data is required'],
    validate: {
      validator: function(v) {
        return v !== null && v !== undefined;
      },
      message: 'Data cannot be null or undefined'
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
featureDataSchema.index({ userId: 1, featureType: 1, createdAt: -1 });
featureDataSchema.index({ featureType: 1, createdAt: -1 });

// Virtual for age in days
featureDataSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get data by type for a user
featureDataSchema.statics.getByType = function(userId, featureType, limit = 20, offset = 0) {
  return this.find({ userId, featureType })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();
};

// Static method to get latest entry by type
featureDataSchema.statics.getLatest = function(userId, featureType) {
  return this.findOne({ userId, featureType })
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to count entries by type
featureDataSchema.statics.countByType = function(userId, featureType) {
  return this.countDocuments({ userId, featureType });
};

const FeatureData = mongoose.model('FeatureData', featureDataSchema);

// Export constants for use in other modules
export { FEATURE_TYPES };
export default FeatureData;
