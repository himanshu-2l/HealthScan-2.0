import assert from 'assert';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../backend/src/utils/tokenVerifier.js';
import { checkRateLimit, resetRateLimitStore } from '../backend/src/utils/userRateLimiter.js';
import geminiProxyHandler from '../backend/src/handlers/geminiProxy.js';

process.env.JWT_SECRET = 'test-only-jwt-secret-key-32chars';
const TEST_SECRET = process.env.JWT_SECRET;

async function runTests() {
  console.log('🧪 Starting Work Order 7 Verification Suite...\n');

  // Test 1: Shared verifyToken with valid JWT
  console.log('Checking shared verifyToken with HealthScan JWT...');
  const testPayload = { uid: 'usr-12345', email: 'clinician@healthscan.io', role: 'doctor' };
  const token = jwt.sign(testPayload, TEST_SECRET, { expiresIn: '1h' });
  const verifiedUser = await verifyToken(token);

  assert(verifiedUser !== null, 'verifyToken should successfully decode valid token');
  assert.strictEqual(verifiedUser.uid, 'usr-12345');
  assert.strictEqual(verifiedUser.email, 'clinician@healthscan.io');
  assert.strictEqual(verifiedUser.role, 'doctor');
  assert.strictEqual(verifiedUser.provider, 'jwt');
  console.log('✅ verifyToken correctly verifies HealthScan JWT.');

  // Test 2: Shared verifyToken rejection on invalid token
  console.log('Checking verifyToken on invalid tokens...');
  const invalidUser = await verifyToken('invalid.jwt.token');
  assert.strictEqual(invalidUser, null, 'verifyToken should return null for invalid tokens');

  const emptyUser = await verifyToken('');
  assert.strictEqual(emptyUser, null, 'verifyToken should return null for empty tokens');
  console.log('✅ verifyToken correctly rejects invalid tokens.\n');

  // Test 3: Shared Rate Limiter sliding window logic
  console.log('Testing sliding window rate limiter (20 requests/min limit)...');
  resetRateLimitStore();

  const userKey = 'user:test-rate-limit-user-1';
  // Send 20 allowed requests
  for (let i = 1; i <= 20; i++) {
    const res = await checkRateLimit(userKey, 20, 60000);
    assert.strictEqual(res.allowed, true, `Request #${i} should be allowed`);
    assert.strictEqual(res.remaining, 20 - i, `Remaining should be ${20 - i}`);
  }

  // 21st request must be denied with 429 info
  const blockedRes = await checkRateLimit(userKey, 20, 60000);
  assert.strictEqual(blockedRes.allowed, false, '21st request must be blocked');
  assert.strictEqual(blockedRes.remaining, 0, 'Remaining should be 0 when blocked');
  assert(blockedRes.retryAfter > 0, 'retryAfter should be > 0');
  console.log('✅ Sliding window rate limiter correctly blocks request #21 with retryAfter.\n');

  // Test 4: Gemini Proxy handler returns 429 when rate limit is exceeded
  console.log('Testing geminiProxyHandler enforcement of 429 on rate limit...');
  resetRateLimitStore();

  const proxyUserToken = jwt.sign({ uid: 'usr-proxy-rate-limit', email: 'ratelimit@healthscan.io' }, TEST_SECRET, { expiresIn: '1h' });

  let lastStatus = null;
  let lastHeaders = {};
  let lastJson = null;

  const mockRes = {
    statusCode: 200,
    setHeader(name, val) {
      lastHeaders[name.toLowerCase()] = val;
    },
    status(code) {
      lastStatus = code;
      return this;
    },
    json(data) {
      lastJson = data;
      return this;
    }
  };

  // Perform 20 calls (which will either fail on payload validation or Gemini key, but NOT 429)
  for (let i = 0; i < 20; i++) {
    const mockReq = {
      method: 'POST',
      headers: {
        authorization: `Bearer ${proxyUserToken}`,
        'x-forwarded-for': '127.0.0.1'
      },
      body: {}
    };
    await geminiProxyHandler(mockReq, mockRes);
    assert.notStrictEqual(lastStatus, 429, `Request #${i + 1} should not be 429`);
  }

  // The 21st call should trigger 429 before even processing body
  const mockReq21 = {
    method: 'POST',
    headers: {
      authorization: `Bearer ${proxyUserToken}`,
      'x-forwarded-for': '127.0.0.1'
    },
    body: {}
  };
  await geminiProxyHandler(mockReq21, mockRes);

  assert.strictEqual(lastStatus, 429, `21st request to geminiProxyHandler must return 429, got ${lastStatus}`);
  assert.strictEqual(lastJson.error, 'Too many requests');
  assert(lastHeaders['retry-after'], 'Should set Retry-After header');
  console.log('✅ geminiProxyHandler correctly returns 429 and rate limit headers on excess requests.\n');

  console.log('🎉 ALL WORK ORDER 7 VERIFICATION CHECKS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
