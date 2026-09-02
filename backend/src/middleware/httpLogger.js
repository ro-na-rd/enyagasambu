'use strict';

const { logger } = require('../config/logger');

// Log one structured line per request with latency + status, keyed by request id.
module.exports = function httpLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.originalUrl}`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status,
      durationMs: Date.now() - start,
      ip: req.ip || null,
      userAgent: req.get('user-agent') || null,
    });
  });
  next();
};