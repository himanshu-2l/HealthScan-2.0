import express from 'express';
import FeatureData from '../models/FeatureData.js';
import EmergencyContact from '../models/EmergencyContact.js';
import { requireAuth } from '../middleware/auth.js';
import { validateUserId, validatePagination } from '../middleware/validate.js';
import { assessmentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Wrap async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Standard success response format
 */
const successResponse = (res, data, statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...meta,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standard error response format
 */
const errorResponse = (res, error, message, statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString()
  });
};

/**
 * Verify user can access the requested data
 * Requires authenticated user to match userId, or have an admin role
 */
const verifyUserAccess = (req, userId) => {
  if (!req.user) {
    return false;
  }
  if (req.user.uid !== userId && req.user.role !== 'admin') {
    return false;
  }
  return true;
};

/**
 * Validate MongoDB ObjectId format
 */
const isValidObjectId = (id) => {
  return id && id.match(/^[0-9a-fA-F]{24}$/);
};

// ===========================================
// SYMPTOM CHECKER ROUTES
// ===========================================

/**
 * Save Symptom Check Result
 * POST /api/features/symptoms/save
 */
router.post('/symptoms/save',
  requireAuth,
  assessmentLimiter,
  asyncHandler(async (req, res) => {
    const { userId, bodyArea, symptoms, aiAnalysis, severity } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const entry = new FeatureData({
      userId,
      featureType: 'symptom_check',
      data: { bodyArea, symptoms, aiAnalysis, severity },
      metadata: { requestId: req.requestId }
    });

    await entry.save();

    return successResponse(res, entry, 201, {
      message: 'Symptom check saved successfully'
    });
  })
);

/**
 * Get Symptom Check History
 * GET /api/features/symptoms/history/:userId
 */
router.get('/symptoms/history/:userId',
  requireAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.pagination || {};

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own data', 403);
    }

    const [history, total] = await Promise.all([
      FeatureData.getByType(userId, 'symptom_check', limit, offset),
      FeatureData.countByType(userId, 'symptom_check')
    ]);

    return successResponse(res, history, 200, {
      pagination: { total, limit, offset, hasMore: offset + history.length < total }
    });
  })
);

// ===========================================
// PERIOD TRACKER ROUTES
// ===========================================

/**
 * Save Period Log Entry
 * POST /api/features/period/log
 */
router.post('/period/log',
  requireAuth,
  assessmentLimiter,
  asyncHandler(async (req, res) => {
    const { userId, date, flowIntensity, symptoms, mood, notes } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const entry = new FeatureData({
      userId,
      featureType: 'period_log',
      data: { date, flowIntensity, symptoms, mood, notes },
      metadata: { requestId: req.requestId }
    });

    await entry.save();

    return successResponse(res, entry, 201, {
      message: 'Period log saved successfully'
    });
  })
);

/**
 * Get Period Log History
 * GET /api/features/period/history/:userId
 */
router.get('/period/history/:userId',
  requireAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.pagination || {};

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own data', 403);
    }

    const [history, total] = await Promise.all([
      FeatureData.getByType(userId, 'period_log', limit, offset),
      FeatureData.countByType(userId, 'period_log')
    ]);

    return successResponse(res, history, 200, {
      pagination: { total, limit, offset, hasMore: offset + history.length < total }
    });
  })
);

/**
 * Delete Period Log Entry
 * DELETE /api/features/period/log/:id
 */
router.delete('/period/log/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Bad Request', 'Invalid ID format', 400);
    }

    const entry = await FeatureData.findById(id);

    if (!entry) {
      return errorResponse(res, 'Not Found', 'Period log entry not found', 404);
    }

    if (!verifyUserAccess(req, entry.userId)) {
      return errorResponse(res, 'Forbidden', 'You can only delete your own data', 403);
    }

    await entry.deleteOne();

    return successResponse(res, { id }, 200, {
      message: 'Period log entry deleted successfully'
    });
  })
);

// ===========================================
// VACCINATION ROUTES
// ===========================================

/**
 * Save Vaccination Record
 * POST /api/features/vaccinations/save
 */
router.post('/vaccinations/save',
  requireAuth,
  assessmentLimiter,
  asyncHandler(async (req, res) => {
    const { userId, vaccineName, date, dose, provider, nextDue } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const entry = new FeatureData({
      userId,
      featureType: 'vaccination',
      data: { vaccineName, date, dose, provider, nextDue },
      metadata: { requestId: req.requestId }
    });

    await entry.save();

    return successResponse(res, entry, 201, {
      message: 'Vaccination record saved successfully'
    });
  })
);

/**
 * Get All Vaccination Records
 * GET /api/features/vaccinations/:userId
 */
