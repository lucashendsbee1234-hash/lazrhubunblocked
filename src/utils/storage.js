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

export const buildRichGameDescription = (title, category) => {
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

  const description = buildRichGameDescription(title, category);

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
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return { gameId: String(item), playedAt: new Date().toISOString() };
      }
      return { ...item, gameId: String(item?.gameId || '') };
    }).filter((item) => Boolean(item.gameId));
  } catch {
    return [];
  }
};

export const recordGamePlay = (gameId) => {
  if (!gameId) return getStoredRecentlyPlayed();
  const targetId = String(gameId);
  const current = getStoredRecentlyPlayed();
  const filtered = current.filter((item) => String(item.gameId) !== targetId);
  const updated = [{ gameId: targetId, playedAt: new Date().toISOString() }, ...filtered].slice(0, 30);
  try {
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to record recently played', e);
  }
  return updated;
};

export const clearStoredRecentlyPlayed = () => {
  try {
    localStorage.removeItem(RECENTLY_PLAYED_KEY);
  } catch (e) {
    console.error('Failed to clear recently played', e);
  }
  return [];
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

export const GUEST_ID_KEY = 'unblocked_vault_guest_id';

export const getOrCreateGuestId = () => {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (id && /^\d{4}$/.test(id)) {
      return id;
    }
    // Generate a random 4-digit guest number string between 1000 and 9999
    id = String(Math.floor(1000 + Math.random() * 9000));
    localStorage.setItem(GUEST_ID_KEY, id);
    return id;
  } catch {
    return '1000';
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

