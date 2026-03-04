import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi, googleCallbackApi } from "../api/authApi";
import { useAuth } from "../store/auth";
import GlowBg from "../components/common/Glowbg"

import { motion } from "framer-motion";
import "../index.css";

import {
  Swords,
  Zap,
  ShieldCheck,
  Users,
  Trophy,
  Code2,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export default function Login() {
 
  const nav = useNavigate();
  const { saveAuth } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ prevent multiple initialization (StrictMode safe)
  const gsiInitedRef = useRef(false);
  const googleBtnRef = useRef(null);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await loginApi(form);

      if (!res?.token) {
        setErr(res?.message || "Login failed");
        return;
      }

      saveAuth(res);
      nav("/dashboard");
    } catch (e2) {
      setErr(e2?.message || "Login error");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Load Google Identity script only once
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setErr("Missing VITE_GOOGLE_CLIENT_ID in .env / Vercel env");
      return;
    }

    // if already loaded
    if (window.google?.accounts?.id) {
      initGsi(clientId);
      return;
    }

    // prevent duplicate script
    const existing = document.querySelector('script[data-gsi="true"]');
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.gsi = "true";

    script.onload = () => initGsi(clientId);
    script.onerror = () => setErr("Failed to load Google login script");

    document.body.appendChild(script);
  }, []);

  function initGsi(clientId) {
    if (gsiInitedRef.current) return;
    if (!window.google?.accounts?.id) return;

    gsiInitedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: "popup",
      callback: async (response) => {
        try {
          setErr("");
          setLoading(true);

          const idToken = response?.credential;
          if (!idToken) {
            setErr("Google did not return token");
            return;
          }

          const res = await googleCallbackApi(idToken);

          if (!res?.token) {
            setErr(res?.message || "Google login failed");
            return;
          }

          saveAuth(res);
          nav("/dashboard");
        } catch (e) {
          setErr(e?.message || "Google login error");
        } finally {
          setLoading(false);
        }
      },
    });

    // ✅ Render official Google button directly
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: 320, // Google’s button width; we’ll wrap it responsively below
      });
    }
  }

  return (
<div className="relative min-h-[100svh] w-full bg-[#06060b] text-white flex items-center justify-center px-4 py-10 overflow-hidden">
    {/* 🔥 Landing-like background */}
    <GlowBg />
    

    {/* Content */}
    <div className="relative z-10 w-full max-w-md">
      <motion.div
  initial={{ opacity: 0, y: 18, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
  whileHover={{ y: -2 }}
  className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-7 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur"
>
  {/* Header */}
  <div className="mb-6 relative">
    {/* Back button (premium pill) */}
    <button
      onClick={() => nav("/")}
      className="absolute left-0 top-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>

    {/* Center logo */}
    <div className="pt-1 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
        <Swords className="h-7 w-7 text-fuchsia-200" />
      </div>

      <h1 className="mt-4 text-[22px] font-semibold tracking-tight">
        Welcome back
      </h1>

      <p className="mt-1 text-sm text-white/60">
        Login to continue your CodeBattle journey.
      </p>
    </div>
  </div>

  {err && (
    <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
      {err}
    </div>
  )}

  {/* Form */}
  <form onSubmit={onSubmit} className="space-y-3">
    {/* Email */}
    <div className="group relative">
      <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-white/0 via-white/0 to-white/0 opacity-0 blur transition group-focus-within:opacity-100 group-focus-within:from-fuchsia-500/18 group-focus-within:via-indigo-500/12 group-focus-within:to-cyan-500/12" />
      <input
        className="relative w-full rounded-2xl border border-white/10 bg-black/25 p-3 outline-none transition
                   focus:border-white/20 focus:bg-black/30 shadow-inner shadow-black/30"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={onChange}
        autoComplete="email"
      />
    </div>

    {/* Password */}
    <div className="group relative">
      <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-white/0 via-white/0 to-white/0 opacity-0 blur transition group-focus-within:opacity-100 group-focus-within:from-fuchsia-500/18 group-focus-within:via-indigo-500/12 group-focus-within:to-cyan-500/12" />
      <input
        className="relative w-full rounded-2xl border border-white/10 bg-black/25 p-3 outline-none transition
                   focus:border-white/20 focus:bg-black/30 shadow-inner shadow-black/30"
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={onChange}
        autoComplete="current-password"
      />
    </div>

    {/* Button */}
    <motion.button
      disabled={loading}
      whileTap={{ scale: 0.99 }}
      whileHover={{ scale: loading ? 1 : 1.01 }}
      className="relative w-full min-h-[48px] overflow-hidden rounded-2xl
                 bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-3 font-semibold
                 shadow-lg shadow-fuchsia-500/15 hover:opacity-95 disabled:opacity-60 transition"
    >
      {/* shine */}
      <span className="absolute inset-0 opacity-0 hover:opacity-100 transition">
        <span className="absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-white/20 blur-md animate-[shine_1.8s_linear_infinite]" />
      </span>

      <span className="relative">{loading ? "Please wait..." : "Login"}</span>
    </motion.button>

    {/* tiny trust text */}
    <p className="text-center text-xs text-white/45">
      Secure login • Google OAuth supported
    </p>
  </form>

  {/* Divider */}
  <div className="my-6 flex items-center gap-3">
    <div className="h-px flex-1 bg-white/10" />
    <span className="text-xs text-white/45">OR</span>
    <div className="h-px flex-1 bg-white/10" />
  </div>

  {/* Google */}
  <div className="w-full flex justify-center">
    <div className="w-full max-w-[320px] overflow-hidden rounded-xl">
      <div ref={googleBtnRef} className="w-full" />
    </div>
  </div>

  <p className="mt-5 text-center text-sm text-white/70">
    New here?{" "}
    <Link className="text-fuchsia-300 underline hover:text-fuchsia-200" to="/register">
      Create account
    </Link>
  </p>
</motion.div>

      <p className="mt-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} CodeBattle — Compete. Compile. Conquer.
      </p>
    </div>
  </div>  
);
}