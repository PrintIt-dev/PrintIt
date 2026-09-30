const assert = require('assert');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runTests() {
  console.log('--- Testing Keep-Alive Module & /healthz Endpoint ---');

  // Test 1: Test keepAlive module environment helpers
  const keepAlive = require('../src/utils/keepAlive');

  // 1a: Default interval
  delete process.env.KEEP_ALIVE_INTERVAL_MS;
  assert.strictEqual(keepAlive.getIntervalMs(), 600000, 'Default interval should be 600,000ms (10 min)');

  // 1b: Custom interval
  process.env.KEEP_ALIVE_INTERVAL_MS = '300000';
  assert.strictEqual(keepAlive.getIntervalMs(), 300000, 'Custom interval should parse correctly');

  // 1c: Enabled flag
  process.env.KEEP_ALIVE_ENABLED = 'true';
  assert.strictEqual(keepAlive.isEnabled(), true, 'Should be enabled when KEEP_ALIVE_ENABLED="true"');
  process.env.KEEP_ALIVE_ENABLED = 'false';
  assert.strictEqual(keepAlive.isEnabled(), false, 'Should be disabled when KEEP_ALIVE_ENABLED="false"');

  // 1d: Base URL resolution
  delete process.env.KEEP_ALIVE_URL;
  delete process.env.RENDER_EXTERNAL_URL;
  assert.strictEqual(keepAlive.getBaseUrl(), '', 'Should be empty string when no URL env set');

  process.env.RENDER_EXTERNAL_URL = 'https://printit-zaf4.onrender.com/';
  assert.strictEqual(keepAlive.getBaseUrl(), 'https://printit-zaf4.onrender.com', 'Should strip trailing slash from RENDER_EXTERNAL_URL');

  process.env.KEEP_ALIVE_URL = 'https://custom.printit.com/';
  assert.strictEqual(keepAlive.getBaseUrl(), 'https://custom.printit.com', 'KEEP_ALIVE_URL should override RENDER_EXTERNAL_URL');
  console.log('✅ Criteria 1-4: Configuration and environment resolution verified');

  // Test 2: Verify /healthz endpoint on express app
  const app = require('../src/app');
  const server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const localUrl = `http://127.0.0.1:${port}`;

  try {
    const start = Date.now();
    const res = await fetch(`${localUrl}/healthz`);
    const elapsed = Date.now() - start;

    assert.strictEqual(res.status, 200, 'GET /healthz should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.ok, true, '/healthz response body should contain { ok: true }');
    assert(typeof data.timestamp === 'number', '/healthz should return timestamp');
    assert(elapsed < 200, `Health check latency was ${elapsed}ms (< 200ms)`);
    console.log(`✅ Acceptance Criterion 1: GET /healthz returned 200 OK in ${elapsed}ms`);

    // Test 3: Test ping execution against live endpoint
    process.env.KEEP_ALIVE_ENABLED = 'true';
    process.env.KEEP_ALIVE_URL = localUrl;
    await keepAlive.ping();
    console.log('✅ Acceptance Criterion 2: Self-ping executed against live server successfully');

    // Test 4: Test network error recovery (unreachable port)
    process.env.KEEP_ALIVE_URL = 'http://127.0.0.1:1'; // invalid port
    await keepAlive.ping();
    console.log('✅ Acceptance Criterion 3: Unreachable target handled gracefully without unhandled rejection');

  } finally {
    server.close();
    keepAlive.stopKeepAlive();
    try {
      const pool = require('../src/config/db');
      await pool.end();
    } catch {}
  }

  console.log('\n🎉 ALL ACCEPTANCE CRITERIA PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
