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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">Video Styles</h3>
          <p className="text-gray-400 text-sm">
            Choose the visual style that matches your content
          </p>
        </div>

        {videoData && (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading || videoData.status !== "ready"}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? "Rendering..." : "Download MP4"}
            </button>
          </div>
        )}
      </div>

      {/* Video Style Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {options.map((option, index) => (
          <div
            key={index}
            className={`cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:-translate-y-2 hover:shadow-xl hover:bg-gray-800 ${
              selectedStyle === option.name
                ? "ring-4 ring-blue-500 ring-offset-4 ring-offset-black shadow-2xl scale-105"
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
              className={`relative w-full h-48 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                selectedStyle === option.name
                  ? "border-blue-500 shadow-xl"
                  : "border-gray-700 hover:border-blue-500"
              }`}
            >
              <Image
                src={option.image}
                alt={option.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 hover:scale-110"
                priority={option.name === "Realistic"}
              />

              {/* Selection Overlay */}
              {selectedStyle === option.name && (
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/80 via-transparent to-transparent flex items-end">
                  <div className="p-3 w-full">
                    <div className="bg-gray-900/90 rounded-lg p-2 text-center">
                      <span className="text-blue-300 font-semibold text-sm">
                        ✓ Selected
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 text-center">
              <p
                className={`text-sm font-semibold transition-all duration-300 ${
                  selectedStyle === option.name
                    ? "text-blue-400"
                    : "text-gray-200"
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
