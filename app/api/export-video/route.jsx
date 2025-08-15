
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

    if (!videoData) {
      return new Response(JSON.stringify({ error: "Video data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!videoData.audioURL) {
      return new Response(
        JSON.stringify({ error: "No audio available for video" }),
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

    const bundled = await bundle(path.join(process.cwd(), "remotion/index.js"));

    const compositions = await getCompositions(bundled);
    const composition = compositions.find(
      (comp) => comp.id === "MyComposition"
    );

    if (!composition) {
      throw new Error("Composition 'MyComposition' not found");
    }

    let durationInFrames = 30 * 25; // Default 25 seconds at 30fps

    if (videoData.audioURL) {
      // Estimate duration based on script length if available
      if (videoData.script) {
        const wordCount = videoData.script.split(" ").length;
        const estimatedSeconds = Math.max(25, Math.min(60, wordCount / 2.5)); // 2.5 words per second
        durationInFrames = Math.floor(estimatedSeconds * 30);
      } else {
        durationInFrames = 30 * 30; // 30 seconds for audio
      }
    } else if (videoData.images && Array.isArray(videoData.images)) {
      // Calculate based on number of images (4 seconds per image minimum)
      const imageCount = videoData.images.length;
      const minSecondsPerImage = 4;
      const totalSeconds = Math.max(25, imageCount * minSecondsPerImage);
      durationInFrames = Math.floor(totalSeconds * 30);
    }

    // Ensure minimum duration of 25 seconds
    durationInFrames = Math.max(durationInFrames, 25 * 30);

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

    try {
      // Render the video with timeout
      const renderPromise = renderMedia({
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
          // Progress logging removed
        },
      });

      // Add timeout (5 minutes)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Video rendering timed out after 5 minutes")),
          5 * 60 * 1000
        );
      });

      await Promise.race([renderPromise, timeoutPromise]);
    } catch (renderError) {
      console.error("Remotion rendering failed:", renderError);
      throw new Error(`Video rendering failed: ${renderError.message}`);
    }

    // Check if file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error("Video file was not created");
    }

    // Read the generated file
    const videoBuffer = fs.readFileSync(outputPath);

    // Clean up the temporary file
    await unlink(outputPath);

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
