import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentBattlesApi } from "../api/historyApi";
import { useAuth } from "../store/auth";
import { makeSocket } from "../lib/socket";
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
import LogoutButton from "../components/logout/logout";

/* ---------------- Premium UI bits ---------------- */

function GlowBG() {
  return (
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
  );
}

function GlowShell({ children, className = "" }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const cls =
    tone === "green"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/25"
      : tone === "red"
      ? "bg-rose-500/15 text-rose-200 border-rose-500/25"
      : tone === "yellow"
      ? "bg-amber-500/15 text-amber-200 border-amber-500/25"
      : "bg-white/5 text-white/70 border-white/10";

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

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition",
        active
          ? "bg-white text-black border-white"
          : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="h-4 w-40 bg-white/10 rounded mb-2" />
        <div className="h-3 w-72 bg-white/10 rounded" />
      </div>
      <div className="h-9 w-28 bg-white/10 rounded-2xl" />
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function Dashboard() {
  const nav = useNavigate();
  const { user, token } = useAuth();

  // history
  const [battles, setBattles] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");

  // ✅ NEW: how many battles fetched from backend (5 / 20 / 50)
  const [fetchLimit, setFetchLimit] = useState(5);

  // ✅ pagination ALWAYS 5 per page
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  // join room
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [joining, setJoining] = useState(false);
  const socketRef = useRef(null);

  // init socket for JOIN only
  useEffect(() => {
    if (!token) return;

    const s = makeSocket(token);
    socketRef.current = s;

    s.on("connect_error", (e) => setJoinErr(e?.message || "Socket error"));
    s.on("room:error", (m) => setJoinErr(String(m || "Room error")));
    s.on("room:cancelled", () => nav("/dashboard"));
    s.on("battle:started", (startedRoom) => nav(`/battle/${startedRoom.roomId}`));

    return () => {
      return () => {
  s.off("connect_error");
  s.off("room:error");
  s.off("room:cancelled");
  s.off("battle:started");
  // ❌ do NOT disconnect here
};
    };
  }, [token, nav]);

  // ✅ LOAD HISTORY FUNCTION (fix)
  async function loadHistory(limit = 5) {
    try {
      setErr("");
      setLoading(true);

      const res = await getRecentBattlesApi(limit);
      if (!res || !Array.isArray(res.battles)) {
        setBattles([]);
        setErr(res?.message || "Failed to load history");
        setHistoryLoaded(true);
        setFetchLimit(limit);
        setPage(1);
        return;
      }

      setBattles(res.battles);
      setHistoryLoaded(true);
      setFetchLimit(limit);
      setPage(1);
    } catch (e) {
      setErr(e?.message || "Failed to load history");
      setBattles([]);
      setHistoryLoaded(true);
      setFetchLimit(limit);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }

  // ✅ AUTO-LOAD only recent 5
  useEffect(() => {
    loadHistory(5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ✅ pagination derived (5 per page always)
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const pagedBattles = filtered.slice(pageStart, pageEnd);

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

  const showPagination = historyLoaded && !loading && fetchLimit > 5 && totalItems > 0;

  return (
    <div className="relative min-h-[100svh] bg-[#06060b] text-white overflow-hidden">
      <GlowBG />

      
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Actions row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlowShell className="p-5 sm:p-6">
            <div className="text-lg font-bold">Create Room</div>
            <div className="text-sm text-white/60 mt-1">
              Start a new battle and invite players.
            </div>

            <button
              onClick={() => nav("/create-room")}
              className="mt-4 w-full h-11 rounded-2xl bg-white text-black font-semibold hover:bg-white/90"
            >
              Create Room
            </button>
          </GlowShell>

          <GlowShell className="p-5 sm:p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Join Room</div>
                <div className="text-sm text-white/60 mt-1">
                  Paste room code to enter lobby.
                </div>
              </div>

              <button
                onClick={() => loadHistory(fetchLimit)}
                disabled={loading}
                className="h-10 px-4 rounded-2xl bg-white/10 border border-white/10 font-semibold hover:bg-white/15 disabled:opacity-60"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter room code (example: a1b2c3)"
                className="w-full flex-1 h-11 px-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
              />

              <button
                disabled={joining}
                onClick={joinRoom}
                className="w-full sm:w-auto h-11 px-5 rounded-2xl font-semibold bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:opacity-95 disabled:opacity-60"
              >
                {joining ? "Joining..." : "Join"}
              </button>
            </div>

            {joinErr && (
              <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                {joinErr}
              </div>
            )}
          </GlowShell>
        </div>

        {/* History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <GlowShell>
              <div className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold">Battle History</div>
                    <div className="text-sm text-white/60">
                      Auto-loads recent 5. Load 20/50 to enable pagination (5 per page).
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => loadHistory(20)}
                      disabled={loading}
                      className="h-10 px-4 rounded-2xl bg-white text-black font-semibold hover:bg-white/90 disabled:opacity-60"
                    >
                      Load 20
                    </button>
                    <button
                      onClick={() => loadHistory(50)}
                      disabled={loading}
                      className="h-10 px-4 rounded-2xl bg-white/10 border border-white/10 font-semibold hover:bg-white/15 disabled:opacity-60"
                    >
                      Load 50
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by topic, room, winner..."
                    className="md:col-span-2 h-11 px-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-fuchsia-400/60"
                  />
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
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
                    <Chip
                      key={st}
                      active={status === st}
                      onClick={() => {
                        setStatus(st);
                        setPage(1);
                      }}
                    >
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
                      <div className="text-white/80 font-semibold">History is not loaded yet</div>
                      <div className="mt-2 text-sm text-white/55">
                        Click <b>Load 20</b> or <b>Load 50</b>.
                      </div>
                    </div>
                  ) : loading ? (
                    <div className="divide-y divide-white/10">
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-white/60">No battles found.</div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {(fetchLimit <= 5 ? filtered.slice(0, 5) : pagedBattles).map((b) => {
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

                {/* ✅ Pagination only for 20/50 mode */}
                {showPagination && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-xs text-white/50">
                      Showing <b>{pageStart + 1}</b>–<b>{Math.min(pageEnd, totalItems)}</b> of{" "}
                      <b>{totalItems}</b> • <b>5</b> per page
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="h-10 px-4 rounded-2xl bg-white/10 border border-white/10 font-semibold hover:bg-white/15 disabled:opacity-50"
                      >
                        Prev
                      </button>

                      <div className="text-sm text-white/70 px-3">
                        Page <b>{page}</b> / <b>{totalPages}</b>
                      </div>

                      <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="h-10 px-4 rounded-2xl bg-white/10 border border-white/10 font-semibold hover:bg-white/15 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-white/45">
                  Tip: Auto-loading 5 keeps dashboard fast. Load more only when needed.
                </div>
              </div>
            </GlowShell>
          </div>

          {/* side card */}
          <GlowShell className="p-5 sm:p-6">
            <div className="text-lg font-bold">Quick Tips</div>
            <ul className="mt-3 text-sm text-white/65 space-y-2">
              <li>• Create a room and share code with your friend.</li>
              <li>• Join a room using the code.</li>
              <li>• History loads 5 by default for speed.</li>
              <li>• Load 20/50 to enable paging (5 per page).</li>
            </ul>

            <button
              onClick={() => loadHistory(5)}
              className="mt-5 w-full h-11 rounded-2xl bg-white/10 border border-white/10 font-semibold hover:bg-white/15"
            >
              Reset to Recent 5
            </button>
          </GlowShell>
        </div>
      </div>
    </div>
  );
}