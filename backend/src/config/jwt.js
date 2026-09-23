import dotenv from 'dotenv';

dotenv.config();

const FALLBACK_JWT_SECRET = 'healthscan-jwt-default-secret-key-32chars-2026';

/**
 * Shared JWT secret provider.
 * Provides fallback to prevent crash during Vercel build/bundle or when unconfigured.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || FALLBACK_JWT_SECRET;
  return secret;
}

export const JWT_SECRET = getJwtSecret();

export default JWT_SECRET;
