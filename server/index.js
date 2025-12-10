import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, MOV, and AVI are allowed.'));
    }
  }
});

// Initialize AI clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Platform-specific prompt templates
const platformTemplates = {
  'veo-3.1': {
    name: 'Veo 3.1',
    systemPrompt: `You are an expert AI video prompt engineer specializing in Google Veo 3.1. Your task is to transform user ideas into professional, structured prompts following the official Veo 3.1 prompting guide.

ALWAYS use this 5-part formula:
[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]

Components:
- Cinematography: Camera work and shot composition (e.g., "Medium shot", "Crane shot", "Close-up with shallow depth of field", "Tracking shot", "POV shot", "Low angle wide shot")
- Subject: Main character or focal point with distinctive details
- Action: What the subject is doing (be specific with movements and timing)
- Context: Environment and background elements
- Style & Ambiance: Overall aesthetic, mood, lighting, and film style

Audio Directives (Veo 3.1 supports rich audio):
- Dialogue: Use quotation marks for speech (e.g., A woman says, "We have to leave now.")
- Sound effects (SFX): Describe sounds clearly (e.g., SFX: thunder cracks in the distance)
- Ambient noise: Define background soundscape (e.g., Ambient noise: the quiet hum of a starship bridge)

Advanced techniques you can use:
- Timestamp prompting for multi-shot sequences: [00:00-00:02] Shot 1... [00:02-00:04] Shot 2...
- Specific lens descriptions: wide-angle lens, macro lens, shallow/deep focus
- Film style references: shot as if on 1980s color film, cinematic, documentary style

Output format: Return ONLY the prompt text, ready to be used directly in Veo 3.1. Make it detailed, cinematic, and professional.`,
  },
  'sora-2': {
    name: 'Sora 2',
    systemPrompt: `You are an expert AI video prompt engineer specializing in OpenAI Sora 2. Your task is to transform user ideas into professional, structured prompts following the official Sora 2 prompting guide.

Use this structured template format:

[Prose scene description in plain language. Describe characters, costumes, scenery, weather and other details. Be descriptive to generate a video that matches the vision.]

Cinematography:
Camera shot: [framing and angle, e.g., wide establishing shot, eye level; medium close-up, slight angle from behind]
Depth of field: [e.g., shallow (sharp on subject, blurred background), deep focus]
Camera motion: [e.g., slowly tilting camera, handheld, tracking left to right]

Lighting + palette: [describe light sources and color anchors, e.g., soft window light with warm lamp fill, cool rim from hallway]
Palette anchors: [3-5 colors, e.g., amber, cream, walnut brown]

Mood: [overall tone, e.g., cinematic and tense, playful and suspenseful, melancholic]

Actions:
- [Action 1: a clear, specific beat or gesture with timing]
- [Action 2: another distinct beat within the clip]
- [Action 3: if needed]

Dialogue (if applicable):
- [Character]: "[Line]"
- [Character]: "[Line]"

Sound: [Background audio description, e.g., "The hum of espresso machines and murmur of voices form the background"]

Key principles:
- Be specific: Instead of "moves quickly," write "jogs three steps and stops at the curb"
- Use visual anchors: Instead of "a beautiful street," write "wet asphalt, zebra crosswalk, neon sign reflection"
- Keep actions in beats or counts for precise timing
- Shorter prompts = more creative freedom; longer prompts = more control

Output format: Return ONLY the prompt text in the structured format above, ready to be used directly in Sora 2.`,
  }
};

// Generate prompt from scene description (OpenAI)
app.post('/api/generate-prompt', async (req, res) => {
  try {
    const { description, platform } = req.body;

    if (!description || !platform) {
      return res.status(400).json({ error: 'Description and platform are required' });
    }

    const template = platformTemplates[platform];
    if (!template) {
      return res.status(400).json({ error: 'Invalid platform selected' });
    }

    // Use OpenAI GPT-5.1
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: template.systemPrompt },
        { role: 'user', content: `Create a professional AI video prompt for ${template.name} based on this idea:\n\n"${description}"\n\nGenerate a detailed, production-ready prompt.` }
      ],
      max_completion_tokens: 2048,
      temperature: 0.7
    });

    const generatedPrompt = completion.choices[0].message.content;

    res.json({ 
      prompt: generatedPrompt,
      platform: template.name
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    
    // Better error messages
    if (error.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again.' });
    } else if (error.message) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate prompt. Please try again.' });
    }
  }
});

// Analyze video and generate prompt (Gemini)
app.post('/api/analyze-video', upload.single('video'), async (req, res) => {
  try {
    const { platform } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }

    const template = platformTemplates[platform];
    if (!template) {
      return res.status(400).json({ error: 'Invalid platform selected' });
    }

    // Read the video file
    const videoPath = req.file.path;
    const videoData = fs.readFileSync(videoPath);
    const base64Video = videoData.toString('base64');

    // Get the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const analysisPrompt = `You are an expert cinematographer and AI video prompt engineer. Analyze this video in detail and create a professional prompt for ${template.name}.

Analyze the following aspects:
1. Visual composition and framing
2. Camera movement and angles
3. Lighting style and color palette
4. Subject(s) and their actions
5. Environment and setting
6. Mood and atmosphere
7. Any audio elements (if discernible)

${template.systemPrompt}

Based on your analysis, generate a detailed prompt that would recreate this video's style and content in ${template.name}. Return ONLY the prompt, ready to use.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: base64Video
        }
      },
      { text: analysisPrompt }
    ]);

    const generatedPrompt = result.response.text();

    // Clean up uploaded file
    fs.unlinkSync(videoPath);

    res.json({ 
      prompt: generatedPrompt,
      platform: template.name
    });

  } catch (error) {
    console.error('Error analyzing video:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to analyze video. Please try again.' });
  }
});

// Get available platforms
app.get('/api/platforms', (req, res) => {
  const platforms = Object.entries(platformTemplates).map(([id, template]) => ({
    id,
    name: template.name
  }));
  res.json(platforms);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
