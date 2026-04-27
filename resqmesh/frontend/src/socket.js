/**
 * socket.js – Socket.io Client Connection
 * 
 * Single source of truth for Socket.io connection to backend.
 * Initializes connection with automatic reconnection handling.
 * Port: 3001 (Backend server)
 */

import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

let socket = null;

/**
 * Initialize and return Socket.io instance
 * Establishes WebSocket connection with fallback to polling
 */
export const initSocket = () => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('✅ [Socket] Connected to backend:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ [Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('⚠️ [Socket] Connection error:', error);
  });

  return socket;
};

/**
 * Get Socket.io instance (ensures initialization)
 */
export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

/**
 * Emit new emergency via socket
 * Body: { id, type, origin, location, priority, hops }
 */
export const emitEmergency = (emergencyData) => {
  const sock = getSocket();
  sock.emit('new_emergency', emergencyData);
  console.log('🚨 [Socket] Emergency emitted:', emergencyData);
};

/**
 * Disconnect socket (cleanup)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
