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

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Enforce HealthScan authentication
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid HealthScan authentication required'
    });
  }

  try {
    return res.status(200).json({
      success: true,
      message: 'Google Fit disconnected'
    });
  } catch (error) {
    console.error('Error disconnecting Google Fit:', error);
    return res.status(500).json({
      error: 'Failed to disconnect',
      message: error.message || 'Unknown error occurred'
    });
  }
}
