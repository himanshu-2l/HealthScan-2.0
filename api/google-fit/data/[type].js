import jwt from 'jsonwebtoken';

/**
 * Verify HealthScan request authentication
 */
function authenticateRequest(req) {
  if (req.user) {
    return req.user;
  }

  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    return null;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  const jwtSecret = process.env.JWT_SECRET || 'healthscan-jwt-dev-secret-do-not-use-in-production';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
  } catch {
    return null;
  }
}

// Generate mock fitness data for local demonstration only when ENABLE_DEMO_DATA=true
function getMockFitnessData() {
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

  return { heartRate, steps, calories, sleep };
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Enforce HealthScan authentication
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid HealthScan authentication required to access fitness data'
    });
  }

  try {
    const { type } = req.query;
    const validTypes = ['heart-rate', 'steps', 'calories', 'sleep'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid data type' });
    }

    const configured = Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      !process.env.GOOGLE_CLIENT_ID.startsWith('your_')
    );

    if (!configured) {
      if (process.env.ENABLE_DEMO_DATA === 'true') {
        const mockData = getMockFitnessData();
        const mapTypeToKey = {
          'heart-rate': 'heartRate',
          'steps': 'steps',
          'calories': 'calories',
          'sleep': 'sleep'
        };
        return res.status(200).json(mockData[mapTypeToKey[type]]);
      }
      return res.status(409).json({
        error: 'Google Fit not configured',
        configured: false,
        connected: false
      });
    }

    if (process.env.ENABLE_DEMO_DATA === 'true') {
      const mockData = getMockFitnessData();
      const mapTypeToKey = {
        'heart-rate': 'heartRate',
        'steps': 'steps',
        'calories': 'calories',
        'sleep': 'sleep'
      };
      return res.status(200).json(mockData[mapTypeToKey[type]]);
    }

    return res.status(401).json({
      error: 'Google Fit not connected',
      configured: true,
      connected: false
    });
  } catch (error) {
    console.error(`Error fetching ${req.query.type} data:`, error);
    return res.status(500).json({
      error: `Failed to fetch ${req.query.type} data`,
      message: error.message
    });
  }
}
