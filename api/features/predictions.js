/**
 * Vercel Serverless Function for Health Predictions
 * Handles POST (save) and GET (latest) operations
 */

// In-memory storage for demo purposes
const predictionsStore = new Map();

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
  return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    if (req.method === 'POST') {
      // Save health prediction results
      const { userId, scores, trends, aiAnalysis } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      const entry = {
        id: generateId(),
        userId,
        featureType: 'health_prediction',
        data: { scores, trends, aiAnalysis },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (grouped by userId)
      if (!predictionsStore.has(userId)) {
        predictionsStore.set(userId, []);
      }
      predictionsStore.get(userId).unshift(entry);

      return res.status(201).json({
        success: true,
        data: entry,
        message: 'Health prediction saved successfully',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'GET') {
      // Get latest health prediction
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId query parameter is required'
        });
      }

      const userPredictions = predictionsStore.get(userId) || [];
      const latest = userPredictions.length > 0 ? userPredictions[0] : null;

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
    console.error('Predictions API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
