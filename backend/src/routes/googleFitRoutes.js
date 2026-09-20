import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Helper to check if real Google Fit credentials are configured
export const isGoogleFitConfigured = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(
    clientId &&
    clientSecret &&
    clientId !== 'your_google_client_id' &&
    !clientId.startsWith('your_')
  );
};

let googleFitService = null;
if (isGoogleFitConfigured()) {
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    googleFitService = require('../../googleFitService.cjs');
  } catch (err) {
    console.warn('Google Fit Service initialization warning:', err.message);
  }
}

// Generate realistic mock fitness data for demonstration when offline/unconnected
const getMockFitnessData = () => {
  const now = new Date();
  const heartRate = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      timestamp: d.toISOString(),
      bpm: Math.floor(65 + Math.random() * 20),
      source: 'Google Fit (Simulated)'
    };
  });

  const steps = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().split('T')[0],
      steps: Math.floor(6000 + Math.random() * 4500),
      source: 'Google Fit (Simulated)'
    };
  });

  const calories = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().split('T')[0],
      calories: Math.floor(1800 + Math.random() * 600),
      source: 'Google Fit (Simulated)'
    };
  });

  const sleep = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().split('T')[0],
      durationHours: (6.5 + Math.random() * 1.8).toFixed(1),
      sleepType: 'Deep/REM',
      source: 'Google Fit (Simulated)'
    };
  });

  const totalSteps = steps.reduce((sum, s) => sum + s.steps, 0);
  const totalCalories = calories.reduce((sum, c) => sum + c.calories, 0);
  const avgHeartRate = Math.round(heartRate.reduce((sum, h) => sum + h.bpm, 0) / heartRate.length);
  const avgSleepHours = (sleep.reduce((sum, s) => sum + parseFloat(s.durationHours), 0) / sleep.length).toFixed(1);

  return {
    heartRate,
    steps,
    calories,
    sleep,
    summary: {
      avgHeartRate,
      totalSteps,
      avgSteps: Math.round(totalSteps / 7),
      totalCalories,
      avgCalories: Math.round(totalCalories / 7),
      avgSleepHours,
      period: '7 days'
    }
  };
};

/**
 * GET /api/google-fit/auth
 * Initiate Google Fit OAuth flow
 */
router.get('/auth', (req, res) => {
  try {
    if (!isGoogleFitConfigured()) {
      return res.status(200).json({
        configured: false,
        error: 'Google OAuth credentials not configured',
        message: 'Google Fit integration requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.'
      });
    }

    if (!googleFitService) {
      return res.status(200).json({
        configured: false,
        error: 'Google Fit service not ready',
        message: 'Could not initialize Google Fit service.'
      });
    }

    const authUrl = googleFitService.getAuthUrl();
    res.json({ configured: true, authUrl });
  } catch (error) {
    console.error('Google Fit auth URL error:', error);
    res.status(500).json({
      error: 'Failed to generate auth URL',
      message: error.message || 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/google-fit/status
 * Check Google Fit connection status
 */
router.get('/status', (req, res) => {
  const configured = isGoogleFitConfigured();
  const token = req.headers.authorization?.replace('Bearer ', '');
  const connected = Boolean(req.session?.googleFitConnected || token);

  res.json({
    connected,
    configured
  });
});

/**
 * POST /api/google-fit/disconnect
 * Disconnect Google Fit
 */
router.post('/disconnect', (req, res) => {
  if (req.session) {
    req.session.googleFitTokens = null;
    req.session.googleFitConnected = false;
  }
  res.json({ success: true, message: 'Google Fit disconnected' });
});

/**
 * GET /api/google-fit/data
 * Get all fitness data
 */
router.get('/data', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let tokens = req.session?.googleFitTokens;

    if (!tokens && authHeader?.startsWith('Bearer ')) {
      try {
        const rawToken = authHeader.replace('Bearer ', '');
        tokens = JSON.parse(Buffer.from(rawToken, 'base64').toString());
      } catch (e) {
        // Not a base64 JSON token
      }
    }

    if (!tokens && !req.session?.googleFitConnected) {
      return res.status(401).json({ error: 'Google Fit not connected' });
    }

    if (googleFitService && tokens) {
      googleFitService.setCredentials(tokens);
      const data = await googleFitService.getAllFitnessData();
      return res.json(data);
    }

    // Return mock data for dev mode if connected in session
    return res.json(getMockFitnessData());
  } catch (error) {
    console.error('Error fetching Google Fit data:', error);
    res.status(500).json({
      error: 'Failed to fetch fitness data',
      message: error.message
    });
  }
});

/**
 * GET /api/google-fit/data/:type
 * Get specific fitness data type
 */
router.get('/data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const mockData = getMockFitnessData();

    switch (type) {
      case 'heart-rate':
        return res.json(mockData.heartRate);
      case 'steps':
        return res.json(mockData.steps);
      case 'calories':
        return res.json(mockData.calories);
      case 'sleep':
        return res.json(mockData.sleep);
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }
  } catch (error) {
    console.error(`Error fetching ${req.params.type} data:`, error);
    res.status(500).json({
      error: `Failed to fetch ${req.params.type} data`,
      message: error.message
    });
  }
});

/**
 * GET /api/google-fit/heart-rate
 * Real-time heart rate endpoint
 */
router.get('/heart-rate', async (req, res) => {
  try {
    const mock = getMockFitnessData();
    res.json(mock.heartRate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heart rate data' });
  }
});

export default router;
