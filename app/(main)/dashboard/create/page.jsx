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
import { useSupabaseMutation } from "@/hooks/use-supabase";
import { supabaseService } from "@/lib/supabase-service";
import { useToast } from "@/components/ui/toast";
import { FormProgress } from "@/components/ui/progress-bar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

function CreateNewVideo() {
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    script: "",
    videoStyle: "",
    voice: "",
    caption: { style: "" },
  });
  const [generatedVideoData, setGeneratedVideoData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { mutate: CreateVideoData, loading: createVideoLoading } =
    useSupabaseMutation(supabaseService.createVideoData.bind(supabaseService));
  const { user } = useAuthContext();
  const router = useRouter();
  const { addToast } = useToast();

  // Prefetch videos page for instant navigation
  useEffect(() => {
    router.prefetch("/dashboard/videos");
  }, [router]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onGenerateVideo: () => {
      if (isFormComplete() && !createVideoLoading) {
        GenerateVideo();
      }
    },
  });

  const onHandleInputChange = (fieldName, fieldValue) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [fieldName]: fieldValue,
      };
      return newFormData;
    });
  };

  // Handle video download
  const handleDownload = async (videoData) => {
    if (!videoData || !videoData._id) {
      console.error("No video data available for download");
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
          console.log(
            "Video images are ready, but audio and captions are still being generated. Please wait a few more minutes and try again."
          );
        } else {
          console.log(
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
      } else {
        // Handle error response
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            console.error(
              `Download failed: ${errorData.error || "Unknown error"}`
            );
          } catch {
            console.error("Download failed: Invalid response from server");
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
            console.error(
              `Download failed: ${
                errorData.error || "Unknown error"
              }\n\nDetails: ${errorData.details || "No additional details"}`
            );
          } catch {
            console.error(
              `Download failed: ${error.message || "Unknown error"}`
            );
          }
        };
        reader.readAsText(error.response.data);
      } else {
        console.error(`Download failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    const isComplete = !!(
      formData?.title?.trim() &&
      formData?.topic?.trim() &&
      formData?.script?.trim() &&
      formData?.videoStyle?.trim() &&
      formData?.voice?.trim() &&
      formData?.caption?.style?.trim()
    );

    console.log("Form completion check:", {
      title: !!formData?.title?.trim(),
      topic: !!formData?.topic?.trim(),
      script: !!formData?.script?.trim(),
      videoStyle: !!formData?.videoStyle?.trim(),
      voice: !!formData?.voice?.trim(),
      caption: !!formData?.caption?.style?.trim(),
      isComplete,
      rawCaption: formData?.caption,
    });

    return isComplete;
  };

  useEffect(() => {
    console.log("FormData changed:", formData);
    console.log("Form completion status:", isFormComplete());
  }, [formData]);

  const GenerateVideo = async () => {
    console.log("🎬 GenerateVideo function called");
    console.log("Current form data:", formData);
    console.log("Form complete:", isFormComplete());

    // Check if user exists and has required properties
    if (!user) {
      console.error("User not logged in");
      return;
    }

    // Check if user has a valid ID
    if (!user._id || typeof user._id !== "string" || user._id.trim() === "") {
      console.error("Invalid user object:", user);
      return;
    }

    // Additional validation for Supabase UUID format
    if (!user._id || user._id.length < 20) {
      console.error("Invalid Supabase UUID format:", user._id);
      return;
    }

    console.log("User object:", user);
    console.log("User ID validation:", {
      exists: !!user._id,
      type: typeof user._id,
      value: user._id,
      length: user._id?.length,
      format: user._id?.length >= 20 ? "Valid Supabase UUID" : "Invalid format",
    });

    console.log("Form data validation:", {
      title: !!formData?.title,
      topic: !!formData?.topic,
      script: !!formData?.script,
      videoStyle: !!formData?.videoStyle,
      caption: !!formData?.caption,
      voice: !!formData?.voice,
    });

    console.log("🔍 Validating form fields...");

    if (!formData?.title?.trim()) {
      addToast("Please enter a video title", "error");
      console.error("❌ Video title is required");
      console.error("Title value:", formData?.title);
      return;
    }

    if (!formData?.topic?.trim()) {
      addToast("Please enter a topic", "error");
      console.error("❌ Topic is required");
      console.error("Topic value:", formData?.topic);
      return;
    }

    if (!formData?.script?.trim()) {
      addToast("Please enter a script", "error");
      console.error("❌ Script is required");
      console.error("Script value:", formData?.script);
      return;
    }

    if (!formData?.videoStyle?.trim()) {
      addToast("Please select a video style", "error");
      console.error("❌ Video style is required");
      console.error("Video style value:", formData?.videoStyle);
      return;
    }

    if (!formData?.voice?.trim()) {
      addToast("Please select a voice", "error");
      console.error("❌ Voice is required");
      console.error("Voice value:", formData?.voice);
      return;
    }

    if (!formData?.caption?.style?.trim()) {
      addToast("Please select a caption style", "error");
      console.error("❌ Caption style is required");
      console.error("Caption data:", formData?.caption);
      return;
    }

    console.log("✅ All form fields validated successfully");

    try {
      console.log("🚀 Starting video generation process...");
      const userId = user._id;

      if (!userId) {
        console.error("User ID not found. User object:", user);
        return;
      }

      // Additional validation for userId
      if (typeof userId !== "string" || userId.trim() === "") {
        console.error("Invalid user ID format:", {
          userId,
          type: typeof userId,
        });
        return;
      }

      console.log("🔄 Starting video creation process...");
      console.log("📋 Form data:", formData);
      console.log("👤 User ID:", userId);
      console.log("👤 User ID type:", typeof userId);
      console.log("👤 User ID length:", userId.length);

      // Validate form data is not empty
      if (!formData.title?.trim()) {
        console.error("Please enter a video title");
        return;
      }

      if (!formData.topic?.trim()) {
        console.error("Please enter a topic");
        return;
      }

      if (!formData.script?.trim()) {
        console.error("Please enter a script");
        return;
      }

      if (!formData.videoStyle?.trim()) {
        console.error("Please select a video style");
        return;
      }

      if (!formData.voice?.trim()) {
        console.error("Please select a voice");
        return;
      }

      // First, create the video record in Supabase
      console.log("📝 Creating initial video record in Supabase...");
      const videoRecordId = await CreateVideoData({
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
      });

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
      console.log("💾 Storing generated video data...");
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

      // Show success toast with instant navigation hint
      addToast("Video generation started! Redirecting...", "success", 1500);

      // Redirect to videos page immediately after successful generation
      console.log("🚀 Redirecting to videos page...");

      // Use replace for instant navigation (no back button)
      router.replace("/dashboard/videos", { scroll: false });
    } catch (error) {
      console.error("❌ Error generating video:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      // Show error toast
      addToast(
        `Video generation failed: ${
          error.response?.data?.error || error.message
        }`,
        "error"
      );

      // Log detailed error information
      if (error.response?.data?.error) {
        console.error(
          `❌ API Error: ${error.response.data.error}\n\nDetails: ${
            error.response.data.details || "No additional details"
          }`
        );
      } else if (error?.message?.includes("ArgumentValidationError")) {
        console.error("Validation error details:", {
          userObject: user,
          userId: user?._id,
          userType: typeof user?._id,
        });
        console.error(
          "User validation error. Please check the console for details."
        );
      } else {
        console.error(
          `Failed to generate video: ${error.message}\n\nCheck console for details.`
        );
      }
    }
  };

  return (
    <div className="space-y-5">
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
            />
            <Voice onHandleInputChange={onHandleInputChange} />
            <Captions onHandleInputChange={onHandleInputChange} />
            <Button
              className="w-full mt-1"
              onClick={GenerateVideo}
              disabled={!isFormComplete() || createVideoLoading}
            >
              <WandSparkles className="mr-2" />
              {createVideoLoading ? "Generating..." : "Generate Video"}{" "}
              {!isFormComplete() && "(Form Incomplete)"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              💡 Tip: Press Ctrl+Enter to generate video
            </p>
          </div>
        </GlassPanel>
        <GlassPanel className="p-5 md:p-6">
          <div className="space-y-6">
            <FormProgress formData={formData} />
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
          </div>
        </GlassPanel>
      </div>
      <LoadingOverlay
        isVisible={createVideoLoading}
        message="Generating your video..."
      />
    </div>
  );
}

export default CreateNewVideo;
