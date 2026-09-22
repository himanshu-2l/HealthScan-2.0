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

  // 2. Check stored session / auth token
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('healthscan_auth_token') || sessionStorage.getItem('healthscan_auth_token');
    if (storedToken) return storedToken;

    // 3. If in demo mode and backend is reachable, retrieve demo session token
    if (localStorage.getItem('healthscan_demo_user')) {
      try {
        const res = await fetch('/api/auth/demo-token', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data?.token) {
            localStorage.setItem('healthscan_auth_token', data.token);
            return data.token;
          }
        }
      } catch {
        // Backend not reachable
      }
    }
  }

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
