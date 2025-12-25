const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

async function findWorkingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-2.0-flash-exp"
  ];

  console.log("Searching for a working model...");

  for (const modelName of candidates) {
    try {
      process.stdout.write(`Testing ${modelName}... `);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      await result.response; // Wait for response
      console.log("✅ SUCCESS!");
      console.log(`\n\n!!! FOUND WORKING MODEL: ${modelName} !!!\n\n`);
      return;
    } catch (error) {
      console.log("❌ Failed");
      // console.error(error.message); // limit noise
    }
  }

  console.error("\n❌ NO WORKING MODELS FOUND.");
}

findWorkingModel();
