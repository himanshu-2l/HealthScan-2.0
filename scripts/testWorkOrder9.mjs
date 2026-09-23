import assert from 'assert';
import { encryptText, decryptText } from '../backend/src/utils/crypto.js';
import GoogleFitToken from '../backend/src/models/GoogleFitToken.js';
import { setUserGoogleTokens, getUserGoogleTokens, removeUserGoogleTokens } from '../backend/src/routes/googleFitRoutes.js';

process.env.TOKEN_ENCRYPTION_KEY = 'healthscan-test-encryption-key-for-wo9-testing';

async function runTests() {
  console.log('🧪 Starting Work Order 9 Verification Suite...\n');

  // Test 1: AES-256-GCM Encryption / Decryption
  console.log('Testing AES-256-GCM token encryption and decryption...');
  const sampleToken = 'ya29.a0ARrdaM_example_google_fit_access_token_secret_value_12345';
  const encrypted = encryptText(sampleToken);

  assert(encrypted !== null, 'encryptText should return an encrypted object');
  assert(encrypted.iv && encrypted.data && encrypted.tag, 'Encrypted object must contain iv, data, tag');
  assert(!encrypted.data.includes(sampleToken), 'Encrypted data must NOT contain plaintext token');
  assert(!encrypted.iv.includes(sampleToken), 'IV must NOT contain plaintext token');
  console.log('✅ Tokens in storage are encrypted (not readable plaintext).');

  const decrypted = decryptText(encrypted);
  assert.strictEqual(decrypted, sampleToken, 'decryptText should recover original plaintext token');
  console.log('✅ Decryption recovers original token successfully.');

  // Tamper test
  const tampered = { ...encrypted, data: '00' + encrypted.data.slice(2) };
  assert.strictEqual(decryptText(tampered), null, 'Tampered ciphertext must fail authentication and return null');
  console.log('✅ Auth tag prevents tampering (returns null on forged ciphertext).\n');

  // Test 2: GoogleFitToken Model schema & helper methods
  console.log('Testing GoogleFitToken model schema and token getters...');
  const fakeDoc = new GoogleFitToken({
    userId: 'user-schema-test',
    encryptedAccessToken: encryptText('access-token-abc'),
    encryptedRefreshToken: encryptText('refresh-token-xyz'),
    scope: 'https://www.googleapis.com/auth/fitness.activity.read',
    tokenType: 'Bearer',
    expiryDate: Date.now() + 3600000
  });

  const tokens = fakeDoc.getTokens();
  assert.strictEqual(tokens.access_token, 'access-token-abc');
  assert.strictEqual(tokens.refresh_token, 'refresh-token-xyz');
  assert.strictEqual(tokens.token_type, 'Bearer');
  console.log('✅ GoogleFitToken model decrypts and returns tokens correctly.\n');

  // Test 3: In-Memory / Route token store fallback and API
  console.log('Testing setUserGoogleTokens and getUserGoogleTokens...');
  const userId = 'user-persistence-test-1';
  const testTokens = {
    access_token: 'test-access-token-999',
    refresh_token: 'test-refresh-token-999',
    scope: 'activity.read',
    token_type: 'Bearer',
    expiry_date: Date.now() + 1000000
  };

  await setUserGoogleTokens(userId, testTokens);
  const fetchedTokens = await getUserGoogleTokens(userId);

  assert(fetchedTokens !== null, 'getUserGoogleTokens should return saved tokens');
  assert.strictEqual(fetchedTokens.access_token, 'test-access-token-999');
  assert.strictEqual(fetchedTokens.refresh_token, 'test-refresh-token-999');
  console.log('✅ setUserGoogleTokens and getUserGoogleTokens handle token lifecycle.');

  await removeUserGoogleTokens(userId);
  const removedTokens = await getUserGoogleTokens(userId);
  assert.strictEqual(removedTokens, null, 'removeUserGoogleTokens should purge tokens');
  console.log('✅ removeUserGoogleTokens purges credentials cleanly.\n');

  console.log('🎉 ALL WORK ORDER 9 VERIFICATION CHECKS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
