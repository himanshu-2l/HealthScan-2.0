import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import labRoutes from './routes/labRoutes.js';
import featureRoutes from './routes/featureRoutes.js';
import { apiLimiter, reportLimiter } from './middleware/rateLimiter.js';
import session from 'express-session';
import googleFitRoutes from './routes/googleFitRoutes.js';
import geminiProxyHandler from '../../api/gemini-proxy.js';

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

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session middleware for OAuth & fit data
app.use(session({
  secret: process.env.SESSION_SECRET || 'healthscan-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Apply global rate limiting
app.use(apiLimiter);

// Request logging with request ID
morgan.token('request-id', (req) => req.requestId || '-');
app.use(morgan(':method :url :status :response-time ms - :request-id'));

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Health check endpoint (no rate limiting)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// Existing endpoints ported to new structure
app.get('/api/body-temperature', (req, res) => {
  try {
    const baseTemp = 36.5;
    const variation = (Math.random() - 0.5) * 0.8;
    const temperatureCelsius = baseTemp + variation;
    res.json({
      temperature: parseFloat(temperatureCelsius.toFixed(2)),
      unit: 'celsius',
      timestamp: new Date().toISOString(),
      sensorId: 'IOT-TEMP-001',
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate temperature data',
      requestId: req.requestId
    });
  }
});

app.post('/api/gemini-proxy', (req, res) => geminiProxyHandler(req, res));

app.post('/api/generate-report', reportLimiter, async (req, res) => {
  try {
    const { metrics, note } = req.body;
    
    if (!metrics) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Metrics data is required',
        requestId: req.requestId
      });
    }

    if (!genAI) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Gemini API key is not configured',
        requestId: req.requestId
      });
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a clinical report for: ${JSON.stringify(metrics)}. Note: ${note}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ report: response.text() });
  } catch (error) {
    console.error(`[${req.requestId}] Report generation error:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate report',
      requestId: req.requestId
    });
  }
});

// New Lab Routes
app.use('/api/labs', labRoutes);

// Feature Routes (symptoms, period, vaccinations, emergency, predictions, etc.)
app.use('/api/features', featureRoutes);

// Google Fit API routes
app.use('/api/google-fit', googleFitRoutes);

// Google OAuth callback endpoint
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const referer = req.get('referer') || '';
  const frontendPort = referer.includes('5173') ? '5173' : '5174';
  const baseUrl = `http://localhost:${frontendPort}`;

  if (!code) {
    return res.redirect(`${baseUrl}/dashboard?error=no_code`);
  }

  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const fitService = require('../../googleFitService.cjs');
    const tokens = await fitService.getTokens(code);
    req.session.googleFitTokens = tokens;
    req.session.googleFitConnected = true;
    const tokenString = Buffer.from(JSON.stringify(tokens)).toString('base64');
    return res.redirect(`${baseUrl}/dashboard?google_fit=connected&token=${encodeURIComponent(tokenString)}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(`${baseUrl}/dashboard?error=auth_failed&message=${encodeURIComponent(error.message || 'OAuth failed')}`);
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
