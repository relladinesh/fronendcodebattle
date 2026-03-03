import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi, googleCallbackApi } from "../api/authApi";
import { useAuth } from "../store/auth";

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
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="absolute top-10 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute bottom-[-220px] left-[20%] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
    </div>

    {/* Content */}
    <div className="relative z-10 w-full max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-7 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-white/65">
            Login to continue your CodeBattle journey.
          </p>
        </div>

        {err && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 outline-none focus:border-fuchsia-400/60"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
          />

          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 outline-none focus:border-fuchsia-400/60"
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
          />

          <button
            disabled={loading}
            className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-3 font-semibold shadow-lg shadow-fuchsia-500/20 hover:opacity-95 disabled:opacity-60 active:scale-[0.99] transition"
          >
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/50">OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* ✅ Responsive Google button wrapper (same as yours) */}
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
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} CodeBattle — Compete. Compile. Conquer.
      </p>
    </div>
  </div>
);
}