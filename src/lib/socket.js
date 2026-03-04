// src/lib/socket.js
import { io } from "socket.io-client";

let socket = null;
let currentToken = null;

export function makeSocket(token) {
  if (!token) return null;

  // recreate only if token changed
  if (socket && currentToken !== token) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch {}
    socket = null;
    currentToken = null;
  }

  if (!socket) {
    currentToken = token;

    socket = io(import.meta.env.VITE_GATEWAY_URL, {
      // ✅ allow fallback
      transports: ["polling", "websocket"],
      auth: { token },

      withCredentials: true,

      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 600,
      timeout: 20000,
    });

    // optional: helps debugging
    socket.on("connect_error", (e) => {
      console.log("socket connect_error:", e?.message, e);
    });
  }

  return socket;
}

export function destroySocket() {
  if (!socket) return;
  try {
    socket.removeAllListeners();
    socket.disconnect();
  } catch {}
  socket = null;
  currentToken = null;
}