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
      const detectedTitle = extractGameTitleFromLink(targetInput);

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
The game name extracted from the URL path slug is: "${detectedTitle}".
Generate accurate metadata specifically for this game ("${detectedTitle}").
Return JSON with clean fields:
- "title": "${detectedTitle}" (or full official title if known, e.g. "${detectedTitle}")
- "category": Choose one of: Arcade, Action, Driving & Racing, Physics & Skill, Sports & Fitness, Puzzle & Logic, Strategy & Defense, Multiplayer
- "description": Engaging 1-2 sentence description explaining the gameplay and core objective of ${detectedTitle}.
- "controls": Concise user control instructions for ${detectedTitle} (e.g. "WASD or Arrow Keys to move / steer, Spacebar to jump / action").
- "tags": Array of 5-7 lowercase relevant search tags.`;

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
      const formattedTitle = formatTitle(parsed.title);
      if (!formattedTitle || formattedTitle === 'Web Game' || formattedTitle === 'New Game' || formattedTitle === 'Untitled') {
        parsed.title = detectedTitle;
      } else {
        parsed.title = formattedTitle;
      }

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
      if (queryName && queryName.trim().length > 1 && !/^\d+$/.test(queryName.trim())) {
        return formatTitle(queryName);
      }

      // 2. Check path segments
      const segments = urlObj.pathname.split('/').filter(Boolean);
      const genericWords = new Set([
        'index', 'index.html', 'index.htm', 'game', 'game.html', 'play', 'play.html',
        'embed', 'embed.html', 'v1', 'v2', 'v3', 'main', 'app', 'iframe', 'frame',
        'html5', 'loader', 'mobile', 'web', 'public', 'assets', 'games', 'playgame',
        'files', 'file', 'content', 'static', 'build', 'dist', 'bin', 'src', 'media',
        'uploads', 'unblocked', 'unblocked-games', 'g'
      ]);

      const isGenericSegment = (seg: string) => {
        if (!seg) return true;
        const cleanSeg = seg.replace(/\.(html|htm|php|js|aspx|jsp|zip|json)$/i, '').trim().toLowerCase();
        if (!cleanSeg) return true;
        if (genericWords.has(cleanSeg)) return true;
        if (/^\d+$/.test(cleanSeg)) return true;
        if (/^v?\d+([\._-]\d+)*$/i.test(cleanSeg)) return true;
        return false;
      };

      const validSegments = segments.filter((s) => !isGenericSegment(s));

      if (validSegments.length > 0) {
        const primaryGameSlug = validSegments[0].replace(/\.(html|htm|php|js|aspx|jsp|zip|json)$/i, '');
        return formatTitle(primaryGameSlug);
      }

      // 3. Fallback to domain host
      let host = urlObj.hostname.replace(/^www\./i, '');
      const parts = host.split('.');
      if (parts.length > 1) {
        const domainName = parts[0];
        if (domainName && domainName.length > 2 && !genericWords.has(domainName.toLowerCase()) && !/^\d+$/.test(domainName)) {
          return formatTitle(domainName);
        }
      }

      return 'New Game';
    } catch {
      const nameMatch = rawUrl.match(/\/([a-zA-Z0-9-_]+)(\/|\.html|\?|$)/);
      if (nameMatch && nameMatch[1] && !/^\d+$/.test(nameMatch[1])) {
        return formatTitle(nameMatch[1]);
      }
      return 'New Game';
    }
  }

  function formatTitle(rawName: string): string {
    if (!rawName) return 'New Game';

    const GAME_VOCABULARY = [
      'fireboyandwatergirl', 'hillclimbracing', 'harvestsimulator', 'rooftopsnipers',
      'subwaysurfers', 'drifthunters', 'basketrandom', 'stickmanhook', 'geometrydash', 'clusterrush',
      'smashkarts', 'crossyroad', 'templerun', 'flappybird', 'papaspizzeria', 'papasfreezeria',
      'baldisbasics', 'ducklife', 'drivemad', 'retrobowl', 'bitlife', 'motox3m', 'tunnelrush',
      'slopeunblocked', 'paperio', 'slitherio', 'holeio', 'diepio', 'survevio', 'voxiomio', 'krunkerio',
      'shellshockers', 'angrybirds', 'plantsvszombies', 'supermario', 'sonicthehedgehog',
      'harvest', 'simulator', 'subway', 'surfers', 'drift', 'hunters', 'retro', 'bowl',
      'drive', 'basket', 'random', 'temple', 'geometry', 'dash', 'flappy', 'bird',
      'moto', 'stickman', 'hook', 'rooftop', 'snipers', 'cluster', 'rush', 'smash',
      'karts', 'crossy', 'road', 'fireboy', 'watergirl', 'papa', 'pizzeria', 'freezeria',
      'bakeria', 'burgeria', 'pancakeria', 'baldi', 'basics', 'duck', 'life', 'tunnel',
      'slope', 'paper', 'slither', 'hole', 'diep', 'krunker', 'voxiom', 'shell',
      'shockers', 'angry', 'birds', 'plants', 'zombies', 'mario', 'super', 'sonic',
      'hedgehog', 'pokemon', 'bloxd', 'terraria', 'roblox', 'among', 'stumble',
      'friday', 'night', 'funkin', 'freddy', 'freddys', 'nights', 'tetris', 'snake',
      'pong', 'breakout', 'invaders', 'asteroids', 'galaga', 'pinball', 'solitaire',
      'chess', 'checkers', 'mahjong', 'sudoku', 'bubble', 'shooter', 'bejeweled',
      'candy', 'crush', 'fruit', 'ninja', 'doodle', 'jetpack', 'joyride', 'climb',
      'racing', 'police', 'taxi', 'bus', 'train', 'plane', 'flight', 'boat', 'ship',
      'tank', 'army', 'sniper', 'zombie', 'monster', 'dragon', 'knight', 'pirate',
      'alien', 'robot', 'hero', 'legend', 'clash', 'craft', 'build', 'idle',
      'clicker', 'tycoon', 'manager', 'chef', 'cooking', 'doctor', 'hospital',
      'salon', 'dress', 'makeup', 'cat', 'dog', 'pet', 'animal', 'farm', 'city',
      'town', 'island', 'world', 'universe', 'galaxy', 'star', 'pixel', 'arcade',
      'action', 'puzzle', 'physics', 'math', 'words', 'board', 'card', 'dice',
      'sports', 'soccer', 'football', 'basketball', 'tennis', 'golf', 'bowling',
      'pool', 'billiards', 'boxing', 'wrestling', 'karate', 'skate', 'snowboard',
      'surf', 'ski', 'runner', 'racer', 'jumper', 'flyer', 'driver', 'fighter',
      'hunter', 'climber', 'escape', 'survival', 'arena', 'battle', 'combat',
      'strike', 'force', 'defense', 'tower', 'castle', 'dungeon', 'quest',
      'adventure', 'mystery', 'magic', 'shadow', 'dark', 'light', 'neon',
      'cyber', 'future', 'chaos', 'madness', 'extreme', 'furious', 'frenzy',
      'fever', 'blitz', 'crash', 'break', 'destroy', 'blast', 'boom', 'burst',
      'flip', 'spin', 'bounce', 'roll', 'slide', 'stack', 'merge', 'match',
      'draw', 'paint', 'color', 'fill', 'connect', 'link', 'slice', 'chop',
      'throw', 'catch', 'dodge', 'avoid', 'block', 'shield', 'power', 'speed',
      'turbo', 'nitro', 'fast', 'quick', 'swift', 'tiny', 'mini', 'micro',
      'giant', 'mega', 'ultra', 'hyper', 'epic', 'master', 'king', 'queen',
      'boss', 'lord', 'champion', 'buddy', 'dude', 'guy', 'boy', 'girl',
      'kid', 'baby', 'blob', 'ball', 'cube', 'box', 'brick', 'tile', 'circle',
      'line', 'dot', 'game', 'play', 'run', 'fly', 'win', 'war', 'gun', 'car'
    ];

    const segmentConcatenatedWord = (word: string): string => {
      if (!word) return '';
      let lower = word.toLowerCase();

      if (lower.endsWith('io') && lower.length > 3 && !lower.endsWith('studio')) {
        const base = lower.slice(0, -2);
        return `${segmentConcatenatedWord(base)}.io`;
      }

      const numMatch = lower.match(/^([a-z]+)(\d+)$/i);
      if (numMatch) {
        const baseSeg = segmentConcatenatedWord(numMatch[1]);
        return `${baseSeg} ${numMatch[2]}`;
      }

      let i = 0;
      const tokens: string[] = [];
      while (i < lower.length) {
        let matched = false;
        for (let len = Math.min(20, lower.length - i); len >= 3; len--) {
          const sub = lower.slice(i, i + len);
          if (GAME_VOCABULARY.includes(sub)) {
            tokens.push(sub);
            i += len;
            matched = true;
            break;
          }
        }
        if (!matched) {
          if (tokens.length > 0 && !GAME_VOCABULARY.includes(tokens[tokens.length - 1])) {
            tokens[tokens.length - 1] += lower[i];
          } else {
            tokens.push(lower[i]);
          }
          i++;
        }
      }

      return tokens
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    };

    let cleaned = rawName.replace(/([a-z])([A-Z])/g, '$1 $2');

    cleaned = cleaned
      .replace(/[-_.]/g, ' ')
      .replace(/%20|\+/gi, ' ')
      .replace(/\b(unblocked|unblockedgame|games|html5|online|free)\b/gi, '')
      .trim();

    if (!cleaned) cleaned = rawName.replace(/[-_.]/g, ' ');

    const words = cleaned.split(/\s+/).filter(Boolean);
    const formattedWords = words.map((w) => {
      if (/^[a-zA-Z0-9]+$/.test(w) && w.length >= 6) {
        return segmentConcatenatedWord(w);
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

    return formattedWords.join(' ');
  }

  function generateFallbackMetadata(input: string) {
    const cleanName = extractGameTitleFromLink(input);
    let category = 'Arcade';
    let controls = 'WASD / Arrow Keys to move, Mouse to interact, Spacebar for action.';

    const nameLower = cleanName.toLowerCase();
    if (/drift|car|race|racing|moto|drive|vehicle|driving|speed|turbo|kart|taxi|bus|truck|highway|traffic/i.test(nameLower)) {
      category = 'Driving & Racing';
      controls = 'WASD or Arrow Keys to steer & accelerate, Spacebar for Handbrake / Nitro.';
    } else if (/basket|soccer|football|golf|tennis|bowl|sports|pool|billiards|boxing|skate|surf|snowboard|ski|hockey|baseball/i.test(nameLower)) {
      category = 'Sports & Fitness';
      controls = 'Mouse click & drag or Spacebar to time shots and moves, Arrow Keys for direction.';
    } else if (/puzzle|chess|math|word|mahjong|sudoku|block|tile|match|2048|tetris|escape|draw|brain|connect|physics/i.test(nameLower)) {
      category = 'Puzzle & Logic';
      controls = 'Mouse / Touch to drag, select, and rotate items on screen.';
    } else if (/run|subway|surfer|temple|slope|rush|dash|hook|jump|flip|bounce|tunnel|parkour|flappy|cluster|crossy|climb/i.test(nameLower)) {
      category = 'Physics & Skill';
      controls = 'Arrow Keys or WASD to move / jump / slide, Spacebar for boost or primary action.';
    } else if (/harvest|farm|sim|simulator|tycoon|defense|tower|castle|manager|idle|clicker|kingdom|empire|city|cooking|chef|papa|restaurant|hospital/i.test(nameLower)) {
      category = 'Strategy & Defense';
      controls = 'Mouse click / Touch to manage, build, upgrade, and navigate menus.';
    } else if (/shoot|gun|sniper|combat|battle|strike|krunker|smash|action|zombie|fight|hero|knight|monster|war|weapon|brawl/i.test(nameLower)) {
      category = 'Action';
      controls = 'WASD to move, Mouse to aim & shoot, R to reload, Spacebar to jump.';
    } else if (/\.io|smash karts|holeio|slither|paperio|shell shockers|among|stumble|multiplayer|online|pvp/i.test(nameLower)) {
      category = 'Multiplayer';
      controls = 'WASD or Arrow Keys to move, Mouse to aim / action, Enter for live chat.';
    }

    const description = `${cleanName} is an exciting ${category.toLowerCase()} web game playable free and unblocked directly in your browser on LAZRHUB! Master the controls and set new high scores.`;

    const tagsArray = [
      cleanName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
      category.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
      'unblocked',
      'html5',
      'web game',
      'free'
    ].filter(Boolean);

    return {
      title: cleanName,
      category,
      description,
      controls,
      tags: tagsArray,
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
