const FAVORITES_KEY = 'unblocked_vault_favorites';
const RECENTLY_PLAYED_KEY = 'unblocked_vault_recently_played';
const RATINGS_KEY = 'unblocked_vault_ratings';
const CUSTOM_GAMES_KEY = 'unblocked_vault_custom_games';

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
