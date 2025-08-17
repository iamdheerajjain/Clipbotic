import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { validators, validateSchema } from "@/lib/validation";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // Max 3 video generation requests per minute

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map();

function checkRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }

  const requests = rateLimitMap.get(identifier);
  const validRequests = requests.filter((time) => time > windowStart);

  if (validRequests.length >= MAX_REQUESTS) {
    return false;
  }

  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  return true;
}

// Video generation schema validation - FIXED to match frontend data
const videoGenerationSchema = {
  title: (value) =>
    validators.string(value, "title", { required: true, maxLength: 200 }),
  topic: (value) =>
    validators.string(value, "topic", { required: true, maxLength: 200 }),
  script: (value) =>
    validators.string(value, "script", { required: true, maxLength: 5000 }),
  videoStyle: (value) =>
    validators.string(value, "videoStyle", { required: true, maxLength: 100 }),
  voice: (value) =>
    validators.string(value, "voice", { required: true, maxLength: 100 }),
  caption: (value) =>
    validators.object(value, "caption", {
      style: (v) => validators.string(v, "caption.style", { maxLength: 100 }),
    }),
  // These fields are optional and may not be in the exact format expected
  videoRecordId: (value) => {
    if (!value) return undefined; // Make it optional
    // Accept both string IDs and other formats
    return validators.string(value, "videoRecordId", { maxLength: 100 });
  },
  userId: (value) => {
    if (!value) return undefined; // Make it optional
    // Accept both string IDs and other formats
    return validators.string(value, "userId", { maxLength: 100 });
  },
  userEmail: (value) => {
    if (!value) return undefined; // Make it optional
    // Accept email or any string identifier
    return validators.string(value, "userEmail", { maxLength: 254 });
  },
};

export async function POST(req) {
  try {
    // Get client IP for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await req.json();

    console.log("Raw form data received:", formData);

    // Validate input data with more flexible validation
    let validatedData;
    try {
      validatedData = validateSchema(formData, videoGenerationSchema);
      console.log("Validation passed:", validatedData);
    } catch (validationError) {
      console.error("Validation failed:", validationError.message);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationError.message,
          receivedData: Object.keys(formData),
        },
        { status: 400 }
      );
    }

    console.log("Received validated video generation request:", {
      title: validatedData.title,
      topic: validatedData.topic,
      videoStyle: validatedData.videoStyle,
      voice: validatedData.voice,
      videoRecordId: validatedData.videoRecordId,
      scriptLength: validatedData.script.length,
    });

    // Send to Inngest for processing
    const result = await inngest.send({
      name: "generate-video-data",
      data: {
        ...validatedData,
        timestamp: new Date().toISOString(),
      },
    });

    console.log("Inngest event sent:", result);

    return NextResponse.json({
      success: true,
      message: "Video generation request sent successfully",
      eventId: result.ids[0],
      data: {
        title: validatedData.title,
        topic: validatedData.topic,
        videoStyle: validatedData.videoStyle,
        status: "processing",
      },
    });
  } catch (error) {
    console.error("Error in generate-video-data:", error);

    if (error.message.includes("Validation failed")) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process video generation request" },
      { status: 500 }
    );
  }
}
