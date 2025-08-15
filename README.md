# 🎬 ShortVid - AI-Powered Short Video Generator

Transform your ideas into stunning short videos with AI-powered generation. Create engaging content with custom styles, voices, and captions in minutes.

![ShortVid Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![Remotion](https://img.shields.io/badge/Remotion-Video%20Generation-orange)

## ✨ Features

### 🎯 Core Functionality

- **AI Video Generation**: Create videos from text scripts using advanced AI models
- **Multiple Video Styles**: Choose from cinematic, anime, cyberpunk, realistic, and more
- **Custom Voice Synthesis**: ElevenLabs integration for natural-sounding audio
- **Smart Captions**: Auto-generated captions with multiple styling options
- **Real-time Preview**: See your video before generation
- **Instant Download**: Download your completed videos in MP4 format

### 🎨 Video Styles

- **Cinematic** - Hollywood-style dramatic visuals
- **Anime** - Japanese animation aesthetic
- **Cyberpunk** - Futuristic neon aesthetics
- **Realistic** - Photorealistic imagery
- **Watercolor** - Artistic painted style
- **GTA** - Video game aesthetic

### 🎤 Voice Options

- Multiple voice personalities
- Natural-sounding speech synthesis
- Customizable voice settings

### 📝 Caption Styles

- **YouTuber** - Bold, attention-grabbing
- **Supreme** - Premium, elegant design
- **Neon** - Glowing, futuristic
- **Glitch** - Digital, tech-inspired
- **Fire** - Dynamic, energetic
- **Futuristic** - Modern, sleek

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- ElevenLabs API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/shortvid.git
   cd shortvid
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # ElevenLabs
   ELEVENLABS_API_KEY=your_elevenlabs_api_key

   # Inngest (for background processing)
   INNGEST_EVENT_KEY=your_inngest_key
   INNGEST_SIGNING_KEY=your_signing_key
   ```

4. **Set up the database**

   ```bash
   # Run the Supabase schema
   psql -h your_supabase_host -U postgres -d postgres -f supabase-schema.sql
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Architecture

### Frontend

- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **Remotion** - Video generation and rendering
- **Lucide React** - Modern icon library

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Database and authentication
- **Inngest** - Background job processing
- **OpenAI API** - AI text and image generation
- **ElevenLabs API** - Voice synthesis

### Key Components

```
app/
├── (main)/                    # Main application layout
│   ├── dashboard/            # Dashboard pages
│   │   ├── create/          # Video creation
│   │   ├── videos/          # Video management
│   │   └── profile/         # User profile
│   └── _components/         # Shared components
├── api/                     # API routes
│   ├── generate-video-data/ # Video generation endpoint
│   ├── export-video/        # Video export endpoint
│   └── get-video-data/      # Video data retrieval
└── providers.jsx           # Context providers

remotion/                   # Video composition
├── Composition.jsx        # Main video composition
├── Root.jsx              # Video root component
└── index.js              # Remotion entry point
```

## 🎥 How It Works

### 1. Video Creation Process

1. **Input Script** - Write your video script
2. **Choose Style** - Select from available video styles
3. **Pick Voice** - Choose voice personality
4. **Customize Captions** - Select caption style
5. **Generate** - AI processes your request
6. **Download** - Get your completed video

### 2. AI Processing Pipeline

```
Script → Audio Generation → Caption Generation → Image Generation → Video Assembly
```

### 3. Background Processing

- **Inngest** handles long-running video generation tasks
- **Real-time updates** via Supabase subscriptions
- **Automatic retries** for failed operations

## 🔧 Configuration

### Environment Variables

| Variable                        | Description               | Required |
| ------------------------------- | ------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL      | ✅       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key    | ✅       |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key | ✅       |
| `OPENAI_API_KEY`                | OpenAI API key            | ✅       |
| `ELEVENLABS_API_KEY`            | ElevenLabs API key        | ✅       |
| `INNGEST_EVENT_KEY`             | Inngest event key         | ✅       |
| `INNGEST_SIGNING_KEY`           | Inngest signing key       | ✅       |

### Customization

- **Video Styles**: Add new styles in `app/(main)/_components/VideoStyle.jsx`
- **Caption Styles**: Modify styles in `app/(main)/_components/RemotionComposition.jsx`
- **Voice Options**: Configure in the Voice component
- **API Endpoints**: Customize in `app/api/` directory

## 📱 Usage

### Creating a Video

1. Navigate to **Create New Video**
2. Enter your video title and topic
3. Write your script (recommended: 30-60 seconds)
4. Select a video style that matches your content
5. Choose a voice personality
6. Pick a caption style
7. Click **Generate Video**
8. Wait for processing (typically 2-5 minutes)
9. Download your completed video

### Managing Videos

- View all your videos in **My Videos**
- Download completed videos
- Check generation status
- Delete unwanted videos

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

- **Netlify**: Configure build settings for Next.js
- **Railway**: Use Railway's Node.js template
- **DigitalOcean App Platform**: Deploy as a Node.js app

### Production Considerations

- Set up proper environment variables
- Configure Supabase production database
- Set up Inngest production environment
- Configure CDN for video assets
- Set up monitoring and logging

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure all checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

- **Video generation fails**: Check API keys and quotas
- **Slow generation**: Verify Inngest configuration
- **Audio issues**: Ensure ElevenLabs API key is valid
- **Database errors**: Check Supabase connection

### Getting Help

- 📧 **Email**: support@shortvid.com
- 💬 **Discord**: [Join our community](https://discord.gg/shortvid)
- 📖 **Documentation**: [docs.shortvid.com](https://docs.shortvid.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/shortvid/issues)

## 🙏 Acknowledgments

- **OpenAI** for GPT and DALL-E APIs
- **ElevenLabs** for voice synthesis
- **Remotion** for video generation framework
- **Supabase** for backend infrastructure
- **Inngest** for background job processing

---

<div align="center">
  <p>Made with ❤️ by the ShortVid team</p>
  <p>
    <a href="https://shortvid.com">Website</a> •
    <a href="https://twitter.com/shortvid">Twitter</a> •
    <a href="https://discord.gg/shortvid">Discord</a>
  </p>
</div>
