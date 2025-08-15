import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { GenerateVideoData, helloWorld } from "@/inngest/function";

// Configure the serve handler with proper settings
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, GenerateVideoData],
  streaming: true,
});
