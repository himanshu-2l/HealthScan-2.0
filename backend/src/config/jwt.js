import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared JWT secret provider.
 * Reads process.env.JWT_SECRET at call time and throws if it is missing.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}
