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
  console.log("Extracting audio URL from response:", audioResponse);

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
    "result",
    "data",
  ];

  for (const field of possibleFields) {
    const value = field.includes(".")
      ? field.split(".").reduce((obj, key) => obj?.[key], audioResponse)
      : audioResponse[field];

    if (value && typeof value === "string") {
      console.log(`Found audio URL in field "${field}":`, value);

      // Validate the URL
      try {
        const url = new URL(value);
        console.log("Validated audio URL:", url.href);

        // Check if it's an audio file
        const audioExtensions = [
          ".mp3",
          ".wav",
          ".ogg",
          ".m4a",
          ".aac",
          ".webm",
        ];
        const hasAudioExtension = audioExtensions.some((ext) =>
          url.pathname.toLowerCase().includes(ext)
        );

        if (hasAudioExtension) {
          console.log("Audio URL has valid extension:", url.href);
          return url.href;
        } else {
          console.warn(
            "Audio URL doesn't have a recognized audio extension:",
            url.href
          );
          // Still return it if it's a valid URL, as some APIs might not include extensions
          return url.href;
        }
      } catch (urlError) {
        console.warn(`Invalid URL format in field "${field}":`, value);
        continue;
      }
    }
  }

  // Try to find any string that looks like a URL in the response
  const responseString = JSON.stringify(audioResponse);
  const urlMatch = responseString.match(/https?:\/\/[^\s"']+/);
  if (urlMatch) {
    console.log("Found URL-like string in response:", urlMatch[0]);
    return urlMatch[0];
  }

  console.error("No valid audio URL found in response");
  console.error("Response structure:", JSON.stringify(audioResponse, null, 2));
  return null;
}

// Audio generation service
export class AudioService {
  static async generateAudio(script, voice) {
    try {
      console.log("Generating audio...");

      if (!script || !voice) {
        throw new Error("Script and voice are required for audio generation");
      }

      const response = await axios.post(
        `${BASE_URL}/api/text-to-speech`,
        { input: script, voice },
        {
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
          timeout: 120000, // 2 minutes
        }
      );

      console.log("Audio generated successfully");
      return response.data;
    } catch (error) {
      console.error(
        "Audio generation error:",
        error.response?.data || error.message
      );
      throw new Error(`Audio generation failed: ${error.message}`);
    }
  }
}

// Caption generation service
export class CaptionService {
  static async generateCaptions(audioURL) {
    try {
      if (!audioURL) {
        throw new Error("Audio URL is required for caption generation");
      }

      if (!process.env.DEEPGRAM_API_KEY) {
        console.warn(
          "DEEPGRAM_API_KEY environment variable is not set, skipping captions"
        );
        return [];
      }

      console.log("Generating captions from audio URL:", audioURL);

      const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
      const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
        { url: audioURL },
        {
          model: "nova-2",
          punctuate: true,
          diarize: false,
          smart_format: true,
        }
      );

      if (error) {
        console.error("Deepgram error:", error);
        throw new Error(`Caption generation failed: ${error.message}`);
      }

      const words = result.results?.channels[0]?.alternatives[0]?.words;
      if (!words || words.length === 0) {
        console.warn("No words found in transcription, using empty array");
        return [];
      }

      // Format captions for video player - group words into sentences
      const formattedCaptions = this.formatCaptionsForVideo(words);

      console.log(
        "Generated captions:",
        formattedCaptions.length,
        "caption segments"
      );
      return formattedCaptions;
    } catch (error) {
      console.error("Caption generation error:", error);
      // Don't fail the entire process if captions fail
      console.warn("Continuing without captions due to error");
      return [];
    }
  }

  // Format captions for video player
  static formatCaptionsForVideo(words) {
    if (!Array.isArray(words) || words.length === 0) {
      return [];
    }

    const captions = [];
    let currentCaption = {
      text: "",
      start: words[0]?.start || 0,
      end: 0,
      words: [],
    };

    words.forEach((word, index) => {
      const wordText = word.word || word.punctuated_word || "";

      // Add word to current caption
      currentCaption.words.push({
        word: wordText,
        start: word.start || 0,
        end: word.end || 0,
      });

      currentCaption.text += wordText + " ";
      currentCaption.end = word.end || 0;

      // Create new caption segment every 3-5 words or on punctuation
      const shouldSplit =
        wordText.match(/[.!?]$/) || // End of sentence
        currentCaption.words.length >= 5 || // Max 5 words per caption
        word.end - currentCaption.start > 3; // Max 3 seconds per caption

      if (shouldSplit && index < words.length - 1) {
        // Clean up text (remove trailing space)
        currentCaption.text = currentCaption.text.trim();

        // Add to captions array
        captions.push({ ...currentCaption });

        // Start new caption
        const nextWord = words[index + 1];
        currentCaption = {
          text: "",
          start: nextWord?.start || word.end || 0,
          end: 0,
          words: [],
        };
      }
    });

    // Add the last caption if it has content
    if (currentCaption.text.trim()) {
      currentCaption.text = currentCaption.text.trim();
      captions.push(currentCaption);
    }

    return captions;
  }
}

