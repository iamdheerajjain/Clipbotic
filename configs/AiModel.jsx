import { GoogleGenerativeAI } from "@google/generative-ai";

if (typeof window !== "undefined") {
  throw new Error("AiModel.jsx cannot be imported on the client side");
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export const generateScript = {
  sendMessage: async (prompt) => {
    try {
      const chatSession = model.startChat({
        generationConfig,
        history: [],
      });

      const result = await chatSession.sendMessage(prompt);
      return result;
    } catch (error) {
      console.error("AI Model error:", error);
      throw new Error("Failed to generate script");
    }
  },
};
