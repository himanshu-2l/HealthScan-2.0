/**
 * Vercel Serverless Function for Emergency Contacts
 * Handles POST/GET/PUT/DELETE for contacts, PUT for medical-id
 */

// In-memory storage for demo purposes
const emergencyStore = new Map();

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
  return `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create user emergency data
 */
const getOrCreateUserData = (userId) => {
  if (!emergencyStore.has(userId)) {
    emergencyStore.set(userId, {
      userId,
      contacts: [],
      medicalId: {
        bloodType: '',
        allergies: [],
        medications: [],
        conditions: [],
        organDonor: false,
        emergencyNotes: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return emergencyStore.get(userId);
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    // Parse the path to determine action
    const path = req.url.split('?')[0];
    const isMedicalId = path.includes('medical-id');

    if (req.method === 'POST') {
      // Save/Update emergency contacts list
      const { userId, contacts } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      const userData = getOrCreateUserData(userId);
      
      // Add IDs to new contacts
      const contactsWithIds = (contacts || []).map(contact => ({
        ...contact,
        id: contact.id || generateId()
      }));
      
      userData.contacts = contactsWithIds;
      userData.updatedAt = new Date().toISOString();

      return res.status(201).json({
        success: true,
        data: userData,
        message: 'Emergency contacts saved successfully',
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'GET') {
      // Get emergency contacts
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId query parameter is required'
        });
      }

      const userData = getOrCreateUserData(userId);

      return res.status(200).json({
        success: true,
        data: userData,
        timestamp: new Date().toISOString()
      });

    } else if (req.method === 'PUT') {
      if (isMedicalId) {
        // Update medical ID
        const { userId, bloodType, allergies, medications, conditions, organDonor, emergencyNotes } = req.body;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'userId is required'
          });
        }

        const userData = getOrCreateUserData(userId);
        userData.medicalId = {
          bloodType: bloodType || '',
          allergies: allergies || [],
          medications: medications || [],
          conditions: conditions || [],
          organDonor: organDonor || false,
          emergencyNotes: emergencyNotes || ''
        };
        userData.updatedAt = new Date().toISOString();

        return res.status(200).json({
          success: true,
          data: userData,
          message: 'Medical ID updated successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        // Update single contact
        const { id, userId, name, phone, relationship, isPrimary } = req.body;

        if (!id || !userId) {
          return res.status(400).json({
            success: false,
            message: 'id and userId are required'
          });
        }

        const userData = getOrCreateUserData(userId);
        const contactIndex = userData.contacts.findIndex(c => c.id === id);

        if (contactIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Contact not found'
          });
        }

        // Update contact fields
        if (name !== undefined) userData.contacts[contactIndex].name = name;
        if (phone !== undefined) userData.contacts[contactIndex].phone = phone;
        if (relationship !== undefined) userData.contacts[contactIndex].relationship = relationship;
        if (isPrimary !== undefined) userData.contacts[contactIndex].isPrimary = isPrimary;
        userData.updatedAt = new Date().toISOString();

        return res.status(200).json({
          success: true,
          data: userData,
          message: 'Contact updated successfully',
          timestamp: new Date().toISOString()
        });
      }

    } else if (req.method === 'DELETE') {
      // Delete contact
      const { id, userId } = req.query;

      if (!id || !userId) {
        return res.status(400).json({
          success: false,
          message: 'id and userId query parameters are required'
        });
      }

      const userData = emergencyStore.get(userId);
      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'No data found for this user'
        });
      }

      const contactIndex = userData.contacts.findIndex(c => c.id === id);
      if (contactIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      userData.contacts.splice(contactIndex, 1);
      userData.updatedAt = new Date().toISOString();

      return res.status(200).json({
        success: true,
        data: { id },
        message: 'Contact deleted successfully',
        timestamp: new Date().toISOString()
      });

    } else {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error('Emergency API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
