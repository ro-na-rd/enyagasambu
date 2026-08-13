const jwt = require('jsonwebtoken');

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

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:3000', process.env.FRONTEND_URL || 'http://localhost:3000'],
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

    socket.on('disconnect', () => {});
  });

  console.log('Socket.IO initialized');
  return io;
}

function getIO() {
  return io;
}

function emitToAuction(auctionId, event, payload) {
  if (!io || auctionId == null) return;
  io.to(roomAuction(auctionId)).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  if (!io || userId == null) return;
  io.to(roomUser(userId)).emit(event, payload);
}

module.exports = { initSocket, getIO, emitToAuction, emitToUser, roomAuction, roomUser };
