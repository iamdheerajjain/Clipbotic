import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Warn but don't crash immediately - allows build to pass if env missing
  console.warn("Missing Supabase Service Role Key environment variable");
}

// Create a Supabase client with the SERVICE ROLE key
// This bypasses Row Level Security (RLS) - USE WITH CAUTION
// ONLY use this in server-side contexts (API routes, Inngest functions)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
