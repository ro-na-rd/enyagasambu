'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { splitDown, checksum, listMigrationFiles } = require('../src/scripts/migrate');

test('checksum returns a stable 64-char sha256', () => {
  const a = checksum('SELECT 1');
  const b = checksum('SELECT 1');
  const c = checksum('SELECT 2');
  assert.strictEqual(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notStrictEqual(a, c);
});

test('listMigrationFiles returns only .sql sorted by name', () => {
  const files = listMigrationFiles();
  assert.ok(files.length >= 5);
  for (const f of files) assert.ok(f.endsWith('.sql'));
  const sorted = [...files].sort();
  assert.deepStrictEqual(files, sorted);
});

test('splitDown extracts the @DOWN section and ignores text before it', () => {
  const sql = [
    '-- up',
    'CREATE TABLE t (id INT);',
    '',
    '-- @DOWN',
    'DROP TABLE t;',
    '-- @END_DOWN',
    '',
  ].join('\n');
  const down = splitDown(sql);
  assert.strictEqual(down.trim(), 'DROP TABLE t;');
});

test('splitDown returns null when no @DOWN marker', () => {
  assert.strictEqual(splitDown('CREATE TABLE t (id INT);'), null);
});

test('baseline migrations contain no raw ? placeholders', () => {
  const dir = path.join(__dirname, '..', 'migrations');
  const fs = require('node:fs');
  for (const f of listMigrationFiles()) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(sql.trim().length > 0, f + ' is empty');
    assert.ok(!sql.includes(', ?'), f + ' contains a raw ? placeholder');
  }
});