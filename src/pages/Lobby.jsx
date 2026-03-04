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
    <div className={`relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur shadow-xl ${className}`}>
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

    const onRoomUpdate = (r) => {
      setRoom(r);
      setErr("");
    };

    const onLobbyTimer = ({ lobbyClosesAtMs }) => {
      setLobbyClosesAtMs(Number(lobbyClosesAtMs || 0));
    };

    const onBattleStarted = (startedRoom) => {

      const readyPlayers =
        startedRoom.players?.filter((p) => startedRoom.ready?.[p.userId]).length || 0;

      const minPlayers = startedRoom.minPlayersToStart || 2;

      // 🚨 Prevent wrong navigation
      if (readyPlayers < minPlayers) {
        setErr(`Need ${minPlayers} READY players to start battle`);
        return;
      }

      nav(`/battle/${startedRoom.roomId}`);
    };

    const onRoomCancelled = () => {
      nav("/dashboard");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("room:update", onRoomUpdate);
    socket.on("lobby:timer", onLobbyTimer);
    socket.on("battle:started", onBattleStarted);
    socket.on("room:cancelled", onRoomCancelled);

    socket.emit("room:get", { roomId }, (ack) => {
      if (!ack?.ok) setErr("Room not found");
      else setRoom(ack.room);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:update", onRoomUpdate);
      socket.off("lobby:timer", onLobbyTimer);
      socket.off("battle:started", onBattleStarted);
      socket.off("room:cancelled", onRoomCancelled);
    };
  }, [socket, roomId, nav]);

  /* ----------------- Timer ----------------- */

  useEffect(() => {
    if (!lobbyClosesAtMs) {
      setTimeLeftMs(0);
      return;
    }

    const tick = () => {
      const left = lobbyClosesAtMs - Date.now();
      setTimeLeftMs(left);

      if (left <= 0 && room?.status === "WAITING") {
        nav("/dashboard");
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);

  }, [lobbyClosesAtMs, room, nav]);

  /* ----------------- Derived Logic ----------------- */

  const playersCount = Number(room?.players?.length || 0);
  const maxPlayers = Number(room?.maxPlayers || 0);
  const minPlayers = Number(room?.minPlayersToStart || 2);

  const readyCount =
    room?.players?.filter((p) => room.ready?.[p.userId]).length || 0;

  const isWaiting = String(room?.status || "").toUpperCase() === "WAITING";
  const isFull = playersCount === maxPlayers;

  const isHost =
    room?.hostUser?.userId &&
    String(room.hostUser.userId) === String(myId);

  const canHostStart =
    isWaiting &&
    isHost &&
    playersCount >= minPlayers &&
    playersCount < maxPlayers &&
    readyCount >= minPlayers;

  /* ----------------- Actions ----------------- */

  const startBattle = () => {

    if (!socket) return;
    if (!canHostStart) {
      setErr(`Need ${minPlayers} READY players`);
      return;
    }

    setStarting(true);

    socket.emit("battle:start", { roomId }, (ack) => {

      setStarting(false);

      if (!ack?.ok) {
        setErr(ack?.message || "Start failed");
      }
    });
  };

  const readyMe = () => socket?.emit("player:ready", { roomId, ready: true });
  const notReady = () => socket?.emit("player:ready", { roomId, ready: false });

  /* ----------------- UI ----------------- */

  return (
    <div className="relative min-h-[100svh] bg-[#06060b] text-white overflow-hidden">

      <GlowBG />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

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

            <div className="font-bold">
              {lobbyClosesAtMs ? formatMMSS(timeLeftMs) : "--:--"}
            </div>

            <div className="text-xs text-white/50">
              Socket: {status}
            </div>

          </div>

        </GlassCard>

        {/* Controls */}

        <GlassCard className="p-6 flex gap-3 flex-wrap">

          <button
            onClick={readyMe}
            className="px-5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40"
          >
            Ready
          </button>

          <button
            onClick={notReady}
            className="px-5 py-2 rounded-xl bg-white/10 border border-white/10"
          >
            Not Ready
          </button>

          <button
            onClick={startBattle}
            disabled={!canHostStart || starting}
            className="px-5 py-2 rounded-xl bg-white text-black disabled:opacity-50"
          >
            {starting ? "Starting..." : "Start Battle (Host)"}
          </button>

        </GlassCard>

        {/* Players */}

        <GlassCard className="p-6">

          <div className="flex justify-between mb-4">

            <div className="text-lg font-bold">Players</div>

            <div className="text-sm text-white/50">
              {playersCount}/{maxPlayers}
            </div>

          </div>

          {room?.players?.map((p) => {

            const isReady = room.ready?.[p.userId];
            const isYou = p.userId === myId;

            return (

              <div
                key={p.userId}
                className="flex justify-between items-center bg-black/30 border border-white/10 rounded-xl px-4 py-2 mb-2"
              >

                <div>
                  {p.email}
                  {isYou && " (you)"}
                  {p.userId === room?.hostUser?.userId && " (host)"}
                </div>

                <div
                  className={`text-xs px-3 py-1 rounded-full ${
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

        </GlassCard>

      </div>

    </div>
  );
}