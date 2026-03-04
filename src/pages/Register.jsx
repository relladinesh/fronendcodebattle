import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerApi } from "../api/authApi";
import { useAuth } from "../store/auth";
import { motion } from "framer-motion";
import { Swords, ArrowLeft } from "lucide-react";

/* background same as login */
function GlowBG() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* soft gradient blobs */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="absolute top-10 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute bottom-[-220px] left-[20%] h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-3xl" />

      {/* SILVER GRID (visible) */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(192,192,192,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(192,192,192,0.35) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
    </div>
  );
}

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
      <GlowBG />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-7 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur"
        >
          {/* Header (same as login) */}
          <div className="mb-6 relative">
            {/* back */}
            <button
              onClick={() => nav("/login")}
              className="absolute left-0 top-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {/* logo center */}
            <div className="pt-1 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <Swords className="h-7 w-7 text-fuchsia-200" />
              </div>

              <h1 className="mt-4 text-[22px] font-semibold tracking-tight">
                Create account
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Join CodeBattle and start competing today.
              </p>
            </div>
          </div>

          {err && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {err}
            </div>
          )}

          {/* Form (same premium inputs) */}
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="group relative">
              <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-white/0 via-white/0 to-white/0 opacity-0 blur transition group-focus-within:opacity-100 group-focus-within:from-fuchsia-500/18 group-focus-within:via-indigo-500/12 group-focus-within:to-cyan-500/12" />
              <input
                className="relative w-full rounded-2xl border border-white/10 bg-black/25 p-3 outline-none transition
                           focus:border-white/20 focus:bg-black/30 shadow-inner shadow-black/30"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={onChange}
                autoComplete="username"
              />
            </div>

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
                autoComplete="new-password"
              />
            </div>

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

              <span className="relative">
                {loading ? "Please wait..." : "Create account"}
              </span>
            </motion.button>

            <p className="text-center text-xs text-white/45">
              Create an account • Start battling in minutes
            </p>
          </form>

          <p className="mt-5 text-center text-sm text-white/70">
            Already have an account?{" "}
            <Link className="text-fuchsia-300 underline hover:text-fuchsia-200" to="/login">
              Login
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