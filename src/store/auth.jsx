import { createContext, useContext, useEffect, useState } from "react";
import { meApi, logoutApi } from "../api/authApi";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email, username }
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [booting, setBooting] = useState(true); // helps avoid UI flicker

  const saveAuth = (res) => {
    if (res?.token) {
      localStorage.setItem("token", res.token);
      setToken(res.token);
    }
    if (res?.user) setUser(res.user);
  };

  // ✅ Persistent login: on refresh, verify token with backend session
  useEffect(() => {
    let ignore = false;

    async function boot() {
      try {
        if (!token) {
          if (!ignore) {
            setUser(null);
            setBooting(false);
          }
          return;
        }

        const res = await meApi(); // uses Authorization from http interceptor
        if (!res?.ok) throw new Error(res?.message || "Unauthorized");

        if (!ignore) {
          setUser(res.user || null);
          setBooting(false);
        }
      } catch (e) {
        // token invalid OR session deleted => logout locally
        localStorage.removeItem("token");
        if (!ignore) {
          setToken("");
          setUser(null);
          setBooting(false);
        }
      }
    }

    boot();
    return () => {
      ignore = true;
    };
  }, [token]);

  // ✅ Server-side logout + local cleanup
  const logout = async () => {
    try {
      if (localStorage.getItem("token")) {
        await logoutApi();
      }
    } catch {
      // even if server fails, remove locally
    } finally {
      localStorage.removeItem("token");
      setToken("");
      setUser(null);
    }
  };

  return (
    <AuthCtx.Provider value={{ user, token, booting, saveAuth, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);