export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate realistic body temperature (normal range: 36.1°C to 37.2°C / 97.0°F to 99.0°F)
    const baseTemp = 36.5; // Base temperature in Celsius
    const variation = (Math.random() - 0.5) * 0.8; // Random variation between -0.4 and +0.4
    const timeVariation = Math.sin(Date.now() / 60000) * 0.3; // Slow sine wave for natural variation
    const temperatureCelsius = baseTemp + variation + timeVariation;
    
    // Ensure temperature stays within normal human range
    const normalizedTemp = Math.max(36.0, Math.min(37.5, temperatureCelsius));
    
    const timestamp = new Date().toISOString();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).json({
      temperature: parseFloat(normalizedTemp.toFixed(2)),
      unit: 'celsius',
      timestamp: timestamp,
      sensorId: 'IOT-TEMP-001',
      status: 'active'
    });
  } catch (error) {
    console.error('Error generating temperature data:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: 'Failed to generate temperature data' 
    });
  }
}

