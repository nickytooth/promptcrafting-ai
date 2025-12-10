# Promptcrafting Tool

AI Video Prompt Generator - Create professional prompts for Veo 3.1, Sora 2, and more.

## Features

- **Scene Description Mode**: Describe your idea in one sentence, get a complete professional prompt
- **Video Upload Mode**: Upload a video, AI analyzes it and generates a matching prompt
- **Platform-Specific**: Prompts are optimized for each platform's requirements
- **Copy to Clipboard**: One-click copy for easy use

## Supported Platforms

- **Veo 3.1** (Google) - Uses the 5-part formula: Cinematography + Subject + Action + Context + Style & Ambiance
- **Sora 2** (OpenAI) - Uses structured template with Cinematography, Mood, Actions, Dialogue

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **AI**: Claude Sonnet 4.5 (scene description) + Gemini 3 Pro (video analysis)

## Setup

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
PORT=3001
```

### 3. Run Development Server

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173).

Open http://localhost:5173 in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

- `GET /api/platforms` - Get available platforms
- `POST /api/generate-prompt` - Generate prompt from scene description
- `POST /api/analyze-video` - Analyze video and generate prompt

## License

MIT