router.get('/vaccinations/:userId',
  requireAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.pagination || {};

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own data', 403);
    }

    const [records, total] = await Promise.all([
      FeatureData.getByType(userId, 'vaccination', limit, offset),
      FeatureData.countByType(userId, 'vaccination')
    ]);

    return successResponse(res, records, 200, {
      pagination: { total, limit, offset, hasMore: offset + records.length < total }
    });
  })
);

/**
 * Update Vaccination Record
 * PUT /api/features/vaccinations/:id
 */
router.put('/vaccinations/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { vaccineName, date, dose, provider, nextDue } = req.body;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Bad Request', 'Invalid ID format', 400);
    }

    const entry = await FeatureData.findById(id);

    if (!entry) {
      return errorResponse(res, 'Not Found', 'Vaccination record not found', 404);
    }

    if (!verifyUserAccess(req, entry.userId)) {
      return errorResponse(res, 'Forbidden', 'You can only update your own data', 403);
    }

    entry.data = { vaccineName, date, dose, provider, nextDue };
    await entry.save();

    return successResponse(res, entry, 200, {
      message: 'Vaccination record updated successfully'
    });
  })
);

/**
 * Delete Vaccination Record
 * DELETE /api/features/vaccinations/:id
 */
router.delete('/vaccinations/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 'Bad Request', 'Invalid ID format', 400);
    }

    const entry = await FeatureData.findById(id);

    if (!entry) {
      return errorResponse(res, 'Not Found', 'Vaccination record not found', 404);
    }

    if (!verifyUserAccess(req, entry.userId)) {
      return errorResponse(res, 'Forbidden', 'You can only delete your own data', 403);
    }

    await entry.deleteOne();

    return successResponse(res, { id }, 200, {
      message: 'Vaccination record deleted successfully'
    });
  })
);

// ===========================================
// EMERGENCY CONTACTS ROUTES
// ===========================================

/**
 * Save/Update Emergency Contacts List
 * POST /api/features/emergency/contacts
 */
router.post('/emergency/contacts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, contacts } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const doc = await EmergencyContact.findOneAndUpdate(
      { userId },
      { $set: { contacts: contacts || [] } },
      { new: true, upsert: true }
    );

    return successResponse(res, doc, 201, {
      message: 'Emergency contacts saved successfully'
    });
  })
);

/**
 * Get Emergency Contacts
 * GET /api/features/emergency/contacts/:userId
 */
router.get('/emergency/contacts/:userId',
  requireAuth,
  validateUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own data', 403);
    }

    const doc = await EmergencyContact.getOrCreate(userId);

    return successResponse(res, doc);
  })
);

/**
 * Update Single Emergency Contact
 * PUT /api/features/emergency/contacts/:id
 */
router.put('/emergency/contacts/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId, name, phone, relationship, isPrimary } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only update your own data', 403);
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (relationship !== undefined) updates.relationship = relationship;
    if (isPrimary !== undefined) updates.isPrimary = isPrimary;

    const doc = await EmergencyContact.updateContact(userId, id, updates);

    if (!doc) {
      return errorResponse(res, 'Not Found', 'Contact not found', 404);
    }

    return successResponse(res, doc, 200, {
      message: 'Contact updated successfully'
    });
  })
);

/**
 * Delete Emergency Contact
 * DELETE /api/features/emergency/contacts/:id
 */
router.delete('/emergency/contacts/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId query parameter is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only delete your own data', 403);
    }

    const doc = await EmergencyContact.removeContact(userId, id);

    if (!doc) {
      return errorResponse(res, 'Not Found', 'Contact not found', 404);
    }

    return successResponse(res, { id }, 200, {
      message: 'Contact deleted successfully'
    });
  })
);

/**
 * Update Medical ID
 * PUT /api/features/emergency/medical-id/:userId
 */
router.put('/emergency/medical-id/:userId',
  requireAuth,
  validateUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { bloodType, allergies, medications, conditions, organDonor, emergencyNotes } = req.body;

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only update your own data', 403);
    }

    const medicalIdData = {
      bloodType,
      allergies: allergies || [],
      medications: medications || [],
      conditions: conditions || [],
      organDonor: organDonor || false,
      emergencyNotes: emergencyNotes || ''
    };

    const doc = await EmergencyContact.updateMedicalId(userId, medicalIdData);

    return successResponse(res, doc, 200, {
      message: 'Medical ID updated successfully'
    });
  })
);

// ===========================================
// HEALTH PREDICTIONS ROUTES
// ===========================================

/**
 * Save Health Prediction Results
 * POST /api/features/predictions/save
 */
router.post('/predictions/save',
  requireAuth,
  assessmentLimiter,
  asyncHandler(async (req, res) => {
    const { userId, scores, trends, aiAnalysis } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const entry = new FeatureData({
      userId,
      featureType: 'health_prediction',
      data: { scores, trends, aiAnalysis },
      metadata: { requestId: req.requestId }
    });

    await entry.save();

    return successResponse(res, entry, 201, {
      message: 'Health prediction saved successfully'
    });
  })
);

