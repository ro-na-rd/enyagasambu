'use strict';

// Aborts requests that take too long, freeing the event loop and DB connections
// under load instead of letting slow/hung requests pile up and take the server down.
module.exports = function requestTimeout({ timeoutMs } = {}) {
  const ms = timeoutMs || parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 30000;
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.set('Connection', 'close');
        return res.status(503).json({ message: 'Request timeout', code: 'REQUEST_TIMEOUT' });
      }
    }, ms);
    timer.unref();
    res.on('close', () => clearTimeout(timer));
    next();
  };
};
