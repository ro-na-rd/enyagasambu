const test = require('node:test');
const assert = require('node:assert');
const { createLimiter } = require('../src/middleware/rateLimiter');

function makeReq(ip) {
  return { ip, connection: { remoteAddress: ip } };
}

function makeRes() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    set(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test('createLimiter allows requests up to the limit and blocks the next one', () => {
  const limiter = createLimiter({ windowMs: 60 * 1000, max: 3, message: 'slow down' });
  const ip = '203.0.113.10';

  for (let i = 0; i < 3; i++) {
    const res = makeRes();
    let called = false;
    limiter(makeReq(ip), res, () => { called = true; });
    assert.equal(called, true, `request ${i + 1} should pass`);
    assert.equal(res.statusCode, null);
  }

  const res = makeRes();
  let called = false;
  limiter(makeReq(ip), res, () => { called = true; });
  assert.equal(called, false, 'the request past the limit must not reach the route');
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.message, 'slow down');
  assert.ok(res.headers['Retry-After'], 'a Retry-After header must be set');
});

test('createLimiter counts each client address separately', () => {
  const limiter = createLimiter({ windowMs: 60 * 1000, max: 1, message: 'slow down' });

  const first = makeRes();
  limiter(makeReq('203.0.113.11'), first, () => {});
  assert.equal(first.statusCode, null);

  const other = makeRes();
  limiter(makeReq('203.0.113.12'), other, () => {});
  assert.equal(other.statusCode, null, 'a different client must not inherit the count');

  const same = makeRes();
  limiter(makeReq('203.0.113.11'), same, () => {});
  assert.equal(same.statusCode, 429, 'the same client must still be throttled');
});

test('createLimiter lets loopback through when skipLoopback is set', () => {
  const limiter = createLimiter({ windowMs: 60 * 1000, max: 1, message: 'slow down', skipLoopback: true });

  for (const ip of ['::1', '127.0.0.1', '::ffff:127.0.0.1']) {
    const res = makeRes();
    let called = false;
    limiter(makeReq(ip), res, () => { called = true; });
    assert.equal(called, true, `${ip} should bypass the limiter in development`);
    assert.equal(res.statusCode, null);
  }
});

test('createLimiter still throttles loopback in production', () => {
  const limiter = createLimiter({ windowMs: 60 * 1000, max: 1, message: 'slow down', skipLoopback: true });
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const res = makeRes();
    let called = false;
    limiter(makeReq('127.0.0.1'), res, () => { called = true; });
    const second = makeRes();
    limiter(makeReq('127.0.0.1'), second, () => { called = true; });
    assert.equal(second.statusCode, 429, 'loopback must be limited when NODE_ENV is production');
  } finally {
    if (originalEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv;
  }
});
