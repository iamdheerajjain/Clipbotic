import { Captions } from "lucide-react";
import React, { useEffect, useMemo, useCallback, useState } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  Audio,
  useVideoConfig,
  interpolate,
  useCurrentFrame,
  spring,
  useSpring,
} from "remotion";

// Caption styles mapping - same as in Preview component
const captionStyles = {
  YouTuber: {
    color: "#ef4444",
    fontSize: "32px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    textShadow: "0 4px 6px rgba(0, 0, 0, 0.8)",
    padding: "12px 20px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2))",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
  Supreme: {
    color: "#ffffff",
    fontSize: "40px",
    fontWeight: "700",
    fontStyle: "italic",
    letterSpacing: "0.05em",
    textShadow: "0 8px 16px rgba(0, 0, 0, 0.9)",
    padding: "12px 20px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #9333ea, #ec4899)",
    border: "2px solid rgba(255, 255, 255, 0.5)",
  },
  Neon: {
    color: "#22d3ee",
    fontSize: "32px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    textShadow: "0 0 20px rgba(34, 211, 238, 0.8)",
    padding: "12px 20px",
    borderRadius: "8px",
    background: "rgba(0, 0, 0, 0.8)",
    border: "1px solid rgba(34, 211, 238, 0.6)",
  },
  Glitch: {
    color: "#22c55e",
    fontSize: "32px",
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: "-0.02em",
    textShadow: "2px 2px 0px rgba(34, 197, 94, 0.8)",
    padding: "12px 20px",
    borderRadius: "6px",
    background: "rgba(0, 0, 0, 0.9)",
    border: "2px solid rgba(34, 197, 94, 0.7)",
  },
  Fire: {
    color: "#f97316",
    fontSize: "40px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    textShadow: "0 0 15px rgba(249, 115, 22, 0.6)",
    padding: "12px 20px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(239, 68, 68, 0.3))",
    border: "1px solid rgba(249, 115, 22, 0.5)",
  },
  Futuristic: {
    color: "#60a5fa",
    fontSize: "32px",
    fontWeight: "300",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    textShadow: "0 0 10px rgba(96, 165, 250, 0.5)",
    padding: "12px 20px",
    borderRadius: "50px",
    background:
      "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))",
    border: "1px solid rgba(96, 165, 250, 0.4)",
  },
};

// Preload images for better performance
const preloadImages = (imageUrls) => {
  if (!Array.isArray(imageUrls)) return;

  imageUrls.forEach((url) => {
    if (url && url.startsWith("http")) {
      const img = new Image();
      img.src = url;
    }
  });
};

function RemotionComposition({ videoData, setDurationFrame }) {
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const [imageErrors, setImageErrors] = useState(new Set());
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Debug logging
  console.log("RemotionComposition received videoData:", {
    hasVideoData: !!videoData,
    hasAudioURL: !!videoData?.audioURL,
    hasAudio_url: !!videoData?.audio_url,
    audioURL: videoData?.audioURL,
    audio_url: videoData?.audio_url,
    imagesType: typeof videoData?.images,
    imagesLength: Array.isArray(videoData?.images)
      ? videoData.images.length
      : "not array",
    hasCaptionJson: !!videoData?.captionJson,
    hasCaption_json: !!videoData?.caption_json,
    captionJson: videoData?.captionJson,
    caption_json: videoData?.caption_json,
    captionStyle: videoData?.caption?.style,
    script: videoData?.script?.substring(0, 100) + "...",
    scriptLength: videoData?.script?.length || 0,
  });

  // Parse captions properly - memoized for performance
  const captions = useMemo(() => {
    const captionData = videoData?.captionJson || videoData?.caption_json;
    if (!captionData) {
      console.log("No caption data found");
      return [];
    }
    try {
      return typeof captionData === "string"
        ? JSON.parse(captionData)
        : captionData;
    } catch (error) {
      console.error("Failed to parse captions:", error);
      console.error("Caption data:", captionData);
      return [];
    }
  }, [videoData?.captionJson, videoData?.caption_json]);

  // Optimized caption lookup with caching
  const captionMap = useMemo(() => {
    const map = new Map();
    captions.forEach((caption) => {
      const startFrame = Math.floor(caption.start * fps);
      const endFrame = Math.ceil(caption.end * fps);
      for (let f = startFrame; f < endFrame; f++) {
        map.set(f, caption.word);
      }
    });
    return map;
  }, [captions, fps]);

  const getCurrentCaption = useCallback(() => {
    return captionMap.get(frame) || "";
  }, [captionMap, frame]);

  // Get the selected caption style
  const selectedCaptionStyle = useMemo(() => {
    const styleName = videoData?.caption?.style;
    return styleName && captionStyles[styleName]
      ? captionStyles[styleName]
      : null;
  }, [videoData?.caption?.style]);

  // Optimized image processing
  const images = useMemo(() => {
    const raw = videoData?.images;
    if (!raw) {
      console.log("No images data found");
      return [];
    }

    try {
      let processedImages;

      // Handle different formats
      if (Array.isArray(raw)) {
        processedImages = raw;
      } else if (typeof raw === "string") {
        processedImages = JSON.parse(raw);
      } else {
        console.log("Unknown images format:", typeof raw);
        return [];
      }

      console.log("Raw processed images:", processedImages);

      // Extract URLs from the processed data
      let imageUrls = [];

      if (Array.isArray(processedImages)) {
        // If it's already an array of URLs
        if (
          processedImages.length > 0 &&
          typeof processedImages[0] === "string"
        ) {
          imageUrls = processedImages.filter(
            (url) => url && url.startsWith("http")
          );
        }
        // If it's an array of objects with image URLs
        else if (
          processedImages.length > 0 &&
          typeof processedImages[0] === "object"
        ) {
          // Try to find image URLs in the objects
          imageUrls = processedImages
            .map((item) => {
              if (item.image) return item.image;
              if (item.url) return item.url;
              if (item.imageUrl) return item.imageUrl;
              if (item.imageURL) return item.imageURL;
              return null;
            })
            .filter((url) => url && url.startsWith("http"));
        }
      }

      console.log("Final image URLs:", imageUrls);
      return imageUrls;
    } catch (error) {
      console.error("Error processing images:", error);
      return [];
    }
  }, [videoData?.images]);

  // Preload images when they change
  useEffect(() => {
    if (images.length > 0) {
      preloadImages(images);
      // Set a timeout to mark images as loaded
      const timer = setTimeout(() => setImagesLoaded(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [images]);

  // Calculate frames per image - memoized
  const framesPerImage = useMemo(() => {
    if (!images.length) return 0;
    return Math.floor(durationInFrames / images.length);
  }, [images.length, durationInFrames]);

  // Premium cinematic transitions with multiple effect types
  const getPremiumTransitionEffects = useCallback(
    (index, from, duration) => {
      const progress = (frame - from) / duration;
      const clampedProgress = Math.max(0, Math.min(1, progress));

      // Ken Burns effect - dynamic zoom and pan
      const kenBurnsScale = interpolate(
        clampedProgress,
        [0, 0.3, 0.7, 1],
        [1.2, 1.1, 1.05, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      // Dynamic panning based on image index
      const panX = interpolate(
        clampedProgress,
        [0, 1],
        [index % 2 === 0 ? -30 : 30, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      const panY = interpolate(
        clampedProgress,
        [0, 1],
        [index % 3 === 0 ? -20 : 20, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      // Premium fade with sophisticated timing
      const fadeIn = interpolate(
        clampedProgress,
        [0, 0.15, 0.25],
        [0, 0.8, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      const fadeOut = interpolate(
        clampedProgress,
        [0.75, 0.85, 1],
        [1, 0.8, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      // Morphing effect - subtle shape transformation
      const morphScale = interpolate(
        clampedProgress,
        [0, 0.5, 1],
        [1.05, 1.02, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      // Cinematic blur with depth of field
      const cinematicBlur = interpolate(
        clampedProgress,
        [0, 0.2, 0.8, 1],
        [3, 0, 0, 3],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      // Subtle rotation for organic movement
      const organicRotation = interpolate(
        clampedProgress,
        [0, 0.5, 1],
        [0.01, 0, -0.01],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      // Dynamic brightness adjustment
      const brightness = interpolate(
        clampedProgress,
        [0, 0.3, 0.7, 1],
        [0.9, 1.05, 1.05, 0.9],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      // Contrast enhancement
      const contrast = interpolate(
        clampedProgress,
        [0, 0.5, 1],
        [0.95, 1.1, 0.95],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }
      );

      return {
        opacity: Math.min(fadeIn, fadeOut),
        scale: kenBurnsScale * morphScale,
        panX,
        panY,
        rotation: organicRotation,
        blur: cinematicBlur,
        brightness,
        contrast,
      };
    },
    [frame]
  );

  // Enhanced caption animation with parallax effect
  const getCaptionAnimation = useCallback(() => {
    const progress = frame / durationInFrames;

    // Parallax effect - captions move slightly slower than images
    const parallaxY = interpolate(progress, [0, 1], [0, -10], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Subtle scale animation
    const captionScale = interpolate(progress, [0, 0.5, 1], [0.95, 1, 0.95], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Fade in/out at start/end
    const captionOpacity = interpolate(
      progress,
      [0, 0.1, 0.9, 1],
      [0, 1, 1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    return {
      transform: `translateY(${parallaxY}px) scale(${captionScale})`,
      opacity: captionOpacity,
    };
  }, [frame, durationInFrames]);

  // Dynamic background animation
  const getBackgroundAnimation = useCallback(() => {
    const progress = frame / durationInFrames;

    // Create a subtle gradient shift
    const hueShift = interpolate(progress, [0, 1], [0, 360], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Subtle opacity animation
    const bgOpacity = interpolate(progress, [0, 0.5, 1], [0.1, 0.05, 0.1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return {
      background: `linear-gradient(45deg, 
        hsla(${hueShift}, 70%, 20%, ${bgOpacity}), 
        hsla(${hueShift + 60}, 70%, 15%, ${bgOpacity * 0.5})
      )`,
    };
  }, [frame, durationInFrames]);

  // Premium dynamic background with atmospheric effects
  const getPremiumBackgroundAnimation = useCallback(() => {
    const progress = frame / durationInFrames;

    // Dynamic color palette based on video progress
    const hue1 = interpolate(
      progress,
      [0, 0.25, 0.5, 0.75, 1],
      [200, 280, 320, 40, 200],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    const hue2 = interpolate(
      progress,
      [0, 0.25, 0.5, 0.75, 1],
      [240, 300, 340, 60, 240],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    // Dynamic saturation and lightness
    const saturation = interpolate(progress, [0, 0.5, 1], [60, 80, 60], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const lightness = interpolate(progress, [0, 0.5, 1], [15, 25, 15], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Atmospheric opacity with breathing effect
    const atmosphericOpacity = interpolate(
      progress,
      [0, 0.5, 1],
      [0.08, 0.12, 0.08],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    // Dynamic gradient angle
    const gradientAngle = interpolate(progress, [0, 1], [45, 135], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Multiple gradient layers for depth
    const primaryGradient = `linear-gradient(${gradientAngle}deg, 
      hsla(${hue1}, ${saturation}%, ${lightness}%, ${atmosphericOpacity}), 
      hsla(${hue2}, ${saturation}%, ${lightness + 5}%, ${
      atmosphericOpacity * 0.7
    })
    )`;

    const secondaryGradient = `radial-gradient(circle at 30% 70%, 
      hsla(${hue1 + 30}, ${saturation + 10}%, ${lightness + 10}%, ${
      atmosphericOpacity * 0.5
    }), 
      transparent 60%
    )`;

    const tertiaryGradient = `radial-gradient(circle at 70% 30%, 
      hsla(${hue2 - 30}, ${saturation + 15}%, ${lightness + 15}%, ${
      atmosphericOpacity * 0.3
    }), 
      transparent 50%
    )`;

    return {
      background: `${primaryGradient}, ${secondaryGradient}, ${tertiaryGradient}`,
      transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  }, [frame, durationInFrames]);

  // Premium caption animations with cinematic effects
  const getPremiumCaptionAnimation = useCallback(() => {
    const progress = frame / durationInFrames;

    // Floating effect with subtle oscillation
    const floatY = interpolate(
      progress,
      [0, 0.25, 0.5, 0.75, 1],
      [0, -5, 0, -3, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    // Dynamic scale with breathing effect
    const breathingScale = interpolate(
      progress,
      [0, 0.5, 1],
      [0.98, 1.02, 0.98],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    // Sophisticated fade with multiple stages
    const captionOpacity = interpolate(
      progress,
      [0, 0.05, 0.1, 0.9, 0.95, 1],
      [0, 0.3, 1, 1, 0.3, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    // Subtle rotation for organic feel
    const captionRotation = interpolate(
      progress,
      [0, 0.5, 1],
      [-0.005, 0, 0.005],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );

    // Dynamic shadow for depth
    const shadowBlur = interpolate(progress, [0, 0.5, 1], [8, 12, 8], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return {
      transform: `translateY(${floatY}px) scale(${breathingScale}) rotate(${captionRotation}rad)`,
      opacity: captionOpacity,
      filter: `drop-shadow(0 4px ${shadowBlur}px rgba(0, 0, 0, 0.3))`,
    };
  }, [frame, durationInFrames]);

  // Handle image loading errors
  const handleImageError = useCallback((index) => {
    setImageErrors((prev) => new Set(prev).add(index));
  }, []);

  // Set duration frame for parent component
  useEffect(() => {
    if (setDurationFrame && durationInFrames) {
      setDurationFrame(durationInFrames);
    }
  }, [durationInFrames, setDurationFrame]);

  // If no images, show a placeholder
  if (!images.length) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "18px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>
            No images available
          </div>
          <div style={{ fontSize: "14px", opacity: 0.7 }}>
            Please check your video data
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Validate audio URL before using it
  const isValidAudioURL = useMemo(() => {
    const audioURL = videoData?.audioURL || videoData?.audio_url;
    if (!audioURL) {
      console.log("No audio URL found");
      return false;
    }
    try {
      const url = new URL(audioURL);
      const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"];
      const isValid = audioExtensions.some((ext) =>
        url.pathname.toLowerCase().includes(ext)
      );
      console.log(
        `Audio URL validation: ${audioURL} -> ${isValid ? "valid" : "invalid"}`
      );
      return isValid;
    } catch (error) {
      console.warn("Invalid audio URL:", audioURL);
      return false;
    }
  }, [videoData?.audioURL, videoData?.audio_url]);

  return (
    <AbsoluteFill style={getPremiumBackgroundAnimation()}>
      {/* Audio component - only once, outside sequences */}
      {isValidAudioURL && (
        <Audio
          src={videoData.audioURL || videoData.audio_url}
          volume={1}
          onError={(error) => {
            console.error("Audio loading error in Remotion:", error);
            console.error(
              "Audio URL:",
              videoData.audioURL || videoData.audio_url
            );
          }}
        />
      )}

      {/* Debug info for audio issues */}
      {!isValidAudioURL && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "8px",
            fontSize: "12px",
            zIndex: 1000,
            borderRadius: "4px",
          }}
        >
          {videoData?.audioURL ? "Invalid audio URL" : "No audio URL available"}
        </div>
      )}

      {/* Image sequences with premium cinematic transitions */}
      {images.map((imageUrl, index) => {
        const from = index * framesPerImage;
        const duration = framesPerImage;
        const {
          opacity,
          scale,
          panX,
          panY,
          rotation,
          blur,
          brightness,
          contrast,
        } = getPremiumTransitionEffects(index, from, duration);
        const hasError = imageErrors.has(index);

        return (
          <Sequence key={index} from={from} durationInFrames={duration}>
            <AbsoluteFill
              style={{
                opacity: opacity,
                transform: `scale(${scale}) translate(${panX}px, ${panY}px) rotate(${rotation}rad)`,
                filter: `blur(${blur}px) brightness(${brightness}) contrast(${contrast})`,
                transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
            >
              {hasError ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "16px",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                      Image {index + 1} failed to load
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.7 }}>
                      {imageUrl}
                    </div>
                  </div>
                </div>
              ) : (
                <Img
                  src={imageUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    // Remove transform from here since it's now on the parent
                  }}
                  onError={() => handleImageError(index)}
                  // Add loading optimization
                  loading="eager"
                />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Premium captions overlay with cinematic effects */}
      <AbsoluteFill
        style={{
          color: "white",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 80,
          height: "100%",
          textAlign: "center",
          pointerEvents: "none", // Don't interfere with video controls
        }}
      >
        <div
          style={{
            backgroundColor: selectedCaptionStyle
              ? "transparent"
              : "rgba(0, 0, 0, 0.8)",
            padding: selectedCaptionStyle ? "0" : "20px 40px",
            borderRadius: selectedCaptionStyle ? "0" : "16px",
            maxWidth: "85%",
            margin: "0 auto",
            minHeight: selectedCaptionStyle ? "auto" : "90px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Premium transitions for captions
            transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            ...selectedCaptionStyle, // Apply the selected caption style
            ...getPremiumCaptionAnimation(), // Apply premium animations
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: selectedCaptionStyle
                ? selectedCaptionStyle.fontSize
                : "36px",
              fontWeight: selectedCaptionStyle
                ? selectedCaptionStyle.fontWeight
                : "700",
              lineHeight: "1.2",
              textShadow: selectedCaptionStyle
                ? selectedCaptionStyle.textShadow
                : "3px 3px 6px rgba(0, 0, 0, 0.9)",
              color: selectedCaptionStyle
                ? selectedCaptionStyle.color
                : "white",
              textTransform: selectedCaptionStyle
                ? selectedCaptionStyle.textTransform
                : "none",
              letterSpacing: selectedCaptionStyle
                ? selectedCaptionStyle.letterSpacing
                : "normal",
              fontStyle: selectedCaptionStyle
                ? selectedCaptionStyle.fontStyle
                : "normal",
              fontFamily: selectedCaptionStyle
                ? selectedCaptionStyle.fontFamily
                : "inherit",
              // Add smooth text transitions
              transition: "all 0.1s ease-out",
            }}
          >
            {getCurrentCaption()}
          </h2>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default RemotionComposition;
