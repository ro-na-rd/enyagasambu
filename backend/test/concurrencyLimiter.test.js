const test = require('node:test');
const assert = require('node:assert');
const concurrencyLimiter = require('../src/middleware/concurrencyLimiter');

function makeRes() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    set(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    on(event, handler) {
      if (event === 'finish' || event === 'close') {
        this._listeners = this._listeners || [];
        this._listeners.push({ event, handler });
      }
      return this;
    },
    simulateFinish() {
      (this._listeners || []).forEach((l) => { if (l.event === 'finish') l.handler(); });
    },
    simulateClose() {
      (this._listeners || []).forEach((l) => { if (l.event === 'close') l.handler(); });
    },
  };
}

test('concurrencyLimiter allows requests up to maxConcurrent', () => {
  const max = 2;
  const limiter = concurrencyLimiter({ maxConcurrent: max });
  const req = {};

  const passed = [];
  for (let i = 0; i < max; i++) {
    const res = makeRes();
    let called = false;
    limiter(req, res, () => { called = true; });
    assert.equal(called, true, `request ${i + 1} should pass`);
    passed.push(res);
  }

  // The next request should be rejected with 503.
  const res = makeRes();
  let called = false;
  limiter(req, res, () => { called = true; });
  assert.equal(called, false, 'over-limit request must not reach the route');
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'SERVER_BUSY');

  // Release one slot by finishing a request that actually passed through.
  passed[0].simulateFinish();

  const res2 = makeRes();
  let called2 = false;
  limiter(req, res2, () => { called2 = true; });
  assert.equal(called2, true, 'request should pass after a slot is released');
  assert.equal(res2.statusCode, null);

  // Release all acquired slots so state does not leak to other tests.
  passed.forEach((r) => r.simulateFinish());
  res2.simulateFinish();
});

test('concurrencyLimiter is disabled when maxConcurrent is 0', () => {
  const limiter = concurrencyLimiter({ maxConcurrent: 0 });
  const req = {};
  const res = makeRes();
  let called = false;
  limiter(req, res, () => { called = true; });
  assert.equal(called, true, 'request should pass when limiter is disabled');
  assert.equal(res.statusCode, null);
});

test('concurrencyLimiter releases on both finish and close', () => {
  const max = 1;
  const limiter = concurrencyLimiter({ maxConcurrent: max });
  const req = {};

  const res1 = makeRes();
  limiter(req, res1, () => {});

  // Over limit now.
  const res2 = makeRes();
  let called2 = false;
  limiter(req, res2, () => { called2 = true; });
  assert.equal(called2, false);
  assert.equal(res2.statusCode, 503);

  // Closing should also release.
  res1.simulateClose();

  const res3 = makeRes();
  let called3 = false;
  limiter(req, res3, () => { called3 = true; });
  assert.equal(called3, true);
  assert.equal(res3.statusCode, null);

  // Release all acquired slots so state does not leak to other tests.
  res3.simulateFinish();
});
