import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Google Fit Service
 *
 * Security Architecture:
 * - Stateless request-isolated OAuth2 clients (no shared mutable credentials).
 * - Per-request authentication passing user tokens explicitly.
 * - State parameter support for OAuth CSRF protection.
 */
class GoogleFitService {
  constructor() {
    this.fitness = google.fitness('v1');
  }

  /**
   * Check if real Google Fit credentials are configured in environment
   */
  isConfigured() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    return Boolean(
      clientId &&
      clientSecret &&
      redirectUri &&
      clientId !== 'your_google_client_id' &&
      !clientId.startsWith('your_')
    );
  }

  /**
   * Create an isolated, ephemeral OAuth2 client instance for the given tokens.
   * Avoids storing mutable credentials on a shared singleton.
   */
  createClient(tokens = null) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!redirectUri) {
      throw new Error('GOOGLE_REDIRECT_URI environment variable is required');
    }

    if (!this.isConfigured()) {
      throw new Error('Google OAuth credentials not configured on server.');
    }

    const client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    if (tokens) {
      client.setCredentials(tokens);
    }

    return client;
  }

  /**
   * Generate OAuth URL with mandatory CSRF state parameter
   */
  getAuthUrl(state) {
    const client = this.createClient();

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.sleep.read',
        'https://www.googleapis.com/auth/fitness.body.read',
      ],
      state,
    });
  }

  /**
   * Exchange authorization code for tokens using an ephemeral client
   */
  async getTokens(code) {
    const client = this.createClient();
    const { tokens } = await client.getToken(code);
    return tokens;
  }

  /**
   * Refresh expired access token with the refresh token
   */
  async refreshAccessToken(refreshToken) {
    const client = this.createClient();
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();
    return credentials;
  }

  /**
   * Fetch heart rate data (last 7 days) using user-specific tokens
   */
  async getHeartRateData(tokens) {
    const auth = this.createClient(tokens);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await this.fitness.users.dataset.aggregate({
      userId: 'me',
      auth,
      requestBody: {
        aggregateBy: [{
          dataTypeName: 'com.google.heart_rate.bpm',
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day
        startTimeMillis: sevenDaysAgo,
        endTimeMillis: now,
      },
    });

    return this.parseHeartRateData(response.data);
  }

  /**
   * Fetch steps data (last 7 days) using user-specific tokens
   */
  async getStepsData(tokens) {
    const auth = this.createClient(tokens);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await this.fitness.users.dataset.aggregate({
      userId: 'me',
      auth,
      requestBody: {
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: sevenDaysAgo,
        endTimeMillis: now,
      },
    });

    return this.parseStepsData(response.data);
  }

  /**
   * Fetch calories data (last 7 days) using user-specific tokens
   */
  async getCaloriesData(tokens) {
    const auth = this.createClient(tokens);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await this.fitness.users.dataset.aggregate({
      userId: 'me',
      auth,
      requestBody: {
        aggregateBy: [{
          dataTypeName: 'com.google.calories.expended',
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: sevenDaysAgo,
        endTimeMillis: now,
      },
    });

    return this.parseCaloriesData(response.data);
  }

  /**
   * Fetch sleep data (last 7 days) using user-specific tokens
   */
  async getSleepData(tokens) {
    const auth = this.createClient(tokens);
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await this.fitness.users.dataset.aggregate({
      userId: 'me',
      auth,
      requestBody: {
        aggregateBy: [{
          dataTypeName: 'com.google.sleep.segment',
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: sevenDaysAgo,
        endTimeMillis: now,
      },
    });

    return this.parseSleepData(response.data);
  }

  /**
   * Fetch all fitness data using user-specific tokens
   */
  async getAllFitnessData(tokens) {
    const [heartRate, steps, calories, sleep] = await Promise.all([
      this.getHeartRateData(tokens),
      this.getStepsData(tokens),
      this.getCaloriesData(tokens),
      this.getSleepData(tokens),
    ]);

    return {
      heartRate,
      steps,
      calories,
      sleep,
      summary: this.generateSummary(heartRate, steps, calories, sleep),
    };
  }

  parseHeartRateData(data) {
    const heartRateData = [];
    data.bucket?.forEach(bucket => {
      bucket.dataset?.[0]?.point?.forEach(point => {
        heartRateData.push({
          timestamp: new Date(parseInt(point.startTimeNanos) / 1000000),
          bpm: point.value?.[0]?.fpVal || 0,
          source: point.originDataSourceId || 'Unknown',
        });
      });
    });
    return heartRateData;
  }

  parseStepsData(data) {
    const stepsData = [];
    data.bucket?.forEach(bucket => {
      let totalSteps = 0;
      bucket.dataset?.[0]?.point?.forEach(point => {
        totalSteps += point.value?.[0]?.intVal || 0;
      });
      if (totalSteps > 0) {
        stepsData.push({
          date: new Date(parseInt(bucket.startTimeMillis)),
          steps: totalSteps,
          source: 'Google Fit',
        });
      }
    });
    return stepsData;
  }

  parseCaloriesData(data) {
    const caloriesData = [];
    data.bucket?.forEach(bucket => {
      let totalCalories = 0;
      bucket.dataset?.[0]?.point?.forEach(point => {
        totalCalories += point.value?.[0]?.fpVal || 0;
      });
      if (totalCalories > 0) {
        caloriesData.push({
          date: new Date(parseInt(bucket.startTimeMillis)),
          calories: Math.round(totalCalories),
          source: 'Google Fit',
        });
      }
    });
    return caloriesData;
  }

  parseSleepData(data) {
    const sleepData = [];
    data.bucket?.forEach(bucket => {
      bucket.dataset?.[0]?.point?.forEach(point => {
        const startTime = parseInt(point.startTimeNanos) / 1000000;
        const endTime = parseInt(point.endTimeNanos) / 1000000;
        const durationHours = ((endTime - startTime) / (1000 * 60 * 60)).toFixed(1);

        sleepData.push({
          date: new Date(startTime),
          durationHours,
          sleepType: this.getSleepType(point.value?.[0]?.intVal),
          source: 'Google Fit',
        });
      });
    });
    return sleepData;
  }

  getSleepType(value) {
    const types = {
      1: 'Awake',
      2: 'Sleep',
      3: 'Out of bed',
      4: 'Light sleep',
      5: 'Deep sleep',
      6: 'REM sleep',
    };
    return types[value] || 'Unknown';
  }

  generateSummary(heartRate, steps, calories, sleep) {
    const avgHeartRate = heartRate.length > 0
      ? Math.round(heartRate.reduce((sum, hr) => sum + hr.bpm, 0) / heartRate.length)
      : 0;

    const totalSteps = steps.reduce((sum, s) => sum + s.steps, 0);
    const avgSteps = steps.length > 0 ? Math.round(totalSteps / steps.length) : 0;

    const totalCalories = calories.reduce((sum, c) => sum + c.calories, 0);
    const avgCalories = calories.length > 0 ? Math.round(totalCalories / calories.length) : 0;

    const avgSleepHours = sleep.length > 0
      ? (sleep.reduce((sum, s) => sum + parseFloat(s.durationHours), 0) / sleep.length).toFixed(1)
      : '0.0';

    return {
      avgHeartRate,
      totalSteps,
      avgSteps,
      totalCalories,
      avgCalories,
      avgSleepHours,
      period: '7 days',
    };
  }
}

const googleFitService = new GoogleFitService();
export default googleFitService;
