import { io, type Socket } from 'socket.io-client';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL || BASE).replace(/\/api$/, '');

let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(): Socket {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nmo_token') : null;
  if (socket && currentToken !== token) {
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    currentToken = token;
  }
  return socket;
}

export function joinAuctionRoom(auctionId: number) {
  const s = getSocket();
  if (s.connected) s.emit('auction:join', { auctionId });
  return s;
}

export function leaveAuctionRoom(auctionId: number) {
  const s = getSocket();
  if (s.connected) s.emit('auction:leave', { auctionId });
}

export function onEvent(event: string, handler: (...args: unknown[]) => void): () => void {
  const s = getSocket();
  s.on(event, handler as never);
  return () => s.off(event, handler as never);
}

export { SOCKET_URL };
