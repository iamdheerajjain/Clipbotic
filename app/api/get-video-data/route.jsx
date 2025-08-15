// Force server-side only
export const runtime = "nodejs";

import { supabaseService } from "@/lib/supabase-service";

export async function POST(req) {
  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return new Response(JSON.stringify({ error: "Video ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const videoData = await supabaseService.getVideoById(videoId);

    if (!videoData) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    let status = "generating";
    if (
      videoData.images &&
      videoData.images.length > 0 &&
      (videoData.audioURL || videoData.captionJson)
    ) {
      status = "ready";
    } else if (videoData.images && videoData.images.length > 0) {
      status = "partial"; 
    }

    const enhancedVideoData = {
      ...videoData,
      status,
      isReady: status === "ready",
      hasImages: !!(videoData.images && videoData.images.length > 0),
      hasAudio: !!videoData.audio_url,
      hasCaptions: !!videoData.caption_json,
    };

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
