import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { makeSocket } from "../lib/socket";

const TOPICS = ["arrays", "strings", "dp", "graphs", "trees"];
const MIN_MINUTES = 1;
const MAX_MINUTES = 120;

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="text-sm text-white/70">{label}</label>
      <div className="mt-2">{children}</div>
      {hint && <p className="text-xs text-white/45 mt-2">{hint}</p>}
    </div>
  );
}

function GlowShell({ children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function SocketPill({ status }) {
  const s = String(status || "").toLowerCase();
  const tone =
    s === "connected"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      : s.includes("error")
      ? "border-rose-500/25 bg-rose-500/10 text-rose-200"
      : "border-white/10 bg-white/5 text-white/70";

  return (
    <div className={`text-xs px-3 py-2 rounded-2xl border ${tone} whitespace-nowrap`}>
      Socket: <span className="font-semibold">{status}</span>
    </div>
  );
}

export default function CreateRoom() {
  const nav = useNavigate();
  const { token } = useAuth();
  const socketRef = useRef(null);

  const [status, setStatus] = useState("connecting...");
  const [err, setErr] = useState("");

  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("3");
  const [maxPlayers, setMaxPlayers] = useState("2");
  const [timerMinutes, setTimerMinutes] = useState("10");

  useEffect(() => {
    if (!token) return;

    const socket = makeSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", (e) => setStatus(e?.message || "connect_error"));
    socket.on("room:error", (msg) => setErr(String(msg || "Room error")));

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const validateCreate = () => {
    if (!topic) return "Select topic";
    const qc = Number(questionCount);
    const mp = Number(maxPlayers);
    const tm = Number(timerMinutes);

    if (!qc || qc < 1 || qc > 10) return "Question count must be 1 to 10";
    if (!mp || mp < 2 || mp > 10) return "Max players must be 2 to 10";
    if (!tm || tm < MIN_MINUTES || tm > MAX_MINUTES)
      return `Timer must be ${MIN_MINUTES}-${MAX_MINUTES} minutes`;

    return "";
  };

  const createRoom = () => {
    setErr("");
    const socket = socketRef.current;
    if (!socket || !socket.connected) return setErr("Socket not connected");

    const v = validateCreate();
    if (v) return setErr(v);

    socket.emit(
      "room:create",
      {
        topic,
        questionCount: Number(questionCount),
        maxPlayers: Number(maxPlayers),
        timerSeconds: Number(timerMinutes) * 60,
      },
      (ack) => {
        if (!ack?.ok) return setErr(ack?.message || "Create failed");
        nav(`/room/${ack.room.roomId}`);
      }
    );
  };

  const validationMsg = validateCreate();
  const canCreate = !validationMsg;

  return (
    <div className="relative min-h-[100svh] w-full bg-[#06060b] text-white overflow-hidden">
      {/* Landing-style background */}
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
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Header card */}
        <GlowShell>
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-white/60">Room Setup</div>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Create Room
                </h1>
                <p className="mt-2 text-sm text-white/65">
                  Configure a battle room and share the code with your friend.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <SocketPill status={status} />
              </div>
            </div>

            {err ? (
              <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                {err}
              </div>
            ) : !canCreate ? (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                {validationMsg}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/65">
                Tip: Choose a topic, then set count/players/timer — and hit{" "}
                <b className="text-white">Create Room</b>.
              </div>
            )}
          </div>
        </GlowShell>

        {/* Form card */}
        <GlowShell>
          <div className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Topic" hint="Choose the topic set for random problems.">
                  <select
                    className="w-full h-12 px-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="">Select topic</option>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Question Count" hint="1 to 10 problems per battle.">
                <input
                  className="w-full h-12 px-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  min={1}
                  max={10}
                />
              </Field>

              <Field label="Max Players" hint="2 to 10 players.">
                <input
                  className="w-full h-12 px-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  min={2}
                  max={10}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Timer (minutes)" hint={`Allowed: ${MIN_MINUTES}-${MAX_MINUTES} minutes`}>
                  <input
                    className="w-full h-12 px-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
                    type="number"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    min={MIN_MINUTES}
                    max={MAX_MINUTES}
                  />
                </Field>
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={createRoom}
                  disabled={!canCreate}
                  className="w-full sm:flex-1 h-12 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 font-semibold shadow-lg shadow-fuchsia-500/20 hover:opacity-95 disabled:opacity-50"
                >
                  Create Room
                </button>

                <button
                  onClick={() => nav("/dashboard")}
                  className="w-full sm:w-auto h-12 px-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 font-semibold"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="mt-4 text-xs text-white/45">
              After creation, you will be redirected to Lobby (<code>/room/:roomId</code>).
            </div>
          </div>
        </GlowShell>
      </div>
    </div>
  );
}