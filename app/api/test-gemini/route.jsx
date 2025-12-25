import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY not configured");
      return NextResponse.json(
        {
          success: false,
          message: "GEMINI_API_KEY not configured",
        model: "gemini-2.5-flash",
          text: "Mock response - API key not configured",
        },
        { status: 200 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const result = await model.generateContent("Hello, can you hear me?");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      text,
      model: "gemini-1.5-flash",
    });
  } catch (error) {
    console.error("Test Gemini error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        cause: error.cause,
      },
      { status: 500 }
    );
  }
}
