"use client";
import React, { useState, useEffect } from "react";
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

  // Allow Firebase UIDs as temporary IDs for immediate functionality
  const userId = user?.supabaseId || user?.uid;

  // Function to refresh video data
  const refreshVideoData = async () => {
    if (!generatedVideoData?._id) return;

    setIsRefreshing(true);
    try {
      console.log("Refreshing video data...");
      const response = await axios.post("/api/get-video-data", {
        videoId: generatedVideoData._id,
      });

      if (response.data.videoData) {
        const updatedVideoData = response.data.videoData;
        console.log("Updated video data:", updatedVideoData);

        // Update the local state with fresh data
        setGeneratedVideoData((prev) => ({
          ...prev,
          ...updatedVideoData,
        }));

        // Check if generation is complete
        if (
          updatedVideoData.images &&
          updatedVideoData.images.length > 0 &&
          (updatedVideoData.audioURL || updatedVideoData.captionJson)
        ) {
          console.log("Video generation appears to be complete!");
        }
      }
    } catch (error) {
      console.error("Failed to refresh video data:", error);
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
      console.log("Updated formData:", newFormData);
      return newFormData;
    });
  };

  // Handle video download
  const handleDownload = async (videoData) => {
    if (!videoData || !videoData._id) {
      alert("No video data available for download");
      return;
    }

    setIsDownloading(true);
    try {
      console.log("Starting video download for video ID:", videoData._id);

      // First, fetch the actual video data from the database
      console.log("Fetching actual video data from database...");
      const fetchResponse = await axios.post("/api/get-video-data", {
        videoId: videoData._id,
      });

      if (!fetchResponse.data.videoData) {
        throw new Error("Failed to fetch video data from database");
      }

      const actualVideoData = fetchResponse.data.videoData;
      console.log("Fetched video data:", {
        id: actualVideoData._id,
        title: actualVideoData.title,
        hasImages: !!actualVideoData.images,
        imageCount: Array.isArray(actualVideoData.images)
          ? actualVideoData.images.length
          : 0,
        hasAudio: !!actualVideoData.audioURL,
        hasCaptions: !!actualVideoData.captionJson,
      });

      // Check if video generation is complete
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

      // Now export the video with the actual data
      console.log("Starting video export with actual data...");
      const response = await axios.post(
        "/api/export-video",
        {
          videoData: actualVideoData,
        },
        {
          responseType: "blob", // Important for file download
        }
      );

      // Check if the response is actually a video file
      if (
        response.headers["content-type"] &&
        response.headers["content-type"].includes("video/mp4")
      ) {
        // Create a download link
        const blob = new Blob([response.data], { type: "video/mp4" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${actualVideoData.title || "video"}-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log("Video downloaded successfully");
        alert("✅ Video downloaded successfully!");
      } else {
        // Handle error response
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
      console.error("Download failed:", error);

      if (error.response?.data) {
        // Try to read error details from blob response
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

  // Auto-refresh video data when generation is in progress
  useEffect(() => {
    if (!generatedVideoData || generatedVideoData.status !== "generating")
      return;

    const interval = setInterval(() => {
      console.log("Auto-refreshing video data...");
      refreshVideoData();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [generatedVideoData?.status]);

  // Check if all required fields are filled
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

  useEffect(() => {
    console.log("FormData changed:", formData);
  }, [formData]);

  const GenerateVideo = async () => {
    // Check if user exists and has required properties
    if (!user) {
      alert("Please log in to generate a video");
      return;
    }

    // Check if user has a valid ID
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      console.error("Invalid user object:", user);
      alert("User authentication error. Please log out and log back in.");
      return;
    }

    // Additional validation for UUID format (but allow Firebase UIDs too)
    if (userId.length < 10) {
      console.error("Invalid ID format:", userId);
      alert("Invalid user ID format. Please log out and log back in.");
      return;
    }

    console.log("User object:", user);
    console.log("User ID validation:", {
      exists: !!userId,
      type: typeof userId,
      value: userId,
      length: userId?.length,
      format: userId?.length >= 10 ? "Valid ID" : "Invalid format",
    });

    console.log("Form data validation:", {
      title: !!formData?.title,
      topic: !!formData?.topic,
      script: !!formData?.script,
      videoStyle: !!formData?.videoStyle,
      caption: !!formData?.caption,
      voice: !!formData?.voice,
    });

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
      // userId is already defined at the top of the component

      if (!userId) {
        console.error("User ID not found. User object:", user);
        alert("User authentication error. Please log out and log back in.");
        return;
      }

      // Additional validation for userId
      if (typeof userId !== "string" || userId.trim() === "") {
        console.error("Invalid user ID format:", {
          userId,
          type: typeof userId,
        });
        alert("Invalid user ID format. Please log out and log back in.");
        return;
      }

      console.log("🔄 Starting video creation process...");
      console.log("📋 Form data:", formData);
      console.log("👤 User ID:", userId);
      console.log("👤 User ID type:", typeof userId);
      console.log("👤 User ID length:", userId.length);

      // Validate form data is not empty
      if (!formData.title?.trim()) {
        alert("Please enter a video title");
        return;
      }

      if (!formData.topic?.trim()) {
        alert("Please enter a topic");
        return;
      }

      if (!formData.script?.trim()) {
        alert("Please enter a script");
        return;
      }

      if (!formData.videoStyle?.trim()) {
        alert("Please select a video style");
        return;
      }

      if (!formData.voice?.trim()) {
        alert("Please select a voice");
        return;
      }

      // First, create the video record in Supabase
      console.log("📝 Creating initial video record in Supabase...");
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
      console.log("✅ Supabase video record created with ID:", videoRecordId);

      // Check if the record was actually created by querying it back
      console.log("🔍 Verifying record creation...");

      // Then send the video generation request to Inngest WITH the video record ID
      console.log("🚀 Triggering Inngest video generation...");
      console.log("📤 Data being sent to API:", {
        title: formData.title,
        topic: formData.topic,
        script: formData.script,
        videoStyle: formData.videoStyle,
        voice: formData.voice,
        caption: formData.caption,
        videoRecordId: videoRecordId,
        userId: userId,
        userEmail: user?.email || user?.name || user?.displayName || "unknown",
      });

      const result = await axios.post("/api/generate-video-data", {
        ...formData,
        videoRecordId: videoRecordId, // Pass the Supabase record ID
        userId: userId, // Also pass user ID for reference
        userEmail: user?.email || user?.name || user?.displayName || "unknown",
      });

      console.log("✅ Video generation response:", result.data);

      // Store the generated video data for download
      // Note: This is just the metadata, the actual video generation happens in the background
      setGeneratedVideoData({
        _id: videoRecordId,
        images: formData.images || [],
        audioURL: formData.audioURL,
        captionJson: formData.captionJson,
        script: formData.script,
        videoStyle: formData.videoStyle,
        voice: formData.voice,
        caption: formData.caption,
        status: "generating", // Initial status, will be updated by the API
      });

      alert(
        `✅ Video generation started! Event ID: ${result.data.eventId}\n\n📝 Video Record ID: ${videoRecordId}\n\n🎬 You can now download your video using the Download MP4 button!`
      );
    } catch (error) {
      console.error("❌ Error generating video:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      // Show more detailed error information
      if (error.response?.data?.error) {
        alert(
          `❌ API Error: ${error.response.data.error}\n\nDetails: ${
            error.response.data.details || "No additional details"
          }`
        );
      } else if (error?.message?.includes("ArgumentValidationError")) {
        console.error("Validation error details:", {
          userObject: user,
          userId: userId,
          userType: typeof userId,
        });
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
