import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBattleDetailsApi } from "../api/historyApi";

/* ----------------- Premium UI helpers ----------------- */

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

function GlassCard({ children, className = "" }) {
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

/* ----------------- Page ----------------- */

export default function BattleDetails() {
  const { roomCode } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setErr("");
        setLoading(true);

        const res = await getBattleDetailsApi(roomCode);
        if (!res?.ok) {
          setErr(res?.message || "Not found");
          setData(null);
          return;
        }
        setData(res);
      } catch (e) {
        setErr(e?.message || "Failed");
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [roomCode]);

  const winnerLabel = useMemo(() => {
    if (!data) return "—";
    return (
      data.winnerUsername ||
      data.players?.find((p) => p.userId === data.winnerUserId)?.username ||
      data.players?.find((p) => p.userId === data.winnerUserId)?.email ||
      data.winnerUserId ||
      "Unknown"
    );
  }, [data]);

  const status = String(data?.status || "").toUpperCase();

  return (
    <div className="relative min-h-[100svh] w-full bg-[#06060b] text-white overflow-hidden">
      <GlowBG />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Header */}
        <GlassCard className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-white/55">History</div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Battle Details
              </div>
              <div className="text-sm text-white/60 mt-1 break-all">
                Room <span className="text-white/85 font-semibold">{roomCode}</span>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => nav("/dashboard")}
                className="w-full sm:w-auto h-11 px-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 font-semibold"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Error */}
        {err && (
          <GlassCard className="p-5 sm:p-6 border-rose-500/20 bg-rose-500/10">
            <div className="font-semibold text-rose-200">Error</div>
            <div className="text-sm mt-1 break-words text-rose-100/90">{err}</div>
            <Link className="inline-block mt-3 text-fuchsia-200 underline" to="/dashboard">
              ← Back
            </Link>
          </GlassCard>
        )}

        {/* Loading */}
        {loading && !err && (
          <GlassCard className="p-5 sm:p-6">
            <div className="text-white/70">Loading battle details...</div>
          </GlassCard>
        )}

        {/* Content */}
        {!loading && !err && data && (
          <>
            {/* Summary */}
            <GlassCard className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-lg font-extrabold break-words">
                      {(data.topic || "TOPIC").toUpperCase()}
                    </div>
                    <Badge tone={statusTone(status)}>{status || "—"}</Badge>
                    <span className="text-xs text-white/45 break-all">
                      Room: <span className="text-white/75">{data.roomCode}</span>
                    </span>
                  </div>

                  <div className="text-sm text-white/70 mt-2">
                    Winner:{" "}
                    <span className="text-emerald-300 font-semibold break-words">
                      {winnerLabel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => navigator.clipboard?.writeText?.(data.roomCode)}
                    className="w-full h-11 px-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 font-semibold"
                  >
                    Copy Room Code
                  </button>

                  <Link
                    to="/dashboard"
                    className="w-full h-11 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 font-semibold text-center leading-[44px]"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </GlassCard>

            {/* Players + Problems */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Players */}
              <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="text-lg font-bold">Players</div>
                  <div className="text-xs text-white/45 mt-1">Sorted by score</div>
                </div>

                {(data.players || []).length === 0 ? (
                  <div className="px-5 py-6 text-white/55">No players</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {(data.players || []).map((p) => {
                      const name = p.username || p.email || p.userId;
                      const isWinner = p.userId === data.winnerUserId;

                      return (
                        <div
                          key={p.userId}
                          className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.03]"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className={`text-sm font-semibold truncate max-w-[60vw] sm:max-w-none ${
                                  isWinner ? "text-emerald-300" : "text-white/90"
                                }`}
                              >
                                {name}
                              </p>
                              {isWinner && <Badge tone="green">Winner</Badge>}
                            </div>
                            <p className="text-xs text-white/45 truncate">{p.userId}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-emerald-300 font-extrabold">{p.score}</div>
                            <div className="text-xs text-white/45">score</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>

              {/* Problems */}
              <GlassCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="text-lg font-bold">Problems</div>
                  <div className="text-xs text-white/45 mt-1">Battle questions list</div>
                </div>

                {(data.problems || []).length === 0 ? (
                  <div className="px-5 py-6 text-white/55">No problems</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {(data.problems || []).map((pr) => (
                      <div key={pr.problemId} className="px-5 py-4 hover:bg-white/[0.03]">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold break-words min-w-0">
                            {pr.order}. {pr.title}
                          </p>
                          <span className="text-xs text-white/45 shrink-0">
                            {pr.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-white/45 mt-1 break-words">{pr.topic}</p>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Submissions */}
            <GlassCard className="overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <div className="text-lg font-bold">Submissions</div>
                <div className="text-xs text-white/45 mt-1">All submissions in this battle</div>
              </div>

              {(data.submissions || []).length === 0 ? (
                <div className="px-5 py-6 text-white/55">No submissions</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {(data.submissions || []).map((s) => {
                    const submitter = s.username || s.userId;
                    const verdict = String(s.verdict || "").toUpperCase();

                    return (
                      <div
                        key={s.id}
                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/[0.03]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{submitter}</p>
                          <p className="text-xs text-white/45 break-words">
                            {s.problemId} • {s.language}
                          </p>
                        </div>

                        <Badge tone={verdict === "AC" ? "green" : "red"}>
                          {verdict || "—"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>

            <div className="text-xs text-white/45 px-1">
              <Link className="text-fuchsia-200 underline" to="/dashboard">
                ← Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}