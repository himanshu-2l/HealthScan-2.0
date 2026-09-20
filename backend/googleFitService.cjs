const { google } = require('googleapis');
require('dotenv').config();

class GoogleFitService {
  constructor() {
    // Validate environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      const missing = [];
      if (!clientId) missing.push('GOOGLE_CLIENT_ID');
      if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
      if (!redirectUri) missing.push('GOOGLE_REDIRECT_URI');
      
      console.error(`Missing Google OAuth environment variables: ${missing.join(', ')}`);
      console.error('Please set these in your .env file to enable Google Fit integration.');
      throw new Error(`Google OAuth credentials not configured. Missing: ${missing.join(', ')}`);
    }

    try {
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      this.fitness = google.fitness('v1');
    } catch (error) {
      console.error('Failed to initialize Google OAuth2 client:', error);
      throw error;
    }
  }

  // Generate OAuth URL
  getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized. Please check your environment variables.');
    }

    try {
      return this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.heart_rate.read',
          'https://www.googleapis.com/auth/fitness.sleep.read',
          'https://www.googleapis.com/auth/fitness.body.read',
        ],
      });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      throw new Error(`Failed to generate auth URL: ${error.message}`);
    }
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // Set credentials for API calls
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Fetch heart rate data (last 7 days)
  async getHeartRateData() {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await this.fitness.users.dataset.aggregate({
      userId: 'me',
      auth: this.oauth2Client,
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

  // Fetch steps data (last 7 days)
  async getStepsData() {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await this.fitness.users.dataset.aggregate({
      userId: 'me',
      auth: this.oauth2Client,
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

  // Fetch calories data (last 7 days)
  async getCaloriesData() {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await this.fitness.users.dataset.aggregate({
      userId: 'me',
      auth: this.oauth2Client,
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

  // Fetch sleep data (last 7 days)
  async getSleepData() {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const response = await this.fitness.users.dataset.aggregate({
      userId: 'me',
      auth: this.oauth2Client,
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

  // Fetch all fitness data
  async getAllFitnessData() {
    const [heartRate, steps, calories, sleep] = await Promise.all([
      this.getHeartRateData(),
      this.getStepsData(),
      this.getCaloriesData(),
      this.getSleepData(),
    ]);

    return {
      heartRate,
      steps,
      calories,
      sleep,
      summary: this.generateSummary(heartRate, steps, calories, sleep),
    };
  }

  // Parse heart rate data
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

  // Parse steps data
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

  // Parse calories data
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

  // Parse sleep data
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

  // Get sleep type from value
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

  // Generate summary statistics
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

module.exports = new GoogleFitService();

