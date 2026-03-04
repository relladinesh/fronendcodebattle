import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../store/auth";
import { makeSocket } from "../lib/socket";
import Editor from "@monaco-editor/react";

const LANGS = [
  { label: "Java", value: 62 },
  { label: "Python", value: 71 },
];

function starterFieldForLang(language_id) {
  if (language_id === 62) return "starterJava";
  if (language_id === 71) return "starterPython";
  return null;
}

const HELPERS_START = "__HELPERS_START__";
const HELPERS_END = "__HELPERS_END__";
const START_MARK = "__START__";
const END_MARK = "__END__";

function token(langId, name) {
  return langId === 62 ? `//${name}` : `#${name}`;
}

function ensureMarkers(code, language_id, fnName = "") {
  if (!code) return "";

  const hs = token(language_id, HELPERS_START);
  const he = token(language_id, HELPERS_END);
  const ms = token(language_id, START_MARK);
  const me = token(language_id, END_MARK);

  const hasHelpers = code.includes(hs) && code.includes(he);
  const hasMain = code.includes(ms) && code.includes(me);
  if (hasHelpers && hasMain) return code;

  let out = String(code);

  if (language_id === 62) {
    if (!hasHelpers) {
      const classIdx = out.search(/\bclass\s+Solution\b/);
      if (classIdx !== -1) {
        const braceIdx = out.indexOf("{", classIdx);
        if (braceIdx !== -1) {
          const insertAt = braceIdx + 1;
          out =
            out.slice(0, insertAt) +
            `\n\n  ${hs}\n  // helper functions here\n  ${he}\n` +
            out.slice(insertAt);
        }
      }
    }

    if (!hasMain) {
      const name = fnName?.trim() || "";
      const re = name
        ? new RegExp(`\\b${name}\\s*\\([^)]*\\)\\s*\\{`, "m")
        : /\bpublic\b[\s\S]*?\([^)]*\)\s*\{/m;

      const m = out.match(re);
      if (m && typeof m.index === "number") {
        const openBraceAt = out.indexOf("{", m.index);
        const insertAt = openBraceAt + 1;
        out = out.slice(0, insertAt) + `\n\n    ${ms}\n\n    ${me}\n` + out.slice(insertAt);
      }
    }

    out = out.replace(/^\s*\/\/\s*TODO:.*$/gm, "");
    return out;
  }

  if (language_id === 71) {
    if (!hasHelpers) {
      const classIdx = out.search(/\bclass\s+Solution\s*:/);
      if (classIdx !== -1) {
        const lineEnd = out.indexOf("\n", classIdx);
        const insertAt = lineEnd === -1 ? out.length : lineEnd + 1;
        out = out.slice(0, insertAt) + `  ${hs}\n  # helper functions here\n  ${he}\n\n` + out.slice(insertAt);
      }
    }

    if (!hasMain) {
      const name = fnName?.trim() || "";
      const re = name ? new RegExp(`\\bdef\\s+${name}\\s*\\(`, "m") : /\bdef\s+\w+\s*\(/m;

      const m = out.match(re);
      if (m && typeof m.index === "number") {
        const defLineEnd = out.indexOf("\n", m.index);
        const insertAt = defLineEnd === -1 ? out.length : defLineEnd + 1;
        out = out.slice(0, insertAt) + `    ${ms}\n\n    ${me}\n` + out.slice(insertAt);
      }
    }

    out = out.replace(/^\s*#\s*TODO:.*$/gm, "");
    return out;
  }

  return out;
}

function getEditableRanges(code, language_id) {
  if (!code) return [];

  const hs = token(language_id, HELPERS_START);
  const he = token(language_id, HELPERS_END);
  const ms = token(language_id, START_MARK);
  const me = token(language_id, END_MARK);

  const ranges = [];

  const hsIdx = code.indexOf(hs);
  const heIdx = code.indexOf(he);
  if (hsIdx !== -1 && heIdx !== -1 && heIdx > hsIdx) {
    ranges.push({ start: hsIdx + hs.length, end: heIdx });
  }

  const msIdx = code.indexOf(ms);
  const meIdx = code.indexOf(me);
  if (msIdx !== -1 && meIdx !== -1 && meIdx > msIdx) {
    ranges.push({ start: msIdx + ms.length, end: meIdx });
  }

  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

function isChangeInsideAnyRange(model, changeRange, ranges) {
  const startOff = model.getOffsetAt(changeRange.getStartPosition());
  const endOff = model.getOffsetAt(changeRange.getEndPosition());
  return ranges.some((r) => startOff >= r.start && endOff <= r.end);
}

function formatMMSS(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* -----------------------------
   Premium UI Helpers
------------------------------*/
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

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-2xl font-semibold whitespace-nowrap transition border",
        active
          ? "bg-white text-black border-white/20"
          : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="px-4 py-2 rounded-2xl bg-black/30 border border-white/10 text-center">
      <div className="text-[11px] text-white/55">{label}</div>
      <div className="text-lg font-extrabold">{value}</div>
    </div>
  );
}
export default function BattleEditor() {
  const { roomId } = useParams();
  const nav = useNavigate();
  const { token } = useAuth();

  const socket = useMemo(() => (token ? makeSocket(token) : null), [token]);

  const [status, setStatus] = useState("connecting...");
  const [err, setErr] = useState("");

  const [room, setRoom] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const [problem, setProblem] = useState(null);
  const [testcases, setTestcases] = useState([]);

  const [language_id, setLanguageId] = useState(62);
  const [source_code, setSourceCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const detailsCacheRef = useRef(new Map());
  const editorRef = useRef(null);
  const lastGoodRef = useRef("");
  const suppressRef = useRef(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", (e) => setErr(e?.message || "Socket error"));
    socket.on("room:error", (m) => setErr(String(m || "Room error")));

    socket.on("room:update", (r) => {
      setRoom(r);
      setErr("");
      if (r?.status === "FINISHED") setShowLeaderboard(true);
    });

    socket.on("battle:ended", (finalRoom) => {
      setRoom(finalRoom);
      setShowLeaderboard(true);
    });

    socket.on("submit:result", (payload) => {
      setSubmitting(false);
      setSubmitResult(payload);
    });

    socket.emit("room:get", { roomId }, (ack) => {
      if (ack?.ok && ack.room) {
        setRoom(ack.room);
        if (ack.room?.status === "FINISHED") setShowLeaderboard(true);
      } else if (ack?.message) {
        setErr(ack.message);
      }
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (!room?.endTimeMs || room?.status !== "ACTIVE") {
      setTimeLeftMs(0);
      return;
    }

    const tick = () => {
      const left = Number(room.endTimeMs) - Date.now();
      setTimeLeftMs(Math.max(0, left));
      if (left <= 0) setShowLeaderboard(true);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [room?.endTimeMs, room?.status]);

  const questions = room?.questions || [];
  const activeQ = questions?.[activeIdx] || null;
  const activeProblemId = activeQ?.id || activeQ?.problemId || null;

  useEffect(() => {
    if (!socket || !activeProblemId) return;

    setErr("");
    setSubmitResult(null);

    const setStarterFor = (p) => {
      const field = starterFieldForLang(language_id);
      const starterRaw = field ? p?.[field] : "";
      const fnName = p?.fnName || "";

      const starter = ensureMarkers(String(starterRaw || ""), language_id, fnName);

      setSourceCode(starter);
      lastGoodRef.current = starter;

      const ed = editorRef.current;
      const model = ed?.getModel?.();
      if (ed && model) {
        suppressRef.current = true;
        model.setValue(starter);
        suppressRef.current = false;
      }
    };

    const cached = detailsCacheRef.current.get(activeProblemId);
    if (cached?.problem) {
      setProblem(cached.problem);
      setTestcases(cached.testcases || []);
      setStarterFor(cached.problem);
      return;
    }

    setProblem(null);
    setTestcases([]);
    setSourceCode("");
    lastGoodRef.current = "";

    socket.emit("problem:details", { problemId: activeProblemId }, (res) => {
      if (!res?.ok) {
        setErr(res?.message || "Failed to load problem");
        return;
      }

      const p = res.problem || null;
      const tcs = res.testcases || [];

      detailsCacheRef.current.set(activeProblemId, { problem: p, testcases: tcs });

      setProblem(p);
      setTestcases(tcs);
      setStarterFor(p);
    });
  }, [socket, activeProblemId, language_id]);

  function attachMonacoGuards(editor) {
    if (!editor) return;

    editor.onKeyDown((e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.code;
      if (ctrl && (key === "KeyC" || key === "KeyV" || key === "KeyX" || key === "KeyA")) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    const node = editor.getDomNode();
    if (node) {
      const stop = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      node.addEventListener("copy", stop);
      node.addEventListener("cut", stop);
      node.addEventListener("paste", stop);
    }

    editor.onDidChangeModelContent((event) => {
      if (suppressRef.current) return;

      const model = editor.getModel();
      if (!model) return;

      const current = model.getValue();
      const ranges = getEditableRanges(current, language_id);

      if (!ranges.length) {
        lastGoodRef.current = current;
        setSourceCode(current);
        return;
      }

      const invalid = (event.changes || []).some((ch) => {
        return !isChangeInsideAnyRange(model, ch.range, ranges);
      });

      if (invalid) {
        suppressRef.current = true;
        model.setValue(lastGoodRef.current);
        suppressRef.current = false;
        return;
      }

      lastGoodRef.current = current;
      setSourceCode(current);
    });
  }

  const submit = () => {
    setErr("");
    setSubmitResult(null);

    if (!socket) return setErr("Socket not connected");
    if (!room) return setErr("Room not loaded");
    if (room.status !== "ACTIVE") return setErr("Battle finished");
    if (timeLeftMs <= 0) return setErr("Time is over");
    if (!activeProblemId) return setErr("No problem selected");

    const codeToSend = editorRef.current?.getValue?.() ?? source_code;
    if (!String(codeToSend || "").trim()) return setErr("Code is empty");

    setSubmitting(true);

    socket.emit("submit:code", {
      roomId,
      problemId: activeProblemId,
      language_id,
      source_code: codeToSend,
    });
  };

  const resultsArr = Array.isArray(submitResult?.results) ? submitResult.results : [];
  const total = resultsArr.length;
  const passedCount = resultsArr.filter((r) => r.passed).length;
  const maxTime = resultsArr.reduce((m, r) => Math.max(m, Number(r.time || 0)), 0);
  const maxMem = resultsArr.reduce((m, r) => Math.max(m, Number(r.memory || 0)), 0);

  const players = Array.isArray(room?.players) ? room.players : [];
  const scores = room?.scores || {};

  const sortedPlayers = players
    .map((p) => ({ ...p, score: Number(scores?.[p.userId] ?? 0) }))
    .sort((a, b) => b.score - a.score);

  // ✅ DRAW / WINNER LOGIC (fix host auto-winner)
  const topScore = sortedPlayers[0]?.score ?? 0;
  const secondScore = sortedPlayers[1]?.score ?? null;

  const isBackendDraw = room?.isDraw === true || !!room?.drawReason;
  const isWinnerMissing = !room?.winner;
  const isTie = sortedPlayers.length >= 2 && secondScore === topScore;
  const isAllZero = sortedPlayers.length > 0 && topScore <= 0;

  const isDraw = isBackendDraw || isWinnerMissing || isTie || isAllZero;

  const winnerId = !isDraw ? room?.winner : "";
  const winner =
    !isDraw && winnerId
      ? sortedPlayers.find((p) => p.userId === winnerId) || null
      : null;

      if (showLeaderboard || room?.status === "FINISHED") {
    return (
      <div className="relative min-h-[100svh] w-full bg-[#06060b] text-white overflow-hidden">
        <GlowBG />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
          <GlassCard className="p-5 sm:p-6">
            <div className="text-2xl sm:text-3xl font-extrabold">🏁 Contest Finished</div>
            <div className="text-sm text-white/55 mt-1 break-all">Room: {roomId}</div>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="text-sm text-white/55">{isDraw ? "Result" : "Winner"}</div>
            <div className="text-xl sm:text-2xl font-extrabold mt-1 break-words">
              {isDraw ? "🤝 DRAW" : winner ? (winner.email || winner.userId) : "N/A"}
            </div>

            <div className="text-sm mt-2 text-white/70">
              Final Score:{" "}
              <span className="font-extrabold text-white">
                {isDraw ? topScore : winner?.score ?? 0}
              </span>
            </div>

            {isDraw && (
              <div className="text-xs text-white/50 mt-2">
                {room?.drawReason ? `Reason: ${room.drawReason}` : "Reason: Tie / No one scored"}
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="text-lg font-bold mb-4">Leaderboard</div>

            <div className="space-y-3">
              {sortedPlayers.length ? (
                sortedPlayers.map((p, idx) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between gap-3 bg-black/30 border border-white/10 rounded-2xl p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-10 text-center font-extrabold text-base sm:text-lg shrink-0">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{p.email || p.userId}</div>
                        <div className="text-xs text-white/45 truncate">{p.userId}</div>
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold shrink-0">{p.score}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/55">No players found.</div>
              )}
            </div>

            <button
              onClick={() => nav("/dashboard")}
              className="mt-6 w-full h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-semibold"
            >
              Back to Dashboard
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }
    return (
    <div className="relative min-h-[100svh] w-full bg-[#06060b] text-white overflow-hidden">
      <GlowBG />

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-4">
        {/* TOP BAR */}
        <GlassCard className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            {/* Tabs + room */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {questions.map((p, idx) => (
                  <Pill key={p.id || p.problemId || idx} active={idx === activeIdx} onClick={() => setActiveIdx(idx)}>
                    Problem {idx + 1}
                  </Pill>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-2 shrink-0">
                <div className="text-xs text-white/50">
                  Room: <span className="text-white/80 font-semibold">{roomId}</span>
                </div>
              </div>
            </div>

            {/* timer + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <StatPill
                  label="Time Left"
                  value={room?.status === "ACTIVE" ? formatMMSS(timeLeftMs) : "--:--"}
                />
                <StatPill label="Status" value={room?.status || "—"} />
                <StatPill label="Socket" value={status || "—"} />
              </div>

              <div className="flex gap-2">
                

                <button
                  onClick={() => {
                    if (!socket) return nav("/dashboard");
                    socket.emit("room:leave", { roomId }, () => nav("/dashboard"));
                    setTimeout(() => nav("/dashboard"), 300);
                  }}
                  className="h-11 px-4 rounded-2xl bg-white text-black hover:bg-white/90 font-semibold"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Error */}
        {err && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {err}
          </div>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: problem */}
          <GlassCard className="p-4 sm:p-5 space-y-4">
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-extrabold break-words">
                {problem?.title || "Loading problem..."}
              </div>
              <div className="text-sm text-white/60 mt-1">
                {problem?.topic ? `Topic: ${problem.topic}` : ""}
                {problem?.difficulty ? ` · Difficulty: ${problem.difficulty}` : ""}
              </div>
              {!!problem?.fnName && (
                <div className="text-xs text-white/45 mt-1 break-all">
                  Function: <span className="text-white/70 font-semibold">{problem.fnName}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm whitespace-pre-wrap min-h-[160px]">
              {problem?.statement || "Loading statement..."}
            </div>

            <div>
              <div className="font-semibold mb-2">Sample Testcases</div>
              {!testcases?.length ? (
                <div className="text-sm text-white/55">No sample testcases received.</div>
              ) : (
                <div className="space-y-3">
                  {testcases.map((t, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
                      <div className="text-white/80 font-semibold">Case {i + 1}</div>

                      <div className="mt-2">
                        <div className="text-xs text-white/50">Input</div>
                        <pre className="whitespace-pre-wrap break-words text-white/80">
                          {t.input || "(empty)"}
                        </pre>
                      </div>

                      <div className="mt-2">
                        <div className="text-xs text-white/50">Expected</div>
                        <pre className="whitespace-pre-wrap break-words text-white/80">
                          {t.expected || "(empty)"}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>

          {/* RIGHT: editor + submit + results */}
          <GlassCard className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Code Editor</div>
                <div className="text-xs text-white/50">
                  Edit only inside the marked regions (anti-copy/paste enabled).
                </div>
              </div>

              <select
                value={language_id}
                onChange={(e) => setLanguageId(Number(e.target.value))}
                className="w-full sm:w-auto h-11 px-3 rounded-2xl bg-black border border-white/10 outline-none focus:border-fuchsia-400/60"
              >
                {LANGS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
              <Editor
                height="55vh"
                language={language_id === 62 ? "java" : "python"}
                value={source_code}
                theme="vs-dark"
                onMount={(editor) => {
                  editorRef.current = editor;
                  attachMonacoGuards(editor);
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={submit}
                disabled={submitting || room?.status !== "ACTIVE" || timeLeftMs <= 0}
                className="w-full sm:flex-1 h-12 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 font-semibold shadow-lg shadow-fuchsia-500/20 hover:opacity-95 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>

              
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="font-semibold">Submission Result</div>
                <div className="text-xs text-white/55">
                  Passed: <span className="text-white/80 font-semibold">{passedCount}</span>/{total || 0}
                  {" · "}Max Time: <span className="text-white/80 font-semibold">{maxTime || 0}</span>
                  {" · "}Max Mem: <span className="text-white/80 font-semibold">{maxMem || 0}</span>
                </div>
              </div>

              {!submitResult ? (
                <div className="mt-2 text-sm text-white/55">No submission yet.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {(resultsArr || []).map((r, idx) => (
                    <div
                      key={idx}
                      className={[
                        "flex items-center justify-between gap-3 rounded-xl border p-3 text-sm",
                        r.passed
                          ? "border-emerald-500/25 bg-emerald-500/10"
                          : "border-rose-500/25 bg-rose-500/10",
                      ].join(" ")}
                    >
                      <div className="font-semibold">
                        Test {idx + 1} — {r.passed ? "PASSED ✅" : "FAILED ❌"}
                      </div>
                      <div className="text-xs text-white/70">
                        {Number(r.time || 0)}s · {Number(r.memory || 0)}KB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}