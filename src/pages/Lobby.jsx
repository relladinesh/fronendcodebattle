import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../store/auth";
import { makeSocket } from "../lib/socket";

/* ----------------- Helpers ----------------- */
function formatMMSS(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ----------------- Premium UI ----------------- */
function GlowBG() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="absolute top-10 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="absolute bottom-[-220px] left-[20%] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

/* ----------------- Component ----------------- */
export default function Lobby() {
  const { roomId } = useParams();
  const nav = useNavigate();
  const { token, user } = useAuth();

  const socket = useMemo(() => (token ? makeSocket(token) : null), [token]);

  const [room, setRoom] = useState(null);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("connecting...");
  const [lobbyClosesAtMs, setLobbyClosesAtMs] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [starting, setStarting] = useState(false);

  const myId = user?.userId || user?.id;

  /* ----------------- Socket Logic ----------------- */
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = (e) => setErr(e?.message || "Socket error");
    const onRoomError = (m) => setErr(String(m || "Room error"));

    const onRoomUpdate = (r) => {
      setRoom(r);
      setErr("");
    };

    const onLobbyTimer = ({ lobbyClosesAtMs }) => {
      setLobbyClosesAtMs(Number(lobbyClosesAtMs || 0));
    };

    const onBattleStarted = (startedRoom) => {
      nav(`/battle/${startedRoom.roomId}`);
    };

    const onRoomCancelled = () => nav("/dashboard");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room:error", onRoomError);

    socket.on("room:update", onRoomUpdate);
    socket.on("lobby:timer", onLobbyTimer);
    socket.on("battle:started", onBattleStarted);
    socket.on("room:cancelled", onRoomCancelled);

    socket.emit("room:get", { roomId }, (ack) => {
      if (!ack?.ok) setErr(ack?.message || "Room not found");
      else setRoom(ack.room);
    });

    // ✅ cleanup (NO disconnect)
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("room:error", onRoomError);

      socket.off("room:update", onRoomUpdate);
      socket.off("lobby:timer", onLobbyTimer);
      socket.off("battle:started", onBattleStarted);
      socket.off("room:cancelled", onRoomCancelled);
    };
  }, [socket, roomId, nav]);

  /* ----------------- Timer UI ----------------- */
  useEffect(() => {
    if (!lobbyClosesAtMs) {
      setTimeLeftMs(0);
      return;
    }

    const tick = () => setTimeLeftMs(lobbyClosesAtMs - Date.now());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [lobbyClosesAtMs]);

  /* ----------------- Derived Rules ----------------- */
  const playersCount = Number(room?.players?.length || 0);
  const maxPlayers = Number(room?.maxPlayers || 0);
  const minPlayers = Number(room?.minPlayersToStart || 2);

  const isWaiting = String(room?.status || "").toUpperCase() === "WAITING";
  const isFull = !!room && playersCount === maxPlayers;

  const isHost =
    !!room?.hostUser?.userId && String(room.hostUser.userId) === String(myId);

  // ✅ host can start only when min <= players < max, and room is WAITING
  const canHostStart =
    isWaiting && isHost && playersCount >= minPlayers && playersCount < maxPlayers;

  const startBattle = () => {
    if (!socket) return;
    if (!canHostStart) return;

    setStarting(true);
    setErr("");

    socket.emit("battle:start", { roomId }, (ack) => {
      setStarting(false);
      if (!ack?.ok) setErr(ack?.message || "Start failed");
      // success => battle:started event will navigate
    });
  };

  // Optional (still ok)
  const readyMe = () => socket?.emit("player:ready", { roomId, ready: true });
  const notReady = () => socket?.emit("player:ready", { roomId, ready: false });

  const showInfo = () => {
    setErr("");
    if (!room) return;

    if (isFull) return setErr("Room is FULL ✅ Battle will auto-start now.");
    if (playersCount < minPlayers)
      return setErr(`Need minimum ${minPlayers} players to start.`);
    if (playersCount >= minPlayers && playersCount < maxPlayers) {
      if (isHost) return setErr("You can start battle now (Host Start ✅).");
      return setErr("Waiting for host to start battle...");
    }
  };

  /* ----------------- UI ----------------- */
  return (
    <div className="relative min-h-[100svh] bg-[#06060b] text-white overflow-hidden">
      <GlowBG />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <GlassCard className="p-5 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">
              Battle Lobby
            </div>
            <div className="text-sm text-white/50 mt-1">
              Room ID:{" "}
              <span className="text-white/80 font-semibold">{roomId}</span>
            </div>
            {err && <div className="text-sm text-rose-400 mt-2">{err}</div>}
          </div>

          <div className="flex gap-3 items-center">
            <div className="text-sm bg-black/40 border border-white/10 rounded-2xl px-4 py-2">
              <div className="text-white/50 text-xs">Lobby Ends In</div>
              <div className="font-bold">
                {lobbyClosesAtMs ? formatMMSS(timeLeftMs) : "--:--"}
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                Socket: {status}
              </div>
            </div>

            <button
              onClick={() => nav("/dashboard")}
              className="h-11 px-4 rounded-2xl bg-white text-black font-semibold hover:bg-white/90"
            >
              Exit
            </button>
          </div>
        </GlassCard>

        {/* Room Code */}
        <GlassCard className="p-8 text-center">
          <div className="text-sm text-white/50 mb-3">
            Share this Room Code
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="px-8 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-5xl font-extrabold tracking-widest text-emerald-300">
                {roomId}
              </span>
            </div>

            <button
              onClick={() => navigator.clipboard?.writeText?.(roomId)}
              className="h-12 px-5 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 font-semibold"
            >
              Copy
            </button>
          </div>
        </GlassCard>

        {/* Controls */}
        <GlassCard className="p-6 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Lobby Controls</div>
            <div className="text-sm text-white/50">
              {isFull
                ? "Room is FULL → battle will auto-start."
                : `Need min ${minPlayers} players. Host can start when min reached.`}
            </div>
            {isHost && (
              <div className="text-xs text-white/40 mt-1">
                You are the HOST ✅
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {/* OPTIONAL: keep ready/not ready */}
            <button
              onClick={readyMe}
              className="h-11 px-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold"
            >
              Ready
            </button>

            <button
              onClick={notReady}
              className="h-11 px-5 rounded-2xl bg-white/10 border border-white/10 font-semibold"
            >
              Not Ready
            </button>

            {/* ✅ Host Start Button */}
            <button
              onClick={startBattle}
              disabled={!canHostStart || starting}
              className="h-11 px-5 rounded-2xl bg-white text-black font-semibold disabled:opacity-60"
              title={
                canHostStart
                  ? "Start battle"
                  : isFull
                  ? "Auto-start when full"
                  : !isHost
                  ? "Only host can start"
                  : playersCount < minPlayers
                  ? `Need min ${minPlayers} players`
                  : "Waiting..."
              }
            >
              {starting ? "Starting..." : "Start Battle (Host)"}
            </button>

            <button
              onClick={showInfo}
              className="h-11 px-5 rounded-2xl bg-white/10 border border-white/10 font-semibold"
            >
              Info
            </button>
          </div>
        </GlassCard>

        {/* Players + Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Players */}
          <GlassCard className="p-6">
            <div className="flex justify-between mb-4">
              <div className="text-lg font-bold">Players</div>
              <div className="text-sm text-white/50">
                {playersCount}/{maxPlayers}
              </div>
            </div>

            {!room?.players?.length ? (
              <div className="text-white/50 text-sm">Waiting for players...</div>
            ) : (
              <div className="space-y-3">
                {room.players.map((p) => {
                  const isReady = !!room.ready?.[p.userId];
                  const isYou = String(p.userId) === String(myId);

                  return (
                    <div
                      key={p.userId}
                      className="flex justify-between items-center bg-black/30 border border-white/10 rounded-2xl px-4 py-3"
                    >
                      <div>
                        <div className="font-semibold">
                          {p.email} {isYou && "(you)"}
                          {room?.hostUser?.userId === p.userId ? " (host)" : ""}
                        </div>
                        <div className="text-xs text-white/40">{p.userId}</div>
                      </div>

                      <div
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          isReady
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {isReady ? "READY" : "NOT READY"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Room Settings */}
          <GlassCard className="p-6">
            <div className="text-lg font-bold mb-4">Room Settings</div>

            {!room ? (
              <div className="text-white/50 text-sm">Loading...</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  Topic: <span className="font-semibold">{room.topic}</span>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  Questions:{" "}
                  <span className="font-semibold">{room.questionCount}</span>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  Battle Timer:{" "}
                  <span className="font-semibold">
                    {Math.round((room.timerSeconds || 0) / 60)} min
                  </span>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  Status: <span className="font-semibold">{room.status}</span>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  Min Players:{" "}
                  <span className="font-semibold">{minPlayers}</span>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  Max Players:{" "}
                  <span className="font-semibold">{maxPlayers}</span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="text-xs text-white/40 text-center">
          Tip: Share the room code so your friend can join from dashboard.
        </div>
      </div>
    </div>
  );
}