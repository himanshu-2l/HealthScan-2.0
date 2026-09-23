import assert from 'assert';
import http from 'http';
import fs from 'fs';
import app from '../backend/src/app.js';

process.env.JWT_SECRET = 'test-only-jwt-secret-key-32chars';

async function runTests() {
  console.log('🧪 Starting Work Order 10 Verification Suite...\n');

  // Test 1: CSP validation in vercel.json
  console.log('Checking vercel.json Content-Security-Policy rules...');
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const cspHeader = vercelConfig.headers[0].headers.find(h => h.key === 'Content-Security-Policy');
  assert(cspHeader, 'vercel.json must define Content-Security-Policy header');

  const cspValue = cspHeader.value;
  // script-src must not contain loose "https:"
  const scriptSrcMatch = cspValue.match(/script-src\s+([^;]+)/);
  assert(scriptSrcMatch, 'CSP must define script-src');
  const scriptDirectives = scriptSrcMatch[1].split(/\s+/);

  assert(!scriptDirectives.includes('https:'), 'script-src must NOT contain wildcard https:');
  assert(!scriptDirectives.includes("'unsafe-inline'"), "script-src must NOT contain 'unsafe-inline'");
  assert(scriptDirectives.includes("'wasm-unsafe-eval'"), "script-src must include 'wasm-unsafe-eval' for MediaPipe/TensorFlow");
  console.log('✅ vercel.json CSP is strictly hardened (no wildcard https:, no unsafe-inline, includes wasm-unsafe-eval).');

  // Test 2: Server-side httpOnly cookie authentication flow
  console.log('Testing server-side httpOnly cookie authentication flow...');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const testEmail = `cookie-test-${Date.now()}@healthscan.io`;
    const testPassword = 'Password123!';

    // Register user
    const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cookie Test User',
        email: testEmail,
        password: testPassword
      })
    });

    assert.strictEqual(regRes.status, 201, `Register failed with status ${regRes.status}`);
    const setCookieHeader = regRes.headers.get('set-cookie');
    assert(setCookieHeader, 'Register response must include Set-Cookie header');
    assert(setCookieHeader.includes('healthscan_auth_token='), 'Cookie must set healthscan_auth_token');
    assert(setCookieHeader.toLowerCase().includes('httponly'), 'Cookie must be HttpOnly');
    assert(setCookieHeader.toLowerCase().includes('samesite=lax'), 'Cookie must be SameSite=Lax');
    console.log('✅ /api/auth/register sets secure httpOnly SameSite cookie.');

    // Extract cookie value
    const cookieMatch = setCookieHeader.match(/healthscan_auth_token=([^;]+)/);
    assert(cookieMatch, 'Must match cookie value');
    const cookieValue = cookieMatch[0];

    // Access protected route /api/auth/me USING COOKIE ONLY (no Authorization header)
    const meRes = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieValue
      }
    });

    assert.strictEqual(meRes.status, 200, `Access via cookie should succeed (got ${meRes.status})`);
    const meData = await meRes.json();
    assert.strictEqual(meData.user?.email, testEmail);
    console.log('✅ Protected route /api/auth/me authenticates via httpOnly cookie alone.');

    // Test logout clears the cookie
    const logoutRes = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Cookie': cookieValue }
    });
    assert.strictEqual(logoutRes.status, 200);
    const logoutCookie = logoutRes.headers.get('set-cookie');
    assert(logoutCookie && (logoutCookie.includes('healthscan_auth_token=;') || logoutCookie.includes('Expires=')), 'Logout must expire the auth cookie');
    console.log('✅ /api/auth/logout successfully clears the authentication cookie.');

    // Test 3: Hide stack traces unless development
    process.env.NODE_ENV = 'production';
    const errRes = await fetch(`http://127.0.0.1:${port}/api/features/symptoms/unknown-route-triggering-404-or-error`, {
      method: 'GET'
    });
    const errData = await errRes.json();
    assert(!errData.stack, 'Error response in production/staging must NOT include stack trace');
    console.log('✅ Stack traces are hidden in non-development environments.\n');

  } finally {
    server.close();
  }

  console.log('🎉 ALL WORK ORDER 10 VERIFICATION CHECKS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
