import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
    return res.status(200).json({ configured: false });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', configured: false });
  }

  // Enforce HealthScan authentication
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid HealthScan authentication required to initiate Google Fit integration'
    });
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return res.status(200).json({
        configured: false,
        error: 'Google Fit not configured',
        message: 'Google OAuth credentials are not set up on the server'
      });
    }

    // Dynamic import for googleapis
    let google;
    try {
      const googleapisModule = await import('googleapis');
      google = googleapisModule.google || googleapisModule.default?.google || googleapisModule.default || googleapisModule;
      if (!google || typeof google !== 'object' || !google.auth) {
        throw new Error('googleapis auth not found');
      }
    } catch (importError) {
      console.error('Failed to import googleapis:', importError.message);
      return res.status(200).json({
        configured: false,
        error: 'Google APIs library not available',
        message: 'Please ensure googleapis is installed: npm install googleapis'
      });
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      // Generate cryptographically signed OAuth CSRF state parameter bound to authenticated user
      const userId = user.userId || user.uid;
      const jwtSecret = process.env.JWT_SECRET || 'healthscan-jwt-dev-secret-do-not-use-in-production';
      const state = jwt.sign(
        {
          userId,
          nonce: crypto.randomBytes(16).toString('hex')
        },
        jwtSecret,
        { expiresIn: '15m' }
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.heart_rate.read',
          'https://www.googleapis.com/auth/fitness.sleep.read',
          'https://www.googleapis.com/auth/fitness.body.read',
        ],
        prompt: 'consent',
        state,
      });

      return res.status(200).json({
        authUrl,
        configured: true
      });
    } catch (oauthError) {
      console.error('OAuth2 client error:', oauthError);
      return res.status(200).json({
        configured: false,
        error: 'Failed to create OAuth2 client',
        message: oauthError.message || 'Unknown OAuth error'
      });
    }
  } catch (error) {
    console.error('Unexpected error in Google auth:', error);
    return res.status(200).json({
      configured: false,
      error: 'Failed to generate auth URL',
      message: error.message || 'Unknown error occurred'
    });
  }
}
