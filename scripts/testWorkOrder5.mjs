import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../backend/src/app.js';
import {
  parseAIJsonResponse,
  cleanJsonText,
  medicineVisionResultSchema,
  symptomCheckResultSchema
} from '../backend/src/handlers/geminiProxy.js';

process.env.JWT_SECRET = 'test-only-jwt-secret-key-32chars';
const TEST_SECRET = process.env.JWT_SECRET;
const validToken = jwt.sign({ uid: 'test-user', email: 'test@healthscan.io', role: 'user' }, TEST_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('🧪 Starting Work Order 5 Verification Suite...\n');

  // Test 1: cleanJsonText helper
  console.log('Checking cleanJsonText helper...');
  assert.strictEqual(cleanJsonText('```json\n{"hello":"world"}\n```'), '{"hello":"world"}');
  assert.strictEqual(cleanJsonText('```\n{"hello":"world"}\n```'), '{"hello":"world"}');
  assert.strictEqual(cleanJsonText('  {"hello":"world"}  '), '{"hello":"world"}');
  console.log('✅ cleanJsonText properly strips markdown fences.\n');

  // Test 2: parseAIJsonResponse with medicineVisionResultSchema
  console.log('Checking parseAIJsonResponse with medicineVisionResultSchema...');
  const validAiVisionOutput = `\`\`\`json
  {
    "brandName": "Paracetamol 500",
    "genericIngredients": [{ "name": "Paracetamol", "strength": "500mg" }],
    "dosageForm": "Tablet",
    "manufacturer": "HealthCorp",
    "packagingType": "blister_strip",
    "visibleText": ["Paracetamol", "500mg"],
    "confidenceScore": 0.95
  }
  \`\`\``;
  const parsedVision = parseAIJsonResponse(validAiVisionOutput, medicineVisionResultSchema);
  assert(parsedVision !== null, 'parseAIJsonResponse should succeed on valid AI response');
  assert.strictEqual(parsedVision.brandName, 'Paracetamol 500');
  assert.strictEqual(parsedVision.confidenceScore, 0.95);

  const invalidVision = parseAIJsonResponse('Sorry, I am just an AI and cannot read this image.', medicineVisionResultSchema);
  assert.strictEqual(invalidVision, null, 'parseAIJsonResponse should return null on non-JSON text');
  console.log('✅ parseAIJsonResponse works correctly with valid and invalid AI responses.\n');

  // Test 3: Express body parser limit on /api/gemini-proxy vs standard routes
  console.log('Testing Express body limit: /api/gemini-proxy allows up to 8MB, standard routes capped at 1MB...');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;

  try {
    // 3A: POST to /api/auth/login with > 1MB payload should be rejected with 413 Payload Too Large
    const bigNonProxyPayload = JSON.stringify({ email: 'test@example.com', padding: 'x'.repeat(1.2 * 1024 * 1024) });
    const resAuth = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bigNonProxyPayload
    });
    assert.strictEqual(resAuth.status, 413, `Standard route should reject >1MB with 413, got ${resAuth.status}`);
    console.log('✅ Standard routes enforce 1MB body limit (returned 413).');

    // 3B: POST to /api/gemini-proxy with 3MB payload should NOT return 413 (it parses successfully and fails auth or validation)
    const bigProxyPayload = JSON.stringify({
      type: 'symptom-check',
      payload: { symptoms: 'headache' },
      padding: 'x'.repeat(3 * 1024 * 1024) // 3MB payload
    });

    const resProxy = await fetch(`http://127.0.0.1:${port}/api/gemini-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: bigProxyPayload
    });

    // It should NOT be 413. Since it passes body parsing and hits handler logic, it's either 200 or 500/502 (if no gemini key), but NOT 413!
    assert.notStrictEqual(resProxy.status, 413, `Gemini proxy should not reject 3MB body with 413. Got: ${resProxy.status}`);
    console.log(`✅ /api/gemini-proxy accepts payloads >1MB without 413 (status: ${resProxy.status}).`);

  } finally {
    server.close();
  }

  console.log('\n🎉 ALL WORK ORDER 5 VERIFICATION CHECKS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
