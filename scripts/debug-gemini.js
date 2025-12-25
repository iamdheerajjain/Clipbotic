const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in .env.local");
    return;
  }
  console.log("✅ GEMINI_API_KEY found");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-2.0-flash-exp"
  ];

  console.log("\nTesting models...");

  for (const modelName of modelsToTest) {
    try {
      console.log(`\n--- Testing ${modelName} ---`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello, are you working?");
      const response = await result.response;
      console.log(`✅ ${modelName} works! Response: ${response.text().substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ ${modelName} failed:`);
      console.error("Status:", error.status);
      console.error("StatusText:", error.statusText);
      console.error("Message:", error.message);
      if (error.response) {
        console.error("Response:", JSON.stringify(error.response, null, 2));
      }
    }
  }
}

testGemini();
