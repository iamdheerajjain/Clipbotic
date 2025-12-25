// This file should only be used on the server side
// Client-side components should call API endpoints instead

import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-side only - this will throw an error if imported on client
if (typeof window !== "undefined") {
  throw new Error("AiModel.jsx cannot be imported on the client side");
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_NAME = "gemini-2.5-flash"; 
const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateScript = {
  sendMessage: async (prompt) => {
    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        console.log(`AiModel: Generation attempt ${attempt + 1}/${maxRetries} (${MODEL_NAME})`);
        
        const chatSession = model.startChat({
          generationConfig,
          history: [],
        });

        const result = await chatSession.sendMessage(prompt);
        return result;
      } catch (error) {
        // Broaden the check for rate limits (429) or Service Unavailable (503)
        const errorCode = error.status || error.response?.status;
        const errorMessage = error.message || "";
        
        const isTransient = 
          errorCode === 429 || 
          errorCode === 503 || 
          errorMessage.includes("429") || 
          errorMessage.includes("Too Many Requests") ||
          errorMessage.includes("quota");
        
        if (isTransient && attempt < maxRetries - 1) {
          // Linear backoff is safer for long waits than exponential to avoid hitting timeouts
          const waitTime = 5000 + (attempt * 2000); // 5s, 7s, 9s, 11s...
          console.warn(`AiModel: Transient error (${error.status}). Retrying in ${waitTime}ms...`);
          await delay(waitTime);
          attempt++;
          continue;
        }

        // If not rate limit or max retries reached, throw the error
        console.error("AI Model error:", error);
        throw error;
      }
    }
  },
};
