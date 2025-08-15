import { ArrowLeft, DownloadIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function VideoInfo({ videoData }) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBack = () => {
    router.push("/dashboard/videos");
  };

  const handleDownloadVideo = async () => {
    setIsDownloading(true);

    try {
      if (!videoData) {
        alert("No video data available for download.");
        return;
      }

      if (!videoData.audioURL) {
        alert(
          "Audio is not ready yet. Please wait for audio generation to complete."
        );
        return;
      }

      if (
        !videoData.images ||
        (Array.isArray(videoData.images) && videoData.images.length === 0)
      ) {
        alert(
          "Images are not ready yet. Please wait for image generation to complete."
        );
        return;
      }

      const response = await fetch("/api/export-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoData: {
            ...videoData,
            // Ensure all required fields are present
            id: videoData.id,
            title: videoData.title || "Untitled Video",
            script: videoData.script || "",
            topic: videoData.topic || "",
            videoStyle: videoData.videoStyle || "cinematic",
            voice: videoData.voice || "default",
            audioURL: videoData.audioURL,
            images: videoData.images,
            captionJson: videoData.captionJson,
            caption: videoData.caption || { style: "default" },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || errorData.details || "Failed to render video"
        );
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Generated video file is empty");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${videoData?.title || "video"}_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        `Download failed: ${error.message}\n\nPlease check the console for more details.`
      );
    } finally {
      setIsDownloading(false);
    }
  };

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
            {videoData?.videoStyle || "No style specified"}
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
          disabled={isDownloading || !videoData?.audioURL || !videoData?.images}
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              Rendering Video...
            </>
          ) : !videoData?.audioURL || !videoData?.images ? (
            <>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Video Not Ready
            </>
          ) : (
            <>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download MP4
            </>
          )}
        </Button>

        {!videoData?.audioURL && (
          <p className="text-xs text-gray-500 text-center">
            Audio is still being generated...
          </p>
        )}
        {!videoData?.images && (
          <p className="text-xs text-gray-500 text-center">
            Images are still being generated...
          </p>
        )}
        {videoData?.audioURL && videoData?.images && (
          <p className="text-xs text-gray-500 text-center">
            Click to download as MP4 video file
          </p>
        )}
      </div>
    </div>
  );
}

export default VideoInfo;
