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

// Generate realistic mock fitness data for demonstration when offline/unconnected
function getMockFitnessData() {
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

    const mockData = getMockFitnessData();

    switch (type) {
      case 'heart-rate':
        return res.status(200).json(mockData.heartRate);
      case 'steps':
        return res.status(200).json(mockData.steps);
      case 'calories':
        return res.status(200).json(mockData.calories);
      case 'sleep':
        return res.status(200).json(mockData.sleep);
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }
  } catch (error) {
    console.error(`Error fetching ${req.query.type} data:`, error);
    return res.status(500).json({
      error: `Failed to fetch ${req.query.type} data`,
      message: error.message
    });
  }
}
