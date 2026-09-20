export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ configured: false });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', configured: false });
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/auth/google/callback`;

    if (!clientId || !clientSecret) {
      console.warn('Missing Google OAuth credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      // Return 200 with configured: false instead of 500 error
      return res.status(200).json({ 
        configured: false,
        error: 'Google Fit not configured',
        message: 'Google OAuth credentials are not set up on the server'
      });
    }

    // Try to import googleapis with better error handling
    let google;
    try {
      // Try different import patterns for compatibility
      const googleapisModule = await import('googleapis');
      
      // Handle different export structures
      if (googleapisModule.google) {
        google = googleapisModule.google;
      } else if (googleapisModule.default && googleapisModule.default.google) {
        google = googleapisModule.default.google;
      } else if (googleapisModule.default) {
        google = googleapisModule.default;
      } else {
        google = googleapisModule;
      }
      
      // Verify the structure
      if (!google || typeof google !== 'object' || !google.auth) {
        console.error('Invalid googleapis structure:', {
          hasGoogle: !!google,
          googleType: typeof google,
          hasAuth: !!(google && google.auth),
          keys: google ? Object.keys(google).slice(0, 10) : []
        });
        throw new Error('googleapis module structure is invalid - auth property not found');
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

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.heart_rate.read',
          'https://www.googleapis.com/auth/fitness.sleep.read',
          'https://www.googleapis.com/auth/fitness.body.read',
        ],
        prompt: 'consent',
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

