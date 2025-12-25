// Force server-side only
export const runtime = "nodejs";

import { supabaseService } from "@/lib/supabase-service";

export async function POST(req) {
  try {
    const { videoId } = await req.json();
    console.log("Fetching video data for ID:", videoId);

    if (!videoId) {
      return new Response(JSON.stringify({ error: "Video ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch video data from Supabase
    const videoData = await supabaseService.getVideoById(videoId);

    if (!videoData) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine video status
    let status = "generating";
    if (
      videoData.images &&
      videoData.images.length > 0 &&
      (videoData.audio_url || videoData.caption_json)
    ) {
      status = "ready";
    } else if (videoData.images && videoData.images.length > 0) {
      status = "partial"; // Has images but no audio/captions yet
    }

    const enhancedVideoData = {
      ...videoData,
      status,
      isReady: status === "ready",
      hasImages: !!(videoData.images && videoData.images.length > 0),
      hasAudio: !!videoData.audio_url,
      hasCaptions: !!videoData.caption_json,
    };

    console.log("Video data fetched successfully:", {
      id: enhancedVideoData._id,
      title: enhancedVideoData.title,
      status: enhancedVideoData.status,
      hasImages: enhancedVideoData.hasImages,
      imageCount: Array.isArray(enhancedVideoData.images)
        ? enhancedVideoData.images.length
        : 0,
      hasAudio: enhancedVideoData.hasAudio,
      hasCaptions: enhancedVideoData.hasCaptions,
    });

    return new Response(JSON.stringify({ videoData: enhancedVideoData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching video data:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch video data",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
