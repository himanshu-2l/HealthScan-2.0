/**
 * Vercel Serverless Function for Doctor Reports
 * Handles POST (generate/save) and GET (history) operations
 */

// In-memory storage for demo purposes
const reportsStore = new Map();

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
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    if (req.method === 'POST') {
      // Save generated report snapshot
      const { userId, reportContent, metrics, notes, reportType } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      const entry = {
        id: generateId(),
        userId,
        featureType: 'doctor_report',
        data: { reportContent, metrics, notes, reportType },
        metadata: { generatedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (grouped by userId)
      if (!reportsStore.has(userId)) {
        reportsStore.set(userId, []);
      }
      reportsStore.get(userId).unshift(entry);

      return res.status(201).json({
        success: true,
        data: entry,
        message: 'Report saved successfully',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'GET') {
      // Get report history
      const { userId, limit = '20', offset = '0' } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId query parameter is required'
        });
      }

      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const userReports = reportsStore.get(userId) || [];
      const paginatedData = userReports.slice(offsetNum, offsetNum + limitNum);
      const total = userReports.length;

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
    console.error('Reports API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
