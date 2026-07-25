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
  
  let cleaned = rawName
    .replace(/[-_.]/g, ' ')
    .replace(/%20|\+/gi, ' ')
    .replace(/\b(unblocked|unblockedgame|games|html5|online|free)\b/gi, '')
    .trim();

  if (!cleaned) cleaned = rawName.replace(/[-_.]/g, ' ');

  // Common concatenated names mapping
  const knownSplits = [
    [/harvestsimulator/i, 'Harvest Simulator'],
    [/subwaysurfers/i, 'Subway Surfers'],
    [/drifthunters/i, 'Drift Hunters'],
    [/retrobowl/i, 'Retro Bowl'],
    [/drivemad/i, 'Drive Mad'],
    [/basketrandom/i, 'Basket Random'],
    [/bitlife/i, 'BitLife'],
    [/templerun/i, 'Temple Run'],
    [/geometrydash/i, 'Geometry Dash'],
    [/flappybird/i, 'Flappy Bird'],
    [/motox3m/i, 'Moto X3M'],
    [/stickman/i, 'Stickman'],
  ];

  for (const [regex, replacement] of knownSplits) {
    if (regex.test(cleaned)) {
      return replacement;
    }
  }

  // Split camelCase (e.g. harvestSimulator -> harvest Simulator)
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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

