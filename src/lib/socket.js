// src/lib/socket.js
import { io } from "socket.io-client";

let socket = null;
let currentToken = null;

export function makeSocket(token) {
  if (!token) return null;

  // if token changed (logout/login), recreate
  if (socket && currentToken !== token) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }

  if (!socket) {
    currentToken = token;
    socket = io(import.meta.env.VITE_GATEWAY_URL, {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 400,
    });
  }

  return socket;
}

export function destroySocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}