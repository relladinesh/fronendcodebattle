// src/lib/socket.js
import { io } from "socket.io-client";

const GATEWAY_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function makeSocket(token) {
  return io(GATEWAY_URL, {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    auth: { token }, // ✅ socketAuth reads this
  });
}