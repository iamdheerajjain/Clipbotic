"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Topic from "../topic";
import VideoStyle from "../../_components/VideoStyle";
import Voice from "../videos/Voice";
import Captions from "../videos/Captions";
import { WandSparkles } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import Preview from "../../_components/Preview";
import SectionHeader from "@/components/ui/section-header";
import GlassPanel from "@/components/ui/glass-panel";
import axios from "axios";
import { useAuthContext } from "@/app/providers";
import { useCreateVideo } from "@/hooks/use-supabase";

function CreateNewVideo() {
  const [formData, setFormData] = useState({});
  const [generatedVideoData, setGeneratedVideoData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createVideo, { loading: createLoading }] = useCreateVideo();
  const { user } = useAuthContext();
  const router = useRouter();

  const userId = user?.supabaseId || user?.uid;

  const refreshVideoData = async () => {
    if (!generatedVideoData?._id) return;

    setIsRefreshing(true);
    try {
      const response = await axios.post("/api/get-video-data", {
        videoId: generatedVideoData._id,
      });

      if (response.data.videoData) {
        const updatedVideoData = response.data.videoData;

        setGeneratedVideoData((prev) => ({
          ...prev,
          ...updatedVideoData,
        }));

        if (
          updatedVideoData.images &&
          updatedVideoData.images.length > 0 &&
          (updatedVideoData.audioURL || updatedVideoData.captionJson)
        ) {
        }
      }
    } catch (error) {
    } finally {
      setIsRefreshing(false);
    }
  };

  const onHandleInputChange = (fieldName, fieldValue) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [fieldName]: fieldValue,
      };
      return newFormData;
    });
  };

  const handleDownload = async (videoData) => {
    if (!videoData || !videoData._id) {
      alert("No video data available for download");
      return;
    }

    setIsDownloading(true);
    try {
      const fetchResponse = await axios.post("/api/get-video-data", {
        videoId: videoData._id,
      });

      if (!fetchResponse.data.videoData) {
        throw new Error("Failed to fetch video data from database");
      }

      const actualVideoData = fetchResponse.data.videoData;

      if (actualVideoData.status !== "ready") {
        if (actualVideoData.status === "partial") {
          alert(
            "Video images are ready, but audio and captions are still being generated. Please wait a few more minutes and try again."
          );
        } else {
          alert(
            "Video generation is still in progress. Please wait a few minutes and try again."
          );
        }
        return;
      }

      const response = await axios.post(
        "/api/export-video",
        {
          videoData: actualVideoData,
        },
        {
          responseType: "blob",
        }
      );
      if (
        response.headers["content-type"] &&
        response.headers["content-type"].includes("video/mp4")
      ) {
        const blob = new Blob([response.data], { type: "video/mp4" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${actualVideoData.title || "video"}-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        alert("✅ Video downloaded successfully!");
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            alert(`Download failed: ${errorData.error || "Unknown error"}`);
          } catch {
            alert("Download failed: Invalid response from server");
          }
        };
        reader.readAsText(response.data);
      }
    } catch (error) {
      if (error.response?.data) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            alert(
              `Download failed: ${
                errorData.error || "Unknown error"
              }\n\nDetails: ${errorData.details || "No additional details"}`
            );
          } catch {
            alert(`Download failed: ${error.message || "Unknown error"}`);
          }
        };
        reader.readAsText(error.response.data);
      } else {
        alert(`Download failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!generatedVideoData || generatedVideoData.status !== "generating")
      return;

    const interval = setInterval(() => {
      refreshVideoData();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [generatedVideoData?.status]);

  const isFormComplete = () => {
    return !!(
      formData?.title?.trim() &&
      formData?.topic?.trim() &&
      formData?.script?.trim() &&
      formData?.videoStyle?.trim() &&
      formData?.voice?.trim() &&
      formData?.caption
    );
  };

  const GenerateVideo = async () => {
    if (!user) {
      alert("Please log in to generate a video");
      return;
    }

    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      alert("User authentication error. Please log out and log back in.");
      return;
    }

    if (userId.length < 10) {
      alert("Invalid user ID format. Please log out and log back in.");
      return;
    }

    if (!formData?.title?.trim()) {
      alert("Please enter a video title");
      return;
    }

    if (!formData?.topic?.trim()) {
      alert("Please enter a topic");
      return;
    }

    if (!formData?.script?.trim()) {
      alert("Please enter a script");
      return;
    }

    if (!formData?.videoStyle?.trim()) {
      alert("Please select a video style");
      return;
    }

    if (!formData?.voice?.trim()) {
      alert("Please select a voice");
      return;
    }

    if (!formData?.caption) {
      alert("Please select a caption style");
      return;
    }

    try {
      if (!userId) {
        alert("User authentication error. Please log out and log back in.");
        return;
      }

      if (typeof userId !== "string" || userId.trim() === "") {
        alert("Invalid user ID format. Please log out and log back in.");
        return;
      }

      const videoRecord = await createVideo({
        title: formData.title.trim(),
        topic: formData.topic.trim(),
        script: formData.script.trim(),
        videoStyle: formData.videoStyle.trim(),
        caption: formData.caption || {},
        voice: formData.voice.trim(),
        userEmail: (
          user?.email ||
          user?.name ||
          user?.displayName ||
          "unknown"
        ).trim(),
        createdBy: (
          user?.email ||
          user?.name ||
          user?.displayName ||
          "unknown"
        ).trim(),
        userId,
      });

      const videoRecordId = videoRecord.id;
      const result = await axios.post("/api/generate-video-data", {
        ...formData,
        videoRecordId: videoRecordId,
        userId: userId,
        userEmail: user?.email || user?.name || user?.displayName || "unknown",
      });

      setGeneratedVideoData({
        _id: videoRecordId,
        images: formData.images || [],
        audioURL: formData.audioURL,
        captionJson: formData.captionJson,
        script: formData.script,
        videoStyle: formData.videoStyle,
        voice: formData.voice,
        caption: formData.caption,
        status: "generating",
      });

      router.push("/dashboard/videos");
    } catch (error) {
      if (error.response?.data?.error) {
        alert(
          `❌ API Error: ${error.response.data.error}\n\nDetails: ${
            error.response.data.details || "No additional details"
          }`
        );
      } else if (error?.message?.includes("ArgumentValidationError")) {
        alert("User validation error. Please check the console for details.");
      } else {
        alert(
          `Failed to generate video: ${error.message}\n\nCheck console for details.`
        );
      }
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Create New Video"
        subtitle="Describe your idea, pick a style and voice, and generate a polished short."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassPanel className="col-span-2 p-5 md:p-6">
          <div className="space-y-6">
            <Topic
              onHandleInputChange={onHandleInputChange}
              currentTopic={formData?.topic}
            />
            <VideoStyle
              onHandleInputChange={onHandleInputChange}
              videoData={generatedVideoData}
              onDownload={handleDownload}
              onRefresh={refreshVideoData}
              isRefreshing={isRefreshing}
            />
            <Voice onHandleInputChange={onHandleInputChange} />
            <Captions onHandleInputChange={onHandleInputChange} />
            <Button
              className="w-full mt-1"
              onClick={GenerateVideo}
              disabled={!isFormComplete()}
            >
              <WandSparkles className="mr-2" />
              Generate Video
            </Button>
          </div>
        </GlassPanel>
        <GlassPanel className="p-5 md:p-6">
          <div className="space-y-3">
            <div className="pt-260">
              <Preview
                videoUrl={formData?.previewUrl}
                placeholderImageUrl={
                  Array.isArray(formData?.images)
                    ? formData.images?.[0]
                    : undefined
                }
                selectedVideoStyle={formData?.videoStyle}
                selectedCaption={formData?.caption?.style}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Your rendered preview will appear here once ready.
            </p>
            {generatedVideoData && (
              <div className="text-xs text-blue-600 text-center p-2 bg-blue-50 rounded-lg">
                🎬 Video generation in progress... Download will be available
                once complete.
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export default CreateNewVideo;
