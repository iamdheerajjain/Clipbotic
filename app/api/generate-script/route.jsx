import { NextResponse } from "next/server";
import { generateScript } from "@/configs/AiModel";

const SCRIPT_PROMPT = `Write two different engaging scripts for 30 seconds on Topic: {topic}
Requirements:
- Each script should be exactly 30 seconds when read aloud (approximately 75-90 words)
- Make them engaging and suitable for YouTube shorts
- Use simple, clear language
- Include a hook at the beginning
- End with a call to action or thought-provoking statement
- Do not add scene descriptions or camera directions
- Do not add anything in brackets or parentheses
- Just return the plain story text

Return the response in this exact JSON format:
{
  "scripts": [
    { "content": "First script content here..." },
    { "content": "Second script content here..." }
  ]
}`;

export async function POST(req) {
  try {
    const { topic } = await req.json();

    if (!topic || topic.trim() === "") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Sanitize the topic
    const sanitizedTopic = topic.trim().substring(0, 200);
    const PROMPT = SCRIPT_PROMPT.replace("{topic}", sanitizedTopic);
    
    console.log("Generating script for topic:", sanitizedTopic);

    let result;
    try {
      result = await generateScript.sendMessage(PROMPT);
    } catch (apiError) {
      console.error("Error calling generateScript.sendMessage:", {
        message: apiError.message,
        stack: apiError.stack,
        name: apiError.name,
      });
      throw new Error(`Failed to generate script: ${apiError.message}`);
    }

    if (!result) {
      console.error("Invalid result structure:", result);
      throw new Error("Invalid response from AI model");
    }

    // Extract text from response
    let rawText;
    try {
      if (result.response) {
        rawText = await result.response.text();
      } else {
        rawText = await result.text();
      }
    } catch (textError) {
      console.error("Error extracting text from response:", textError);
      throw new Error(`Failed to extract text from response: ${textError.message}`);
    }

    if (!rawText || rawText.trim() === "") {
      console.error("Empty or null text received from response");
      throw new Error("No text content received from AI model response");
    }

    console.log("Raw response from Gemini:", rawText.substring(0, 200) + "...");

    // Clean the response to extract JSON
    let cleanedText = rawText.trim();

    // Remove markdown code block markers if present
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.substring(3);
    }

    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.lastIndexOf("```"));
    }

    cleanedText = cleanedText.trim();

    let json;
    try {
      json = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.error("Raw response:", rawText);
      console.error("Cleaned response:", cleanedText);

      // Try to extract JSON from within the text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          json = JSON.parse(jsonMatch[0]);
        } catch (innerParseError) {
          console.error("Inner JSON parsing also failed:", innerParseError);
          throw new Error("Failed to parse JSON from AI response");
        }
      } else {
        throw new Error("Could not parse JSON from AI response");
      }
    }

    // Validate the response structure
    if (!json.scripts || !Array.isArray(json.scripts) || json.scripts.length === 0) {
      console.error("Invalid response structure:", json);
      throw new Error("Invalid response structure from AI model");
    }

    // Ensure each script has content
    json.scripts = json.scripts.filter(script => script.content && script.content.trim().length > 0);
    
    if (json.scripts.length === 0) {
      throw new Error("No valid scripts generated");
    }

    console.log(`Successfully generated ${json.scripts.length} scripts`);
    return NextResponse.json(json);

  } catch (error) {
    console.error("CRITICAL API Error in /api/generate-script:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });

    // Provide specific error messages
    let errorMessage = error.message || "Internal Server Error";
    let statusCode = 500;

    if (error.message?.includes("quota") || error.message?.includes("429")) {
      errorMessage = "API quota exceeded. Please try again later.";
      statusCode = 429;
    } else if (error.message?.includes("API key") || error.message?.includes("GEMINI_API_KEY")) {
      errorMessage = "AI service configuration error. Please contact support.";
      statusCode = 500;
    } else if (error.message?.includes("blocked")) {
      errorMessage = "The AI response was blocked. Please try a different topic.";
      statusCode = 400;
    } else if (error.message?.includes("parse") || error.message?.includes("JSON")) {
      errorMessage = "Failed to parse AI response. Please try again.";
      statusCode = 500;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: statusCode }
    );
  }
}
