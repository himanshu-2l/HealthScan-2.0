import mongoose from 'mongoose';
import { encryptText, decryptText } from '../utils/crypto.js';

const EncryptedFieldSchema = new mongoose.Schema({
  iv: { type: String, required: true },
  data: { type: String, required: true },
  tag: { type: String, required: true }
}, { _id: false });

const GoogleFitTokenSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  encryptedAccessToken: {
    type: EncryptedFieldSchema,
    required: true
  },
  encryptedRefreshToken: {
    type: EncryptedFieldSchema,
    required: false
  },
  scope: {
    type: String
  },
  tokenType: {
    type: String,
    default: 'Bearer'
  },
  expiryDate: {
    type: Number
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Instance method to decrypt and return token payload
GoogleFitTokenSchema.methods.getTokens = function () {
  const access_token = decryptText(this.encryptedAccessToken);
  const refresh_token = this.encryptedRefreshToken ? decryptText(this.encryptedRefreshToken) : undefined;

  return {
    access_token,
    refresh_token,
    scope: this.scope,
    token_type: this.tokenType,
    expiry_date: this.expiryDate
  };
};

// Static helper to upsert encrypted tokens for a user
GoogleFitTokenSchema.statics.saveTokensForUser = async function (userId, tokens) {
  if (!userId || !tokens) {
    return null;
  }

  const encryptedAccessToken = tokens.access_token ? encryptText(tokens.access_token) : undefined;
  const encryptedRefreshToken = tokens.refresh_token ? encryptText(tokens.refresh_token) : undefined;

  const updateData = {
    userId,
    scope: tokens.scope,
    tokenType: tokens.token_type || 'Bearer',
    expiryDate: tokens.expiry_date,
    updatedAt: new Date()
  };

  if (encryptedAccessToken) {
    updateData.encryptedAccessToken = encryptedAccessToken;
  }
  if (encryptedRefreshToken) {
    updateData.encryptedRefreshToken = encryptedRefreshToken;
  }

  return await this.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const GoogleFitToken = mongoose.models.GoogleFitToken || mongoose.model('GoogleFitToken', GoogleFitTokenSchema);
export default GoogleFitToken;
