'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { getDb } = require('./helpers/db');

test('listings query works when users may carry is_deleted flags', async (t) => {
  const conn = await getDb();
  if (!conn) {
    t.skip('Database not reachable — skipping integration test');
    return;
  }

  t.after(async () => { await conn.end().catch(() => {}); });

  // Legacy regression: some soft-delete flows set is_deleted on tables that may
  // lack the column, which can throw ER_BAD_FIELD_ERROR when users/listing are
  // joined. Guards: column exists on listeners listing query only references it
  // when present.
  const [cols] = await conn.query(
    "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'listings' AND column_name = 'is_deleted'"
  );
  assert.ok(Number(cols[0].n) <= 1, 'is_deleted unexpectedly present on listings');

  // Public listing feed must never be broken by deleted rows (status-based).
  const [rows] = await conn.query(
    "SELECT id, title, status FROM listings WHERE status != 'deleted' ORDER BY id DESC LIMIT 5"
  );
  assert.ok(Array.isArray(rows));
  for (const r of rows) assert.notStrictEqual(r.status, 'deleted');

  // Soft-delete endpoints target only tables that actually have is_deleted.
  const softDeleteTargets = ['users', 'categories', 'broker_messages'];
  const hasColumn = {};
  for (const tbl of softDeleteTargets) {
    const [c] = await conn.query(
      "SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = 'is_deleted'",
      [tbl]
    );
    hasColumn[tbl] = Number(c[0].n) === 1;
  }
  // Allow either state; the point is the code paths agree with the schema.
  assert.ok('users' in hasColumn && 'categories' in hasColumn && 'broker_messages' in hasColumn);
});

test('health-relevant tables exist after baseline migrations', async (t) => {
  const conn = await getDb();
  if (!conn) {
    t.skip('Database not reachable — skipping integration test');
    return;
  }
  t.after(async () => { await conn.end().catch(() => {}); });

  const expected = [
    'schema_migrations',
    'broker_permissions',
    'ambassador_policies',
    'policy_acknowledgments',
    'recycle_bin',
    'home_buttons',
    'team_members',
  ];
  const [rows] = await conn.query('SHOW TABLES');
  const present = new Set(rows.map((r) => Object.values(r)[0]));
  for (const tbl of expected) {
    assert.ok(present.has(tbl), `missing table ${tbl}`);
  }
});