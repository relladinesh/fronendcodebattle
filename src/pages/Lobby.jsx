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

    const onRoomUpdate = (r) => setRoom(r);

    const onLobbyTimer = ({ lobbyClosesAtMs }) => {
      setLobbyClosesAtMs(Number(lobbyClosesAtMs || 0));
    };

    const onBattleStarted = (startedRoom) => {
      nav(`/battle/${startedRoom.roomId}`);
    };

    const onRoomCancelled = () => {
      nav("/dashboard");
    };

    socket.on("room:update", onRoomUpdate);
    socket.on("lobby:timer", onLobbyTimer);
    socket.on("battle:started", onBattleStarted);
    socket.on("room:cancelled", onRoomCancelled);

    socket.emit("room:get", { roomId }, (ack) => {
      if (!ack?.ok) setErr("Room not found");
      else setRoom(ack.room);
    });

    return () => {
      socket.off("room:update", onRoomUpdate);
      socket.off("lobby:timer", onLobbyTimer);
      socket.off("battle:started", onBattleStarted);
      socket.off("room:cancelled", onRoomCancelled);
    };
  }, [socket, roomId, nav]);

  /* ----------------- Timer ----------------- */

  useEffect(() => {
    if (!lobbyClosesAtMs) return;

    const tick = () => {
      const left = lobbyClosesAtMs - Date.now();
      setTimeLeftMs(left);

      if (left <= 0 && room?.status === "WAITING") {
        nav("/dashboard"); // redirect when lobby expires
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [lobbyClosesAtMs, room, nav]);

  /* ----------------- Derived Logic ----------------- */

  const playersCount = room?.players?.length || 0;
  const maxPlayers = room?.maxPlayers || 0;
  const minPlayers = room?.minPlayersToStart || 2;

  const readyCount =
    room?.players?.filter((p) => room.ready?.[p.userId]).length || 0;

  const isHost = room?.hostUser?.userId === myId;

  const canHostStart =
    isHost &&
    room?.status === "WAITING" &&
    playersCount >= minPlayers &&
    playersCount < maxPlayers &&
    readyCount >= minPlayers; // ✅ READY CHECK ADDED

  /* ----------------- Actions ----------------- */

  const startBattle = () => {
    if (!canHostStart) return;

    setStarting(true);

    socket.emit("battle:start", { roomId }, (ack) => {
      setStarting(false);
      if (!ack?.ok) setErr(ack.message);
    });
  };

  const readyMe = () => socket?.emit("player:ready", { roomId, ready: true });
  const notReady = () =>
    socket?.emit("player:ready", { roomId, ready: false });

  /* ----------------- UI ----------------- */

  return (
    <div className="relative min-h-[100svh] bg-[#06060b] text-white overflow-hidden">
      <GlowBG />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <GlassCard className="p-5 flex justify-between">
          <div>
            <div className="text-2xl font-bold">Battle Lobby</div>
            <div className="text-sm text-white/60">
              Room ID: <b>{roomId}</b>
            </div>
            {err && <div className="text-red-400">{err}</div>}
          </div>

          <div>
            <div>{formatMMSS(timeLeftMs)}</div>
            <div className="text-xs text-white/50">Socket: {status}</div>
          </div>
        </GlassCard>

        {/* Controls */}
        <GlassCard className="p-6 flex gap-3">

          <button
            onClick={readyMe}
            className="px-5 py-2 bg-green-600 rounded-xl"
          >
            Ready
          </button>

          <button
            onClick={notReady}
            className="px-5 py-2 bg-gray-600 rounded-xl"
          >
            Not Ready
          </button>

          <button
            onClick={startBattle}
            disabled={!canHostStart || starting}
            className="px-5 py-2 bg-white text-black rounded-xl disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start Battle"}
          </button>
        </GlassCard>

        {/* Players */}
        <GlassCard className="p-6">
          <div className="flex justify-between mb-3">
            <div>Players</div>
            <div>
              {playersCount}/{maxPlayers}
            </div>
          </div>

          {room?.players?.map((p) => (
            <div key={p.userId} className="flex justify-between py-2">
              <div>
                {p.email}
                {p.userId === myId && " (you)"}
                {p.userId === room.hostUser?.userId && " (host)"}
              </div>

              <div>
                {room.ready?.[p.userId] ? "READY" : "NOT READY"}
              </div>
            </div>
          ))}
        </GlassCard>

      </div>
    </div>
  );
}