// Image prompt generation service
export class ImagePromptService {
  static async generateImagePrompts(script, videoStyle) {
    try {
      console.log("Generating image prompts for style:", videoStyle);

      const ImagePromptScript = `Generate Image Prompt of {style} style with all details for each scene for 30 seconds video : script: {script}
- Just Give specifying image prompt depends on the story line
- do not give camera angle image prompt
- Follow the Following schema and return JSON data (Max 4-5 Images)
[{
  imagePrompt: '',
  sceneContent: '<Script Content>'
}]`;

      const FINAL_PROMPT = ImagePromptScript.replace(
        "{style}",
        videoStyle
      ).replace("{script}", script);

      const result = await generateScript.sendMessage(FINAL_PROMPT);
      const responseText = await result.response.text();

      let resp;
      try {
        resp = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse AI response:", responseText);
        throw new Error("Invalid JSON response from AI model");
      }

      if (!Array.isArray(resp) || resp.length === 0) {
        throw new Error("AI returned invalid or empty image prompts");
      }

      console.log("Parsed image prompts:", resp.length, "prompts");
      return resp;
    } catch (error) {
      console.error("Image prompt generation error:", error);
      throw new Error(`Image prompt generation failed: ${error.message}`);
    }
  }
}

// Image generation service
export class ImageGenerationService {
  static async generateImages(imagePrompts) {
    try {
      if (!Array.isArray(imagePrompts) || imagePrompts.length === 0) {
        throw new Error("No valid image prompts available");
      }

      // Validate prompts
      const validPrompts = imagePrompts.filter(
        (prompt) =>
          prompt?.imagePrompt && typeof prompt.imagePrompt === "string"
      );

      if (validPrompts.length === 0) {
        throw new Error("No valid image prompts found");
      }

      console.log(`Generating ${validPrompts.length} images...`);

      // Process images with limited concurrency to avoid overwhelming the API
      const images = [];
      const batchSize = 2; // Process 2 images at a time

      for (let i = 0; i < validPrompts.length; i += batchSize) {
        const batch = validPrompts.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (element, batchIndex) => {
            const globalIndex = i + batchIndex;
            try {
              console.log(
                `Generating image ${globalIndex + 1}/${validPrompts.length}`
              );

              const requestBody = {
                input: element.imagePrompt,
                model: "sdxl",
                width: 1024,
                height: 1024,
              };

              let result;
              try {
                result = await axios.post(
                  `${BASE_URL}/api/generate-image`,
                  requestBody,
                  {
                    headers: {
                      "x-api-key": apiKey,
                      "Content-Type": "application/json",
                    },
                    timeout: 120000, // 2 minutes
                  }
                );
              } catch (sdxlError) {
                console.log(
                  `SDXL failed for image ${globalIndex + 1}, trying DALL-E 3...`
                );

                result = await axios.post(
                  `${BASE_URL}/api/generate-image`,
                  {
                    input: element.imagePrompt,
                    model: "dall-e-3",
                    size: "1024x1024",
                  },
                  {
                    headers: {
                      "x-api-key": apiKey,
                      "Content-Type": "application/json",
                    },
                    timeout: 120000,
                  }
                );
              }

              if (!result.data?.image) {
                console.error("Image response structure:", result.data);
                throw new Error("No image URL in API response");
              }

              console.log(
                `Image ${globalIndex + 1} generated successfully:`,
                result.data.image
              );
              return result.data.image;
            } catch (err) {
              console.error(
                `Failed to generate image ${globalIndex + 1}:`,
                err.message
              );
              throw new Error(
                `Image ${globalIndex + 1} generation failed: ${err.message}`
              );
            }
          })
        );

        images.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < validPrompts.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      console.log("All images generated successfully:", images.length);
      return images;
    } catch (error) {
      console.error("Image generation error:", error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }
}
