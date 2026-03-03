import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";
import LogoutButton from "../logout/logout";

function BrandMark() {
  return (
    <div className="relative">
      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-fuchsia-500/25 to-indigo-500/25 blur-xl" />
      <div className="relative flex items-center gap-2">
        <div className="h-9 w-9 rounded-2xl bg-white/10 border border-white/10 grid place-items-center">
          <span className="text-sm font-black">CB</span>
        </div>
        <div className="leading-tight">
          <div className="text-base font-extrabold tracking-tight">CodeBattle</div>
          <div className="text-[11px] text-white/45">Realtime coding battles</div>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const nav = useNavigate();
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    [
      "px-3 py-2 rounded-xl text-sm font-semibold transition border",
      isActive
        ? "bg-white/10 text-white border-white/10"
        : "text-white/70 border-transparent hover:border-white/10 hover:bg-white/5 hover:text-white",
    ].join(" ");

  return (
    <nav className="sticky top-0 z-50">
      {/* glow + glass */}
      <div className="absolute inset-0 bg-[#06060b]/75 backdrop-blur-xl border-b border-white/10" />
      <div
        className="absolute inset-x-0 -top-10 h-20 opacity-60 blur-2xl"
        style={{
          background:
            "linear-gradient(90deg, rgba(217,70,239,0.18), rgba(99,102,241,0.18), rgba(34,211,238,0.10))",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-6 min-w-0">
          <button onClick={() => nav("/dashboard")} className="shrink-0">
            <BrandMark />
          </button>

          {/* Optional links (enable if you want) */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/create-room" className={linkClass}>
              Create Room
            </NavLink>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* User pill */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
            <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 border border-white/10 grid place-items-center text-xs font-black">
              {(user?.username || user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate max-w-[220px]">
                {user?.username || user?.email}
              </div>
              <div className="text-[11px] text-white/45 truncate max-w-[220px]">
                Signed in
              </div>
            </div>
          </div>

          <LogoutButton />
        </div>
      </div>

      {/* Mobile quick links */}
      <div className="relative md:hidden border-b border-white/10 bg-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/create-room" className={linkClass}>
            Create Room
          </NavLink>
        </div>
      </div>
    </nav>
  );
}