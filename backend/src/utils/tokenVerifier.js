import jwt from 'jsonwebtoken';
import firebaseAdmin from 'firebase-admin';
import { getJwtSecret } from '../config/jwt.js';

let firebaseInitialized = false;

// Initialize Firebase Admin once at startup (silent if credentials not provided)
try {
  if (!firebaseAdmin.apps?.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
      } catch (err) {
        console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT:', err.message);
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      try {
        firebaseAdmin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        firebaseInitialized = true;
      } catch (err) {
        console.error('[Firebase Admin] Error initializing with FIREBASE_PROJECT_ID:', err.message);
      }
    }
  } else {
    firebaseInitialized = true;
  }
} catch (err) {
  // Silent catch at startup - no per-request noise
  firebaseInitialized = false;
}

/**
 * Universal Token Verifier across Express and Vercel runtimes.
 * Checks Firebase ID token first, then falls back to HealthScan signed JWT.
 * 
 * @param {string} token
 * @returns {Promise<{ uid: string, email: string|null, name: string|null, role: string, provider: 'firebase'|'jwt' } | null>}
 */
export async function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  // 1. Try Firebase ID token verification first if Firebase Admin is initialized
  if (firebaseInitialized && firebaseAdmin.apps?.length) {
    try {
      const decodedFirebase = await firebaseAdmin.auth().verifyIdToken(token);
      if (decodedFirebase && decodedFirebase.uid) {
        return {
          uid: decodedFirebase.uid,
          email: decodedFirebase.email || null,
          name: decodedFirebase.name || null,
          picture: decodedFirebase.picture || null,
          role: decodedFirebase.role || 'user',
          provider: 'firebase'
        };
      }
    } catch {
      // Not a valid Firebase token; fall through to HealthScan JWT
    }
  }

  // 2. Fallback: HealthScan signed JWT
  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret);
    if (decoded) {
      return {
        uid: decoded.userId || decoded.uid || decoded.sub || 'anonymous',
        email: decoded.email || null,
        name: decoded.name || null,
        role: decoded.role || 'user',
        provider: 'jwt'
      };
    }
  } catch {
    // Both token types failed
    return null;
  }

  return null;
}

export function isFirebaseAdminInitialized() {
  return Boolean(firebaseInitialized && firebaseAdmin.apps?.length);
}

export default {
  verifyToken,
  isFirebaseAdminInitialized
};
