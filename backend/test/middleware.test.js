'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

function capture(fn) {
  const chunks = { out: [], err: [] };
  const origOut = process.stdout.write;
  const origErr = process.stderr.write;
  process.stdout.write = (c) => { chunks.out.push(c); return true; };
  process.stderr.write = (c) => { chunks.err.push(c); return true; };
  try { fn(); } finally {
    process.stdout.write = origOut;
    process.stderr.write = origErr;
  }
  return {
    outLines: chunks.out.join('').split('\n').filter(Boolean),
    errLines: chunks.err.join('').split('\n').filter(Boolean),
  };
}

function makeRes() {
  const res = { headers: {}, statusCode: 200, _listeners: {} };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  res.on = (evt, fn) => { (res._listeners[evt] = res._listeners[evt] || []).push(fn); return res; };
  res.emit = (evt) => { (res._listeners[evt] || []).forEach((l) => l()); return res; };
  return res;
}

const testRequestId = require('../src/middleware/requestId');
const testHttpLogger = require('../src/middleware/httpLogger');
const errorHandler = require('../src/middleware/errorHandler');

test('requestId generates a fresh uuid when no header', () => {
  const req = { get: () => undefined };
  const res = makeRes();
  testRequestId(req, res, () => {});
  assert.ok(req.id);
  assert.strictEqual(res.headers['x-request-id'], req.id);
  assert.match(req.id, /^[0-9a-f]{8}-/);
});

test('requestId honors inbound x-request-id', () => {
  const req = { get: (k) => (k === 'x-request-id' ? 'client-gen-id' : undefined) };
  const res = makeRes();
  testRequestId(req, res, () => {});
  assert.strictEqual(req.id, 'client-gen-id');
  assert.strictEqual(res.headers['x-request-id'], 'client-gen-id');
});

test('httpLogger logs one structured record with status/duration/requestId', () => {
  const req = {
    id: 'req-1',
    method: 'GET',
    originalUrl: '/api/health',
    get: (k) => (k === 'user-agent' ? 'node-test' : undefined),
    ip: '127.0.0.1',
  };
  const res = makeRes();
  const { outLines } = capture(() => {
    testHttpLogger(req, res, () => {});
    res.statusCode = 200;
    res.emit('finish');
  });
  const rec = JSON.parse(outLines[0]);
  assert.strictEqual(rec.msg, 'GET /api/health');
  assert.strictEqual(rec.requestId, 'req-1');
  assert.strictEqual(rec.status, 200);
  assert.strictEqual(rec.method, 'GET');
  assert.ok(typeof rec.durationMs === 'number');
});

test('httpLogger marks 5xx as error level', () => {
  const req = { id: 'r', method: 'GET', originalUrl: '/api/x', get: () => undefined, ip: '127.0.0.1' };
  const res = makeRes();
  const { outLines, errLines } = capture(() => {
    testHttpLogger(req, res, () => {});
    res.statusCode = 500;
    res.emit('finish');
  });
  assert.strictEqual(outLines.length, 0);
  assert.strictEqual(JSON.parse(errLines[0]).level, 'error');
});

test('errorHandler maps multer errors to 400', () => {
  const multer = require('multer');
  const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image');
  const res = makeRes();
  capture(() => errorHandler(err, { id: 'r', method: 'POST', originalUrl: '/u' }, res, () => {}));
  assert.strictEqual(res.statusCode, 400);
  assert.ok(res._body.message.length > 0);
});

test('errorHandler maps entity.too.large to 413', () => {
  const res = makeRes();
  capture(() => errorHandler({ type: 'entity.too.large' }, { id: 'r' }, res, () => {}));
  assert.strictEqual(res.statusCode, 413);
});

test('errorHandler maps entity.parse.failed to 400', () => {
  const res = makeRes();
  capture(() => errorHandler({ type: 'entity.parse.failed' }, { id: 'r' }, res, () => {}));
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res._body.message, 'Invalid JSON body');
});

test('errorHandler passes through err.status < 500', () => {
  const res = makeRes();
  capture(() => errorHandler({ status: 403, message: 'Nope' }, { id: 'r' }, res, () => {}));
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res._body.message, 'Nope');
});

test('errorHandler returns 500 and hides details in production', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const res = makeRes();
    capture(() => errorHandler(new Error('secret internal detail'), { id: 'r' }, res, () => {}));
    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res._body.message, 'Internal server error');
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test('errorHandler returns 500 with message in development', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    const res = makeRes();
    capture(() => errorHandler(new Error('visible detail'), { id: 'r' }, res, () => {}));
    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res._body.message, 'visible detail');
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test('errorHandler delegates when headers already sent', () => {
  let called = false;
  const res = { headersSent: true, statusCode: 500 };
  errorHandler(new Error('x'), { id: 'r' }, res, () => { called = true; });
  assert.strictEqual(called, true);
});

test('notFound returns 404 JSON', () => {
  const res = makeRes();
  errorHandler.notFound({}, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res._body, { message: 'Route not found' });
});