/**
 * Get Latest Health Prediction
 * GET /api/features/predictions/latest/:userId
 */
router.get('/predictions/latest/:userId',
  requireAuth,
  validateUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own data', 403);
    }

    const latest = await FeatureData.getLatest(userId, 'health_prediction');

    return successResponse(res, latest);
  })
);

// ===========================================
// RECOMMENDATIONS ROUTES
// ===========================================

/**
 * Save Recommendations
 * POST /api/features/recommendations/save
 */
router.post('/recommendations/save',
  requireAuth,
  assessmentLimiter,
  asyncHandler(async (req, res) => {
    const { userId, diet, exercise, lifestyle, sleep } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const entry = new FeatureData({
      userId,
      featureType: 'recommendation',
      data: { diet, exercise, lifestyle, sleep },
      metadata: { requestId: req.requestId }
    });

    await entry.save();

    return successResponse(res, entry, 201, {
      message: 'Recommendations saved successfully'
    });
  })
);

/**
 * Get Latest Recommendations
 * GET /api/features/recommendations/latest/:userId
 */
router.get('/recommendations/latest/:userId',
  requireAuth,
  validateUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own data', 403);
    }

    const latest = await FeatureData.getLatest(userId, 'recommendation');

    return successResponse(res, latest);
  })
);

// ===========================================
// VOICE ENTRY ROUTES
// ===========================================

/**
 * Save Voice Entry
 * POST /api/features/voice/entry
 */
router.post('/voice/entry',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, type, value, unit, rawTranscript } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const entry = new FeatureData({
      userId,
      featureType: 'voice_entry',
      data: { type, value, unit, rawTranscript },
      metadata: { requestId: req.requestId }
    });

    await entry.save();

    return successResponse(res, entry, 201, {
      message: 'Voice entry saved successfully'
    });
  })
);

// ===========================================
// DOCTOR REPORT ROUTES
// ===========================================

/**
 * Save Generated Report Snapshot
 * POST /api/features/reports/generate
 */
router.post('/reports/generate',
  requireAuth,
  assessmentLimiter,
  asyncHandler(async (req, res) => {
    const { userId, reportContent, metrics, notes, reportType } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const entry = new FeatureData({
      userId,
      featureType: 'doctor_report',
      data: { reportContent, metrics, notes, reportType },
      metadata: { requestId: req.requestId, generatedAt: new Date().toISOString() }
    });

    await entry.save();

    return successResponse(res, entry, 201, {
      message: 'Report saved successfully'
    });
  })
);

/**
 * Get Report History
 * GET /api/features/reports/history/:userId
 */
router.get('/reports/history/:userId',
  requireAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.pagination || {};

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own data', 403);
    }

    const [history, total] = await Promise.all([
      FeatureData.getByType(userId, 'doctor_report', limit, offset),
      FeatureData.countByType(userId, 'doctor_report')
    ]);

    return successResponse(res, history, 200, {
      pagination: { total, limit, offset, hasMore: offset + history.length < total }
    });
  })
);

// ===========================================
// ANOMALY DETECTION ROUTES
// ===========================================

/**
 * Save Anomaly Report
 * POST /api/features/anomalies/report
 */
router.post('/anomalies/report',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, anomalies, severity, affectedMetrics, recommendations } = req.body;

    if (!userId) {
      return errorResponse(res, 'Bad Request', 'userId is required', 400);
    }

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save data for yourself', 403);
    }

    const entry = new FeatureData({
      userId,
      featureType: 'anomaly_report',
      data: { anomalies, severity, affectedMetrics, recommendations },
      metadata: { requestId: req.requestId, detectedAt: new Date().toISOString() }
    });

    await entry.save();

    return successResponse(res, entry, 201, {
      message: 'Anomaly report saved successfully'
    });
  })
);

/**
 * Get Anomaly History
 * GET /api/features/anomalies/:userId
 */
router.get('/anomalies/:userId',
  requireAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.pagination || {};

    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own data', 403);
    }

    const [history, total] = await Promise.all([
      FeatureData.getByType(userId, 'anomaly_report', limit, offset),
      FeatureData.countByType(userId, 'anomaly_report')
    ]);

    return successResponse(res, history, 200, {
      pagination: { total, limit, offset, hasMore: offset + history.length < total }
    });
  })
);

// ===========================================
// ERROR HANDLING
// ===========================================

router.use((err, req, res, next) => {
  console.error(`[Feature Route Error] ${req.method} ${req.path}:`, err);

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    return errorResponse(
      res,
      'Validation Error',
      'Data validation failed',
      400,
      Object.values(err.errors).map(e => e.message)
    );
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 'Bad Request', 'Invalid ID format', 400);
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    return errorResponse(res, 'Conflict', 'Duplicate entry exists', 409);
  }

  // Pass to global error handler
  next(err);
});

export default router;
