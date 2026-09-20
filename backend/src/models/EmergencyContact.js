import mongoose from 'mongoose';

/**
 * Emergency Contact Model
 * Stores emergency contacts and medical ID information for users
 */

/**
 * Individual contact sub-schema
 */
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true,
    maxlength: [50, 'Relationship cannot exceed 50 characters']
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, { _id: true });

/**
 * Medical ID sub-schema
 */
const medicalIdSchema = new mongoose.Schema({
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', ''],
    default: ''
  },
  allergies: [{
    type: String,
    trim: true,
    maxlength: [100, 'Allergy name cannot exceed 100 characters']
  }],
  medications: [{
    type: String,
    trim: true,
    maxlength: [100, 'Medication name cannot exceed 100 characters']
  }],
  conditions: [{
    type: String,
    trim: true,
    maxlength: [100, 'Condition name cannot exceed 100 characters']
  }],
  organDonor: {
    type: Boolean,
    default: false
  },
  emergencyNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Emergency notes cannot exceed 500 characters']
  }
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  contacts: {
    type: [contactSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10; // Max 10 contacts
      },
      message: 'Cannot have more than 10 emergency contacts'
    }
  },
  medicalId: {
    type: medicalIdSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to ensure only one primary contact
emergencyContactSchema.pre('save', function(next) {
  const primaryContacts = this.contacts.filter(c => c.isPrimary);
  if (primaryContacts.length > 1) {
    // Keep only the first primary, set others to false
    let foundFirst = false;
    this.contacts.forEach(contact => {
      if (contact.isPrimary) {
        if (foundFirst) {
          contact.isPrimary = false;
        } else {
          foundFirst = true;
        }
      }
    });
  }
  next();
});

// Static method to get or create emergency contact document for user
emergencyContactSchema.statics.getOrCreate = async function(userId) {
  let doc = await this.findOne({ userId }).lean();
  if (!doc) {
    doc = await this.create({ userId, contacts: [], medicalId: {} });
    doc = doc.toObject();
  }
  return doc;
};

// Static method to add a contact
emergencyContactSchema.statics.addContact = async function(userId, contact) {
  return this.findOneAndUpdate(
    { userId },
    { 
      $push: { contacts: contact },
      $setOnInsert: { medicalId: {} }
    },
    { new: true, upsert: true }
  );
};

// Static method to update a specific contact
emergencyContactSchema.statics.updateContact = async function(userId, contactId, updates) {
  const updateFields = {};
  Object.keys(updates).forEach(key => {
    updateFields[`contacts.$.${key}`] = updates[key];
  });
  
  return this.findOneAndUpdate(
    { userId, 'contacts._id': contactId },
    { $set: updateFields },
    { new: true }
  );
};

// Static method to remove a contact
emergencyContactSchema.statics.removeContact = async function(userId, contactId) {
  return this.findOneAndUpdate(
    { userId },
    { $pull: { contacts: { _id: contactId } } },
    { new: true }
  );
};

// Static method to update medical ID
emergencyContactSchema.statics.updateMedicalId = async function(userId, medicalIdData) {
  return this.findOneAndUpdate(
    { userId },
    { 
      $set: { medicalId: medicalIdData },
      $setOnInsert: { contacts: [] }
    },
    { new: true, upsert: true }
  );
};

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema);

export default EmergencyContact;
