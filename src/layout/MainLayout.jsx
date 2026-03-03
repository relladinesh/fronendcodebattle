import { Outlet } from "react-router-dom";
import Navbar from "../components/common/navbar";

export default function MainLayout() {
  return (
    <div className="relative min-h-screen w-full bg-[#06060b] text-white overflow-hidden">
      
      {/* 🔥 Background Glow Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        
        {/* Gradient Blobs */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute top-10 right-[-120px] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-[-200px] left-[30%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
      </div>

      {/* 🔥 Actual Content */}
      <div className="relative z-10">
        <Navbar />
        <div className="px-4 md:px-8 py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}