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
  function extractGameTitleFromLink(input: string): string {
    if (!input) return 'New Game';
    
    // Extract src URL or https link
    let rawUrl = input;
    const srcMatch = input.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      rawUrl = srcMatch[1];
    } else {
      const httpMatch = input.match(/https?:\/\/[^\s"'>]+/i);
      if (httpMatch && httpMatch[0]) {
        rawUrl = httpMatch[0];
      }
    }

    try {
      const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      
      // 1. Check query parameters
      const params = urlObj.searchParams;
      const queryName = params.get('game') || params.get('name') || params.get('title') || params.get('g') || params.get('id');
      if (queryName && queryName.trim().length > 1) {
        return formatTitle(queryName);
      }

      // 2. Check path segments
      const segments = urlObj.pathname.split('/').filter(Boolean);
      const genericWords = new Set([
        'index', 'index.html', 'index.htm', 'game', 'game.html', 'play', 'play.html',
        'embed', 'embed.html', 'v1', 'v2', 'v3', 'main', 'app', 'iframe', 'frame',
        'html5', 'loader', 'mobile', 'web', 'public', 'assets', 'games', 'playgame'
      ]);

      for (let i = segments.length - 1; i >= 0; i--) {
        let seg = segments[i].replace(/\.(html|htm|php|js|aspx|jsp|zip)$/i, '').trim();
        if (seg && !genericWords.has(seg.toLowerCase())) {
          return formatTitle(seg);
        }
      }

      // 3. Fallback to domain host
      let host = urlObj.hostname.replace(/^www\./i, '');
      const parts = host.split('.');
      if (parts.length > 1) {
        const domainName = parts[0];
        if (domainName && domainName.length > 2 && !genericWords.has(domainName.toLowerCase())) {
          return formatTitle(domainName);
        }
      }

      return 'New Game';
    } catch {
      const nameMatch = rawUrl.match(/\/([a-zA-Z0-9-_]+)(\/|\.html|\?|$)/);
      if (nameMatch && nameMatch[1]) {
        return formatTitle(nameMatch[1]);
      }
      return 'New Game';
    }
  }

  function formatTitle(rawName: string): string {
    if (!rawName) return 'New Game';
    let cleaned = rawName
      .replace(/[-_]/g, ' ')
      .replace(/%20|\+/gi, ' ')
      .replace(/\b(unblocked|unblockedgame|games|html5|online|free|v1|v2|v3)\b/gi, '')
      .trim();

    if (!cleaned) cleaned = rawName.replace(/[-_]/g, ' ');

    return cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  function generateFallbackMetadata(input: string) {
    const cleanName = extractGameTitleFromLink(input);
    let category = 'Arcade';

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
