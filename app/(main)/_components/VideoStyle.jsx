"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";

export const options = [
  { name: "Realistic", image: "/realistic.png" },
  { name: "Cinematic", image: "/cinematic.png" },
  { name: "Anime", image: "/anime.png" },
  { name: "Watercolor", image: "/watercolor.png" },
  { name: "Cyberpunk", image: "/cyberpunk.jpg" },
  { name: "GTA", image: "/gta.png" },
];

function VideoStyle({ onHandleInputChange, videoData, onDownload }) {
  const [selectedStyle, setSelectedStyle] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleStyleSelect = (styleName) => {
    setSelectedStyle(styleName);
    onHandleInputChange("videoStyle", styleName);
  };

  const handleDownload = async () => {
    if (!videoData) {
      console.error("No video data available for download");
      return;
    }

    setIsDownloading(true);
    try {
      if (onDownload) {
        await onDownload(videoData);
      }
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold">Video Styles</h2>
          <p className="text-sm text-muted-foreground">Select Video Style</p>
        </div>

        {videoData ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading || videoData.status !== "ready"}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? "Rendering..." : "Download MP4"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {options.map((option, index) => (
          <div
            key={index}
            className={`cursor-pointer transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[--brand-from] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.28)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] hover:border-[color-mix(in_oklab,var(--primary)_25%,transparent)] ${
              selectedStyle === option.name
                ? "ring-[3px] ring-[--brand-from] ring-offset-2 ring-offset-background"
                : ""
            }`}
            onClick={() => handleStyleSelect(option.name)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                handleStyleSelect(option.name);
            }}
          >
            <div
              className={`relative w-full h-56 overflow-hidden rounded-lg border transition-all duration-300 ${
                selectedStyle === option.name
                  ? "border-[--brand-from] border-2"
                  : "border-border hover:border-[--brand-from]/50"
              }`}
            >
              <Image
                src={option.image}
                alt={option.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
                priority={option.name === "Realistic"}
              />
            </div>

            <div className="mt-2 text-center">
              <p
                className={`text-sm font-medium transition-all duration-300 ${
                  selectedStyle === option.name
                    ? "!text-white"
                    : "text-foreground"
                }`}
              >
                {option.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VideoStyle;
