"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Player } from "@remotion/player";
import RemotionComposition from "@/app/(main)/_components/RemotionComposition";
import { useVideoPerformance } from "@/hooks/use-video-performance";

const FPS = 30;

function RemotionPlayer({ videoData }) {
  const [durationInFrames, setDurationInFrames] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

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

  // Debug logging for audio issues
  useEffect(() => {
    if (memoizedVideoData) {
      console.log("Video data for player:", {
        hasAudioURL: !!memoizedVideoData.audioURL,
        audioURL: memoizedVideoData.audioURL,
        audioURLType: typeof memoizedVideoData.audioURL,
        hasImages: !!memoizedVideoData.images,
        imageCount: Array.isArray(memoizedVideoData.images)
          ? memoizedVideoData.images.length
          : "unknown",
        hasCaptions: !!memoizedVideoData.captionJson,
      });
    }
  }, [memoizedVideoData]);

  // Validate audio URL format
  const isValidAudioURL = useMemo(() => {
    if (!memoizedVideoData?.audioURL) return false;

    const url = memoizedVideoData.audioURL;

    // Check if it's a valid URL
    try {
      new URL(url);
    } catch {
      console.warn("Invalid audio URL format:", url);
      return false;
    }

    // Check if it's an audio file
    const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"];
    const hasAudioExtension = audioExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );

    if (!hasAudioExtension) {
      console.warn("Audio URL doesn't have a recognized audio extension:", url);
    }

    return hasAudioExtension;
  }, [memoizedVideoData?.audioURL]);

  // Set duration from optimized audio
  useEffect(() => {
    if (audioRef && audioRef.duration) {
      const frames = Math.ceil(audioRef.duration * FPS);
      if (frames > 0) {
        setDurationInFrames(frames);
        setError(null);
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
        console.log(
          `Script-based duration: ${wordCount} words = ${estimatedDurationSeconds}s = ${calculatedDuration} frames`
        );
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
              console.log(`Caption-based duration: ${captionDuration} frames`);
            }
          }
        } catch (error) {
          console.warn("Failed to parse captions for duration:", error);
        }
      }

      // Method 3: Use image count as fallback
      if (memoizedVideoData.images && Array.isArray(memoizedVideoData.images)) {
        const imageBasedDuration = memoizedVideoData.images.length * 3 * FPS; // 3 seconds per image
        if (imageBasedDuration > calculatedDuration) {
          calculatedDuration = imageBasedDuration;
          console.log(`Image-based duration: ${imageBasedDuration} frames`);
        }
      }

      setDurationInFrames(calculatedDuration);
      setError(null);
      setIsReady(true);
      console.log(
        `Final duration: ${calculatedDuration} frames (${
          calculatedDuration / FPS
        }s)`
      );
    }
  }, [memoizedVideoData, durationInFrames]);

  // Additional fallback: use a default duration if nothing else works
  useEffect(() => {
    if (!durationInFrames && isOptimized && isReady) {
      // Default to 10 seconds if no duration can be determined
      const defaultDuration = 10 * FPS; // 10 seconds at 30fps
      setDurationInFrames(defaultDuration);
      console.log("Using default duration:", defaultDuration, "frames");
    }
  }, [durationInFrames, isOptimized, isReady]);

  // Handle retry with cleanup
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    setDurationInFrames(null);
    setIsReady(false);
  }, []);

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

  // Show warning if no valid audio URL but allow playback
  if (!isValidAudioURL) {
    console.warn(
      "No valid audio URL found, but allowing video playback with captions only"
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
    <div className="w-full">
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
        onError={(error) => {
          console.error("Remotion player error:", error);
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
        // Reduce unnecessary re-renders
        key={`${memoizedVideoData?.audioURL}-${retryCount}`}
      />
    </div>
  );
}

export default RemotionPlayer;
