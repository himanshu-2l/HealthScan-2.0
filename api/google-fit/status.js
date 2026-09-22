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
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ connected: false });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', connected: false });
  }

  // Enforce HealthScan authentication
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      connected: false,
      message: 'Valid HealthScan authentication required'
    });
  }

  try {
    const configured = Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      !process.env.GOOGLE_CLIENT_ID.startsWith('your_')
    );

    return res.status(200).json({
      connected: false,
      configured
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    return res.status(200).json({
      connected: false,
      error: 'Failed to check connection status',
      message: error.message || 'Unknown error occurred'
    });
  }
}
