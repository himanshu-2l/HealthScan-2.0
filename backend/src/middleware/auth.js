import jwt from 'jsonwebtoken';
import { getJwtSecret, JWT_SECRET } from '../config/jwt.js';

/**
 * Extract token from Authorization header
 * @param {import('express').Request} req 
 * @returns {string|null}
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  // Support "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

import { verifyToken } from '../utils/tokenVerifier.js';

export { verifyToken };

/**
 * Required authentication middleware
 * Returns 401 if no valid token is provided
 */
export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }
    
    const user = await verifyToken(token);
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication verification failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Continues without error if no token, but attaches user if valid token present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const user = await verifyToken(token);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Log error but continue without auth
    console.warn('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Role-based authorization middleware
 * Must be used after requireAuth
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'NO_USER'
      });
    }
    
    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this action',
        code: 'FORBIDDEN'
      });
    }
    
    next();
  };
};

/**
 * Verify that the authenticated user owns the requested resource
 * @param {string} paramName - The request parameter name containing the userId
 */
export const requireOwnership = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'NO_USER'
      });
    }
    
    const resourceUserId = req.params[paramName] || req.body[paramName];
    
    // Allow admins to access any resource
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Resource ${paramName} is required`,
        code: 'MISSING_RESOURCE_USER_ID'
      });
    }
    
    if (resourceUserId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own data',
        code: 'NOT_OWNER'
      });
    }
    
    next();
  };
};

/**
 * Generate JWT token for a user
 * @param {object} user - User object with id, email, name, role
 * @param {string} expiresIn - Token expiration time (default: 24h)
 * @returns {string}
 */
export const generateToken = (user, expiresIn = '24h') => {
  return jwt.sign(
    {
      userId: user._id || user.id || user.uid,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn }
  );
};

export default {
  requireAuth,
  optionalAuth,
  requireRole,
  requireOwnership,
  generateToken
};
