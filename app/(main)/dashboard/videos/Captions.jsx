import React, { useState, useEffect } from "react";

const options = [
  {
    name: "YouTuber",
    style:
      "text-red-500 text-2xl font-black uppercase tracking-wider drop-shadow-lg px-4 py-2 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30",
  },
  {
    name: "Supreme",
    style:
      "text-white text-3xl font-bold italic tracking-wide drop-shadow-2xl px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 border-2 border-white/50",
  },
  {
    name: "Neon",
    style:
      "text-cyan-400 text-2xl font-extrabold uppercase tracking-widest drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] px-4 py-2 rounded-lg bg-black/80 border border-cyan-400/60",
  },
  {
    name: "Glitch",
    style:
      "text-green-400 text-2xl font-mono font-bold tracking-tight drop-shadow-[2px_2px_0px_rgba(34,197,94,0.8)] px-4 py-2 rounded-md bg-black/90 border-2 border-green-400/70",
  },
  {
    name: "Fire",
    style:
      "text-orange-500 text-3xl font-black uppercase tracking-wide drop-shadow-[0_0_15px_rgba(249,115,22,0.6)] px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/30 to-red-500/30 border border-orange-400/50",
  },
  {
    name: "Futuristic",
    style:
      "text-blue-400 text-2xl font-light uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/40",
  },
];

function Captions({ onHandleInputChange }) {
  const [selectedCaptionStyle, setSelectedCaptionStyle] = useState("");

  return (
    <div className="mt-5">
      <h2>Captions</h2>
      <p className="text-sm text-muted-foreground">Select Caption Style</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              setSelectedCaptionStyle(option.name);
              onHandleInputChange("caption", { style: option.name });
            }}
            className={`relative h-24 border rounded-lg transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-from)] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.28)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] hover:border-[color-mix(in_oklab,var(--primary)_25%,transparent)] ${
              selectedCaptionStyle === option.name
                ? "border-[var(--brand-from)] border-2"
                : "border-border"
            }`}
          >
            <span className={option.style}>{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Captions;
