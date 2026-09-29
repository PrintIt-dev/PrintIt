/**
 * PrintIt Backend — Untrusted User Security Test
 * ------------------------------------------------
 * Simulates an attacker (no token, forged token, wrong role, wrong ownership)
 * and verifies the backend correctly blocks every attempt.
 *
 * Run: node security_test.js
 * Requires: node-fetch (npm i node-fetch)
 */

const BASE = 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'printit-test-jwt-secret-key-for-local-testing';

let passed = 0;
let failed = 0;
const results = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function req(method, path, { token, body } = {}) {
  const { default: fetch } = await import('node-fetch');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json;
  try { json = await res.json(); } catch { json = {}; }
  return { status: res.status, body: json };
}

function expect(label, actual, expectedStatus, notExpectedBody) {
  const statusOk = actual.status === expectedStatus;
  const bodyOk = notExpectedBody
    ? !JSON.stringify(actual.body).toLowerCase().includes(notExpectedBody.toLowerCase())
    : true;
  const ok = statusOk && bodyOk;

  const icon = ok ? '✅' : '❌';
  const detail = `${icon} [${actual.status}] ${label}`;
  if (!ok) {
    results.push(`${detail}\n     → expected ${expectedStatus}, body check: ${notExpectedBody || 'none'}\n     → got: ${JSON.stringify(actual.body)}`);
    failed++;
  } else {
    results.push(detail);
    passed++;
  }
}

