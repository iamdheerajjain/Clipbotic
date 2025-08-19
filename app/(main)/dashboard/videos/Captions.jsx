import React, { useState } from "react";

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
    <div className="space-y-4">
      {/* Header Section */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">Caption Styles</h3>
        <p className="text-gray-400 text-sm">
          Choose how your text appears on screen
        </p>
      </div>

      {/* Caption Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.name}
            onClick={() =>
              onHandleInputChange("caption", { style: option.name })
            }
            className={`h-24 rounded-xl border transition-all duration-300 overflow-hidden ${
              selectedCaptionStyle === option.name
                ? "border-purple-500 bg-purple-500/10"
                : "border-gray-800 bg-black hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
            }`}
          >
            <div className="flex items-center justify-center h-full p-3 relative">
              <span className={option.style}>{option.name}</span>

              {/* Selection Overlay */}
              {selectedCaptionStyle === option.name && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Captions;
