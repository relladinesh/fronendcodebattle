import http from "./http";

export const loginApi = async (payload) => {
  const { data } = await http.post("/auth/login", payload);
  return data;
};

export const registerApi = async (payload) => {
  const { data } = await http.post("/auth/register", payload);
  return data;
};

export const googleCallbackApi = async (idToken) => {
  const { data } = await http.post("/auth/google/callback", { idToken });
  return data;
};

// ✅ NEW: persistent login
export const meApi = async () => {
  const { data } = await http.get("/auth/me");
  return data;
};

// ✅ NEW: server-side logout
export const logoutApi = async () => {
  const { data } = await http.post("/auth/logout");
  return data;
};