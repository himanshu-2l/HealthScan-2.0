/**
 * Vercel Serverless Function for Anomaly Detection
 * Handles POST (report) and GET (history) operations
 */

// In-memory storage for demo purposes
const anomaliesStore = new Map();

/**
 * Set CORS headers
 */
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
};

/**
 * Generate a unique ID
 */
const generateId = () => {
  return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    if (req.method === 'POST') {
      // Save anomaly report
      const { userId, anomalies, severity, affectedMetrics, recommendations } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      const entry = {
        id: generateId(),
        userId,
        featureType: 'anomaly_report',
        data: { anomalies, severity, affectedMetrics, recommendations },
        metadata: { detectedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (grouped by userId)
      if (!anomaliesStore.has(userId)) {
        anomaliesStore.set(userId, []);
      }
      anomaliesStore.get(userId).unshift(entry);

      return res.status(201).json({
        success: true,
        data: entry,
        message: 'Anomaly report saved successfully',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'GET') {
      // Get anomaly history
      const { userId, limit = '20', offset = '0' } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId query parameter is required'
        });
      }

      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const userAnomalies = anomaliesStore.get(userId) || [];
      const paginatedData = userAnomalies.slice(offsetNum, offsetNum + limitNum);
      const total = userAnomalies.length;

      return res.status(200).json({
        success: true,
        data: paginatedData,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + paginatedData.length < total
        },
        timestamp: new Date().toISOString()
      });

    } else {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error('Anomalies API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
