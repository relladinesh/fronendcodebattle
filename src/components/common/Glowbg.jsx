import React from 'react'

const GlowBG = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* soft gradient blobs */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="absolute top-10 right-[-120px] h-[520px] w-[520px] rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="absolute bottom-[-220px] left-[20%] h-[520px] w-[520px] rounded-full bg-cyan-500/15 blur-3xl" />

      {/* SILVER GRID */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(192,192,192,0.35) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      {/* vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />

    </div>
  );
}

export default GlowBG
