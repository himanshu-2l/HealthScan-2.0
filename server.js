const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001; // Different port from your Vite dev server

app.use(express.json());

// CORS configuration
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Session middleware
if (isProduction && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET env var is required in production.');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.warn('SECURITY WARNING: SESSION_SECRET is not set. Using insecure development fallback secret. Set SESSION_SECRET in production.');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'healthscan-session-dev-secret-do-not-use-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Load Google Fit Service (may fail if env vars not set)
let googleFitService;
try {
  googleFitService = require('./backend/googleFitService.cjs');
} catch (error) {
  console.warn('Google Fit Service not available:', error.message);
  googleFitService = null;
}

// Body Temperature Endpoint - Simulates IoT sensor reading
// Returns fake temperature data that looks like real-time IoT sensor data
app.get('/api/body-temperature', (req, res) => {
  try {
    // Generate realistic body temperature (normal range: 36.1°C to 37.2°C / 97.0°F to 99.0°F)
    // Add slight variation to simulate real sensor readings
    const baseTemp = 36.5; // Base temperature in Celsius
    const variation = (Math.random() - 0.5) * 0.8; // Random variation between -0.4 and +0.4
    const timeVariation = Math.sin(Date.now() / 60000) * 0.3; // Slow sine wave for natural variation
    const temperatureCelsius = baseTemp + variation + timeVariation;
    
    // Ensure temperature stays within normal human range
    const normalizedTemp = Math.max(36.0, Math.min(37.5, temperatureCelsius));
    
    const timestamp = new Date().toISOString();
    
    res.json({
      temperature: parseFloat(normalizedTemp.toFixed(2)),
      unit: 'celsius',
      timestamp: timestamp,
      sensorId: 'IOT-TEMP-001',
      status: 'active'
    });
  } catch (error) {
    console.error('Error generating temperature data:', error);
    res.status(500).json({ error: 'Failed to generate temperature data' });
  }
});

// === Google Fit Routes ===

// Initiate Google OAuth flow
app.get('/api/google-fit/auth', (req, res) => {
  try {
    // Check if Google Fit service is available
    if (!googleFitService) {
      return res.status(500).json({ 
        error: 'Google OAuth credentials not configured',
        message: 'Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your .env file'
      });
    }

    // Check if environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      return res.status(500).json({ 
        error: 'Google OAuth credentials not configured',
        message: 'Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your .env file'
      });
    }

    const authUrl = googleFitService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Google auth URL error:', error);
    res.status(500).json({ 
      error: 'Failed to generate auth URL',
      message: error.message || 'Unknown error occurred'
    });
  }
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    if (!googleFitService) {
      return res.redirect(`${frontendUrl}?error=service_not_configured`);
    }

    const { code } = req.query;

    if (!code) {
      return res.redirect(`${frontendUrl}?error=no_code`);
    }

    const tokens = await googleFitService.getTokens(code);
    
    // Store tokens in session
    req.session.googleFitTokens = tokens;
    req.session.googleFitConnected = true;

    // Redirect back to frontend
    res.redirect(`${frontendUrl}/?google_fit=connected`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${frontendUrl}?error=auth_failed`);
  }
});

// Check Google Fit connection status
app.get('/api/google-fit/status', (req, res) => {
  res.json({
    connected: !!req.session.googleFitConnected,
  });
});

// Disconnect Google Fit
app.post('/api/google-fit/disconnect', (req, res) => {
  req.session.googleFitTokens = null;
  req.session.googleFitConnected = false;
  res.json({ success: true, message: 'Google Fit disconnected' });
});

// Fetch all fitness data
app.get('/api/google-fit/data', async (req, res) => {
  try {
    if (!googleFitService) {
      return res.status(500).json({ 
        error: 'Google Fit service not configured',
        message: 'Please set Google OAuth credentials in your .env file'
      });
    }

    if (!req.session.googleFitConnected || !req.session.googleFitTokens) {
      return res.status(401).json({ error: 'Google Fit not connected' });
    }

    googleFitService.setCredentials(req.session.googleFitTokens);
    const data = await googleFitService.getAllFitnessData();
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching fitness data:', error);
    res.status(500).json({ error: 'Failed to fetch fitness data', message: error.message });
  }
});

// Fetch specific fitness data type
app.get('/api/google-fit/data/:type', async (req, res) => {
  try {
    if (!googleFitService) {
      return res.status(500).json({ 
        error: 'Google Fit service not configured',
        message: 'Please set Google OAuth credentials in your .env file'
      });
    }

    if (!req.session.googleFitConnected || !req.session.googleFitTokens) {
      return res.status(401).json({ error: 'Google Fit not connected' });
    }

    googleFitService.setCredentials(req.session.googleFitTokens);
    
    const { type } = req.params;
    let data;

    switch (type) {
      case 'heart-rate':
        data = await googleFitService.getHeartRateData();
        break;
      case 'steps':
        data = await googleFitService.getStepsData();
        break;
      case 'calories':
        data = await googleFitService.getCaloriesData();
        break;
      case 'sleep':
        data = await googleFitService.getSleepData();
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} data:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.type} data`, message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
