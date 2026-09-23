/**
 * Validation middleware for lab routes
 * Provides manual validation without external dependencies
 */

/**
 * Standard error response format
 * @param {import('express').Response} res 
 * @param {string[]} errors 
 * @param {number} statusCode 
 */
const sendValidationError = (res, errors, statusCode = 400) => {
  return res.status(statusCode).json({
    error: 'Validation Failed',
    message: 'Request data validation failed',
    details: errors,
    code: 'VALIDATION_ERROR'
  });
};

/**
 * Check if value is a non-empty string
 * @param {any} value 
 * @returns {boolean}
 */
const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Check if value is a valid object (not null/array)
 * @param {any} value 
 * @returns {boolean}
 */
const isValidObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Check if value is a number
 * @param {any} value 
 * @returns {boolean}
 */
const isNumber = (value) => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Validate Gait Assessment
 */
export const validateGaitAssessment = (req, res, next) => {
  const { userId, metrics, data } = req.body;
  const errors = [];

  // Validate userId
  if (!userId) {
    errors.push('userId is required');
  } else if (!isNonEmptyString(userId)) {
    errors.push('userId must be a non-empty string');
  }

  // Validate metrics
  if (!metrics) {
    errors.push('metrics object is required');
  } else if (!isValidObject(metrics)) {
    errors.push('metrics must be a valid object');
  } else {
    // Validate specific metric fields if present
    if (metrics.stability) {
      if (!isValidObject(metrics.stability)) {
        errors.push('metrics.stability must be an object');
      } else {
        if (metrics.stability.score !== undefined && !isNumber(metrics.stability.score)) {
          errors.push('metrics.stability.score must be a number');
        }
      }
    }
    if (metrics.balance) {
      if (!isValidObject(metrics.balance)) {
        errors.push('metrics.balance must be an object');
      }
    }
    if (metrics.gait) {
      if (!isValidObject(metrics.gait)) {
        errors.push('metrics.gait must be an object');
      }
    }
  }

  // Validate data (optional but if present must be object)
  if (data !== undefined && !isValidObject(data)) {
    errors.push('data must be a valid object if provided');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validate Tremor Assessment
 */
export const validateTremorAssessment = (req, res, next) => {
  const { userId, metrics, data } = req.body;
  const errors = [];

  // Validate userId
  if (!userId) {
    errors.push('userId is required');
  } else if (!isNonEmptyString(userId)) {
    errors.push('userId must be a non-empty string');
  }

  // Validate metrics
  if (!metrics) {
    errors.push('metrics object is required');
  } else if (!isValidObject(metrics)) {
    errors.push('metrics must be a valid object');
  } else {
    // Validate specific tremor fields
    if (metrics.tremor_frequency !== undefined && !isNumber(metrics.tremor_frequency)) {
      errors.push('metrics.tremor_frequency must be a number');
    }
    if (metrics.tremor_amplitude !== undefined && !isNumber(metrics.tremor_amplitude)) {
      errors.push('metrics.tremor_amplitude must be a number');
    }
    if (metrics.severity !== undefined && !isNonEmptyString(metrics.severity)) {
      errors.push('metrics.severity must be a string');
    }
  }

  // Validate data (optional but if present must be object)
  if (data !== undefined && !isValidObject(data)) {
    errors.push('data must be a valid object if provided');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validate Hyperventilation Assessment
 */
export const validateHyperventilationAssessment = (req, res, next) => {
  const { userId, metrics, data } = req.body;
  const errors = [];

  // Validate userId
  if (!userId) {
    errors.push('userId is required');
  } else if (!isNonEmptyString(userId)) {
    errors.push('userId must be a non-empty string');
  }

  // Validate metrics
  if (!metrics) {
    errors.push('metrics object is required');
  } else if (!isValidObject(metrics)) {
    errors.push('metrics must be a valid object');
  } else {
    // Validate specific hyperventilation fields
    if (metrics.duration !== undefined && !isNumber(metrics.duration)) {
      errors.push('metrics.duration must be a number');
    }
    if (metrics.respiratoryRate !== undefined && !isNumber(metrics.respiratoryRate)) {
      errors.push('metrics.respiratoryRate must be a number');
    }
    if (metrics.symptomScore !== undefined && !isNumber(metrics.symptomScore)) {
      errors.push('metrics.symptomScore must be a number');
    }
    if (metrics.observedSymptoms !== undefined && !Array.isArray(metrics.observedSymptoms)) {
      errors.push('metrics.observedSymptoms must be an array');
    }
  }

  // Validate data (optional but if present must be object)
  if (data !== undefined && !isValidObject(data)) {
    errors.push('data must be a valid object if provided');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validate Generic Assessment
 */
export const validateGenericAssessment = (req, res, next) => {
  const { userId, type, metrics, data } = req.body;
  const errors = [];

  // Validate userId
  if (!userId) {
    errors.push('userId is required');
  } else if (!isNonEmptyString(userId)) {
    errors.push('userId must be a non-empty string');
  }

  // Validate type
  const validTypes = [
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
    'CARDIOVASCULAR_ASSESSMENT',
    'MENTAL_HEALTH_SCREENING'
  ];

  if (!type) {
    errors.push('type is required');
  } else if (!isNonEmptyString(type)) {
    errors.push('type must be a non-empty string');
  } else if (!validTypes.includes(type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }

  // Validate metrics
  if (!metrics) {
    errors.push('metrics object is required');
  } else if (!isValidObject(metrics)) {
    errors.push('metrics must be a valid object');
  }

  // Validate data
  if (!data) {
    errors.push('data object is required');
  } else if (!isValidObject(data)) {
    errors.push('data must be a valid object');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validate userId parameter
 */
export const validateUserId = (req, res, next) => {
  const { userId } = req.params;
  const errors = [];

  if (!userId) {
    errors.push('userId parameter is required');
  } else if (!isNonEmptyString(userId)) {
    errors.push('userId must be a non-empty string');
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validate pagination query parameters
 */
export const validatePagination = (req, res, next) => {
  const { limit, offset, page } = req.query;
  const errors = [];

  // Parse and validate limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('limit cannot exceed 100');
    } else {
      req.pagination = req.pagination || {};
      req.pagination.limit = limitNum;
    }
  } else {
    req.pagination = req.pagination || {};
    req.pagination.limit = 20; // Default limit
  }

  // Parse and validate offset
  if (offset !== undefined) {
    const offsetNum = parseInt(offset, 10);
    if (isNaN(offsetNum) || offsetNum < 0) {
      errors.push('offset must be a non-negative integer');
    } else {
      req.pagination = req.pagination || {};
      req.pagination.offset = offsetNum;
    }
  } else {
    req.pagination = req.pagination || {};
    req.pagination.offset = 0; // Default offset
  }

  // Parse and validate page (alternative to offset)
  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('page must be a positive integer');
    } else {
      req.pagination = req.pagination || {};
      req.pagination.page = pageNum;
      req.pagination.offset = (pageNum - 1) * (req.pagination.limit || 20);
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Sanitize request body - remove potentially dangerous fields
 */
export const sanitizeBody = (allowedFields) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const sanitized = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          sanitized[field] = req.body[field];
        }
      }
      req.body = sanitized;
    }
    next();
  };
};

/**
 * Validate Cardiovascular Assessment
 */
export const validateCardiovascularAssessment = (req, res, next) => {
  const { userId, metrics, data } = req.body;
  const errors = [];

  if (!userId) {
    errors.push('userId is required');
  } else if (!isNonEmptyString(userId)) {
    errors.push('userId must be a non-empty string');
  }

  if (!metrics || !isValidObject(metrics)) {
    errors.push('metrics must be a valid object');
  } else {
    // heartRate validation
    const hr = metrics.heartRate?.value !== undefined ? metrics.heartRate.value : metrics.heartRate;
    if (hr === undefined || hr === null) {
      errors.push('metrics.heartRate is required');
    } else if (!isNumber(hr) || hr < 30 || hr > 220) {
      errors.push('metrics.heartRate must be a physiologically plausible number between 30 and 220 BPM');
    }

    // SpO2 validation if present
    const spo2 = metrics.spo2?.value !== undefined ? metrics.spo2.value : metrics.spo2;
    if (spo2 !== undefined && spo2 !== null) {
      if (!isNumber(spo2) || spo2 < 50 || spo2 > 100) {
        errors.push('metrics.spo2 must be a percentage between 50 and 100%');
      }
    }
  }

  // Sensor contact integrity validation
  if (data && isValidObject(data)) {
    if (data.fingerDetected === false && (!data.mode || data.mode === 'fingertip')) {
      errors.push('Sensor contact validation failed: fingertip was not detected on camera lens');
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

export default {
  validateGaitAssessment,
  validateTremorAssessment,
  validateHyperventilationAssessment,
  validateCardiovascularAssessment,
  validateGenericAssessment,
  validateUserId,
  validatePagination,
  sanitizeBody
};
