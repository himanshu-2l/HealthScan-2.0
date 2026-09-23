import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared JWT secret provider.
 * Throws immediately if JWT_SECRET is not configured in any environment (including Vercel).
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export const JWT_SECRET = getJwtSecret();

export default JWT_SECRET;
