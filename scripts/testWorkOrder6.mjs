import assert from 'assert';
import { getGeminiModelName } from '../backend/src/handlers/geminiProxy.js';

console.log('🧪 Starting Work Order 6 Verification Suite...\n');

// Test 1: Default model name
delete process.env.GEMINI_MODEL;
assert.strictEqual(getGeminiModelName(), 'gemini-3.8-flash', 'Default model should be gemini-3.8-flash');
console.log('✅ Default model is gemini-3.8-flash');

// Test 2: Configurable model name
process.env.GEMINI_MODEL = 'gemini-2.0-flash';
assert.strictEqual(getGeminiModelName(), 'gemini-2.0-flash', 'Should read model name from GEMINI_MODEL env var');
console.log('✅ GEMINI_MODEL env var correctly overrides model name');

process.env.GEMINI_MODEL = 'gemini-2.5-pro';
assert.strictEqual(getGeminiModelName(), 'gemini-2.5-pro', 'Should support custom models like gemini-2.5-pro');
console.log('✅ Custom model configuration verified');

console.log('\n🎉 ALL WORK ORDER 6 VERIFICATION CHECKS PASSED!');
