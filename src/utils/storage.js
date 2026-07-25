const FAVORITES_KEY = 'unblocked_vault_favorites';
const RECENTLY_PLAYED_KEY = 'unblocked_vault_recently_played';
const RATINGS_KEY = 'unblocked_vault_ratings';
const CUSTOM_GAMES_KEY = 'unblocked_vault_custom_games';
const ALL_GAMES_OVERRIDE_KEY = 'unblocked_vault_all_games_override';
const ANNOUNCEMENT_KEY = 'unblocked_vault_announcement';
const USER_AUTH_KEY = 'unblocked_vault_user_auth';

export const ADMIN_EMAIL = 'lucas.hendsbee1234@gmail.com';
export const ADMIN_PASSWORD = 'Hendsbee2011?';

export const extractIframeUrl = (input) => {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1].trim();
  }
  const httpMatch = trimmed.match(/https?:\/\/[^\s"'>]+/i);
  if (httpMatch && httpMatch[0]) {
    return httpMatch[0].trim();
  }
  return trimmed;
};

export const formatGameTitle = (rawName) => {
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

  const segmentConcatenatedWord = (word) => {
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
    const tokens = [];
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

  // 1. Handle camelCase before lowercasing (e.g. harvestSimulator -> harvest Simulator)
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
};

export const deriveTitleFromUrl = (input) => {
  if (!input || typeof input !== 'string') return 'New Game';
  const rawUrl = extractIframeUrl(input);
  if (!rawUrl) return 'New Game';

  try {
    const urlObj = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    
    // 1. Check query parameters
    const params = urlObj.searchParams;
    const queryName = params.get('game') || params.get('name') || params.get('title') || params.get('g') || params.get('id');
    if (queryName && queryName.trim().length > 1 && !/^\d+$/.test(queryName.trim())) {
      return formatGameTitle(queryName);
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

    const isGenericSegment = (seg) => {
      if (!seg) return true;
      const cleanSeg = seg.replace(/\.(html|htm|php|js|aspx|jsp|zip|json)$/i, '').trim().toLowerCase();
      if (!cleanSeg) return true;
      if (genericWords.has(cleanSeg)) return true;
      // Filter out pure numbers like 1, 2, 10, 100 or version strings like v1, v2, v10
      if (/^\d+$/.test(cleanSeg)) return true;
      if (/^v?\d+([\._-]\d+)*$/i.test(cleanSeg)) return true;
      return false;
    };

    // Filter valid non-generic segments
    const validSegments = segments.filter((s) => !isGenericSegment(s));

    if (validSegments.length > 0) {
      // Return the FIRST valid non-generic segment (e.g. harvestsimulator in pizzaedition.com/harvestsimulator/1/index.html)
      const primaryGameSlug = validSegments[0].replace(/\.(html|htm|php|js|aspx|jsp|zip|json)$/i, '');
      return formatGameTitle(primaryGameSlug);
    }

    // 3. Fallback to domain host if path had only generic words or numbers
    let host = urlObj.hostname.replace(/^www\./i, '');
    const parts = host.split('.');
    if (parts.length > 1) {
      const domainName = parts[0];
      if (domainName && domainName.length > 2 && !genericWords.has(domainName.toLowerCase()) && !/^\d+$/.test(domainName)) {
        return formatGameTitle(domainName);
      }
    }

    return 'New Game';
  } catch {
    const nameMatch = rawUrl.match(/\/([a-zA-Z0-9-_]+)(\/|\.html|\?|$)/);
    if (nameMatch && nameMatch[1] && !/^\d+$/.test(nameMatch[1])) {
      return formatGameTitle(nameMatch[1]);
    }
    return 'New Game';
  }
};

export const generateSmartGameMetadata = (input) => {
  const cleanUrl = extractIframeUrl(input) || input || '';
  const title = deriveTitleFromUrl(cleanUrl);
  const titleLower = title.toLowerCase();

  let category = 'Arcade';
  let controls = 'WASD / Arrow Keys to move, Mouse to interact, Spacebar for action.';

  if (/drift|car|race|racing|moto|drive|vehicle|driving|speed|turbo|kart|taxi|bus|truck|highway|traffic/i.test(titleLower)) {
    category = 'Driving & Racing';
    controls = 'WASD or Arrow Keys to steer & accelerate, Spacebar for Handbrake / Nitro.';
  } else if (/basket|soccer|football|golf|tennis|bowl|sports|pool|billiards|boxing|skate|surf|snowboard|ski|hockey|baseball/i.test(titleLower)) {
    category = 'Sports & Fitness';
    controls = 'Mouse click & drag or Spacebar to time shots and moves, Arrow Keys for direction.';
  } else if (/puzzle|chess|math|word|mahjong|sudoku|block|tile|match|2048|tetris|escape|draw|brain|connect|physics/i.test(titleLower)) {
    category = 'Puzzle & Logic';
    controls = 'Mouse / Touch to drag, select, and rotate items on screen.';
  } else if (/run|subway|surfer|temple|slope|rush|dash|hook|jump|flip|bounce|tunnel|parkour|flappy|cluster|crossy|climb/i.test(titleLower)) {
    category = 'Physics & Skill';
    controls = 'Arrow Keys or WASD to move / jump / slide, Spacebar for boost or primary action.';
  } else if (/harvest|farm|sim|simulator|tycoon|defense|tower|castle|manager|idle|clicker|kingdom|empire|city|cooking|chef|papa|restaurant|hospital/i.test(titleLower)) {
    category = 'Strategy & Defense';
    controls = 'Mouse click / Touch to manage, build, upgrade, and navigate menus.';
  } else if (/shoot|gun|sniper|combat|battle|strike|krunker|smash|action|zombie|fight|hero|knight|monster|war|weapon|brawl/i.test(titleLower)) {
    category = 'Action';
    controls = 'WASD to move, Mouse to aim & shoot, R to reload, Spacebar to jump.';
  } else if (/\.io|smash karts|holeio|slither|paperio|shell shockers|among|stumble|multiplayer|online|pvp/i.test(titleLower)) {
    category = 'Multiplayer';
    controls = 'WASD or Arrow Keys to move, Mouse to aim / action, Enter for live chat.';
  }

  const description = `${title} is an exciting ${category.toLowerCase()} web game playable free and unblocked directly in your browser on LAZRHUB! Master the controls and set new high scores.`;

  const tagsArray = [
    title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
    category.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
    'unblocked',
    'html5',
    'web game',
    'free'
  ].filter(Boolean);

  return {
    title,
    category,
    description,
    controls,
    tags: tagsArray,
    tagsString: tagsArray.join(', '),
  };
};

export const getStoredFavorites = () => {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const toggleStoredFavorite = (gameId) => {
  const current = getStoredFavorites();
  const exists = current.includes(gameId);
  const updated = exists ? current.filter((id) => id !== gameId) : [...current, gameId];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
  return updated;
};

export const getStoredRecentlyPlayed = () => {
  try {
    const data = localStorage.getItem(RECENTLY_PLAYED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const recordGamePlay = (gameId) => {
  const current = getStoredRecentlyPlayed();
  const filtered = current.filter((item) => item.gameId !== gameId);
  const updated = [{ gameId, playedAt: new Date().toISOString() }, ...filtered].slice(0, 20);
  try {
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record recently played', e);
  }
  return updated;
};

export const getStoredUserRatings = () => {
  try {
    const data = localStorage.getItem(RATINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const setUserRating = (gameId, rating) => {
  const current = getStoredUserRatings();
  current[gameId] = rating;
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save rating', e);
  }
};

export const getStoredCustomGames = () => {
  try {
    const data = localStorage.getItem(CUSTOM_GAMES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCustomGame = (newGame) => {
  const current = getStoredCustomGames();
  const updated = [newGame, ...current];
  try {
    localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom game', e);
  }
  return updated;
};

export const getStoredAllGamesOverride = () => {
  try {
    const data = localStorage.getItem(ALL_GAMES_OVERRIDE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveAllGamesOverride = (gamesList) => {
  try {
    localStorage.setItem(ALL_GAMES_OVERRIDE_KEY, JSON.stringify(gamesList));
  } catch (e) {
    console.error('Failed to save games override', e);
  }
};

export const getStoredAnnouncement = () => {
  try {
    return localStorage.getItem(ANNOUNCEMENT_KEY) || '';
  } catch {
    return '';
  }
};

export const saveStoredAnnouncement = (text) => {
  try {
    localStorage.setItem(ANNOUNCEMENT_KEY, text);
  } catch (e) {
    console.error('Failed to save announcement', e);
  }
};

export const getStoredUserAuth = () => {
  try {
    const data = localStorage.getItem(USER_AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveStoredUserAuth = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_AUTH_KEY);
    }
  } catch (e) {
    console.error('Failed to save user auth', e);
  }
};

