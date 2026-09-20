export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // In serverless environment, we can't use sessions
    // The frontend should handle clearing the token from localStorage
    // This endpoint just confirms the disconnection

    return res.status(200).json({ 
      success: true, 
      message: 'Google Fit disconnected' 
    });
  } catch (error) {
    console.error('Error disconnecting Google Fit:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: 'Failed to disconnect',
      message: error.message || 'Unknown error occurred'
    });
  }
}

