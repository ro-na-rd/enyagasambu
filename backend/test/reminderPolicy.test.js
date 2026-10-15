const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyReminderTier, buildReminderMessages } = require('../src/services/reminderPolicy');

test('classifyReminderTier picks the 6h tier inside its window', () => {
  assert.equal(classifyReminderTier({ hoursLeft: 6, reminder6hSent: false, reminder2hSent: false }), 6);
  assert.equal(classifyReminderTier({ hoursLeft: 7.5, reminder6hSent: false, reminder2hSent: false }), 6);
});

test('classifyReminderTier picks the 2h tier inside its window', () => {
  assert.equal(classifyReminderTier({ hoursLeft: 2, reminder6hSent: false, reminder2hSent: false }), 2);
  assert.equal(classifyReminderTier({ hoursLeft: 0.5, reminder6hSent: true, reminder2hSent: false }), 2);
});

test('classifyReminderTier prefers the 2h tier when both are pending', () => {
  assert.equal(classifyReminderTier({ hoursLeft: 1.5, reminder6hSent: false, reminder2hSent: false }), 2);
});

test('classifyReminderTier skips tiers already sent', () => {
  assert.equal(classifyReminderTier({ hoursLeft: 6, reminder6hSent: true, reminder2hSent: false }), null);
  assert.equal(classifyReminderTier({ hoursLeft: 2, reminder6hSent: true, reminder2hSent: true }), null);
});

test('classifyReminderTier ignores listings outside both windows', () => {
  assert.equal(classifyReminderTier({ hoursLeft: 8, reminder6hSent: false, reminder2hSent: false }), null);
  assert.equal(classifyReminderTier({ hoursLeft: 3.5, reminder6hSent: false, reminder2hSent: false }), null);
  assert.equal(classifyReminderTier({ hoursLeft: 0, reminder6hSent: false, reminder2hSent: false }), null);
  assert.equal(classifyReminderTier({ hoursLeft: -1, reminder6hSent: false, reminder2hSent: false }), null);
  assert.equal(classifyReminderTier({ hoursLeft: NaN, reminder6hSent: false, reminder2hSent: false }), null);
});

test('buildReminderMessages tailors the timing per tier', () => {
  const expiresAt = new Date('2030-01-01T12:00:00Z');
  const two = buildReminderMessages('Fresh milk', expiresAt, 2);
  const six = buildReminderMessages('Fresh milk', expiresAt, 6);

  assert.match(two.sms, /in about 2 hours/);
  assert.match(six.sms, /in about 6 hours/);
  assert.match(two.message, /in about 2 hours/);
  assert.ok(two.subject.includes('Fresh milk'));
  assert.ok(two.html.includes('Fresh milk'));
  assert.ok(six.html.includes('in about 6 hours'));
  assert.ok(expiresAt.toUTCString().length > 0);
});
