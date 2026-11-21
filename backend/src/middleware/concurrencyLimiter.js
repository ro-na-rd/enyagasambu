'use strict';

// Limits the number of concurrently handled requests. When the limit is hit new
// requests get a 503 instead of exhausting memory/DB connections. Set
// MAX_CONCURRENT_REQUESTS=0 (or omit) to disable.
let active = 0;

module.exports = function concurrencyLimiter({ maxConcurrent } = {}) {
  const max = maxConcurrent || parseInt(process.env.MAX_CONCURRENT_REQUESTS, 10) || 0;
  if (!max) return (req, res, next) => next();
  return (req, res, next) => {
    if (active >= max) {
      return res.status(503).json({
        message: 'Server busy, too many concurrent requests. Try again shortly.',
        code: 'SERVER_BUSY',
      });
    }
    active++;
    const release = () => { active = Math.max(0, active - 1); };
    res.on('finish', release);
    res.on('close', release);
    next();
  };
};
