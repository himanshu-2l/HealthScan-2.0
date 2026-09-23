import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { getJwtSecret } from '../src/config/jwt.js';
import app from '../src/app.js';
import { isDemoDataAllowed } from '../src/routes/googleFitRoutes.js';
import bodyTemperatureHandler from '../../api/body-temperature.js';
import { generateToken } from '../src/middleware/auth.js';

describe('JWT Secret & Demo Data Security Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('JWT Secret Provider (backend/src/config/jwt.js)', () => {
    it('importing the module does not throw even if JWT_SECRET is unset', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.VITE_JWT_SECRET;
      const module = await import('../src/config/jwt.js');
      expect(module.getJwtSecret).toBeTypeOf('function');
    });

    it('getJwtSecret throws when process.env.JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      delete process.env.VITE_JWT_SECRET;
      expect(() => getJwtSecret()).toThrow('JWT_SECRET environment variable is required');
    });

    it('getJwtSecret returns the current process.env.JWT_SECRET at call time', () => {
      process.env.JWT_SECRET = 'runtime-test-secret-at-least-32-chars';
      expect(getJwtSecret()).toBe('runtime-test-secret-at-least-32-chars');

      process.env.JWT_SECRET = 'second-runtime-secret-key-32chars';
      expect(getJwtSecret()).toBe('second-runtime-secret-key-32chars');
    });

    it('does not fall back to VITE_JWT_SECRET or default fallback secret', () => {
      delete process.env.JWT_SECRET;
      process.env.VITE_JWT_SECRET = 'some-vite-secret';
      expect(() => getJwtSecret()).toThrow('JWT_SECRET environment variable is required');
    });
  });

  describe('Demo Data Gating in Production', () => {
    const testUser = {
      uid: 'demo-gate-user',
      name: 'Demo Gate Tester',
      email: 'gate@example.com',
      role: 'patient'
    };
    const validToken = generateToken(testUser, '1h');

    it('disallows demo data in Google Fit routes when NODE_ENV is production even if ENABLE_DEMO_DATA is true', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_DEMO_DATA = 'true';

      expect(isDemoDataAllowed()).toBe(false);

      const res = await request(app)
        .get('/api/google-fit/data')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).not.toBe(200);
      expect([401, 409]).toContain(res.status);
      expect(res.body.simulated).toBeUndefined();
    });

    it('disallows demo data in /api/body-temperature (Express app) when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_DEMO_DATA = 'true';

      const res = await request(app).get('/api/body-temperature');
      expect(res.status).toBe(501);
      expect(res.body.error).toBe('Not Implemented');
      expect(res.body.simulated).toBe(false);
    });

    it('disallows demo data in api/body-temperature.js (Vercel handler) when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_DEMO_DATA = 'true';

      let statusCode = 200;
      let responseBody = {};
      const mockReq = { method: 'GET', headers: {} };
      const mockRes = {
        setHeader: () => mockRes,
        status: (code) => {
          statusCode = code;
          return mockRes;
        },
        json: (data) => {
          responseBody = data;
          return mockRes;
        }
      };

      await bodyTemperatureHandler(mockReq, mockRes);
      expect(statusCode).toBe(501);
      expect(responseBody.error).toBe('Not Implemented');
      expect(responseBody.simulated).toBe(false);
    });

    it('allows demo data in development when ENABLE_DEMO_DATA is true', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_DEMO_DATA = 'true';

      expect(isDemoDataAllowed()).toBe(true);

      const res = await request(app).get('/api/body-temperature');
      expect(res.status).toBe(200);
      expect(res.body.simulated).toBe(true);
      expect(res.body.temperature).toBe(36.6);
    });
  });
});
