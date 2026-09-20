/**
 * Vercel Serverless Function for Vaccination Records
 * Handles POST (save), GET (list), PUT (update), DELETE (remove) operations
 */

// In-memory storage for demo purposes
const vaccinationStore = new Map();

/**
 * Set CORS headers
 */
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
};

/**
 * Generate a unique ID
 */
const generateId = () => {
  return `vacc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    if (req.method === 'POST') {
      // Save vaccination record
      const { userId, vaccineName, date, dose, provider, nextDue } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      const entry = {
        id: generateId(),
        userId,
        featureType: 'vaccination',
        data: { vaccineName, date, dose, provider, nextDue },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in memory (grouped by userId)
      if (!vaccinationStore.has(userId)) {
        vaccinationStore.set(userId, []);
      }
      vaccinationStore.get(userId).unshift(entry);

      return res.status(201).json({
        success: true,
        data: entry,
        message: 'Vaccination record saved successfully',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'GET') {
      // Get vaccination records
      const { userId, limit = '50', offset = '0' } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId query parameter is required'
        });
      }

      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      const userRecords = vaccinationStore.get(userId) || [];
      const paginatedData = userRecords.slice(offsetNum, offsetNum + limitNum);
      const total = userRecords.length;

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

    } else if (req.method === 'PUT') {
      // Update vaccination record
      const { id, userId, vaccineName, date, dose, provider, nextDue } = req.body;

      if (!id || !userId) {
        return res.status(400).json({
          success: false,
          message: 'id and userId are required'
        });
      }

      const userRecords = vaccinationStore.get(userId);
      if (!userRecords) {
        return res.status(404).json({
          success: false,
          message: 'No records found for this user'
        });
      }

      const index = userRecords.findIndex(rec => rec.id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Vaccination record not found'
        });
      }

      userRecords[index].data = { vaccineName, date, dose, provider, nextDue };
      userRecords[index].updatedAt = new Date().toISOString();

      return res.status(200).json({
        success: true,
        data: userRecords[index],
        message: 'Vaccination record updated successfully',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'DELETE') {
      // Delete vaccination record
      const { id, userId } = req.query;

      if (!id || !userId) {
        return res.status(400).json({
          success: false,
          message: 'id and userId query parameters are required'
        });
      }

      const userRecords = vaccinationStore.get(userId);
      if (!userRecords) {
        return res.status(404).json({
          success: false,
          message: 'No records found for this user'
        });
      }

      const index = userRecords.findIndex(rec => rec.id === id);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Vaccination record not found'
        });
      }

      userRecords.splice(index, 1);

      return res.status(200).json({
        success: true,
        data: { id },
        message: 'Vaccination record deleted successfully',
        timestamp: new Date().toISOString()
      });

    } else {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error('Vaccinations API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
