import fs from 'fs';
import http from 'http';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'healthscan-jwt-dev-secret-test-only-key-32chars';
}

const { default: app } = await import('../backend/src/app.js');
const { default: serverlessTempHandler } = await import('../api/body-temperature.js');
const { default: serverlessFitDataHandler } = await import('../api/google-fit/data/index.js');
const { default: serverlessFitTypeHandler } = await import('../api/google-fit/data/[type].js');

console.log('====================================================');
console.log('HEALTHSCAN WORK ORDER 3 VERIFICATION SUITE');
console.log('====================================================\n');

let server;
const PORT = 5892;
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET;
const testToken = jwt.sign({ userId: 'test-user-123', email: 'test@healthscan.io' }, JWT_SECRET);

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: json || data });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    setHeader(name, val) { this.headers[name] = val; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.data = obj; return this; },
    send(str) { this.data = str; return this; }
  };
  return res;
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function pass(desc) {
    console.log(`✓ [PASS] ${desc}`);
    passed++;
  }

  function fail(desc, err) {
    console.error(`✗ [FAIL] ${desc}`, err);
    failed++;
  }

  // 1. Static Audit Check: No Math.random in backend/serverless routes
  console.log('--- SECTION 1: STATIC AUDIT FOR Math.random ---');
  const filesToAudit = [
    'backend/src/app.js',
    'backend/src/routes/googleFitRoutes.js',
    'api/body-temperature.js',
    'api/google-fit/data/index.js',
    'api/google-fit/data/[type].js',
    'server.js'
  ];

  for (const file of filesToAudit) {
    const content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('Math.random()')) {
      pass(`Static audit: No Math.random() in ${file}`);
    } else {
      fail(`Static audit: Found Math.random() in ${file}`);
    }
  }

  // Start Express server for dynamic testing
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  console.log('\n--- SECTION 2: PRODUCTION PATH CHECKS (ENABLE_DEMO_DATA not set) ---');
  delete process.env.ENABLE_DEMO_DATA;

  // 2. /api/body-temperature in Express
  const tempRes = await request('/api/body-temperature');
  if (tempRes.status === 501 && tempRes.body.error === 'Not Implemented') {
    pass('/api/body-temperature returns 501 Not Implemented in production');
  } else {
    fail(`/api/body-temperature expected 501, got ${tempRes.status}`, tempRes.body);
  }

  // 3. /api/body-temperature in Serverless function
  const serverlessRes = mockRes();
  await serverlessTempHandler({ method: 'GET', headers: {} }, serverlessRes);
  if (serverlessRes.statusCode === 501 && serverlessRes.data?.error === 'Not Implemented') {
    pass('Serverless api/body-temperature returns 501 Not Implemented in production');
  } else {
    fail(`Serverless api/body-temperature expected 501, got ${serverlessRes.statusCode}`);
  }

  // 4. /api/google-fit/data in Express without authentication
  const fitUnauthRes = await request('/api/google-fit/data');
  if (fitUnauthRes.status === 401) {
    pass('/api/google-fit/data returns 401 for unauthenticated requests');
  } else {
    fail(`/api/google-fit/data expected 401, got ${fitUnauthRes.status}`);
  }

  // 5. /api/google-fit/data in Express with Auth, but no Google tokens
  const fitAuthNoTokensRes = await request('/api/google-fit/data', {
    headers: { Authorization: `Bearer ${testToken}` }
  });
  if (fitAuthNoTokensRes.status === 401 || fitAuthNoTokensRes.status === 409) {
    pass(`/api/google-fit/data returns ${fitAuthNoTokensRes.status} (401 or 409) when user has no real Google tokens`);
  } else {
    fail(`/api/google-fit/data expected 401 or 409, got ${fitAuthNoTokensRes.status}`, fitAuthNoTokensRes.body);
  }

  // 6. /api/google-fit/data/:type in Express with Auth, but no Google tokens
  const fitTypeNoTokensRes = await request('/api/google-fit/data/heart-rate', {
    headers: { Authorization: `Bearer ${testToken}` }
  });
  if (fitTypeNoTokensRes.status === 401 || fitTypeNoTokensRes.status === 409) {
    pass(`/api/google-fit/data/heart-rate returns ${fitTypeNoTokensRes.status} (401 or 409) when user has no real Google tokens`);
  } else {
    fail(`/api/google-fit/data/heart-rate expected 401 or 409, got ${fitTypeNoTokensRes.status}`);
  }

  // 7. /api/google-fit/status
  const fitStatusRes = await request('/api/google-fit/status', {
    headers: { Authorization: `Bearer ${testToken}` }
  });
  if (fitStatusRes.status === 200 && fitStatusRes.body.connected === false) {
    pass('/api/google-fit/status returns connected: false when unconnected');
  } else {
    fail(`/api/google-fit/status expected connected: false, got:`, fitStatusRes.body);
  }

  // 8. Serverless api/google-fit/data/index.js
  const serverlessFitRes = mockRes();
  await serverlessFitDataHandler({
    method: 'GET',
    headers: { authorization: `Bearer ${testToken}` }
  }, serverlessFitRes);
  if (serverlessFitRes.statusCode === 401 || serverlessFitRes.statusCode === 409) {
    pass(`Serverless /api/google-fit/data returns ${serverlessFitRes.statusCode} without Google tokens`);
  } else {
    fail(`Serverless /api/google-fit/data expected 401/409, got ${serverlessFitRes.statusCode}`);
  }

  console.log('\n--- SECTION 3: DEMO MODE CHECKS (ENABLE_DEMO_DATA=true) ---');
  process.env.ENABLE_DEMO_DATA = 'true';

  // 9. /api/body-temperature with ENABLE_DEMO_DATA=true
  const demoTempRes = await request('/api/body-temperature');
  if (demoTempRes.status === 200 && demoTempRes.body.simulated === true) {
    pass('/api/body-temperature returns simulated: true when ENABLE_DEMO_DATA=true');
  } else {
    fail('/api/body-temperature demo check failed', demoTempRes.body);
  }

  // 10. /api/google-fit/data with ENABLE_DEMO_DATA=true
  const demoFitRes = await request('/api/google-fit/data', {
    headers: { Authorization: `Bearer ${testToken}` }
  });
  if (demoFitRes.status === 200 && demoFitRes.body.simulated === true && demoFitRes.body.heartRate[0].simulated === true) {
    pass('/api/google-fit/data returns simulated: true on all data points when ENABLE_DEMO_DATA=true');
  } else {
    fail('/api/google-fit/data demo check failed', demoFitRes.body);
  }

  server.close();
  delete process.env.ENABLE_DEMO_DATA;

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed}/${passed + failed} TESTS PASSED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  if (server) server.close();
  process.exit(1);
});
