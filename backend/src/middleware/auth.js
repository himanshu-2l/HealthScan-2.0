import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required in production.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn('SECURITY WARNING: JWT_SECRET is not set. Using insecure development fallback secret. Set JWT_SECRET in production.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'healthscan-jwt-dev-secret-do-not-use-in-production';

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

/**
 * Verify Firebase ID token
 * Falls back to JWT verification if firebase-admin is not available
 * @param {string} token 
 * @returns {Promise<object|null>}
 */
const verifyToken = async (token) => {
  try {
    // Try to dynamically import firebase-admin if available
    let firebaseAdmin;
    try {
      firebaseAdmin = await import('firebase-admin');
      
      // Initialize Firebase Admin if not already initialized
      if (!firebaseAdmin.apps?.length) {
        // Check for service account credentials
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount)
          });
        } else if (process.env.FIREBASE_PROJECT_ID) {
          // Use application default credentials
          firebaseAdmin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID
          });
        }
      }
      
      // Verify Firebase token
      if (firebaseAdmin.apps?.length) {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        return {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
          provider: 'firebase'
        };
      }
    } catch (firebaseError) {
      // Firebase Admin not available or not configured, fall back to JWT
      console.log('Firebase Admin not available, using JWT verification');
    }
    
    // Fall back to JWT verification
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      uid: decoded.userId || decoded.uid || decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      provider: 'jwt'
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

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
    
    if (resourceUserId && resourceUserId !== req.user.uid) {
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
