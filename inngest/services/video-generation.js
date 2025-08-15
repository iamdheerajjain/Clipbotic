// Video generation service - broken down into focused functions
import axios from "axios";
import { createClient } from "@deepgram/sdk";
import { generateScript } from "@/configs/AiModel";

const BASE_URL = "https://aigurulab.tech";
const apiKey = process.env.AIGURULAB_API_KEY;

if (!apiKey) {
  throw new Error("AIGURULAB_API_KEY environment variable is required");
}

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

// Helper function to validate audio URL
function validateAudioURL(urlString) {
  try {
    const url = new URL(urlString);
    const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"];
    return audioExtensions.some((ext) =>
      url.pathname.toLowerCase().includes(ext)
    );
  } catch {
    return false;
  }
}

// Helper function to extract URL from text
function extractURLFromText(text) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urlMatch = text.match(urlRegex);
  return urlMatch ? urlMatch[0] : null;
}

export async function generateAudio(script, voice) {
  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Audio generation failed: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const audioURL = URL.createObjectURL(audioBlob);

    return {
      audioURL,
      success: true,
    };
  } catch (error) {
    throw new Error(`Audio generation failed: ${error.message}`);
  }
}

export async function generateCaptions(audioURL) {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          file: audioURL,
          model: "whisper-1",
          response_format: "verbose_json",
          timestamp_granularities: ["word"],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Caption generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.words || [];
  } catch (error) {
    throw new Error(`Caption generation failed: ${error.message}`);
  }
}

export async function generateImagePrompts(script, videoStyle) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert at creating image prompts for video generation. Create 5 detailed, cinematic image prompts based on the script and video style. Each prompt should be descriptive and suitable for AI image generation.`,
          },
          {
            role: "user",
            content: `Script: ${script}\nVideo Style: ${videoStyle}\n\nGenerate 5 image prompts that match the style and content.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Image prompt generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    const prompts = result.choices[0].message.content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, "").trim());

    return prompts.slice(0, 5);
  } catch (error) {
    throw new Error(`Image prompt generation failed: ${error.message}`);
  }
}

export async function generateImages(script, videoStyle, count = 5) {
  try {
    const prompts = await generateImagePrompts(script, videoStyle);
    const validPrompts = prompts.filter((prompt) => prompt.length > 0);

    const imagePromises = validPrompts.map(async (prompt, index) => {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: `${prompt}, ${videoStyle} style, cinematic, high quality, 16:9 aspect ratio`,
            n: 1,
            size: "1024x576",
            quality: "standard",
            response_format: "url",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Image generation failed for prompt ${index + 1}: ${
            response.statusText
          }`
        );
      }

      const result = await response.json();
      return result.data[0].url;
    });

    const images = await Promise.all(imagePromises);
    return images.filter((url) => url);
  } catch (error) {
    throw new Error(`Image generation failed: ${error.message}`);
  }
}
