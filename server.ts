import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint for automatic game metadata analysis using Gemini API
  app.post('/api/analyze-game', async (req, res) => {
    try {
      const { iframeSrc, iframeCode } = req.body;
      const targetInput = iframeSrc || iframeCode || '';

      if (!targetInput) {
        return res.status(400).json({ success: false, error: 'No iframe code or URL provided' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('GEMINI_API_KEY missing, using intelligent fallback parser');
        return res.json({
          success: true,
          metadata: generateFallbackMetadata(targetInput),
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Analyze this web game iframe URL or embed code: "${targetInput}".
Identify or deduce metadata for this web/HTML5 game.
Return JSON with clean fields:
- "title": Title of the game (e.g. Slope, Drift Hunters, Retro Bowl, Subway Surfers, BitLife, Basket Random)
- "category": Choose one of: Arcade, Action, Driving & Racing, Physics & Skill, Sports & Fitness, Puzzle & Logic, Strategy & Defense, Multiplayer
- "description": Engaging 1-2 sentence description explaining the core gameplay and objective.
- "controls": Concise user control instructions (e.g. "Arrow Keys or WASD to move / steer, Spacebar to jump / brake").
- "tags": Array of 5-7 lowercase relevant search tags (e.g. ["arcade", "3d", "endless", "runner", "skill", "slope"]).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              controls: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['title', 'category', 'description', 'controls', 'tags'],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error('Empty response received from Gemini');
      }

      const parsed = JSON.parse(resultText);
      return res.json({ success: true, metadata: parsed });
    } catch (err) {
      console.error('Error analyzing game metadata:', err);
      // Fallback fallback metadata if AI call fails or errors out
      const fallback = generateFallbackMetadata(req.body.iframeSrc || req.body.iframeCode || '');
      return res.json({ success: true, metadata: fallback, warning: 'Used fallback metadata generator' });
    }
  });

  // Helper fallback metadata generator
  function generateFallbackMetadata(input) {
    let cleanName = 'Web Game';
    let category = 'Arcade';

    try {
      const urlMatches = input.match(/https?:\/\/[^\s"']+/);
      const rawUrl = urlMatches ? urlMatches[0] : input;
      const urlObj = new URL(rawUrl);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      
      const fileOrFolder = segments[segments.length - 1] || segments[segments.length - 2] || '';
      const nameWithoutExt = fileOrFolder.replace(/\.(html|htm|php|aspx|js)$/i, '');
      
      if (nameWithoutExt && nameWithoutExt !== 'index') {
        cleanName = nameWithoutExt
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
      } else if (segments.length > 1) {
        cleanName = segments[segments.length - 2]
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }
    } catch {
      // Ignore parse error
    }

    const nameLower = cleanName.toLowerCase();
    if (nameLower.includes('drift') || nameLower.includes('car') || nameLower.includes('drive') || nameLower.includes('moto') || nameLower.includes('race')) {
      category = 'Driving & Racing';
    } else if (nameLower.includes('ball') || nameLower.includes('basket') || nameLower.includes('soccer') || nameLower.includes('golf') || nameLower.includes('bowl')) {
      category = 'Sports & Fitness';
    } else if (nameLower.includes('puzzle') || nameLower.includes('chess') || nameLower.includes('math') || nameLower.includes('word')) {
      category = 'Puzzle & Logic';
    } else if (nameLower.includes('run') || nameLower.includes('slope') || nameLower.includes('jump') || nameLower.includes('dash')) {
      category = 'Physics & Skill';
    } else if (nameLower.includes('shoot') || nameLower.includes('gun') || nameLower.includes('fight') || nameLower.includes('combat')) {
      category = 'Action';
    }

    return {
      title: cleanName,
      category,
      description: `${cleanName} is an exciting unblocked web game playable directly in your browser on LAZRHUB.`,
      controls: 'Arrow Keys or WASD to navigate, Mouse / Touch to interact.',
      tags: [category.toLowerCase(), 'unblocked', 'html5', 'web', 'fun'],
    };
  }

  // Vite middleware for development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
