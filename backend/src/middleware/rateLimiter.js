const hits = new Map();

function createLimiter({ windowMs, max, message, skipLoopback }) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    // Local bypasses are helpful during development, but must never weaken
    // production controls when a proxy or an internal network is misconfigured.
    if (skipLoopback && process.env.NODE_ENV !== 'production' && /^::1$|^127\.0\.0\.1$|^::ffff:127\.0\.0\.1$/.test(key || '')) {
      return next();
    }
    const now = Date.now();
    const record = hits.get(key);

    if (!record || now - record.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }

    record.count++;
    if (record.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.start + windowMs - now) / 1000));
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ message });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of hits) {
    if (now - record.start > 60 * 60 * 1000) hits.delete(key);
  }
}, 5 * 60 * 1000).unref();

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
  skipLoopback: true,
});

const otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests. Please try again later.',
});

const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please try again later.',
});

const revealLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many contact reveal requests. Please try again later.',
});

const verifyOtpLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many OTP verification attempts. Please try again later.',
});

const executiveRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many executive requests, please try again later',
});

module.exports = { loginLimiter, otpLimiter, passwordResetLimiter, revealLimiter, verifyOtpLimiter, executiveRateLimiter };
