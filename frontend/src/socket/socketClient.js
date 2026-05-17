import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket          = null;
let connectedPlayer = null; 

export function getSocket(playerId) {
  if (socket && connectedPlayer !== playerId) {
    console.log(`[Socket] Player berubah (${connectedPlayer} → ${playerId}), reconnecting...`);
    socket.disconnect();
    socket          = null;
    connectedPlayer = null;
  }

  if (!socket) {
    connectedPlayer = playerId;

    socket = io(SOCKET_URL, {
      query:               { playerId: playerId || '' },
      transports:          ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:   1000,
    });

    socket.on('connect',       () => console.log('[Socket] Connected:', socket.id));
    socket.on('disconnect',    () => console.log('[Socket] Disconnected'));
    socket.on('connect_error', (e) => console.error('[Socket] Error:', e.message));
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket          = null;
    connectedPlayer = null;
  }
}