import { useEffect, useRef, useState, useCallback } from "react";

export const useVideoPerformance = (videoData) => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const audioRef = useRef(null);
  const imageRefs = useRef(new Map());
  const cleanupRef = useRef([]);

  // Preload audio with better error handling
  const preloadAudio = useCallback(async (audioURL) => {
    if (!audioURL) return null;

    try {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = audioURL;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Audio preload timeout"));
        }, 10000); // 10 second timeout

        const onLoaded = () => {
          clearTimeout(timeout);
          resolve(audio);
        };

        const onError = (error) => {
          clearTimeout(timeout);
          reject(error);
        };

        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("canplay", onLoaded);
        audio.addEventListener("error", onError);
        audio.load();

        // Cleanup function
        cleanupRef.current.push(() => {
          audio.removeEventListener("loadedmetadata", onLoaded);
          audio.removeEventListener("canplay", onLoaded);
          audio.removeEventListener("error", onError);
          audio.pause();
          audio.src = "";
        });
      });
    } catch (error) {
      console.warn("Audio preload failed:", error);
      return null;
    }
  }, []);

  // Preload images with progress tracking
  const preloadImages = useCallback(async (images) => {
    if (!Array.isArray(images) || images.length === 0) return;

    const imageUrls = images.filter((url) => url && url.startsWith("http"));
    if (imageUrls.length === 0) return;

    let loadedCount = 0;
    const totalImages = imageUrls.length;

    const preloadPromises = imageUrls.map((url, index) => {
      return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          loadedCount++;
          setPreloadProgress((loadedCount / totalImages) * 100);
          imageRefs.current.set(index, img);
          resolve();
        };

        img.onerror = () => {
          loadedCount++;
          setPreloadProgress((loadedCount / totalImages) * 100);
          resolve(); // Don't fail on image errors
        };

        img.src = url;
      });
    });

    await Promise.allSettled(preloadPromises);
  }, []);

  // Optimize video data
  useEffect(() => {
    if (!videoData) return;

    let isCancelled = false;

    const optimizeVideo = async () => {
      try {
        setIsOptimized(false);
        setPreloadProgress(0);

        // Parse images if needed
        let images = [];
        if (videoData.images) {
          if (typeof videoData.images === "string") {
            try {
              const parsed = JSON.parse(videoData.images);
              images = Array.isArray(parsed) ? parsed : [];
            } catch (error) {
              console.warn("Failed to parse images:", error);
            }
          } else if (Array.isArray(videoData.images)) {
            images = videoData.images;
          }
        }

        // Preload audio and images in parallel
        const [audio] = await Promise.allSettled([
          preloadAudio(videoData.audioURL),
          preloadImages(images),
        ]);

        if (!isCancelled) {
          if (audio.status === "fulfilled") {
            audioRef.current = audio.value;
          }
          setIsOptimized(true);
        }
      } catch (error) {
        console.warn("Video optimization failed:", error);
        if (!isCancelled) {
          setIsOptimized(true); // Still mark as optimized to allow playback
        }
      }
    };

    optimizeVideo();

    return () => {
      isCancelled = true;
      // Cleanup
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
      imageRefs.current.clear();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [videoData, preloadAudio, preloadImages]);

  // Memory management
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
      imageRefs.current.clear();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isOptimized,
    preloadProgress,
    audioRef: audioRef.current,
    imageRefs: imageRefs.current,
  };
};
