import { supabaseAdmin } from "./supabase-admin";

export class SupabaseAdminService {
  // Update video data (Bypasses RLS)
  async updateVideoData({ videoRecordId, audioURL, images, captionJson }) {
    try {
      console.log(
        "SupabaseAdminService: UpdateVideoData called for:",
        videoRecordId
      );

      // Build update data
      const updateData = {};
      if (audioURL !== undefined) updateData.audio_url = audioURL;
      if (images !== undefined) updateData.images = images;
      if (captionJson !== undefined) updateData.caption_json = captionJson;

      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }

      const { data: updatedVideo, error: updateError } = await supabaseAdmin
        .from("video_data")
        .update(updateData)
        .eq("id", videoRecordId)
        .select()
        .single();

      if (updateError) {
        console.error("SupabaseAdminService update error:", updateError);
        throw updateError;
      }

      console.log(
        "SupabaseAdminService: Video updated successfully:",
        updatedVideo.id
      );
      return updatedVideo;
    } catch (error) {
      console.error("SupabaseAdminService: UpdateVideoData error:", error);
      throw error;
    }
  }
}

export const supabaseAdminService = new SupabaseAdminService();
