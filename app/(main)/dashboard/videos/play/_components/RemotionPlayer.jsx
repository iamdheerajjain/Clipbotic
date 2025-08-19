"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Player } from "@remotion/player";
import RemotionComposition from "@/app/(main)/_components/RemotionComposition";
import { useVideoPerformance } from "@/hooks/use-video-performance";
import { Gauge } from "lucide-react";

const FPS = 30;

function RemotionPlayer({ videoData }) {
  const [durationInFrames, setDurationInFrames] = useState(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Use the performance optimization hook
  const { isOptimized, preloadProgress, audioRef } =
    useVideoPerformance(videoData);

  // Memoize video data to prevent unnecessary re-renders
  const memoizedVideoData = useMemo(
    () => videoData,
    [
      videoData?.audioURL,
      videoData?.images,
      videoData?.captionJson,
      videoData?.caption?.style,
    ]
  );

  //

  // Set duration from optimized audio
  useEffect(() => {
    if (audioRef && audioRef.duration) {
      const frames = Math.ceil(audioRef.duration * FPS);
      if (frames > 0) {
        setDurationInFrames(frames);
        setIsReady(true);
      }
    }
  }, [audioRef]);

  // Mark as ready when optimization is complete
  useEffect(() => {
    if (isOptimized && !isReady) {
      setIsReady(true);
    }
  }, [isOptimized, isReady]);

  // Calculate duration based on script length, captions, or images
  useEffect(() => {
    if (!durationInFrames && memoizedVideoData) {
      let calculatedDuration = 10 * FPS; // Default 10 seconds

      // Method 1: Calculate based on script length
      if (memoizedVideoData.script) {
        const wordCount = memoizedVideoData.script.split(/\s+/).length;
        const estimatedDurationSeconds = Math.max(10, wordCount / 2.5); // 2.5 words per second
        calculatedDuration = Math.ceil(estimatedDurationSeconds * FPS);
      }

      // Method 2: Use caption timing if available
      if (memoizedVideoData.captionJson) {
        try {
          const captions =
            typeof memoizedVideoData.captionJson === "string"
              ? JSON.parse(memoizedVideoData.captionJson)
              : memoizedVideoData.captionJson;

          if (captions?.length > 0) {
            const lastCaption = captions[captions.length - 1];
            const captionDuration = Math.ceil((lastCaption.end || 0) * FPS);
            if (captionDuration > calculatedDuration) {
              calculatedDuration = captionDuration;
            }
          }
        } catch (error) {}
      }

      // Method 3: Use image count as fallback
      if (memoizedVideoData.images && Array.isArray(memoizedVideoData.images)) {
        const imageBasedDuration = memoizedVideoData.images.length * 3 * FPS; // 3 seconds per image
        if (imageBasedDuration > calculatedDuration) {
          calculatedDuration = imageBasedDuration;
        }
      }

      setDurationInFrames(calculatedDuration);
      setIsReady(true);
    }
  }, [memoizedVideoData, durationInFrames]);

  // Additional fallback: use a default duration if nothing else works
  useEffect(() => {
    if (!durationInFrames && isOptimized && isReady) {
      const defaultDuration = 10 * FPS; // 10 seconds at 30fps
      setDurationInFrames(defaultDuration);
    }
  }, [durationInFrames, isOptimized, isReady]);

  // Don't render until we have a duration and are ready
  if (!durationInFrames || !isReady) {
    return (
      <div className="flex items-center justify-center h-64 bg-black rounded-lg">
        {preloadProgress > 0 && preloadProgress < 100 && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">
              Optimizing video... {Math.round(preloadProgress)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-black rounded-lg">
        {/* Black screen - no error indicators for cleaner look */}
      </div>
    );
  }

  return (
    <div className="w-full relative no-hover-glow">
      <Player
        component={RemotionComposition}
        durationInFrames={durationInFrames}
        compositionWidth={720}
        compositionHeight={1280}
        fps={FPS}
        controls
        data-remotion-player="true"
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          maxHeight: "80vh",
          aspectRatio: "9/16",
        }}
        inputProps={{
          videoData: memoizedVideoData,
          setDurationFrame: setDurationInFrames,
        }}
        // Preload the composition for instant display
        preload="auto"
        // Start paused to avoid autoplay issues
        autoPlay={false}
        // Add error boundary for Remotion errors
        onError={() => {
          setError("Video playback error. Please try again.");
        }}
        // Optimize for faster audio start
        renderLoading={() => (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Preparing video...</p>
            </div>
          </div>
        )}
        // Add performance optimizations
        showVolumeControls={true}
        allowFullscreen={true}
        clickToPlay={true}
        // Playback speed
        playbackRate={playbackRate}
        // Reduce unnecessary re-renders
        key={memoizedVideoData?.audioURL || "player"}
      />
      {/* Playback speed controls - position just left of fullscreen icon */}
      <div className="absolute bottom-8 right-10 z-10 pointer-events-none">
        <div className="relative pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowSpeedMenu((v) => !v)}
            className="size-8 flex items-center justify-center text-white bg-transparent border-0 focus:outline-none"
            aria-label="Playback speed"
          >
            <Gauge className="w-5.3 h-5.3" />
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-10 right-0 min-w-[84px] rounded-md backdrop-blur-sm bg-black/70 border border-gray-700 shadow-md p-1">
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    setPlaybackRate(rate);
                    setShowSpeedMenu(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded-sm text-xs ${
                    playbackRate === rate
                      ? "bg-gray-700/50 text-white"
                      : "text-gray-200 hover:bg-gray-700/40"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RemotionPlayer;
