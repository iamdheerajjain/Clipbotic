"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import RemotionPlayer from "../_components/RemotionPlayer";
import VideoInfo from "../_components/VideoInfo";
import { useParams } from "next/navigation";
import { supabaseService } from "@/lib/supabase-service";

function PlayVideoPage() {
  const { videoId } = useParams();
  const [videoData, setVideoData] = useState();
  const [loading, setLoading] = useState(true);

  const GetVideoDataById = useCallback(async () => {
    try {
      if (!videoId) {
        console.error("No videoId provided");
        setVideoData(null);
        setLoading(false);
        return;
      }

      const result = await supabaseService.getVideoById(videoId);
      setVideoData(result);
    } catch (error) {
      console.error("GetVideoDataById error:", error);
      setVideoData(null);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    if (videoId) {
      GetVideoDataById();
    }
  }, [videoId, GetVideoDataById]);

  // Memoized loading state
  const isLoading = useMemo(() => loading || !videoData, [loading, videoData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-white">Video Player</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* Video Player */}
          <div className="xl:col-span-2">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <RemotionPlayer videoData={videoData} />
            </div>
          </div>

          {/* Video Info */}
          <div className="xl:col-span-1">
            <VideoInfo videoData={videoData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(PlayVideoPage);
