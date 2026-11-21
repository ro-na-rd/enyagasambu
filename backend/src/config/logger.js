'use strict';

const fs = require('fs');
const path = require('path');

// Structured JSON logger (zero dependencies). Every record is a single JSON line
// so it can be parsed by PM2/Filebeat/Loki etc. without external tooling.
// In production (LOG_TO_FILE=true) records are also appended to a daily rotating
// log file under LOG_DIR (defaults to backend/logs/).

const LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 };

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = process.env.LOG_FILE;
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';
const MAX_SIZE_MB = parseInt(process.env.LOG_MAX_SIZE_MB, 10) || 50;

function ensureLogDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // Directory may not be writable; file logging is best-effort.
  }
}

function currentLogPath() {
  if (LOG_FILE) return LOG_FILE;
  const today = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `app-${today}.log`);
}

function maybeRotate(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_SIZE_MB * 1024 * 1024) {
      fs.renameSync(filePath, filePath + '.' + Date.now() + '.rotated');
    }
  } catch {
    // File does not exist yet or cannot be stat'd; nothing to rotate.
  }
}

function appendToFile(line) {
  if (!LOG_TO_FILE) return;
  ensureLogDir();
  try {
    const filePath = currentLogPath();
    maybeRotate(filePath);
    fs.appendFileSync(filePath, line + '\n');
  } catch {
    // Never let logging crash the application.
  }
}

function normalize(msg, fields) {
  const record = { time: new Date().toISOString(), level: 'info', msg: '' };
  if (msg instanceof Error) {
    record.msg = msg.message || 'Error';
    record.err = {
      name: msg.name,
      message: msg.message,
      stack: msg.stack,
    };
    if (msg.code) record.err.code = msg.code;
    if (msg.sqlMessage) record.err.sqlMessage = msg.sqlMessage;
  } else if (typeof msg === 'object' && msg !== null) {
    record.msg = msg.message || 'log';
    record.data = msg;
  } else {
    record.msg = String(msg);
  }
  if (fields && typeof fields === 'object') {
    for (const [k, v] of Object.entries(fields)) {
      if (v instanceof Error) record[k] = { message: v.message, stack: v.stack };
      else record[k] = v === undefined ? null : v;
    }
  }
  return record;
}

function emit(level, msg, fields) {
  const record = normalize(msg, fields);
  record.level = level;
  const line = JSON.stringify(record);

  if (level === 'error' || level === 'warn') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');

  appendToFile(line);
}

const logger = {
  debug: (msg, fields) => emit('debug', msg, fields),
  info: (msg, fields) => emit('info', msg, fields),
  warn: (msg, fields) => emit('warn', msg, fields),
  error: (msg, fields) => emit('error', msg, fields),
  child: () => logger,
};

module.exports = { logger, LEVEL_ORDER };
