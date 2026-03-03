import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentBattlesApi } from "../api/historyApi";
import { useAuth } from "../store/auth";
import { makeSocket } from "../lib/socket";
import LogoutButton from "../components/logout/logout";

/* -----------------------------
   UI Helpers
------------------------------*/
function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
        active
          ? "bg-white text-black border-white/20"
          : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = "slate" }) {
  const cls =
    tone === "green"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : tone === "red"
      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
      : tone === "yellow"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-slate-500/15 text-slate-300 border-slate-500/30";

  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function statusTone(status) {
  const s = String(status || "").toUpperCase();
  if (s === "FINISHED") return "green";
  if (s === "CANCELLED") return "red";
  if (s === "ACTIVE") return "yellow";
  return "slate";
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

function SkeletonRow() {
  return (
    <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-white/10">
      <div className="space-y-2 w-full">
        <div className="h-4 w-56 bg-white/10 rounded" />
        <div className="h-3 w-80 bg-white/10 rounded" />
        <div className="h-3 w-40 bg-white/10 rounded" />
      </div>
      <div className="flex gap-2 w-full lg:w-auto">
        <div className="h-9 w-full lg:w-24 bg-white/10 rounded-xl" />
        <div className="h-9 w-full lg:w-28 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

/* -----------------------------
   Main
------------------------------*/
export default function Dashboard() {
  const nav = useNavigate();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [battles, setBattles] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");

  // join room
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [joining, setJoining] = useState(false);
  const socketRef = useRef(null);

  // init socket for JOIN only (keep it light)
  useEffect(() => {
    if (!token) return;

    const s = makeSocket(token);
    socketRef.current = s;

    s.on("connect_error", (e) => setJoinErr(e?.message || "Socket error"));
    s.on("room:error", (m) => setJoinErr(String(m || "Room error")));
    s.on("room:cancelled", () => nav("/dashboard"));
    s.on("battle:started", (startedRoom) => nav(`/battle/${startedRoom.roomId}`));

    return () => {
      s.off();
      s.disconnect();
      socketRef.current = null;
    };
  }, [token, nav]);

  async function loadHistory(limit = 20) {
    try {
      setErr("");
      setLoading(true);

      const res = await getRecentBattlesApi(limit);

      if (!res || !Array.isArray(res.battles)) {
        setBattles([]);
        setErr(res?.message || "Failed to load history");
        setHistoryLoaded(true);
        return;
      }

      setBattles(res.battles);
      setHistoryLoaded(true);
    } catch (e) {
      setErr(e?.message || "Failed to load history");
      setBattles([]);
      setHistoryLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return (battles || []).filter((b) => {
      const s = String(b.status || "").toUpperCase();
      const topic = String(b.topic || "").toLowerCase();
      const room = String(b.roomCode || "").toLowerCase();
      const winner = String(b.winnerUsername || "").toLowerCase();

      const statusOk = status === "ALL" ? true : s === status;
      const qOk =
        !text ||
        topic.includes(text) ||
        room.includes(text) ||
        winner.includes(text) ||
        s.toLowerCase().includes(text);

      return statusOk && qOk;
    });
  }, [battles, q, status]);

  const joinRoom = () => {
    setJoinErr("");
    const code = String(joinCode || "").trim();
    if (!code) return setJoinErr("Enter a room code");

    const s = socketRef.current;
    if (!s || !s.connected) return setJoinErr("Socket not connected");

    setJoining(true);

    s.emit("room:join", { roomId: code }, (ack) => {
      setJoining(false);
      if (!ack?.ok) return setJoinErr(ack?.message || "Join failed");
      nav(`/room/${code}`);
    });
  };

  const displayName = user?.username || user?.email || "Player";

  return (
    <div className="min-h-[100svh] w-full text-white">
      {/* Premium header (no extra heavy navbar needed) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <GlowShell>
          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-white/60">Dashboard</div>
              <div className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, <span className="text-white">{displayName}</span>
              </div>
              <div className="mt-2 text-sm text-white/65 max-w-2xl">
                Create a room, join with code, and load battle history only when you need it.
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => nav("/create-room")}
                className="h-10 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 font-semibold shadow-lg shadow-fuchsia-500/20 hover:opacity-95 active:scale-[0.99] transition"
              >
                Create Room
              </button>
              <LogoutButton />
            </div>
          </div>
        </GlowShell>
      </div>

      {/* Content grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Join + Quick actions */}
        <div className="space-y-5">
          {/* Join Room */}
          <GlowShell>
            <div className="p-5 sm:p-6">
              <div className="text-lg font-bold">Join Room</div>
              <div className="mt-1 text-sm text-white/65">
                Paste a room code to enter the lobby.
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter room code (example: a1b2c3)"
                  className="w-full h-12 px-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
                />

                <button
                  disabled={joining}
                  onClick={joinRoom}
                  className="w-full h-12 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60 active:scale-[0.99] transition"
                >
                  {joining ? "Joining..." : "Join Room"}
                </button>

                {joinErr && (
                  <div className="text-rose-200 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-sm">
                    {joinErr}
                  </div>
                )}
              </div>
            </div>
          </GlowShell>

          {/* Quick actions */}
          <GlowShell>
            <div className="p-5 sm:p-6">
              <div className="text-lg font-bold">Quick Actions</div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => nav("/create-room")}
                  className="h-12 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 font-semibold"
                >
                  Create
                </button>
                <button
                  onClick={() => setJoinCode("")}
                  className="h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-semibold text-white/80"
                >
                  Clear Code
                </button>
              </div>

              <div className="mt-4 text-xs text-white/55">
                Tip: Use <b>Create</b> to start a new battle, then share the room code.
              </div>
            </div>
          </GlowShell>
        </div>

        {/* Right column: History (lazy loaded) */}
        <div className="lg:col-span-2">
          <GlowShell>
            <div className="p-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-lg font-bold">Battle History</div>
                  <div className="text-sm text-white/60">
                    Load recent battles only when you want (faster dashboard).
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => loadHistory(20)}
                    disabled={loading}
                    className="h-10 px-4 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60"
                  >
                    {historyLoaded ? "Reload (20)" : "Load (20)"}
                  </button>
                  <button
                    onClick={() => loadHistory(100)}
                    disabled={loading}
                    className="h-10 px-4 rounded-2xl bg-white/10 border border-white/10 font-semibold hover:bg-white/15 disabled:opacity-60"
                  >
                    Load 100
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by topic, room, winner..."
                  className="md:col-span-2 h-11 px-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
                />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-11 px-3 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
                >
                  <option value="ALL">All</option>
                  <option value="FINISHED">FINISHED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="WAITING">WAITING</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* quick filter chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {["ALL", "FINISHED", "ACTIVE", "WAITING", "CANCELLED"].map((st) => (
                  <Chip key={st} active={status === st} onClick={() => setStatus(st)}>
                    {st}
                  </Chip>
                ))}
              </div>

              {err && (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {err}
                </div>
              )}

              {/* Content */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                {!historyLoaded && !loading ? (
                  <div className="p-8 text-center">
                    <div className="text-white/80 font-semibold">
                      History is not loaded yet
                    </div>
                    <div className="mt-2 text-sm text-white/55">
                      Click <b>Load (20)</b> to fetch recent battles.
                    </div>
                  </div>
                ) : loading ? (
                  <div className="divide-y divide-white/10">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center text-white/60">
                    No battles found for this filter.
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {filtered.map((b) => {
                      const s = String(b.status || "").toUpperCase();
                      return (
                        <div
                          key={b.roomCode}
                          className="px-5 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 hover:bg-white/5 transition"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-semibold truncate max-w-[70vw] sm:max-w-none">
                                {(b.topic || "TOPIC").toUpperCase()}
                              </div>
                              <Badge tone={statusTone(s)}>{s}</Badge>
                              <span className="text-xs text-white/55 break-all">
                                Room: <span className="text-white/85">{b.roomCode}</span>
                              </span>
                            </div>

                            <div className="mt-1 text-sm text-white/70 flex flex-wrap gap-x-2 gap-y-1">
                              <span>
                                Players: <span className="text-white">{b.playerCount}</span>
                              </span>
                              <span className="text-white/30">·</span>
                              <span>
                                Questions: <span className="text-white">{b.questionCount}</span>
                              </span>
                              <span className="text-white/30">·</span>
                              <span>
                                Timer: <span className="text-white">{b.timerSeconds}s</span>
                              </span>
                            </div>

                            <div className="mt-1 text-sm text-white/60">
                              Winner:{" "}
                              <span className="text-emerald-300 font-semibold break-words">
                                {b.winnerUsername || "—"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:flex gap-2 w-full lg:w-auto">
                            <button
                              onClick={() => nav(`/history/${b.roomCode}`)}
                              className="w-full px-4 py-2 rounded-2xl bg-white text-black hover:bg-white/90 font-semibold"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => navigator.clipboard?.writeText?.(b.roomCode)}
                              className="w-full px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-semibold"
                            >
                              Copy Code
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-white/45">
                Tip: Loading history on-demand makes your dashboard faster and feels premium.
              </div>
            </div>
          </GlowShell>
        </div>
      </div>
    </div>
  );
}