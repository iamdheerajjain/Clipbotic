import { inngest } from "./client";
import { supabaseService } from "@/lib/supabase-service";
import {
  AudioService,
  CaptionService,
  ImagePromptService,
  ImageGenerationService,
} from "./services/video-generation";

// Supabase service is imported and used directly

// Helper function to extract audio URL consistently
function extractAudioURL(audioResponse) {
  const possibleFields = [
    "audioUrl",
    "url",
    "audio_url",
    "download_url",
    "file_url",
    "result.url",
    "data.url",
    "audio",
    "link",
    "href",
  ];

  for (const field of possibleFields) {
    const value = field.includes(".")
      ? field.split(".").reduce((obj, key) => obj?.[key], audioResponse)
      : audioResponse[field];

    if (value && typeof value === "string") {
      return value;
    }
  }

  return null;
}

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

export const GenerateVideoData = inngest.createFunction(
  {
    id: "generate-video-data",
    name: "Generate Video Data",
    retries: 3,
  },
  { event: "generate-video-data" },
  async ({ event, step }) => {
    try {
      console.log("=== GenerateVideoData START ===");
      console.log("Event data received:", JSON.stringify(event.data, null, 2));

      const {
        script,
        topic,
        title,
        caption,
        videoStyle,
        voice,
        videoRecordId,
        userId,
        userEmail,
      } = event.data || {};

      // Validate required fields with better error messages
      if (!script) {
        throw new Error("Script is required for video generation");
      }
      if (!voice) {
        throw new Error("Voice is required for audio generation");
      }
      if (!videoRecordId) {
        throw new Error("Video record ID is required to update the database");
      }

      console.log("Processing video:", {
        topic,
        title,
        videoStyle,
        voice,
        videoRecordId,
        userId,
        userEmail,
        scriptLength: script.length,
      });

      // Generate audio using the service
      const GenerateAudioFile = await step.run(
        "GenerateAudioFile",
        async () => {
          console.log("Starting audio generation...");
          const result = await AudioService.generateAudio(script, voice);
          console.log("Audio generation completed");
          return result;
        }
      );

      // Generate captions using the service
      const GenerateCaptions = await step.run("GenerateCaptions", async () => {
        console.log("Starting caption generation...");
        const audioURL = extractAudioURL(GenerateAudioFile);
        if (!audioURL) {
          console.error("Audio response structure:", GenerateAudioFile);
          throw new Error(
            "No valid audio URL found in the API response. Available fields: " +
              Object.keys(GenerateAudioFile).join(", ")
          );
        }
        const result = await CaptionService.generateCaptions(audioURL);
        console.log("Caption generation completed");
        return result;
      });

      // Generate image prompts using the service
      const GenerateImagePrompts = await step.run(
        "generateImagePrompt",
        async () => {
          console.log("Starting image prompt generation...");
          const result = await ImagePromptService.generateImagePrompts(
            script,
            videoStyle
          );
          console.log("Image prompt generation completed");
          return result;
        }
      );

      // Generate images using the service
      const GenerateImages = await step.run("generateImages", async () => {
        console.log("Starting image generation...");
        const result =
          await ImageGenerationService.generateImages(GenerateImagePrompts);
        console.log("Image generation completed");
        return result;
      });

      // Update Supabase database
      const updateResult = await step.run(
        "UpdateSupabaseDatabase",
        async () => {
          try {
            console.log("=== Updating Supabase Database ===");
            console.log("Video Record ID:", videoRecordId);
            console.log("GenerateImages count:", GenerateImages?.length || 0);
            console.log(
              "GenerateCaptions count:",
              GenerateCaptions?.length || 0
            );

            if (!videoRecordId) {
              throw new Error("videoRecordId is required but was not provided");
            }

            const audioURL = extractAudioURL(GenerateAudioFile);
            if (!audioURL) {
              throw new Error(
                "No valid audio URL available for database update"
              );
            }

            const updateData = {
              videoRecordId: videoRecordId,
              audioURL: audioURL,
            };

            if (GenerateImages && GenerateImages.length > 0) {
              updateData.images = JSON.stringify(GenerateImages);
              console.log(`Adding ${GenerateImages.length} images to update`);
            }

            if (GenerateCaptions && GenerateCaptions.length > 0) {
              updateData.captionJson = JSON.stringify(GenerateCaptions);
              console.log(
                `Adding ${GenerateCaptions.length} captions to update`
              );
            }

            console.log("Update data being sent:", updateData);

            const result = await supabaseService.updateVideoData(updateData);

            if (!result) {
              throw new Error("UpdateVideoData returned null");
            }

            console.log("Database updated successfully, result:", result);
            return result;
          } catch (err) {
            console.error("Database update failed:", err);
            console.error("Error details:", {
              message: err.message,
              stack: err.stack,
              videoRecordId,
              videoRecordIdType: typeof videoRecordId,
              audioURL: extractAudioURL(GenerateAudioFile),
              imagesCount: GenerateImages?.length || 0,
              captionsCount: GenerateCaptions?.length || 0,
            });
            throw new Error(`Database update failed: ${err.message}`);
          }
        }
      );

      console.log("=== GenerateVideoData SUCCESS ===");
      return {
        success: true,
        audioData: GenerateAudioFile,
        images: GenerateImages,
        captions: GenerateCaptions,
        databaseUpdate: updateResult,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("=== GenerateVideoData ERROR ===");
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        eventData: event?.data,
      });
      throw error;
    }
  }
);
