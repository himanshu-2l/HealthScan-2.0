export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({
    message: 'API is working',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      vercelUrl: process.env.VERCEL_URL,
      nodeEnv: process.env.NODE_ENV
    }
  });
}

