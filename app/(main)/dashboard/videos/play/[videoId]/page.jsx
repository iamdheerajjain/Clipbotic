"use client";
import React, { useState, useEffect } from "react";
import RemotionPlayer from "../_components/RemotionPlayer";
import VideoInfo from "../_components/VideoInfo";
import { useParams } from "next/navigation";
import { supabaseService } from "@/lib/supabase-service";

function PlayVideoPage() {
  const { videoId } = useParams();
  const [videoData, setVideoData] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    videoId && GetVideoDataById();
  }, [videoId]);

  const GetVideoDataById = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await supabaseService.getVideoById(videoId);

      setVideoData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-gray-400">Loading video...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-400 mb-2">Error loading video</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default PlayVideoPage;
