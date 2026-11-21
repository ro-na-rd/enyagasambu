const jwt = require('jsonwebtoken');
const cluster = require('cluster');
const { logger } = require('./logger');

let io = null;

function roomAuction(auctionId) {
  return `auction:${auctionId}`;
}

function roomUser(userId) {
  return `user:${userId}`;
}

function tokenFromHandshake(handshake) {
  const authToken = handshake.auth && handshake.auth.token;
  if (authToken) return authToken;
  const header = handshake.headers && handshake.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.split(' ')[1];
  return null;
}

// When running under Node.js cluster, Socket.IO instances are isolated per
// worker. A user connected to worker A will not receive events emitted from
// worker B. To work around this without adding a Redis dependency, we tunnel
// cross-worker emits through the cluster master using process messages.
//
// Message shape: { type: 'socket:broadcast', room, event, payload, seq }
// The master rebroadcasts to every worker; each worker emits locally to its
// own sockets. Deduplication by seq prevents echo-back to the sender.
let seq = 0;

function broadcastCluster(room, event, payload) {
  if (!cluster.isPrimary && process.send) {
    const message = {
      type: 'socket:broadcast',
      room,
      event,
      payload,
      seq: ++seq,
      from: cluster.worker.id,
    };
    process.send(message);
  }
}

function handleClusterMessage(message) {
  if (message.type !== 'socket:broadcast') return;
  // Ignore echoes from our own worker.
  if (cluster.isWorker && message.from === cluster.worker.id) return;
  const ioInstance = getIO();
  if (!ioInstance || message.room == null) return;
  ioInstance.to(message.room).emit(message.event, message.payload);
}

if (cluster.isWorker) {
  process.on('message', handleClusterMessage);
}

function initSocket(server) {
  const { Server } = require('socket.io');
  const origins = (process.env.CLIENT_URL || '').split(',').map((o) => o.trim()).filter(Boolean);
  io = new Server(server, {
    cors: {
      origin: origins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = tokenFromHandshake(socket.handshake);
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
      } catch {
        socket.userId = null;
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(roomUser(socket.userId));
    }

    socket.on('auction:join', ({ auctionId } = {}) => {
      if (auctionId != null) socket.join(roomAuction(auctionId));
    });

    socket.on('auction:leave', ({ auctionId } = {}) => {
      if (auctionId != null) socket.leave(roomAuction(auctionId));
    });

    socket.on('disconnect', () => { });
  });

  logger.info('Socket.IO initialized', { worker: cluster.isWorker ? cluster.worker.id : 'master' });
  return io;
}

function getIO() {
  return io;
}

function emitToAuction(auctionId, event, payload) {
  if (!io || auctionId == null) return;
  io.to(roomAuction(auctionId)).emit(event, payload);
  // Also broadcast to other workers so users on other nodes receive it.
  broadcastCluster(roomAuction(auctionId), event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io || userId == null) return;
  io.to(roomUser(userId)).emit(event, payload);
  // Also broadcast to other workers so users on other nodes receive it.
  broadcastCluster(roomUser(userId), event, payload);
}

module.exports = { initSocket, getIO, emitToAuction, emitToUser, roomAuction, roomUser, handleClusterMessage, broadcastCluster };
