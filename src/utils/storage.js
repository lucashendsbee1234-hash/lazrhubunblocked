const FAVORITES_KEY = 'unblocked_vault_favorites';
const RECENTLY_PLAYED_KEY = 'unblocked_vault_recently_played';
const RATINGS_KEY = 'unblocked_vault_ratings';
const CUSTOM_GAMES_KEY = 'unblocked_vault_custom_games';
const ALL_GAMES_OVERRIDE_KEY = 'unblocked_vault_all_games_override';
const ANNOUNCEMENT_KEY = 'unblocked_vault_announcement';
const USER_AUTH_KEY = 'unblocked_vault_user_auth';

export const ADMIN_EMAIL = 'lucas.hendsbee1234@gmail.com';

export const extractIframeUrl = (input) => {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1].trim();
  }
  return trimmed;
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

