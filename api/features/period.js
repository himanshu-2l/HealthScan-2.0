/**
 * Vercel Serverless Function for Period Tracker
 * Handles POST (log), GET (history), DELETE (remove) operations
 */

// In-memory storage for demo purposes
const periodStore = new Map();

/**
 * Set CORS headers
 */
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
};

/**
 * Generate a unique ID
 */
const generateId = () => {
  return `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    if (req.method === 'POST') {
      // Save period log entry
      const { userId, date, flowIntensity, symptoms, mood, notes } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      const entry = {
        id: generateId(),
        userId,
        featureType: 'period_log',
        data: { date, flowIntensity, symptoms, mood, notes },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (grouped by userId)
      if (!periodStore.has(userId)) {
        periodStore.set(userId, []);
      }
      periodStore.get(userId).unshift(entry);

      return res.status(201).json({
        success: true,
        data: entry,
        message: 'Period log saved successfully',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'GET') {
      // Get period log history
      const { userId, limit = '20', offset = '0' } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId query parameter is required'
        });
      }

      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const userLogs = periodStore.get(userId) || [];
      const paginatedData = userLogs.slice(offsetNum, offsetNum + limitNum);
      const total = userLogs.length;

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

    } else if (req.method === 'DELETE') {
      // Delete period log entry
      const { id, userId } = req.query;

      if (!id || !userId) {
        return res.status(400).json({
          success: false,
          message: 'id and userId query parameters are required'
        });
      }

      const userLogs = periodStore.get(userId);
      if (!userLogs) {
        return res.status(404).json({
          success: false,
          message: 'No logs found for this user'
        });
      }

      const index = userLogs.findIndex(log => log.id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Log entry not found'
        });
      }

      userLogs.splice(index, 1);

      return res.status(200).json({
        success: true,
        data: { id },
        message: 'Period log entry deleted successfully',
        timestamp: new Date().toISOString()
      });

    } else {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error('Period API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
