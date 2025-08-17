import { ArrowLeft, DownloadIcon } from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function VideoInfo({ videoData }) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBack = useCallback(() => {
    router.push("/dashboard/videos");
  }, [router]);

  // Memoized video readiness check
  const videoReadiness = useMemo(() => {
    if (!videoData) return { isReady: false, missingComponents: [] };

    const images = Array.isArray(videoData.images)
      ? videoData.images
      : typeof videoData.images === "string"
      ? JSON.parse(videoData.images)
      : [];

    const hasAudio = videoData.audio_url;
    const hasCaptions = videoData.caption_json;
    const hasImages = images.length > 0;

    const missingComponents = [];
    if (!hasImages) missingComponents.push("images");
    if (!hasAudio && !hasCaptions) missingComponents.push("audio/captions");

    return {
      isReady: hasImages && (hasAudio || hasCaptions),
      hasImages,
      hasAudio,
      hasCaptions,
      missingComponents,
    };
  }, [videoData]);

  const handleDownloadVideo = useCallback(async () => {
    if (!videoData) {
      console.error("No video data available for download.");
      return;
    }

    if (!videoReadiness.isReady) {
      const missing = videoReadiness.missingComponents.join(", ");
      console.error(
        `Video is not ready yet. Missing: ${missing}. Please wait a few minutes and try again.`
      );
      return;
    }

    setIsDownloading(true);

    try {
      console.log("Starting video download for:", videoData.title);

      // Prepare video data with correct field names for the API
      const videoDataForAPI = {
        ...videoData,
        audioURL: videoData.audio_url, // Map to expected API field
        captionJson: videoData.caption_json, // Map to expected API field
        videoStyle: videoData.video_style, // Map to expected API field
        script: videoData.script,
        images: videoData.images,
        title: videoData.title,
        topic: videoData.topic,
        voice: videoData.voice,
      };

      // Call the export API to render the video
      const response = await fetch("/api/export-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoData: videoDataForAPI }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to render video");
      }

      console.log("Video rendered successfully, preparing download...");

      // Get the video blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${videoData.title || "video"}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      console.log("Video download completed successfully");
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [videoData, videoReadiness.isReady, videoReadiness.missingComponents]);

  // Memoized status messages
  const statusMessages = useMemo(() => {
    if (!videoData) return [];

    const messages = [];

    if (!videoReadiness.hasImages) {
      messages.push("Images are still being generated...");
    }

    if (!videoReadiness.hasAudio && !videoReadiness.hasCaptions) {
      messages.push("Audio and captions are still being generated...");
    }

    if (videoReadiness.isReady) {
      if (videoReadiness.hasAudio && videoReadiness.hasImages) {
        messages.push("Click to download as MP4 video file");
      } else if (videoReadiness.hasCaptions && videoReadiness.hasImages) {
        messages.push("Click to download as MP4 video file (with captions)");
      }
    }

    return messages;
  }, [videoData, videoReadiness]);

  if (!videoData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-gray-400">Loading video info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Videos</span>
      </button>

      {/* Video Information */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Project Name
          </h2>
          <p className="text-gray-400 text-sm">
            {videoData?.title || "Untitled"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Script</h2>
          <p className="text-gray-400 text-sm">
            {videoData?.script || "No script available"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Video Style</h2>
          <p className="text-gray-400 text-sm">
            {videoData?.video_style || "No style specified"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Topic</h2>
          <p className="text-gray-400 text-sm">
            {videoData?.topic || "No topic specified"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Voice</h2>
          <p className="text-gray-400 text-sm">
            {videoData?.voice || "No voice specified"}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 space-y-3">
        <Button
          className="w-full bg-white text-black hover:bg-gray-200 border-0 disabled:bg-gray-600 disabled:text-gray-400"
          onClick={handleDownloadVideo}
          disabled={isDownloading || !videoReadiness.isReady}
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              Rendering Video...
            </>
          ) : (
            <>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download MP4
            </>
          )}
        </Button>

        {/* Status Messages */}
        {statusMessages.map((message, index) => (
          <p key={index} className="text-xs text-gray-500 text-center">
            {message}
          </p>
        ))}
      </div>
    </div>
  );
}

export default React.memo(VideoInfo);
