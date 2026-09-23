import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import googleFitService from '../../googleFitService.js';
import { requireAuth } from '../middleware/auth.js';
import { getJwtSecret } from '../config/jwt.js';

dotenv.config();

const router = express.Router();

/**
 * Server-Side In-Memory User Google Token Store
 * Binds Google OAuth tokens strictly to authenticated HealthScan user IDs.
 * Tokens are never transmitted to client-side localStorage or URLs.
 */
export const userGoogleTokens = new Map();

export const setUserGoogleTokens = (userId, tokens) => {
  if (userId && tokens) {
    userGoogleTokens.set(userId, tokens);
  }
};

export const getUserGoogleTokens = (userId) => {
  return userId ? userGoogleTokens.get(userId) : null;
};

export const removeUserGoogleTokens = (userId) => {
  if (userId) {
    userGoogleTokens.delete(userId);
  }
};

export const isGoogleFitConfigured = () => googleFitService.isConfigured();

// Generate realistic mock fitness data for demonstration when offline/unconnected
export const getMockFitnessData = () => {
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
 * Initiate Google Fit OAuth flow with signed CSRF state parameter.
 * Requires HealthScan authentication.
 */
router.get('/auth', requireAuth, (req, res) => {
  try {
    if (!googleFitService.isConfigured()) {
      return res.status(200).json({
        configured: false,
        error: 'Google OAuth credentials not configured',
        message: 'Google Fit integration requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.'
      });
    }

    const userId = req.user.userId || req.user.uid;
    const jwtSecret = getJwtSecret();

    // Generate cryptographic CSRF state token bound to the authenticated user
    const state = jwt.sign(
      {
        userId,
        nonce: crypto.randomBytes(16).toString('hex')
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const authUrl = googleFitService.getAuthUrl(state);
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
 * Check Google Fit connection status for the authenticated user.
 */
router.get('/status', requireAuth, (req, res) => {
  const configured = googleFitService.isConfigured();
  const userId = req.user.userId || req.user.uid;
  const hasToken = userGoogleTokens.has(userId) || Boolean(req.session?.googleFitTokens);
  const connected = Boolean(req.session?.googleFitConnected || hasToken);

  res.json({
    connected,
    configured
  });
});

/**
 * POST /api/google-fit/disconnect
 * Disconnect Google Fit and purge credentials for the authenticated user.
 */
router.post('/disconnect', requireAuth, (req, res) => {
  const userId = req.user.userId || req.user.uid;
  removeUserGoogleTokens(userId);

  if (req.session) {
    req.session.googleFitTokens = null;
    req.session.googleFitConnected = false;
    req.session.googleFitUserId = null;
  }

  res.json({ success: true, message: 'Google Fit disconnected' });
});

/**
 * GET /api/google-fit/data
 * Get all fitness data for the authenticated user.
 * Access is strictly isolated to the caller's own credentials.
 */
router.get('/data', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.uid;
    const tokens = userGoogleTokens.get(userId) || req.session?.googleFitTokens;
    const isConnected = Boolean(req.session?.googleFitConnected || tokens);

    if (!isConnected) {
      return res.status(401).json({ error: 'Google Fit not connected' });
    }

    if (googleFitService.isConfigured() && tokens) {
      const data = await googleFitService.getAllFitnessData(tokens);
      return res.json(data);
    }

    // Return mock data for demo mode if connected in session
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
 * Get specific fitness data type for the authenticated user.
 * Access is strictly isolated to the caller's own credentials.
 */
router.get('/data/:type', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.uid;
    const tokens = userGoogleTokens.get(userId) || req.session?.googleFitTokens;
    const isConnected = Boolean(req.session?.googleFitConnected || tokens);

    if (!isConnected) {
      return res.status(401).json({ error: 'Google Fit not connected' });
    }

    const { type } = req.params;
    const validTypes = ['heart-rate', 'steps', 'calories', 'sleep'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    if (googleFitService.isConfigured() && tokens) {
      switch (type) {
        case 'heart-rate':
          return res.json(await googleFitService.getHeartRateData(tokens));
        case 'steps':
          return res.json(await googleFitService.getStepsData(tokens));
        case 'calories':
          return res.json(await googleFitService.getCaloriesData(tokens));
        case 'sleep':
          return res.json(await googleFitService.getSleepData(tokens));
      }
    }

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
    }
  } catch (error) {
    console.error(`Error fetching ${req.params.type} data:`, error);
    res.status(500).json({
      error: `Failed to fetch ${req.params.type} data`,
      message: error.message
    });
  }
});

export default router;
