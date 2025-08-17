import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema types (for reference only - not used in runtime)
export const Database = {
  public: {
    Tables: {
      users: {
        Row: {},
        Insert: {},
        Update: {}
      },
      video_data: {
        Row: {},
        Insert: {},
        Update: {}
      }
    }
  }
}
