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

  try {
    // In serverless environment, we can't use sessions
    // Check if token is provided in query or header
    const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
    
    // For now, return false if no token, true if token exists
    // In production, you'd validate the token
    const connected = !!token;

    return res.status(200).json({
      connected
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    // Always return valid JSON with connected: false on error
    return res.status(200).json({ 
      connected: false,
      error: 'Failed to check connection status',
      message: error.message || 'Unknown error occurred'
    });
  }
}

