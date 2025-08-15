-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    picture_url TEXT DEFAULT '',
    credits INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_data table
CREATE TABLE IF NOT EXISTS video_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    topic VARCHAR(200) NOT NULL,
    script TEXT NOT NULL,
    video_style VARCHAR(100) NOT NULL,
    caption JSONB DEFAULT '{}',
    voice VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_by VARCHAR(254) NOT NULL,
    images JSONB,
    audio_url TEXT,
    caption_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_video_data_user_id ON video_data(user_id);
CREATE INDEX IF NOT EXISTS idx_video_data_created_at ON video_data(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own videos" ON video_data
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own videos" ON video_data
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own videos" ON video_data
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create function to get user by email
CREATE OR REPLACE FUNCTION get_user_by_email(user_email TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    email VARCHAR(254),
    picture_url TEXT,
    credits INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u.picture_url, u.credits, u.created_at, u.updated_at
    FROM users u
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get videos by user email
CREATE OR REPLACE FUNCTION get_videos_by_email(user_email TEXT)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    topic VARCHAR(200),
    script TEXT,
    video_style VARCHAR(100),
    caption JSONB,
    voice VARCHAR(100),
    user_id UUID,
    created_by VARCHAR(254),
    images JSONB,
    audio_url TEXT,
    caption_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.title, v.topic, v.script, v.video_style, v.caption, v.voice, 
           v.user_id, v.created_by, v.images, v.audio_url, v.caption_json, 
           v.created_at, v.updated_at
    FROM video_data v
    JOIN users u ON v.user_id = u.id
    WHERE u.email = user_email
    ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
