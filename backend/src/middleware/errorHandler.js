'use strict';

const multer = require('multer');
const { logger } = require('../config/logger');

// Central error handler. Controllers may throw/next() errors; everything is
// logged structured with the request id and turned into a safe JSON response.
module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  logger.error(err, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
  });

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Payload too large' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message || 'Bad request' });
  }

  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';
  return res.status(500).json({ message });
};

// Standard 404 fallback.
module.exports.notFound = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};