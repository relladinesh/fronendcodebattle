import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const http = axios.create({
  baseURL,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.message || err?.message || "Network error";
    return Promise.reject(new Error(msg));
  }
);

export default http;