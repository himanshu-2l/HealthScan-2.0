import express from 'express';
import Assessment from '../models/Assessment.js';
import GaitAnalysisAssessment from '../models/GaitAnalysisAssessment.js';
import TremorAssessment from '../models/TremorAssessment.js';
import HyperventilationAssessment from '../models/HyperventilationAssessment.js';
import { optionalAuth, requireOwnership } from '../middleware/auth.js';
import {
  validateGaitAssessment,
  validateTremorAssessment,
  validateHyperventilationAssessment,
  validateGenericAssessment,
  validateUserId,
  validatePagination
} from '../middleware/validate.js';
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
 * For optional auth: if user is authenticated, verify ownership
 */
const verifyUserAccess = (req, userId) => {
  // If user is authenticated, verify they're accessing their own data
  if (req.user && req.user.uid !== userId) {
    // Allow admins to access any data
    if (req.user.role !== 'admin') {
      return false;
    }
  }
  return true;
};

// ===========================================
// GAIT ANALYSIS ROUTES
// ===========================================

/**
 * Save Gait Assessment
 * POST /api/labs/gait/save
 */
router.post('/gait/save',
  optionalAuth,
  assessmentLimiter,
  validateGaitAssessment,
  asyncHandler(async (req, res) => {
    const { userId, metrics, data } = req.body;

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save assessments for yourself', 403);
    }

    const assessment = new GaitAnalysisAssessment({
      userId,
      metrics,
      data,
      status: 'COMPLETED'
    });

    await assessment.save();
    
    return successResponse(res, assessment, 201, {
      message: 'Gait assessment saved successfully'
    });
  })
);

/**
 * Get Gait Assessment History
 * GET /api/labs/gait/history/:userId
 */
router.get('/gait/history/:userId',
  optionalAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.pagination || {};

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own assessments', 403);
    }

    const [history, total] = await Promise.all([
      GaitAnalysisAssessment.find({ userId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      GaitAnalysisAssessment.countDocuments({ userId })
    ]);

    return successResponse(res, history, 200, {
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + history.length < total
      }
    });
  })
);

// ===========================================
// TREMOR ASSESSMENT ROUTES
// ===========================================

/**
 * Save Tremor Assessment
 * POST /api/labs/tremor/save
 */
router.post('/tremor/save',
  optionalAuth,
  assessmentLimiter,
  validateTremorAssessment,
  asyncHandler(async (req, res) => {
    const { userId, metrics, data } = req.body;

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save assessments for yourself', 403);
    }

    const assessment = new TremorAssessment({
      userId,
      metrics,
      data,
      status: 'COMPLETED'
    });

    await assessment.save();
    
    return successResponse(res, assessment, 201, {
      message: 'Tremor assessment saved successfully'
    });
  })
);

/**
 * Get Tremor Assessment History
 * GET /api/labs/tremor/history/:userId
 */
router.get('/tremor/history/:userId',
  optionalAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.pagination || {};

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own assessments', 403);
    }

    const [history, total] = await Promise.all([
      TremorAssessment.find({ userId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      TremorAssessment.countDocuments({ userId })
    ]);

    return successResponse(res, history, 200, {
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + history.length < total
      }
    });
  })
);

// ===========================================
// HYPERVENTILATION ASSESSMENT ROUTES
// ===========================================

/**
 * Save Hyperventilation Assessment
 * POST /api/labs/hyperventilation/save
 */
router.post('/hyperventilation/save',
  optionalAuth,
  assessmentLimiter,
  validateHyperventilationAssessment,
  asyncHandler(async (req, res) => {
    const { userId, metrics, data } = req.body;

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save assessments for yourself', 403);
    }

    const assessment = new HyperventilationAssessment({
      userId,
      metrics,
      data,
      status: 'COMPLETED'
    });

    await assessment.save();
    
    return successResponse(res, assessment, 201, {
      message: 'Hyperventilation assessment saved successfully'
    });
  })
);

/**
 * Get Hyperventilation Assessment History
 * GET /api/labs/hyperventilation/history/:userId
 */
router.get('/hyperventilation/history/:userId',
  optionalAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.pagination || {};

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own assessments', 403);
    }

    const [history, total] = await Promise.all([
      HyperventilationAssessment.find({ userId })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      HyperventilationAssessment.countDocuments({ userId })
    ]);

    return successResponse(res, history, 200, {
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + history.length < total
      }
    });
  })
);

// ===========================================
// GENERIC ASSESSMENT ROUTES
// ===========================================

/**
 * Save Generic Assessment
 * POST /api/labs/assessment/save
 */
router.post('/assessment/save',
  optionalAuth,
  assessmentLimiter,
  validateGenericAssessment,
  asyncHandler(async (req, res) => {
    const { userId, type, metrics, data } = req.body;

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only save assessments for yourself', 403);
    }

    const assessment = new Assessment({
      userId,
      type,
      metrics,
      data,
      status: 'COMPLETED'
    });

    await assessment.save();
    
    return successResponse(res, assessment, 201, {
      message: 'Assessment saved successfully'
    });
  })
);

/**
 * Get Assessment History (all types)
 * GET /api/labs/history/:userId
 */
router.get('/history/:userId',
  optionalAuth,
  validateUserId,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.pagination || {};
    const { type } = req.query;

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own assessments', 403);
    }

    // Build query
    const query = { userId };
    if (type) {
      query.type = type;
    }

    const [history, total] = await Promise.all([
      Assessment.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Assessment.countDocuments(query)
    ]);

    return successResponse(res, history, 200, {
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + history.length < total
      }
    });
  })
);

/**
 * Get Single Assessment by ID
 * GET /api/labs/assessment/:id
 */
router.get('/assessment/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Bad Request', 'Invalid assessment ID format', 400);
    }

    const assessment = await Assessment.findById(id).lean();

    if (!assessment) {
      return errorResponse(res, 'Not Found', 'Assessment not found', 404);
    }

    // Verify user access
    if (!verifyUserAccess(req, assessment.userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own assessments', 403);
    }

    return successResponse(res, assessment);
  })
);

/**
 * Delete Assessment
 * DELETE /api/labs/assessment/:id
 */
router.delete('/assessment/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Bad Request', 'Invalid assessment ID format', 400);
    }

    const assessment = await Assessment.findById(id);

    if (!assessment) {
      return errorResponse(res, 'Not Found', 'Assessment not found', 404);
    }

    // Verify user access
    if (!verifyUserAccess(req, assessment.userId)) {
      return errorResponse(res, 'Forbidden', 'You can only delete your own assessments', 403);
    }

    await assessment.deleteOne();

    return successResponse(res, { id }, 200, {
      message: 'Assessment deleted successfully'
    });
  })
);

/**
 * Get Assessment Statistics
 * GET /api/labs/stats/:userId
 */
router.get('/stats/:userId',
  optionalAuth,
  validateUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Verify user access
    if (!verifyUserAccess(req, userId)) {
      return errorResponse(res, 'Forbidden', 'You can only access your own statistics', 403);
    }

    const stats = await Assessment.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          lastAssessment: { $max: '$timestamp' }
        }
      }
    ]);

    const totalAssessments = stats.reduce((acc, stat) => acc + stat.count, 0);

    return successResponse(res, {
      totalAssessments,
      byType: stats.map(s => ({
        type: s._id,
        count: s.count,
        lastAssessment: s.lastAssessment
      }))
    });
  })
);

// Error handling for this router
router.use((err, req, res, next) => {
  console.error(`[Labs Route Error] ${req.method} ${req.path}:`, err);
  
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
