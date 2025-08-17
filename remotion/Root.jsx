import React from "react";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";

export const RemotionRoot = ({ videoData }) => {
  // Calculate duration based on script length, audio, or captions
  let durationInFrames = 30 * 10; // Default 10 seconds at 30fps

  // Method 1: Calculate based on script length (average 150 words per minute)
  if (videoData?.script) {
    const wordCount = videoData.script.split(/\s+/).length;
    const estimatedDurationSeconds = Math.max(10, wordCount / 2.5); // 2.5 words per second
    durationInFrames = Math.ceil(estimatedDurationSeconds * 30);
    console.log(
      `Script-based duration: ${wordCount} words = ${estimatedDurationSeconds}s = ${durationInFrames} frames`
    );
  }

  // Method 2: Use caption timing if available
  if (videoData?.captionJson) {
    try {
      const captions =
        typeof videoData.captionJson === "string"
          ? JSON.parse(videoData.captionJson)
          : videoData.captionJson;

      if (Array.isArray(captions) && captions.length > 0) {
        const lastCaption = captions[captions.length - 1];
        const captionDuration = Math.ceil((lastCaption.end || 0) * 30);
        if (captionDuration > durationInFrames) {
          durationInFrames = captionDuration;
          console.log(`Caption-based duration: ${captionDuration} frames`);
        }
      }
    } catch (error) {
      console.warn("Failed to parse captions for duration calculation:", error);
    }
  }

  // Method 3: Use image count as fallback
  if (videoData?.images && Array.isArray(videoData.images)) {
    const imageBasedDuration = videoData.images.length * 3 * 30; // 3 seconds per image
    if (imageBasedDuration > durationInFrames) {
      durationInFrames = imageBasedDuration;
      console.log(`Image-based duration: ${imageBasedDuration} frames`);
    }
  }

  console.log(
    `Final duration: ${durationInFrames} frames (${durationInFrames / 30}s)`
  );

  return (
    <>
      <Composition
        id="MyComposition"
        component={MyComposition}
        durationInFrames={durationInFrames}
        fps={30}
        width={720}
        height={1280}
        defaultProps={{
          videoData: videoData || {},
        }}
      />
    </>
  );
};
