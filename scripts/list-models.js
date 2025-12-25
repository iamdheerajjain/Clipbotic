const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get access to client if needed, though usually listModels is on the client.
    // Actually, looking at the docs, usually we might need to use the API directly or a specific method if the SDK exposes it.
    // The node SDK often exposes this via a model manager or similar, but for simplicity let's try a direct REST call or just try known models.
    
    // Wait, the SDK V0.3.0+ should have `listModels`.
    // But to avoid SDK version issues, let's just use fetch to the API endpoint which gives us the source of truth.
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
           console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("No models found or error:", data);
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
