import { NavLink } from "react-router-dom";
import { useAuth } from "../../store/auth";
import LogoutButton from "../logout/logout";

export default function Navbar() {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-slate-800 text-white border border-slate-700"
        : "text-slate-300 hover:text-white hover:bg-slate-800"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Left Section */}
        <div className="flex gap-6 items-center">
          
            CodeBattle
          


          


        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            {user?.username || user?.email}
          </span>

          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}