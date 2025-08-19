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
import axios from "axios";
import { useAuthContext } from "@/app/providers";
import { useSupabaseMutation } from "@/hooks/use-supabase";
import { supabaseService } from "@/lib/supabase-service";
import { useToast } from "@/components/ui/toast";
import { FormProgress } from "@/components/ui/progress-bar";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Loader2 } from "lucide-react";

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
      return;
    }

    setIsDownloading(true);
    try {
      // First, fetch the actual video data from the database
      const fetchResponse = await axios.post("/api/get-video-data", {
        videoId: videoData._id,
      });

      if (!fetchResponse.data.videoData)
        throw new Error("Failed to fetch video data from database");

      const actualVideoData = fetchResponse.data.videoData;

      // Check if video generation is complete
      if (actualVideoData.status !== "ready") {
        return;
      }

      // Now export the video with the actual data
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
        reader.onload = () => {};
        reader.readAsText(response.data);
      }
    } catch (error) {
      if (error.response?.data) {
        // Try to read error details from blob response
        const reader = new FileReader();
        reader.onload = () => {};
        reader.readAsText(error.response.data);
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

    return isComplete;
  };

  useEffect(() => {}, [formData]);

  const GenerateVideo = async () => {
    // Check if user exists and has required properties
    if (!user) {
      return;
    }

    // Check if user has a valid ID
    if (!user._id || typeof user._id !== "string" || user._id.trim() === "") {
      return;
    }

    // Additional validation for Supabase UUID format
    if (!user._id || user._id.length < 20) {
      return;
    }

    if (!formData?.title?.trim()) {
      addToast("Please enter a video title", "error");
      return;
    }

    if (!formData?.topic?.trim()) {
      addToast("Please enter a topic", "error");
      return;
    }

    if (!formData?.script?.trim()) {
      addToast("Please enter a script", "error");
      return;
    }

    if (!formData?.videoStyle?.trim()) {
      addToast("Please select a video style", "error");
      return;
    }

    if (!formData?.voice?.trim()) {
      addToast("Please select a voice", "error");
      return;
    }

    if (!formData?.caption?.style?.trim()) {
      addToast("Please select a caption style", "error");
      return;
    }

    try {
      const userId = user._id;

      if (!userId) {
        return;
      }

      // Additional validation for userId
      if (typeof userId !== "string" || userId.trim() === "") return;

      // Validate form data is not empty
      if (!formData.title?.trim()) {
        return;
      }

      if (!formData.topic?.trim()) {
        return;
      }

      if (!formData.script?.trim()) {
        return;
      }

      if (!formData.videoStyle?.trim()) {
        return;
      }

      if (!formData.voice?.trim()) {
        return;
      }

      // First, create the video record in Supabase
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

      const result = await axios.post("/api/generate-video-data", {
        ...formData,
        videoRecordId: videoRecordId, // Pass the Supabase record ID
        userId: userId, // Also pass user ID for reference
        userEmail: user?.email || user?.name || user?.displayName || "unknown",
      });

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

      // Show success toast with instant navigation hint
      addToast("Video generation started! Redirecting...", "success", 1500);

      // Redirect to videos page immediately after successful generation
      // Use replace for instant navigation (no back button)
      router.replace("/dashboard/videos", { scroll: false });
    } catch (error) {
      // Show error toast
      addToast(
        `Video generation failed: ${
          error.response?.data?.error || error.message
        }`,
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full px-2 sm:px-4 lg:px-6 py-6">
        {/* Simple Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-purple-400">
            Create New Video
          </h1>
          <p className="text-purple-200 text-sm mt-1">
            Transform your ideas into captivating short videos
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Main Form */}
          <div className="xl:col-span-3 space-y-6">
            {/* Project Title Card */}
            <div className="bg-black rounded-xl border border-gray-800 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">1</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Project Details
                  </h2>
                  <p className="text-gray-400 text-sm">Start with the basics</p>
                </div>
              </div>
              <Topic
                onHandleInputChange={onHandleInputChange}
                currentTopic={formData?.topic}
              />
            </div>

            {/* Video Style Card */}
            <div className="bg-black rounded-xl border border-gray-800 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">2</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Visual Style</h2>
                  <p className="text-gray-400 text-sm">Choose your aesthetic</p>
                </div>
              </div>
              <VideoStyle
                onHandleInputChange={onHandleInputChange}
                videoData={generatedVideoData}
                onDownload={handleDownload}
              />
            </div>

            {/* Voice & Captions Card */}
            <div className="bg-black rounded-xl border border-gray-800 p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">3</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Audio & Text</h2>
                  <p className="text-gray-400 text-sm">
                    Bring your story to life
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Voice onHandleInputChange={onHandleInputChange} />
                <Captions onHandleInputChange={onHandleInputChange} />
              </div>
            </div>

            {/* Generate Video Button */}
            <div className="pt-2">
              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={GenerateVideo}
                disabled={!isFormComplete() || createVideoLoading}
              >
                {createVideoLoading ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <WandSparkles className="mr-2 h-4 w-4" />
                )}
                Generate Video
              </Button>
            </div>
          </div>

          {/* Right Column - Progress & Preview */}
          <div className="xl:col-span-1 space-y-4">
            {/* Progress Card */}
            <div className="bg-black rounded-xl border border-gray-800 p-4 sticky top-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">📊</span>
                </div>
                <h3 className="text-base font-semibold text-white">Progress</h3>
              </div>
              <FormProgress formData={formData} />
            </div>

            {/* Preview Card */}
            <div className="bg-black rounded-xl border border-gray-800 p-4 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">🎬</span>
                </div>
                <h3 className="text-base font-semibold text-white">Preview</h3>
              </div>
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
              <p className="text-gray-400 text-sm text-center mt-3">
                Your rendered preview will appear here once ready
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay
        isVisible={createVideoLoading}
        message="Generating your video..."
      />
    </div>
  );
}

export default CreateNewVideo;
