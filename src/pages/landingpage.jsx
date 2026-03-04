import React from "react";
import { motion } from "framer-motion";
import {
  Swords,
  Zap,
  ShieldCheck,
  Users,
  Trophy,
  Code2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* -------------------------
   Small helpers
--------------------------*/
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  },
});

const floaty = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

function GlowBG() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* soft gradient blobs */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="absolute top-10 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute bottom-[-220px] left-[20%] h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-3xl" />

      {/* SILVER GRID */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(192,192,192,0.35) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />

    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 shadow-sm">
      <Sparkles className="h-4 w-4 text-fuchsia-300" />
      {children}
    </span>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <motion.div
      variants={floaty}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur"
    >
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10">
          <Icon className="h-6 w-6 text-fuchsia-200" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/60">{label}</div>
    </div>
  );
}

/* -------------------------
   Main Page
--------------------------*/
export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Swords,
      title: "Live 1v1 Battles",
      desc: "Create or join rooms, lock-in languages, and compete in real-time with a clean battle UI.",
    },
    {
      icon: Zap,
      title: "Instant Judging",
      desc: "Run submissions fast with automated evaluation, clear verdicts, and performance metrics.",
    },
    {
      icon: Users,
      title: "Realtime Match Flow",
      desc: "Ready checks, start triggers, timers, and submission events—smooth like a tournament platform.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Auth",
      desc: "JWT / OAuth-ready authentication and protected routes so your platform stays safe.",
    },
    {
      icon: Trophy,
      title: "History & Rankings",
      desc: "Track battles, see results, and build a leaderboard to keep users addicted (in a good way).",
    },
    {
      icon: Code2,
      title: "Modern Dev Stack",
      desc: "React + Tailwind UI, scalable backend services, and clean APIs designed for production.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#06060b] text-white">
      <GlowBG />

      {/* Top Nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp(0)}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <Swords className="h-5 w-5 text-fuchsia-200" />
          </div>
          <div>
            <div className="text-lg font-bold leading-none">CodeBattle</div>
            <div className="text-xs text-white/60">Compete. Compile. Conquer.</div>
          </div>
        </motion.div>

        <motion.button
          initial="hidden"
          animate="visible"
          variants={fadeUp(0.1)}
          onClick={() => navigate("/login")}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-white/10 hover:bg-white/90 active:scale-[0.98]"
        >
          Login / Register <ArrowRight className="h-4 w-4" />
        </motion.button>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-8 md:px-8 md:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left */}
          <div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp(0.15)}
            >
              <Badge>Battle-ready coding platform for students & devs</Badge>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp(0.25)}
              className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl"
            >
              The fastest way to{" "}
              <span className="bg-gradient-to-r from-fuchsia-300 via-white to-indigo-300 bg-clip-text text-transparent">
                practice, compete, and level up
              </span>{" "}
              with real-time coding battles.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp(0.35)}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/75"
            >
              CodeBattle lets you challenge friends, solve curated problems, and
              get instant verdicts. Built for speed, fairness, and a smooth
              competitive experience.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp(0.45)}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-6 py-3 font-semibold shadow-xl shadow-fuchsia-500/20 hover:opacity-95 active:scale-[0.98]"
              >
                Start Battling <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById("features");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white/90 hover:bg-white/10 active:scale-[0.98]"
              >
                Explore Features
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp(0.55)}
              className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3"
            >
              <Stat value="Real-time" label="Socket-driven battles" />
              <Stat value="Instant" label="Auto judging & verdicts" />
              <Stat value="Scalable" label="Service-ready backend" />
            </motion.div>
          </div>

          {/* Right: Showcase Card */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp(0.35)}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur">
              <div className="absolute inset-0 opacity-70">
                <div className="absolute -top-28 right-[-120px] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
                <div className="absolute -bottom-28 left-[-120px] h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white/90">
                    Battle Room Preview
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    Live
                  </span>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Problem</span>
                      <span>Difficulty: Medium</span>
                    </div>
                    <div className="mt-2 text-base font-semibold">
                      Two Sum — Competitive Edition
                    </div>
                    <p className="mt-2 text-sm text-white/65">
                      Solve under time pressure. Submit. Get verdict. Win.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-xs text-white/60">Player A</div>
                      <div className="mt-1 font-semibold">You</div>
                      <div className="mt-2 text-xs text-emerald-300">
                        READY ✓
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-xs text-white/60">Player B</div>
                      <div className="mt-1 font-semibold">Opponent</div>
                      <div className="mt-2 text-xs text-emerald-300">
                        READY ✓
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Judge</span>
                      <span className="text-fuchsia-200">Running...</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[65%] bg-gradient-to-r from-fuchsia-400 to-indigo-400" />
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      Verdict: <span className="text-amber-200">Pending</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-sm text-white/75">
                    Ready to join the arena?
                  </div>
                  <button
                    onClick={() => navigate("/login")}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98]"
                  >
                    Enter
                  </button>
                </div>
              </div>
            </div>

            {/* floating mini pill */}
           
          </motion.div>
        </div>

        {/* About */}
        <section className="mt-16 md:mt-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp(0)}
            className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur"
          >
            <h2 className="text-2xl font-bold">About CodeBattle</h2>
            <p className="mt-3 max-w-3xl text-white/75 leading-relaxed">
              CodeBattle is a competitive coding platform where users can battle
              in real-time, solve curated problems, and receive instant judging.
              It’s built to help students and developers improve speed, logic,
              and confidence through fun competition.
            </p>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="mt-14 md:mt-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp(0)}
            className="flex items-end justify-between gap-6"
          >
            <div>
              <h2 className="text-2xl font-bold">Features</h2>
              <p className="mt-2 text-white/70">
                Everything you need to build a world-class battle platform.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ staggerChildren: 0.08 }}
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-white/60">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-fuchsia-200" />
              <span className="font-semibold text-white/80">CodeBattle</span>
            </div>
            <p>© {new Date().getFullYear()} CodeBattle. Built for competitive coders.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}