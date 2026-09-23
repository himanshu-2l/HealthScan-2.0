import crypto from 'crypto';

/**
 * Derives a 32-byte (256-bit) buffer key from the provided encryption key or secret.
 */
function getEncryptionKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.SESSION_SECRET || process.env.JWT_SECRET || 'healthscan-dev-encryption-key-32b';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypt a text string using AES-256-GCM.
 * Returns an object with iv, data (ciphertext in hex), and auth tag in hex.
 * 
 * @param {string} plainText
 * @returns {{ iv: string, data: string, tag: string } | null}
 */
export function encryptText(plainText) {
  if (!plainText) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    data: encrypted,
    tag: tag
  };
}

/**
 * Decrypt an AES-256-GCM encrypted object { iv, data, tag }.
 * Returns original plaintext string.
 * 
 * @param {{ iv: string, data: string, tag: string }} encryptedObj
 * @returns {string | null}
 */
export function decryptText(encryptedObj) {
  if (!encryptedObj || !encryptedObj.iv || !encryptedObj.data || !encryptedObj.tag) {
    return null;
  }
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(encryptedObj.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));

    let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

export default {
  encryptText,
  decryptText
};
