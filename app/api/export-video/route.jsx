// Force server-side only
export const runtime = "nodejs";

import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export async function POST(req) {
  try {
    const { videoData } = await req.json();
    console.log("Video Data Received:", videoData);

    if (!videoData) {
      return new Response(JSON.stringify({ error: "Video data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate that we have the necessary data
    if (!videoData.audioURL && !videoData.captionJson) {
      return new Response(
        JSON.stringify({ error: "No audio or captions available for video" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (
      !videoData.images ||
      (Array.isArray(videoData.images) && videoData.images.length === 0)
    ) {
      return new Response(
        JSON.stringify({ error: "No images available for video" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Starting video rendering process...");
    console.log("Video data validation passed:", {
      hasAudio: !!videoData.audioURL,
      hasImages: !!videoData.images,
      imageCount: Array.isArray(videoData.images)
        ? videoData.images.length
        : "unknown",
      hasCaptions: !!videoData.captionJson,
      videoStyle: videoData.videoStyle,
      script: videoData.script?.substring(0, 100) + "...",
    });

    // Bundle the Remotion composition
    console.log("Bundling Remotion composition...");
    const bundled = await bundle(path.join(process.cwd(), "remotion/index.js"));
    console.log("Bundle created successfully");

    // Get the composition
    console.log("Getting compositions...");
    const compositions = await getCompositions(bundled);
    const composition = compositions.find(
      (comp) => comp.id === "MyComposition"
    );

    if (!composition) {
      throw new Error("Composition 'MyComposition' not found");
    }

    console.log("Composition found:", composition.id);

    // Calculate duration based on script length, audio, or captions
    let durationInFrames = 30 * 10; // Default 10 seconds at 30fps

    // Method 1: Calculate based on script length (average 150 words per minute)
    if (videoData.script) {
      const wordCount = videoData.script.split(/\s+/).length;
      const estimatedDurationSeconds = Math.max(10, wordCount / 2.5); // 2.5 words per second
      durationInFrames = Math.ceil(estimatedDurationSeconds * 30);
      console.log(
        `Script-based duration: ${wordCount} words = ${estimatedDurationSeconds}s = ${durationInFrames} frames`
      );
    }

    // Method 2: Use caption timing if available
    if (videoData.captionJson) {
      try {
        const captions =
          typeof videoData.captionJson === "string"
            ? JSON.parse(videoData.captionJson)
            : videoData.captionJson;

        if (Array.isArray(captions) && captions.length > 0) {
          const lastCaption = captions[captions.length - 1];
          const captionDuration = Math.ceil((lastCaption.end || 0) * 30);
          if (captionDuration > durationInFrames) {
            durationInFrames = captionDuration;
            console.log(`Caption-based duration: ${captionDuration} frames`);
          }
        }
      } catch (error) {
        console.warn(
          "Failed to parse captions for duration calculation:",
          error
        );
      }
    }

    // Method 3: Use image count as fallback
    if (videoData.images && Array.isArray(videoData.images)) {
      const imageBasedDuration = videoData.images.length * 3 * 30; // 3 seconds per image
      if (imageBasedDuration > durationInFrames) {
        durationInFrames = imageBasedDuration;
        console.log(`Image-based duration: ${imageBasedDuration} frames`);
      }
    }

    console.log(
      `Final duration: ${durationInFrames} frames (${durationInFrames / 30}s)`
    );

    console.log("Calculated duration:", durationInFrames, "frames");

    // Create output filename
    const outputFilename = `video-${Date.now()}.mp4`;
    const outputPath = path.join(
      process.cwd(),
      "public",
      "exports",
      outputFilename
    );

    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), "public", "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    console.log("Output path:", outputPath);
    console.log("Rendering video with data:", {
      imageCount: videoData.images?.length || 0,
      hasAudio: !!videoData.audioURL,
      hasCaptions: !!videoData.captionJson,
      duration: durationInFrames / 30,
    });
    console.log("Rendering video...");

    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: {
        videoData: {
          ...videoData,
          durationInFrames,
        },
      },
      onProgress: (progress) => {
        console.log(`Rendering progress: ${Math.round(progress * 100)}%`);
      },
    });

    console.log("Video rendered successfully");

    // Check if file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error("Video file was not created");
    }

    // Get file stats
    const stats = fs.statSync(outputPath);
    console.log("Video file size:", stats.size, "bytes");

    if (stats.size === 0) {
      throw new Error("Video file is empty");
    }

    // Read the generated file
    const videoBuffer = fs.readFileSync(outputPath);

    // Clean up the temporary file
    await unlink(outputPath);

    console.log(
      "Video file prepared for download, size:",
      videoBuffer.length,
      "bytes"
    );

    // Return the video as a downloadable file
    return new Response(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
        "Content-Length": videoBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error processing video export request:", error);

    // Return a more detailed error response
    return new Response(
      JSON.stringify({
        error: "Failed to process video export request",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
