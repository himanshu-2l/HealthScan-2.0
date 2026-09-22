export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ error: null });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(200).json({ 
        error: 'Google Fit not configured',
        message: 'Google OAuth credentials are not set up on the server',
        heartRate: [],
        steps: 0,
        calories: 0,
        sleep: [],
        summary: { avgHeartRate: 0, totalSteps: 0, avgSteps: 0, totalCalories: 0, avgCalories: 0, avgSleepHours: '0', period: '7 days' }
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authorization token required' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    let tokens;
    try {
      tokens = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (e) {
      return res.status(401).json({ 
        error: 'Invalid token format' 
      });
    }

    // Use dynamic import for googleapis with error handling
    let google;
    try {
      const googleapisModule = await import('googleapis');
      google = googleapisModule.google || googleapisModule.default?.google || googleapisModule.default || googleapisModule;
    } catch (importError) {
      console.error('Failed to import googleapis:', importError.message);
      return res.status(200).json({ 
        error: 'Google APIs library not available',
        heartRate: [],
        steps: 0,
        calories: 0,
        sleep: [],
        summary: { avgHeartRate: 0, totalSteps: 0, avgSteps: 0, totalCalories: 0, avgCalories: 0, avgSleepHours: '0', period: '7 days' }
      });
    }

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/auth/google/callback`;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    oauth2Client.setCredentials(tokens);
    const fitness = google.fitness('v1');

    const endTime = Date.now() * 1000000; // nanoseconds
    const startTime = endTime - (7 * 24 * 60 * 60 * 1000 * 1000000); // 7 days ago

    // Fetch all fitness data types
    const [heartRateResponse, stepsResponse, caloriesResponse, sleepResponse] = await Promise.all([
      fitness.users.dataSources.datasets.get({
        userId: 'me',
        dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
        datasetId: `${startTime}-${endTime}`,
        auth: oauth2Client,
      }).catch(() => ({ data: { point: [] } })),
      fitness.users.dataSources.datasets.get({
        userId: 'me',
        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:aggregated',
        datasetId: `${startTime}-${endTime}`,
        auth: oauth2Client,
      }).catch(() => ({ data: { point: [] } })),
      fitness.users.dataSources.datasets.get({
        userId: 'me',
        dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
        datasetId: `${startTime}-${endTime}`,
        auth: oauth2Client,
      }).catch(() => ({ data: { point: [] } })),
      fitness.users.sessions.list({
        userId: 'me',
        startTimeMillis: startTime / 1000000,
        endTimeMillis: endTime / 1000000,
        activityType: 72, // Sleep
        auth: oauth2Client,
      }).catch(() => ({ data: { session: [] } }))
    ]);

    const heartRate = parseHeartRateData(heartRateResponse.data);
    const steps = parseStepsData(stepsResponse.data);
    const calories = parseCaloriesData(caloriesResponse.data);
    const sleep = parseSleepData(sleepResponse.data);

    return res.status(200).json({
      heartRate: heartRate.heartRate || [],
      steps: steps.steps || 0,
      calories: calories.calories || 0,
      sleep: sleep.sleep || [],
      summary: {
        avgHeartRate: heartRate.average || 0,
        totalSteps: steps.steps || 0,
        avgSteps: 0,
        totalCalories: calories.calories || 0,
        avgCalories: 0,
        avgSleepHours: '0',
        period: '7 days'
      }
    });
  } catch (error) {
    console.error('Error fetching fitness data:', error);
    return res.status(200).json({ 
      error: 'Failed to fetch fitness data',
      message: error.message,
      heartRate: [],
      steps: 0,
      calories: 0,
      sleep: [],
      summary: { avgHeartRate: 0, totalSteps: 0, avgSteps: 0, totalCalories: 0, avgCalories: 0, avgSleepHours: '0', period: '7 days' }
    });
  }
}

function parseHeartRateData(data) {
  if (!data || !data.point) return { heartRate: [], average: null };
  
  const readings = data.point
    .filter(point => point.value && point.value[0] && point.value[0].fpVal !== undefined)
    .map(point => ({
      bpm: point.value[0].fpVal,
      timestamp: parseInt(point.startTimeNanos) / 1000000,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return {
    heartRate: readings,
    average: readings.length > 0 
      ? readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length 
      : null,
  };
}

function parseStepsData(data) {
  if (!data || !data.point) return { steps: 0 };
  
  const totalSteps = data.point.reduce((sum, point) => {
    return sum + (point.value?.[0]?.intVal || 0);
  }, 0);

  return { steps: totalSteps };
}

function parseCaloriesData(data) {
  if (!data || !data.point) return { calories: 0 };
  
  const totalCalories = data.point.reduce((sum, point) => {
    return sum + (point.value?.[0]?.fpVal || 0);
  }, 0);

  return { calories: Math.round(totalCalories) };
}

function parseSleepData(data) {
  if (!data || !data.session) return { sleep: [] };
  
  const sleepSessions = data.session.map(session => ({
    startTime: session.startTimeMillis,
    endTime: session.endTimeMillis,
    duration: session.endTimeMillis - session.startTimeMillis,
  }));

  return { sleep: sleepSessions };
}

