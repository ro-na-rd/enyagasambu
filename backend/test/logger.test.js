'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { logger, LEVEL_ORDER } = require('../src/config/logger');

function capture(fn) {
  const chunks = { out: [], err: [] };
  const origOut = process.stdout.write;
  const origErr = process.stderr.write;
  process.stdout.write = (c) => { chunks.out.push(c); return true; };
  process.stderr.write = (c) => { chunks.err.push(c); return true; };
  try {
    fn();
  } finally {
    process.stdout.write = origOut;
    process.stderr.write = origErr;
  }
  return {
    outLines: chunks.out.join('').split('\n').filter(Boolean),
    errLines: chunks.err.join('').split('\n').filter(Boolean),
  };
}

test('LEVEL_ORDER ranks error above debug', () => {
  assert.ok(LEVEL_ORDER.error > LEVEL_ORDER.info);
  assert.ok(LEVEL_ORDER.info > LEVEL_ORDER.warn ? false : true); // warn(30) > info(20)
  assert.strictEqual(LEVEL_ORDER.warn, 30);
});

test('info() writes one JSON line to stdout', () => {
  const { outLines, errLines } = capture(() => logger.info('hello', { count: 1 }));
  assert.strictEqual(errLines.length, 0);
  assert.strictEqual(outLines.length, 1);
  const rec = JSON.parse(outLines[0]);
  assert.strictEqual(rec.level, 'info');
  assert.strictEqual(rec.msg, 'hello');
  assert.strictEqual(rec.count, 1);
  assert.ok(!Number.isNaN(Date.parse(rec.time)));
});

test('error() writes to stderr and includes fields', () => {
  const { errLines } = capture(() => logger.error('boom', { requestId: 'abc' }));
  assert.strictEqual(errLines.length, 1);
  const rec = JSON.parse(errLines[0]);
  assert.strictEqual(rec.level, 'error');
  assert.strictEqual(rec.requestId, 'abc');
});

test('Error objects are normalized with name/message/stack/code/sqlMessage', () => {
  const e = new Error('query exploded');
  e.code = 'ER_BAD_FIELD_ERROR';
  e.sqlMessage = 'Unknown column is_deleted';
  const { errLines } = capture(() => logger.error(e));
  const rec = JSON.parse(errLines[0]);
  assert.strictEqual(rec.msg, 'query exploded');
  assert.ok(rec.err);
  assert.strictEqual(rec.err.name, 'Error');
  assert.strictEqual(rec.err.code, 'ER_BAD_FIELD_ERROR');
  assert.strictEqual(rec.err.sqlMessage, 'Unknown column is_deleted');
  assert.ok(rec.err.stack.includes('Error: query exploded'));
});

test('non-error objects become data payloads', () => {
  const { outLines } = capture(() => logger.info({ message: 'status ok', api: 'health' }));
  const rec = JSON.parse(outLines[0]);
  assert.strictEqual(rec.msg, 'status ok');
  assert.strictEqual(rec.data.api, 'health');
});

test('undefined fields serialize as null', () => {
  const { outLines } = capture(() => logger.info('x', { maybe: undefined, keep: 'y' }));
  const rec = JSON.parse(outLines[0]);
  assert.strictEqual(rec.maybe, null);
  assert.strictEqual(rec.keep, 'y');
});

test('child() returns a loggable logger', () => {
  const child = logger.child({ service: 'api' });
  assert.strictEqual(typeof child.info, 'function');
  const { outLines } = capture(() => child.info('via child', { requestId: 'r1' }));
  assert.strictEqual(JSON.parse(outLines[0]).msg, 'via child');
});