import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./auth";

const SocketCtx = createContext(null);

const GATEWAY_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // ✅ if no token, disconnect existing socket
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    // ✅ already created
    if (socketRef.current) return;

    const socket = io(GATEWAY_URL, {
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false, // ✅ important
    });

    // ✅ set token before connect
    socket.auth = { token };
    socket.connect();

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (e) => console.log("socket connect_error:", e?.message));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const value = useMemo(() => {
    return { socket: socketRef.current, connected };
  }, [connected]);

  return <SocketCtx.Provider value={value}>{children}</SocketCtx.Provider>;
}

export const useSocket = () => useContext(SocketCtx);