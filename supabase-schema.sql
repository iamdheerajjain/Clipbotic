-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  picture_url TEXT,
  credits INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_data table
CREATE TABLE IF NOT EXISTS video_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  script TEXT NOT NULL,
  video_style TEXT NOT NULL,
  caption JSONB DEFAULT '{}',
  voice TEXT NOT NULL,
  images JSONB,
  audio_url TEXT,
  caption_json JSONB,
  uid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_video_data_uid ON video_data(uid);
CREATE INDEX IF NOT EXISTS idx_video_data_created_by ON video_data(created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_data_updated_at BEFORE UPDATE ON video_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_data ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for video_data table
CREATE POLICY "Users can view their own videos" ON video_data
  FOR SELECT USING (auth.uid()::text = uid::text);

CREATE POLICY "Users can insert their own videos" ON video_data
  FOR INSERT WITH CHECK (auth.uid()::text = uid::text);

CREATE POLICY "Users can update their own videos" ON video_data
  FOR UPDATE USING (auth.uid()::text = uid::text);

CREATE POLICY "Users can delete their own videos" ON video_data
  FOR DELETE USING (auth.uid()::text = uid::text);
