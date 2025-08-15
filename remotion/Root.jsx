import React from "react";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";

export const RemotionRoot = ({ videoData }) => {
  // Calculate duration based on content
  let durationInFrames = 30 * 25; // Default 25 seconds at 30fps

  if (videoData?.audioURL) {
    // Estimate duration based on script length if available
    if (videoData?.script) {
      const wordCount = videoData.script.split(" ").length;
      const estimatedSeconds = Math.max(25, Math.min(60, wordCount / 2.5)); // 2.5 words per second
      durationInFrames = Math.floor(estimatedSeconds * 30);
    } else {
      durationInFrames = 30 * 30; // 30 seconds for audio
    }
  } else if (videoData?.images && Array.isArray(videoData.images)) {
    // Calculate based on number of images (4 seconds per image minimum)
    const imageCount = videoData.images.length;
    const minSecondsPerImage = 4;
    const totalSeconds = Math.max(25, imageCount * minSecondsPerImage);
    durationInFrames = Math.floor(totalSeconds * 30);
  }

  // Ensure minimum duration of 25 seconds
  durationInFrames = Math.max(durationInFrames, 25 * 30);

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
