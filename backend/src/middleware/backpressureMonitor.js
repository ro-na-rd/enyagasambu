'use strict';

const { logger } = require('../config/logger');

// Emits structured warnings when the server is under load so operators can
// detect and react to workload spikes before they cause downtime. No requests
// are rejected here — this is purely observability.
let lastWarn = 0;
const WARN_INTERVAL_MS = 60 * 1000;

module.exports = function backpressureMonitor({ maxConcurrent } = {}) {
  const max = maxConcurrent || parseInt(process.env.MAX_CONCURRENT_REQUESTS, 10) || 0;
  return (req, res, next) => {
    // Track active request count via the concurrency limiter's module state is
    // not exported, so we infer load from response timing instead.
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const now = Date.now();

      // Log slow responses (could indicate DB pool exhaustion or slow queries).
      if (duration > 5000 && now - lastWarn > WARN_INTERVAL_MS) {
        lastWarn = now;
        logger.warn('[Backpressure] Slow response detected', {
          method: req.method,
          url: req.originalUrl,
          durationMs: duration,
          ip: req.ip || null,
        });
      }

      // Log 503 responses (concurrency limit hit or server busy).
      if (res.statusCode === 503 && now - lastWarn > WARN_INTERVAL_MS) {
        lastWarn = now;
        logger.warn('[Backpressure] Server busy response', {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          ip: req.ip || null,
          maxConcurrent: max || 0,
        });
      }
    });
    next();
  };
};
