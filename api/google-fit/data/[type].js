export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { type } = req.query;
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

    // Use dynamic import for googleapis
    const { google } = await import('googleapis');
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

    let data;

    switch (type) {
      case 'heart-rate':
        const heartRateResponse = await fitness.users.dataSources.datasets.get({
          userId: 'me',
          dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
          datasetId: `${startTime}-${endTime}`,
          auth: oauth2Client,
        });
        data = parseHeartRateData(heartRateResponse.data);
        break;
      case 'steps':
        const stepsResponse = await fitness.users.dataSources.datasets.get({
          userId: 'me',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:aggregated',
          datasetId: `${startTime}-${endTime}`,
          auth: oauth2Client,
        });
        data = parseStepsData(stepsResponse.data);
        break;
      case 'calories':
        const caloriesResponse = await fitness.users.dataSources.datasets.get({
          userId: 'me',
          dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
          datasetId: `${startTime}-${endTime}`,
          auth: oauth2Client,
        });
        data = parseCaloriesData(caloriesResponse.data);
        break;
      case 'sleep':
        const sleepResponse = await fitness.users.sessions.list({
          userId: 'me',
          startTimeMillis: startTime / 1000000,
          endTimeMillis: endTime / 1000000,
          activityType: 72, // Sleep
          auth: oauth2Client,
        });
        data = parseSleepData(sleepResponse.data);
        break;
      default:
        return res.status(400).json({ 
          error: 'Invalid data type' 
        });
    }

    // Return data in the format expected by frontend
    if (type === 'heart-rate') {
      // Frontend expects array of { timestamp, bpm, source }
      const formattedData = data.heartRate?.map((reading) => ({
        timestamp: new Date(reading.timestamp).toISOString(),
        bpm: reading.bpm,
        source: 'Google Fit'
      })) || [];
      return res.status(200).json(formattedData);
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching ${req.query.type} data:`, error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: `Failed to fetch ${req.query.type} data`,
      message: error.message 
    });
  }
}

function parseHeartRateData(data) {
  if (!data || !data.point) return { heartRate: [] };
  
  const readings = data.point
    .filter(point => point.value && point.value[0] && point.value[0].fpVal !== undefined)
    .map(point => ({
      bpm: point.value[0].fpVal,
      timestamp: parseInt(point.startTimeNanos) / 1000000,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return {
    heartRate: readings,
    latest: readings[0] || null,
    average: readings.length > 0 
      ? readings.reduce((sum, r) => sum + r.bpm, 0) / readings.length 
      : null,
  };
}

function parseStepsData(data) {
  if (!data || !data.point) return { steps: 0, dailySteps: [] };
  
  const totalSteps = data.point.reduce((sum, point) => {
    return sum + (point.value?.[0]?.intVal || 0);
  }, 0);

  return { steps: totalSteps, dailySteps: [] };
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

