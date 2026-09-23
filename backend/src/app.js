import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import crypto from 'crypto';
import labRoutes from './routes/labRoutes.js';
import featureRoutes from './routes/featureRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { apiLimiter, aiProxyLimiter, authLimiter } from './middleware/rateLimiter.js';
import { requireAuth, generateToken } from './middleware/auth.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import jwt from 'jsonwebtoken';
import googleFitRoutes, { setUserGoogleTokens } from './routes/googleFitRoutes.js';
import googleFitService from '../googleFitService.js';
import geminiProxyHandler from '../../api/gemini-proxy.js';
import { getJwtSecret } from './config/jwt.js';

dotenv.config();

const app = express();

// Trust proxy for accurate IP detection behind reverse proxies
app.set('trust proxy', 1);

/**
 * Security Headers Middleware
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Don't expose server info
  res.removeHeader('X-Powered-By');
  // Permissions Policy - Allow camera and microphone for HealthScan diagnostic tests
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  
  next();
};

/**
 * Request ID Middleware for tracing
 */
const requestIdMiddleware = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Get allowed CORS origins from environment
 */
const getAllowedOrigins = () => {
  const envOrigins = process.env.CORS_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  // Default development origins
  return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
};

// Apply security headers first
app.use(securityHeaders);

// Request ID for tracing
app.use(requestIdMiddleware);

// CORS with environment-based origins
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Requested-With', 'Accept']
}));

// Route-specific body parser with higher limit for image/AI payloads
app.use('/api/gemini-proxy', express.json({ limit: '8mb' }));

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session middleware for OAuth & fit data
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is required in production.');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.warn('SECURITY WARNING: SESSION_SECRET is not set. Using insecure development fallback secret. Set SESSION_SECRET in production.');
}

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'healthscan-session-dev-secret-do-not-use-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
};

if (process.env.MONGODB_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,
    autoRemove: 'native',
  });
}

app.use(session(sessionOptions));

// Apply global rate limiting
app.use(apiLimiter);

// Request logging with request ID
morgan.token('request-id', (req) => req.requestId || '-');
app.use(morgan(':method :url :status :response-time ms - :request-id'));

// Dedicated authentication routes (register, login, me)
app.use('/api/auth', authRoutes);

// Demo session token endpoint for development/demo testing
if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_AUTH === 'true') {
  app.post('/api/auth/demo-token', authLimiter, (req, res) => {
    const demoUser = {
      uid: 'demo-user-healthscan',
      name: 'Dr. Alex Mercer',
      email: 'alex.mercer@healthscan.io',
      role: 'user'
    };
    const token = generateToken(demoUser, '24h');
    res.json({ token, user: demoUser });
  });
}

// Health check endpoint (no rate limiting)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// Body temperature endpoint - returns 501 unless demo data mode is explicitly enabled
app.get('/api/body-temperature', (req, res) => {
  if (process.env.ENABLE_DEMO_DATA === 'true') {
    return res.json({
      temperature: 36.6,
      unit: 'celsius',
      timestamp: new Date().toISOString(),
      sensorId: 'IOT-TEMP-DEMO',
      status: 'simulated',
      simulated: true
    });
  }

  return res.status(501).json({
    error: 'Not Implemented',
    message: 'Body temperature sensor hardware integration not connected. A real IoT sensor source is required.',
    simulated: false,
    requestId: req.requestId
  });
});


app.post('/api/gemini-proxy', requireAuth, aiProxyLimiter, (req, res) => geminiProxyHandler(req, res));

// New Lab Routes
app.use('/api/labs', labRoutes);

// Feature Routes (symptoms, period, vaccinations, emergency, predictions, etc.)
app.use('/api/features', featureRoutes);

// Google Fit API routes
app.use('/api/google-fit', googleFitRoutes);

// Google OAuth callback endpoint with CSRF state verification
app.get('/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${baseUrl}/dashboard?error=no_code`);
  }

  if (!state) {
    return res.redirect(`${baseUrl}/dashboard?error=missing_state`);
  }

  let decodedState;
  try {
    const jwtSecret = getJwtSecret();
    decodedState = jwt.verify(state, jwtSecret);
  } catch (stateErr) {
    console.error('OAuth state verification failed:', stateErr.message);
    return res.redirect(`${baseUrl}/dashboard?error=invalid_state`);
  }

  try {
    const tokens = await googleFitService.getTokens(code);
    const userId = decodedState.userId;

    if (userId) {
      await setUserGoogleTokens(userId, tokens);
    }

    if (req.session) {
      req.session.googleFitTokens = tokens;
      req.session.googleFitConnected = true;
      req.session.googleFitUserId = userId;
    }

    // Clean redirect without exposing any tokens in URL parameters
    return res.redirect(`${baseUrl}/dashboard?google_fit=connected`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(`${baseUrl}/dashboard?error=auth_failed`);
  }
});

// 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    requestId: req.requestId
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error with request ID
  console.error(`[${req.requestId}] Error:`, err);

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'CORS policy does not allow this origin',
      requestId: req.requestId
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON in request body',
      requestId: req.requestId
    });
  }

  // Handle payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request body exceeds the allowed size limit (1MB)',
      requestId: req.requestId
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Error',
    message: message,
    requestId: req.requestId,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

export default app;
