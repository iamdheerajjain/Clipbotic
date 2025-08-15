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

  const { isOptimized, preloadProgress, audioRef } =
    useVideoPerformance(videoData);

  const memoizedVideoData = useMemo(
    () => videoData,
    [
      videoData?.audioURL,
      videoData?.images,
      videoData?.captionJson,
      videoData?.caption?.style,
    ]
  );

  const isValidAudioURL = useMemo(() => {
    if (!memoizedVideoData?.audioURL) return false;

    const url = memoizedVideoData.audioURL;

    try {
      new URL(url);
    } catch {
      console.warn("Invalid audio URL format:", url);
      return false;
    }

    const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"];
    const hasAudioExtension = audioExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );

    if (!hasAudioExtension) {
      console.warn("Audio URL doesn't have a recognized audio extension:", url);
    }

    return hasAudioExtension;
  }, [memoizedVideoData?.audioURL]);

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

  useEffect(() => {
    if (isOptimized && !isReady) {
      setIsReady(true);
    }
  }, [isOptimized, isReady]);

  useEffect(() => {
    if (!audioRef && memoizedVideoData?.captionJson && !durationInFrames) {
      try {
        const captions =
          typeof memoizedVideoData.captionJson === "string"
            ? JSON.parse(memoizedVideoData.captionJson)
            : memoizedVideoData.captionJson;

        if (captions?.length > 0) {
          const lastCaption = captions[captions.length - 1];
          const duration = Math.ceil((lastCaption.end || 0) * FPS);
          if (duration > 0) {
            setDurationInFrames(duration);
            setError(null);
            setIsReady(true);
          }
        }
      } catch (error) {
        console.warn("Failed to parse captions for duration:", error);
        setError("Failed to parse video captions");
        setIsReady(true);
      }
    }
  }, [memoizedVideoData?.captionJson, audioRef, durationInFrames]);

  useEffect(() => {
    if (!durationInFrames && isOptimized && isReady) {
      const defaultDuration = 10 * FPS; // 10 seconds at 30fps
      setDurationInFrames(defaultDuration);
    }
  }, [durationInFrames, isOptimized, isReady]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    setDurationInFrames(null);
    setIsReady(false);
  }, []);

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

  if (!isValidAudioURL) {
    console.warn(
      "No valid audio URL found, but allowing video playback with captions only"
    );
  }

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
        preload="auto"
        autoPlay={false}
        onError={(error) => {
          console.error("Remotion player error:", error);
          setError("Video playback error. Please try again.");
        }}
        renderLoading={() => (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Preparing video...</p>
            </div>
          </div>
        )}
        showVolumeControls={true}
        allowFullscreen={true}
        clickToPlay={true}
        key={`${memoizedVideoData?.audioURL}-${retryCount}`}
      />
    </div>
  );
}

export default RemotionPlayer;