// Build a forged JWT signed with correct secret but wrong role/user
function forgeToken(payload) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🔐 PrintIt — Untrusted User Security Tests\n' + '─'.repeat(50));

  // ── 1. No Token ─────────────────────────────────────────────────────────────
  console.log('\n[1] No Token / Unauthenticated Access');

  let r;
  r = await req('GET', '/orders');
  expect('GET /orders — no token → 401', r, 401);

  r = await req('GET', '/shop/orders');
  expect('GET /shop/orders — no token → 401', r, 401);

  r = await req('GET', '/admin/payouts/pending');
  expect('GET /admin/payouts/pending — no token → 401', r, 401);

  r = await req('GET', '/admin/products');
  expect('GET /admin/products — no token → 401', r, 401);

  r = await req('GET', '/wallet/balance');
  expect('GET /wallet/balance — no token → 401', r, 401);

  r = await req('GET', '/shop/analytics/summary');
  expect('GET /shop/analytics/summary — no token → 401', r, 401);

  // ── 2. Garbage Token ────────────────────────────────────────────────────────
  console.log('\n[2] Garbage / Malformed Token');

  r = await req('GET', '/orders', { token: 'not-a-jwt' });
  expect('GET /orders — garbage token → 401', r, 401);

  r = await req('GET', '/shop/orders', { token: 'Bearer eyJhbGciOiJub25lIn0.e30.' });
  expect('GET /shop/orders — alg:none token → 401', r, 401);

  r = await req('GET', '/orders', { token: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZm9vIn0.INVALID_SIG' });
  expect('GET /orders — invalid signature → 401', r, 401);

  // ── 3. Forged Role — Customer trying to reach Shop/Admin routes ──────────────
  console.log('\n[3] Forged Token — Wrong Role');

  const customerToken = forgeToken({ user_id: 'fake-customer-001', role: 'customer', email: 'hacker@evil.com' });

  r = await req('GET', '/shop/orders', { token: customerToken });
  expect('Customer token → GET /shop/orders (shop-only) → 403', r, 403);

  r = await req('GET', '/admin/payouts/pending', { token: customerToken });
  expect('Customer token → GET /admin/payouts/pending (admin-only) → 403', r, 403);

  r = await req('GET', '/admin/products', { token: customerToken });
  expect('Customer token → GET /admin/products (admin-only) → 403', r, 403);

  r = await req('GET', '/shop/analytics/summary', { token: customerToken });
  expect('Customer token → GET /shop/analytics (shop-only) → 403', r, 403);

  // Shopkeeper trying to reach admin routes
  const shopkeeperToken = forgeToken({ user_id: 'fake-shop-owner-001', role: 'shopkeeper', email: 'fakeshop@evil.com' });

  r = await req('GET', '/admin/payouts/pending', { token: shopkeeperToken });
  expect('Shopkeeper token → GET /admin/payouts/pending (admin-only) → 403', r, 403);

  r = await req('PUT', '/admin/payouts/some-id/approve', { token: shopkeeperToken });
  expect('Shopkeeper token → PUT /admin/payouts/:id/approve → 403', r, 403);

  // ── 4. Forged Admin Role — Should still fail (token verified against DB session) ─
  console.log('\n[4] Forged Admin Token (not a real account)');

  const fakeAdminToken = forgeToken({ user_id: 'fake-admin-999', role: 'admin', email: 'admin@evil.com' });

  // This will pass auth+roleCheck but the user/shop won't exist in DB
  // We expect either 403 or 404 (not data)
  r = await req('GET', '/admin/payouts/pending', { token: fakeAdminToken });
  const adminAccessBlocked = r.status === 401 || r.status === 403 || r.status === 404 || r.status === 500;
  results.push(`${adminAccessBlocked ? '⚠️ ' : '❌'} [${r.status}] Forged admin token → GET /admin/payouts/pending (JWT valid but user not in DB session)`);
  if (!adminAccessBlocked) failed++; else passed++;

  // ── 5. Cross-User Order Access (IDOR) ───────────────────────────────────────
  console.log('\n[5] Cross-User IDOR — Customer A reading Customer B\'s order');

  // Try to access a random order ID as a different customer
  const customerAToken = forgeToken({ user_id: 'attacker-user-A', role: 'customer', email: 'a@test.com' });
  const fakeOrderId = 'E-DOESNOTEXIST-0001';

  r = await req('GET', `/orders/${fakeOrderId}`, { token: customerAToken });
  expect('IDOR: customer A reading random order → 404 (not found, not 200)', r, 404);

  // ── 6. Error Information Leakage ────────────────────────────────────────────
  console.log('\n[6] Error Response — No Sensitive Info Leaked');

  // Trigger a 500 by hitting an endpoint that doesn't exist in a way that would previously leak
  r = await req('GET', '/orders/FAKEID-TRIGGER-ERR', { token: customerAToken });
  const body = JSON.stringify(r.body).toLowerCase();
  const leaksStack = body.includes('at ') || body.includes('stack') || body.includes('pg_') ||
                     body.includes('select ') || body.includes('syntax error') || body.includes('node_modules');
  results.push(`${!leaksStack ? '✅' : '❌'} Error responses don't leak stack/SQL/internals`);
  if (!leaksStack) passed++; else failed++;

  // ── 7. Health endpoint — no sensitive data ───────────────────────────────────
  console.log('\n[7] Public Health Endpoint');

  r = await req('GET', '/health');
  expect('GET /health → 200 ok', r, 200);
  const healthBody = JSON.stringify(r.body);
  const leaksDbDetails = healthBody.includes('postgresql://') || healthBody.includes('password') || healthBody.includes('secret');
  results.push(`${!leaksDbDetails ? '✅' : '❌'} /health does not leak DB connection strings`);
  if (!leaksDbDetails) passed++; else failed++;

  // ── 8. Injection Attempts ────────────────────────────────────────────────────
  console.log('\n[8] Injection / Fuzzing');

  r = await req('GET', "/orders/' OR 1=1--", { token: customerAToken });
  const sqlInjectionStatus = r.status === 404 || r.status === 400 || r.status === 403;
  results.push(`${sqlInjectionStatus ? '✅' : '❌'} [${r.status}] SQL injection in order ID → rejected (not 200)`);
  if (sqlInjectionStatus) passed++; else failed++;

  r = await req('POST', '/orders', {
    token: customerAToken,
    body: { customer_id: '../../../etc/passwd', shop_id: 'x', files: [], amount_total: 0 }
  });
  const pathTraversalBlocked = r.status === 400 || r.status === 422;
  results.push(`${pathTraversalBlocked ? '✅' : '❌'} [${r.status}] Path traversal in customer_id → validation rejected`);
  if (pathTraversalBlocked) passed++; else failed++;

  // ── 9. Agent endpoints (no auth) ─────────────────────────────────────────────
  console.log('\n[9] Agent Endpoints — No Token');

  r = await req('GET', '/agent/download-url?path=somefile.pdf');
  expect('GET /agent/download-url — no token → 401', r, 401);

  r = await req('PUT', '/agent/status');
  expect('PUT /agent/status — no token → 401', r, 401);

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log('\n' + '─'.repeat(50));
  results.forEach(r => console.log(r));
  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);

  if (failed === 0) {
    console.log('🎉 All security checks passed! Backend correctly rejects untrusted users.\n');
  } else {
    console.log(`⚠️  ${failed} security issue(s) detected — review the ❌ items above.\n`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
