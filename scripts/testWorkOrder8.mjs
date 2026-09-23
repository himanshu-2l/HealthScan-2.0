import assert from 'assert';
import http from 'http';
import app from '../backend/src/app.js';

process.env.JWT_SECRET = 'test-only-jwt-secret-key-32chars';
const TEST_STAGING_FRONTEND = 'https://health-scan-staging.app';
process.env.FRONTEND_URL = TEST_STAGING_FRONTEND;

async function runTests() {
  console.log('🧪 Starting Work Order 8 Verification Suite...\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    // Test 1: Callback missing code redirects to {FRONTEND_URL}/dashboard?error=no_code regardless of referer header
    console.log('Testing callback with missing code and custom referer header...');
    const resNoCode = await fetch(`http://127.0.0.1:${port}/auth/google/callback`, {
      method: 'GET',
      headers: {
        'Referer': 'http://localhost:5174/some/page' // Should be IGNORED
      },
      redirect: 'manual'
    });

    assert.strictEqual(resNoCode.status, 302, `Should return 302 redirect, got ${resNoCode.status}`);
    const locationNoCode = resNoCode.headers.get('location');
    assert.strictEqual(locationNoCode, `${TEST_STAGING_FRONTEND}/dashboard?error=no_code`);
    console.log(`✅ Redirects to ${locationNoCode} (Referer header ignored in favor of FRONTEND_URL).`);

    // Test 2: Callback missing state
    console.log('Testing callback with code but missing state...');
    const resNoState = await fetch(`http://127.0.0.1:${port}/auth/google/callback?code=fake_auth_code`, {
      method: 'GET',
      redirect: 'manual'
    });
    assert.strictEqual(resNoState.status, 302);
    const locationNoState = resNoState.headers.get('location');
    assert.strictEqual(locationNoState, `${TEST_STAGING_FRONTEND}/dashboard?error=missing_state`);
    console.log(`✅ Redirects to ${locationNoState}.`);

    // Test 3: Callback with invalid state
    console.log('Testing callback with invalid CSRF state...');
    const resInvalidState = await fetch(`http://127.0.0.1:${port}/auth/google/callback?code=fake_auth_code&state=bad_state`, {
      method: 'GET',
      redirect: 'manual'
    });
    assert.strictEqual(resInvalidState.status, 302);
    const locationInvalidState = resInvalidState.headers.get('location');
    assert.strictEqual(locationInvalidState, `${TEST_STAGING_FRONTEND}/dashboard?error=invalid_state`);
    console.log(`✅ Redirects to ${locationInvalidState}.`);

    // Test 4: Error redirect must NEVER leak raw error messages in query parameters
    assert(!locationNoCode.includes('message='), 'URL must not contain message parameter');
    assert(!locationNoState.includes('message='), 'URL must not contain message parameter');
    assert(!locationInvalidState.includes('message='), 'URL must not contain message parameter');
    console.log('✅ Verified zero raw error messages leaked in URL parameters.\n');

  } finally {
    server.close();
  }

  console.log('🎉 ALL WORK ORDER 8 VERIFICATION CHECKS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
