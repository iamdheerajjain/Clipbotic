import { NextResponse } from "next/server";
import { generateScript } from "@/configs/AiModel";

const SCRIPT_PROMPT = `Write two different scripts for 30 seconds on Topic: {topic}
Do not add scene description.
Do not add anything in braces. Just return the plain story in text.
Give me the response in JSON format and follow the schema:
{
  scripts: [
    { content: "" },
    { content: "" }
  ]
}`;

export async function POST(req) {
  try {
    const { topic } = await req.json();

    if (!topic || topic.trim() === "") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const PROMPT = SCRIPT_PROMPT.replace("{topic}", topic);
    const result = await generateScript.sendMessage(PROMPT);
    const rawText = await result?.response?.text();

    const json = JSON.parse(rawText);

    return NextResponse.json(json);
  } catch (error) {
    console.error("API Error in /api/generate-script:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
