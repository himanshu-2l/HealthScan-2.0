/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAuthToken } from '../utils/authUtils';

export type AIProxyErrorReason = 'offline' | 'unauthorized' | 'server_error';

export interface AIProxySuccess<T = any> {
  ok: true;
  data: T;
  status: number;
}

export interface AIProxyError {
  ok: false;
  reason: AIProxyErrorReason;
  status?: number;
  message: string;
}

export type AIProxyResult<T = any> = AIProxySuccess<T> | AIProxyError;

/**
 * Universal AI Caller for HealthScan.
 *
 * Security & Clinical Integrity Architecture:
 * - All AI requests route strictly through the authenticated server-side /api/gemini-proxy.
 * - ZERO Gemini API keys or generative AI libraries exist in the client bundle.
 * - Returns typed error results ({ ok: false, reason: 'offline' | 'unauthorized' | 'server_error' })
 *   with HTTP status instead of fabricated clinical payloads.
 */
export async function callAIProxy<T = any>(type: string, payload: any): Promise<AIProxyResult<T>> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (typeof window !== 'undefined' && (localStorage.getItem('healthscan_demo_user') || localStorage.getItem('healthscan_token')?.startsWith('demo-'))) {
      headers['x-demo-session'] = 'true';
    }

    const response = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ type, payload }),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data && data.result !== undefined) {
          return { ok: true, data: data.result as T, status: response.status };
        }
      }
      return {
        ok: false,
        reason: 'server_error',
        status: response.status,
        message: 'Invalid response format from AI service.'
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        reason: 'unauthorized',
        status: response.status,
        message: 'Authentication required to access AI service.'
      };
    }

    return {
      ok: false,
      reason: 'server_error',
      status: response.status,
      message: `AI service returned error status ${response.status}.`
    };
  } catch (proxyError: any) {
    console.warn('[AI Service] /api/gemini-proxy unreachable:', proxyError);
    return {
      ok: false,
      reason: 'offline',
      status: undefined,
      message: 'Network offline or AI service unreachable.'
    };
  }
}
