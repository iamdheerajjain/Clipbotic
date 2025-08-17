"use client";
import React from "react";
import Image from "next/image";

// Caption styles mapping
const captionStyles = {
  YouTuber:
    "text-red-500 text-3xl font-black uppercase tracking-wider drop-shadow-lg px-5 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30",
  Supreme:
    "text-white text-4xl font-bold italic tracking-wide drop-shadow-2xl px-5 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 border-2 border-white/50",
  Neon: "text-cyan-400 text-3xl font-extrabold uppercase tracking-widest drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] px-5 py-3 rounded-lg bg-black/80 border border-cyan-400/60",
  Glitch:
    "text-green-400 text-3xl font-mono font-bold tracking-tight drop-shadow-[2px_2px_0px_rgba(34,197,94,0.8)] px-5 py-3 rounded-md bg-black/90 border-2 border-green-400/70",
  Fire: "text-orange-500 text-4xl font-black uppercase tracking-wide drop-shadow-[0_0_15px_rgba(249,115,22,0.6)] px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500/30 to-red-500/30 border border-orange-400/50",
  Futuristic:
    "text-blue-400 text-3xl font-light uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] px-5 py-3 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/40",
};

export default function Preview({
  videoUrl,
  placeholderImageUrl,
  title = "Preview",
  selectedVideoStyle,
  selectedCaption,
}) {
  const handleDownload = () => {
    if (!videoUrl) {
      console.error("No video source found to download.");
      return;
    }

    // Create a temporary anchor for downloading
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = "video.mp4"; // Name of the file when downloaded
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Video style options mapping
  const videoStyleOptions = {
    Realistic: "/realistic.png",
    Cinematic: "/cinematic.png",
    Anime: "/anime.png",
    Watercolor: "/watercolor.png",
    Cyberpunk: "/cyberpunk.jpg",
    GTA: "/gta.png",
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6 w-full">
      {videoUrl ? (
        <>
          <video
            src={videoUrl}
            controls
            className="rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] w-full h-auto border border-border"
          />
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-[linear-gradient(135deg,var(--brand-from),var(--brand-to))] text-primary-foreground hover:opacity-95 transition"
            >
              Download
            </button>
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition"
            >
              Open in new tab
            </a>
          </div>
        </>
      ) : (
        <div className="w-full">
          <div className="w-full aspect-[9/16] rounded-xl border border-border overflow-hidden bg-secondary/40 flex items-center justify-center relative">
            {selectedVideoStyle && videoStyleOptions[selectedVideoStyle] ? (
              <div className="w-full h-full relative">
                <Image
                  src={videoStyleOptions[selectedVideoStyle]}
                  alt={selectedVideoStyle}
                  fill
                  className="object-cover"
                />
                {selectedCaption && captionStyles[selectedCaption] && (
                  <div className="absolute inset-0 flex items-end justify-center pb-20">
                    <span className={captionStyles[selectedCaption]}>
                      {selectedCaption}
                    </span>
                  </div>
                )}
              </div>
            ) : placeholderImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={placeholderImageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                Preview coming soon…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
