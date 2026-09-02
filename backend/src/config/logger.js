'use strict';

// Structured JSON logger (zero dependencies). Every record is a single JSON line
// so it can be parsed by PM2/Filebeat/Loki etc. without external tooling.

const LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 };

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
}

const logger = {
  debug: (msg, fields) => emit('debug', msg, fields),
  info: (msg, fields) => emit('info', msg, fields),
  warn: (msg, fields) => emit('warn', msg, fields),
  error: (msg, fields) => emit('error', msg, fields),
  child: () => logger,
};

module.exports = { logger, LEVEL_ORDER };