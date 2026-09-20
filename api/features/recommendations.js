/**
 * Vercel Serverless Function for Recommendations
 * Handles POST (save) and GET (latest) operations
 */

// In-memory storage for demo purposes
const recommendationsStore = new Map();

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
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    if (req.method === 'POST') {
      // Save recommendations
      const { userId, diet, exercise, lifestyle, sleep } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      const entry = {
        id: generateId(),
        userId,
        featureType: 'recommendation',
        data: { diet, exercise, lifestyle, sleep },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (grouped by userId)
      if (!recommendationsStore.has(userId)) {
        recommendationsStore.set(userId, []);
      }
      recommendationsStore.get(userId).unshift(entry);

      return res.status(201).json({
        success: true,
        data: entry,
        message: 'Recommendations saved successfully',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'GET') {
      // Get latest recommendations
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId query parameter is required'
        });
      }

      const userRecs = recommendationsStore.get(userId) || [];
      const latest = userRecs.length > 0 ? userRecs[0] : null;

      return res.status(200).json({
        success: true,
        data: latest,
        timestamp: new Date().toISOString()
      });

    } else {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error('Recommendations API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
