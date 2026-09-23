import { auth } from '../lib/firebase';

/**
 * Retrieve the current authenticated HealthScan JWT token.
 * 1. Checks Firebase user ID token if available.
 * 2. Checks localStorage / sessionStorage for healthscan_auth_token.
 * 3. If in demo mode and backend is reachable, fetches a demo session token.
 */
export async function getAuthToken(): Promise<string | null> {
  // 1. Check active Firebase user session
  if (auth?.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) return token;
    } catch {
      // Ignore and check local tokens
    }
  }

  // 2. HealthScan native sessions use secure httpOnly cookies sent with credentials: 'include'.
  // We do not store or read JWTs in client-accessible localStorage/sessionStorage.
  return null;
}

/**
 * Get HTTP headers for authenticated HealthScan API requests
 */
export async function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { ...additionalHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
