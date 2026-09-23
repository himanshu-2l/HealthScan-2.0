export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (process.env.ENABLE_DEMO_DATA === 'true') {
    return res.status(200).json({
      temperature: 36.6,
      unit: 'celsius',
      timestamp: new Date().toISOString(),
      sensorId: 'IOT-TEMP-DEMO',
      status: 'simulated',
      simulated: true
    });
  }

  return res.status(501).json({
    error: 'Not Implemented',
    message: 'Body temperature sensor hardware integration not connected. A real IoT sensor source is required.',
    simulated: false
  });
}

