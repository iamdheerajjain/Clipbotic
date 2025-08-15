import { inngest } from "./client.js";
import {
  generateAudio,
  generateCaptions,
  generateImages,
} from "./services/video-generation.js";
import { supabaseService } from "../lib/supabase-service.js";

export const generateVideoData = inngest.createFunction(
  { name: "Generate Video Data" },
  { event: "app/generate-video-data" },
  async ({ event, step }) => {
    const {
      title,
      topic,
      script,
      videoStyle,
      voice,
      caption,
      videoRecordId,
      userId,
      userEmail,
    } = event.data;

    // Validate required fields
    if (
      !title ||
      !topic ||
      !script ||
      !videoStyle ||
      !voice ||
      !videoRecordId
    ) {
      throw new Error("Missing required fields for video generation");
    }

    // Validate video record exists
    const existingVideo = await step.run("validate-video-record", async () => {
      return await supabaseService.getVideoById(videoRecordId);
    });

    if (!existingVideo) {
      throw new Error(`Video record with ID ${videoRecordId} not found`);
    }

    // Update status to processing
    await step.run("update-status-processing", async () => {
      return await supabaseService.updateVideo(videoRecordId, {
        status: "processing",
        updatedAt: new Date().toISOString(),
      });
    });

    // Generate audio
    const GenerateAudioFile = await step.run("generate-audio", async () => {
      return await generateAudio(script, voice);
    });

    // Generate captions from audio
    const GenerateCaptions = await step.run("generate-captions", async () => {
      return await generateCaptions(GenerateAudioFile.audioURL);
    });

    // Generate image prompts
    const imagePrompts = await step.run("generate-image-prompts", async () => {
      return await generateImages(script, videoStyle, 5);
    });

    // Generate images
    const GenerateImages = await step.run("generate-images", async () => {
      return await generateImages(script, videoStyle, 5);
    });

    // Update database with generated data
    const updateData = {
      audioURL: GenerateAudioFile.audioURL,
      captionJson: JSON.stringify(GenerateCaptions),
      images: GenerateImages,
      status: "ready",
      updatedAt: new Date().toISOString(),
    };

    // Add images to update if they exist
    if (GenerateImages && GenerateImages.length > 0) {
      updateData.images = GenerateImages;
    }

    // Update the video record with all generated data
    const result = await step.run("update-database", async () => {
      return await supabaseService.updateVideo(videoRecordId, updateData);
    });

    if (!result) {
      throw new Error("Failed to update video record in database");
    }

    return {
      success: true,
      videoId: videoRecordId,
      audioURL: GenerateAudioFile.audioURL,
      captionCount: GenerateCaptions?.length || 0,
      imageCount: GenerateImages?.length || 0,
    };
  }
);
