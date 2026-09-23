import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import googleFitService from '../../googleFitService.js';
import { requireAuth } from '../middleware/auth.js';
import { getJwtSecret } from '../config/jwt.js';

import mongoose from 'mongoose';
import GoogleFitToken from '../models/GoogleFitToken.js';

dotenv.config();

const router = express.Router();

/**
 * Server-Side User Google Token Store
 * Binds Google OAuth tokens strictly to authenticated HealthScan user IDs.
 * Persisted in MongoDB with AES-256-GCM encryption.
 */
export const userGoogleTokens = new Map();

export const setUserGoogleTokens = async (userId, tokens) => {
  if (!userId || !tokens) return;
  userGoogleTokens.set(userId, tokens); // in-memory fallback
  try {
    if (mongoose.connection.readyState === 1) {
      await GoogleFitToken.saveTokensForUser(userId, tokens);
    }
  } catch (err) {
    console.error('Failed to persist Google Fit tokens to MongoDB:', err.message);
  }
};

export const getUserGoogleTokens = async (userId) => {
  if (!userId) return null;

  let tokens = null;
  try {
    if (mongoose.connection.readyState === 1) {
      const doc = await GoogleFitToken.findOne({ userId });
      if (doc) {
        tokens = doc.getTokens();
      }
    }
  } catch (err) {
    console.error('Failed to read Google Fit tokens from MongoDB:', err.message);
  }

  // Fallback to in-memory store
  if (!tokens) {
    tokens = userGoogleTokens.get(userId) || null;
  }

  if (!tokens) return null;

  // Refresh expired access token with the refresh token if needed
  if (tokens.expiry_date && tokens.expiry_date <= Date.now() + 60000 && tokens.refresh_token) {
    try {
      const refreshed = await googleFitService.refreshAccessToken(tokens.refresh_token);
      tokens = {
        ...tokens,
        ...refreshed,
        refresh_token: refreshed.refresh_token || tokens.refresh_token
      };
      await setUserGoogleTokens(userId, tokens);
    } catch (refreshErr) {
      console.error('Failed to refresh Google Fit access token:', refreshErr.message);
    }
  }

  return tokens;
};

export const removeUserGoogleTokens = async (userId) => {
  if (!userId) return;
  userGoogleTokens.delete(userId);
  try {
    if (mongoose.connection.readyState === 1) {
      await GoogleFitToken.deleteOne({ userId });
    }
  } catch (err) {
    console.error('Failed to delete Google Fit tokens from MongoDB:', err.message);
  }
};

export const isGoogleFitConfigured = () => googleFitService.isConfigured();

// Generate mock fitness data for local demonstration only when ENABLE_DEMO_DATA=true
export const getMockFitnessData = () => {
  const now = new Date();
  const heartRate = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      timestamp: d.toISOString(),
      bpm: 72 + ((i * 3) % 10),
      source: 'Google Fit (Simulated)',
      simulated: true
    };
  });

  const steps = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().split('T')[0],
      steps: 7500 + ((i * 450) % 2000),
      source: 'Google Fit (Simulated)',
      simulated: true
    };
  });

  const calories = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().split('T')[0],
      calories: 2100 + ((i * 120) % 400),
      source: 'Google Fit (Simulated)',
      simulated: true
    };
  });

  const sleep = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().split('T')[0],
      durationHours: (7.0 + ((i * 0.3) % 1.5)).toFixed(1),
      sleepType: 'Deep/REM',
      source: 'Google Fit (Simulated)',
      simulated: true
    };
  });

  const totalSteps = steps.reduce((sum, s) => sum + s.steps, 0);
  const totalCalories = calories.reduce((sum, c) => sum + c.calories, 0);
  const avgHeartRate = Math.round(heartRate.reduce((sum, h) => sum + h.bpm, 0) / heartRate.length);
  const avgSleepHours = (sleep.reduce((sum, s) => sum + parseFloat(s.durationHours), 0) / sleep.length).toFixed(1);

  return {
    simulated: true,
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
      period: '7 days',
      simulated: true
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
router.get('/status', requireAuth, async (req, res) => {
  const configured = googleFitService.isConfigured();
  const userId = req.user.userId || req.user.uid;
  const tokens = (await getUserGoogleTokens(userId)) || req.session?.googleFitTokens;
  const connected = Boolean(configured && tokens);

  res.json({
    connected,
    configured
  });
});

/**
 * POST /api/google-fit/disconnect
 * Disconnect Google Fit and purge credentials for the authenticated user.
 */
router.post('/disconnect', requireAuth, async (req, res) => {
  const userId = req.user.userId || req.user.uid;
  await removeUserGoogleTokens(userId);

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
    const configured = googleFitService.isConfigured();
    if (!configured) {
      if (process.env.ENABLE_DEMO_DATA === 'true') {
        return res.json(getMockFitnessData());
      }
      return res.status(409).json({
        error: 'Google Fit not configured',
        configured: false,
        connected: false
      });
    }

    const userId = req.user.userId || req.user.uid;
    const tokens = (await getUserGoogleTokens(userId)) || req.session?.googleFitTokens;

    if (!tokens) {
      if (process.env.ENABLE_DEMO_DATA === 'true') {
        return res.json(getMockFitnessData());
      }
      return res.status(401).json({
        error: 'Google Fit not connected',
        configured: true,
        connected: false
      });
    }

    const data = await googleFitService.getAllFitnessData(tokens);
    return res.json(data);
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
    const { type } = req.params;
    const validTypes = ['heart-rate', 'steps', 'calories', 'sleep'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    const mapTypeToKey = {
      'heart-rate': 'heartRate',
      'steps': 'steps',
      'calories': 'calories',
      'sleep': 'sleep'
    };

    const configured = googleFitService.isConfigured();
    if (!configured) {
      if (process.env.ENABLE_DEMO_DATA === 'true') {
        const mockData = getMockFitnessData();
        return res.json(mockData[mapTypeToKey[type]]);
      }
      return res.status(409).json({
        error: 'Google Fit not configured',
        configured: false,
        connected: false
      });
    }

    const userId = req.user.userId || req.user.uid;
    const tokens = (await getUserGoogleTokens(userId)) || req.session?.googleFitTokens;

    if (!tokens) {
      if (process.env.ENABLE_DEMO_DATA === 'true') {
        const mockData = getMockFitnessData();
        return res.json(mockData[mapTypeToKey[type]]);
      }
      return res.status(401).json({
        error: 'Google Fit not connected',
        configured: true,
        connected: false
      });
    }

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
  } catch (error) {
    console.error(`Error fetching ${req.params.type} data:`, error);
    res.status(500).json({
      error: `Failed to fetch ${req.params.type} data`,
      message: error.message
    });
  }
});

export default router;
