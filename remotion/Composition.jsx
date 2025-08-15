import RemotionComposition from "../app/(main)/_components/RemotionComposition";

export const MyComposition = ({ videoData }) => {
  // Calculate duration based on audio or use default
  let durationInFrames = 30 * 25; // Default 25 seconds at 30fps

  if (videoData?.audioURL) {
    // In a real implementation, you'd analyze the audio duration
    // For now, we'll use a reasonable default based on content
    if (videoData?.script) {
      // Estimate duration based on script length (average 150 words per minute)
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

  console.log("MyComposition duration calculation:", {
    imageCount: videoData?.images?.length || 0,
    hasAudio: !!videoData?.audioURL,
    scriptLength: videoData?.script?.split(" ").length || 0,
    calculatedDuration: durationInFrames,
    calculatedSeconds: durationInFrames / 30,
  });

  return (
    <RemotionComposition
      videoData={videoData}
      setDurationFrame={(frames) => {
        // This will be called by the RemotionComposition to set the actual duration
        if (frames && frames > durationInFrames) {
          console.log(
            `MyComposition: Updating duration from ${durationInFrames} to ${frames} frames`
          );
          durationInFrames = frames;
        }
      }}
    />
  );
};
