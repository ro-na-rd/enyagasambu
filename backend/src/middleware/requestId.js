'use strict';

const crypto = require('crypto');

// Attach a request id to every request, honoring an inbound x-request-id if present.
module.exports = function requestId(req, res, next) {
  const id = req.get('x-request-id') || crypto.randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
};