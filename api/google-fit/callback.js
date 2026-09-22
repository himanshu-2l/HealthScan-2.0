import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: false });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const frontendUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';

  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(`${frontendUrl}/dashboard?error=no_code`);
    }

    if (!state) {
      return res.redirect(`${frontendUrl}/dashboard?error=missing_state`);
    }

    // Verify cryptographic OAuth CSRF state parameter
    let decodedState;
    try {
      const jwtSecret = process.env.JWT_SECRET || 'healthscan-jwt-dev-secret-do-not-use-in-production';
      decodedState = jwt.verify(state, jwtSecret);
    } catch (stateErr) {
      console.error('OAuth state verification failed:', stateErr.message);
      return res.redirect(`${frontendUrl}/dashboard?error=invalid_state`);
    }

    // Check if credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${frontendUrl}/dashboard?error=not_configured`);
    }

    // Use dynamic import for googleapis with error handling
    let google;
    try {
      const googleapisModule = await import('googleapis');
      google = googleapisModule.google || googleapisModule.default?.google || googleapisModule.default || googleapisModule;
    } catch (importError) {
      console.error('Failed to import googleapis:', importError.message);
      return res.redirect(`${frontendUrl}/dashboard?error=server_error&message=${encodeURIComponent('googleapis library not available')}`);
    }

    const baseUrl = frontendUrl;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Tokens are kept server-side; NEVER expose tokens in URL parameters or browser history
    return res.redirect(`${frontendUrl}/dashboard?google_fit=connected`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return res.redirect(`${frontendUrl}/dashboard?error=auth_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
}
