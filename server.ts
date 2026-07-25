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

      const prompt = `You are a professional web game cataloger for LAZRHUB unblocked games.
Target Game Name: "${detectedTitle}"
Input Link / Code: "${targetInput}"

Your task is to write authentic, detailed, and game-specific metadata for the web game "${detectedTitle}".

CRITICAL INSTRUCTIONS FOR "description":
- Write a vivid, informative 2-3 sentence description explaining specifically what the player DOES in "${detectedTitle}".
- Identify the exact gameplay mechanics, primary objectives, game world, vehicles/characters, hazards, or upgrade systems.
- DO NOT use generic boilerplate sentences like "This is an exciting web game on LAZRHUB" or "Master controls to set new high scores".
- Examples of good game-specific descriptions:
  - Harvest Simulator: "Take control of modern agricultural machinery to plow fields, plant seeds, and harvest crops in Harvest Simulator. Transport your produce, manage farm logistics, and build a booming agricultural empire!"
  - Subway Surfers: "Dash through vibrant railway tracks, leap over oncoming trains, and dodge barriers in Subway Surfers while outrunning the grumpy inspector and his dog!"
  - Drift Hunters: "Tune iconic sports cars, hit challenging tracks, and slide through long-angle drifts to earn points and unlock high-performance vehicles!"
- Focus entirely on authentic gameplay details and mechanics that make "${detectedTitle}" unique.

Return JSON with exact fields:
- "title": "${detectedTitle}" (or full official title if known)
- "category": Choose the single best fit from: Arcade, Action, Driving & Racing, Physics & Skill, Sports & Fitness, Puzzle & Logic, Strategy & Defense, Multiplayer
- "description": Detailed 2-3 sentence description explaining actual gameplay, mechanics, and objectives of ${detectedTitle}.
- "controls": Concise, accurate control guide (e.g. "WASD or Arrow Keys to steer & accelerate, Spacebar for Nitro / Handbrake").
- "tags": Array of 5-7 relevant lowercase search tags (e.g. ["driving", "3d", "drift", "cars", "unblocked"]).`;

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

  function buildRichGameDescription(title: string, category: string) {
    const t = (title || '').toLowerCase();

    // Specific game signature checks
    if (t.includes('harvest') && (t.includes('farm') || t.includes('sim'))) {
      return `Take control of modern agricultural machinery to plow fields, plant seeds, and harvest abundant crops in ${title}. Upgrade your tractors, manage farm logistics, and build a flourishing farming enterprise!`;
    }
    if (t.includes('harvest') || t.includes('farm')) {
      return `Cultivate crops, raise farm animals, and expand your agricultural empire in ${title}. Drive tractors, harvest produce, and manage your farm to maximize profit and efficiency!`;
    }
    if (t.includes('subway') || t.includes('surfer')) {
      return `Dash through vibrant railway tracks, leap over oncoming trains, and collect shiny coins while outrunning the grumpy inspector and his dog in ${title}!`;
    }
    if (t.includes('drift') && (t.includes('hunter') || t.includes('car') || t.includes('boss'))) {
      return `Tune iconic sports cars, hit challenging tracks, and slide through long-angle drifts to earn points and unlock high-performance vehicles in ${title}!`;
    }
    if (t.includes('retro') && t.includes('bowl')) {
      return `Take charge as the head coach and quarterback of your football team in ${title}. Manage your roster, draft star talent, and execute game-winning plays to win the ultimate championship!`;
    }
    if (t.includes('drive mad') || (t.includes('drive') && t.includes('mad'))) {
      return `Pilot oversized 4x4 trucks across treacherous physics-based tracks filled with ramps, bridges, and hazards in ${title}. Balance your speed carefully to reach the finish line without flipping!`;
    }
    if (t.includes('basket') && t.includes('random')) {
      return `Enjoy chaotic single-button physics basketball where every jump and bounce leads to hilarious shots in ${title}. Adapt to changing courts, random players, and wild ball physics!`;
    }
    if (t.includes('slope')) {
      return `Guide a fast-rolling 3D ball down an endless steep neon slope in ${title}. React instantly to sharp turns, narrow platforms, and red obstacles as you push for a record high score!`;
    }
    if (t.includes('temple') && t.includes('run')) {
      return `Sprint through ancient temple ruins, slide under fallen trees, and swing across broken bridges to escape ferocious demon monkeys chasing you in ${title}!`;
    }
    if (t.includes('flappy')) {
      return `Tap with precision to flap your wings and navigate through dense fields of pipe obstacles in ${title}, testing your reflexes and rhythm to set new high scores!`;
    }
    if (t.includes('geometry') && t.includes('dash')) {
      return `Rhythmically jump, fly, and flip your way through treacherous geometric spike courses in ${title}, syncing your movements to energetic electronic beats!`;
    }
    if (t.includes('stickman') && t.includes('hook')) {
      return `Swing through dozens of challenging physics levels as a nimble stickman in ${title}. Time your grapple releases to bounce off trampolines and zoom past obstacles to the finish line!`;
    }
    if (t.includes('rooftop') && t.includes('sniper')) {
      return `Engage in unpredictable 2-player sniper duels on slippery city rooftops in ${title}. Use wild ragdoll physics and random weaponry to knock your rival off the building!`;
    }
    if (t.includes('cluster') && t.includes('rush')) {
      return `Leap across the roofs of speeding, out-of-control semi-trucks in ${title}. Dodge tumbling vehicles and maintain your momentum in this heart-pounding first-person platformer!`;
    }
    if (t.includes('smash') && t.includes('kart')) {
      return `Drive combat go-karts into 3D arena battles in ${title}. Collect mystery boxes on the track to grab rocket launchers, machine guns, and mines to blast rival players!`;
    }
    if (t.includes('fireboy') || t.includes('watergirl')) {
      return `Work cooperatively to guide Fireboy and Watergirl through dangerous elemental temples in ${title}. Solve environmental puzzles, flip levers, and collect gems while avoiding contrasting elements!`;
    }
    if (t.includes('papa') && (t.includes('pizzeria') || t.includes('freezeria') || t.includes('baker') || t.includes('sushi') || t.includes('burg'))) {
      return `Serve hungry customers delicious customized orders in Papa's kitchen! Manage order tickets, grill or bake to perfection, and top off meals to earn big tips and upgrade your shop in ${title}.`;
    }
    if (t.includes('baldi')) {
      return `Collect notebook problems while escaping the strict teacher Baldi in ${title}. Solve tricky math questions, collect school items, and navigate corridors to escape!`;
    }
    if (t.includes('duck life') || t.includes('ducklife')) {
      return `Train a young duckling in running, swimming, flying, and climbing to win championship races in ${title}. Feed your duck seeds and level up its stats to become a racing champion!`;
    }
    if (t.includes('bitlife') || t.includes('bit life')) {
      return `Shape your character's life story from birth to old age in ${title}. Make choices regarding education, careers, relationships, and wealth to craft a unique virtual life!`;
    }
    if (t.includes('moto x3m') || t.includes('x3m')) {
      return `Race high-powered dirt bikes across extreme obstacle courses in ${title}. Perform backflips to shave seconds off your timer while dodging landmines and buzzsaws!`;
    }
    if (t.includes('tunnel rush') || t.includes('tunnel')) {
      return `Fly through a fast-paced 3D tunnel packed with rotating hazard gates and moving geometric shapes in ${title}, putting your reflexes to the ultimate test!`;
    }
    if (t.includes('paper.io') || t.includes('paperio')) {
      return `Claim colorful territory by drawing enclosed loops across the arena in ${title}. Cut off rival trails to eliminate opponents and expand your kingdom on the leaderboard!`;
    }
    if (t.includes('slither') || t.includes('slitherio')) {
      return `Grow a glowing snake by consuming energy pellets in ${title}. Outmaneuver giant snakes, force them to crash into your body, and devour their remains to top the leaderboard!`;
    }
    if (t.includes('hole.io') || t.includes('holeio')) {
      return `Control an all-devouring black hole roaming through a bustling city in ${title}. Swallow park benches, cars, and entire skyscrapers to grow larger than competing holes!`;
    }
    if (t.includes('shell shocker') || t.includes('shellshock')) {
      return `Suit up as an egg armed to the yolk in ${title}. Blast rival eggs with shotguns, snipers, and rocket launchers across vibrant 3D multiplayer maps!`;
    }
    if (t.includes('krunker')) {
      return `Experience fast-paced pixelated FPS combat in ${title}. Bunny-hop through maps, customize weapons, and show off sharp aiming skills in competitive online matches!`;
    }

    // Category & keyword based rich descriptions
    if (category === 'Driving & Racing' || /car|drive|race|racing|moto|kart|drift|vehicle|speed|truck|bus|highway/i.test(t)) {
      return `Get behind the wheel in ${title}! Accelerate down open roads, tackle sharp turns, and outpace rivals in high-octane driving challenges designed to test your precision and control.`;
    }
    if (category === 'Sports & Fitness' || /sport|basket|soccer|football|golf|tennis|bowl|billiards|skate|boxing|hockey/i.test(t)) {
      return `Step onto the field in ${title}! Execute strategic plays, time your shots perfectly, and compete against tough opponents to take home the championship victory.`;
    }
    if (category === 'Puzzle & Logic' || /puzzle|chess|math|word|mahjong|sudoku|block|match|2048|tetris|brain|escape/i.test(t)) {
      return `Challenge your brain with ${title}! Solve intricate puzzles, manipulate grid pieces, and exercise your logic to overcome increasingly complex stages and set new records.`;
    }
    if (category === 'Physics & Skill' || /run|jump|dash|hook|flip|bounce|parkour|climb|rush|fall|slope/i.test(t)) {
      return `Test your timing and reflexes in ${title}! Master physics-based mechanics, dodge hazardous obstacles, and guide your character through action-packed stages.`;
    }
    if (category === 'Strategy & Defense' || /sim|simulator|farm|harvest|tycoon|defense|tower|castle|manager|idle|city|empire|build/i.test(t)) {
      return `Build, manage, and strategize in ${title}! Plan your moves carefully, upgrade your resources, and expand your operations to overcome incoming challenges.`;
    }
    if (category === 'Action' || /shoot|gun|sniper|combat|battle|strike|zombie|fight|hero|war|brawl|weapon/i.test(t)) {
      return `Dive into heart-pounding action in ${title}! Equip powerful weapons, dodge enemy attacks, and battle through hostile environments to complete your objective.`;
    }
    if (category === 'Multiplayer' || /\.io|multiplayer|online|pvp|arena|stumble|brawl/i.test(t)) {
      return `Jump into fast-paced online action in ${title}! Compete against players worldwide, collect power-ups, and climb to the top of the real-time arena leaderboard.`;
    }

    return `Experience the excitement of ${title}! Master intuitive controls, navigate challenging obstacles, and set new high scores in this feature-packed unblocked web game on LAZRHUB.`;
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

    const description = buildRichGameDescription(cleanName, category);

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
