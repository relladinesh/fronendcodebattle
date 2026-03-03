import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerApi } from "../api/authApi";
import { useAuth } from "../store/auth";

export default function Register() {
  const nav = useNavigate();
  const { saveAuth } = useAuth();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await registerApi(form);

      if (!res?.token) {
        setErr(res?.message || "Register failed");
        return;
      }

      saveAuth(res);
      nav("/dashboard");
    } catch (e2) {
      setErr(e2?.message || "Register error");
    } finally {
      setLoading(false);
    }
  }

  return (
  <div className="relative min-h-[100svh] w-full bg-[#06060b] text-white flex items-center justify-center px-4 py-10 overflow-hidden">
    
    {/* 🔥 Landing-style Background */}
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
          <h1 className="text-2xl font-extrabold tracking-tight">
            Create Account
          </h1>
          <p className="mt-1 text-sm text-white/65">
            Join CodeBattle and start competing today.
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
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={onChange}
            autoComplete="username"
          />

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
            autoComplete="new-password"
          />

          <button
            disabled={loading}
            className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-3 font-semibold shadow-lg shadow-fuchsia-500/20 hover:opacity-95 disabled:opacity-60 active:scale-[0.99] transition"
          >
            {loading ? "Please wait..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link
            className="text-fuchsia-300 underline hover:text-fuchsia-200"
            to="/login"
          >
            Login
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