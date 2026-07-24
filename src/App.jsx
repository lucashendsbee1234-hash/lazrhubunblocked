import React, { useState, useEffect, useMemo, useCallback } from 'react';
import initialGamesData from './data/games.json';
import categoriesData from './data/categories.json';
import defaultTagsData from './data/tags.json';

import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { HeroBanner } from './components/HeroBanner';
import { CategoryNav } from './components/CategoryNav';
import { TagFilter } from './components/TagFilter';
import { GameGrid } from './components/GameGrid';
import { GameModal } from './components/GameModal';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';

import {
  getStoredFavorites,
  toggleStoredFavorite,
  getStoredRecentlyPlayed,
  recordGamePlay,
  getStoredUserAuth,
  saveStoredUserAuth,
  ADMIN_EMAIL,
} from './utils/storage';
import {
  subscribeToGames,
  saveGameToDb,
  deleteGameFromDb,
  resetGamesDbToDefaults,
  resetAllGameStatsInDb,
  subscribeToAnnouncement,
  saveAnnouncementToDb,
  recordGamePlayInDb,
  rateGameInDb,
} from './utils/firebase';
import { Megaphone, X } from 'lucide-react';

export default function App() {
  const [games, setGames] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortOption, setSortOption] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');

  const [showingFavoritesOnly, setShowingFavoritesOnly] = useState(false);
  const [showingRecentlyPlayedOnly, setShowingRecentlyPlayedOnly] = useState(false);

  const [activeGame, setActiveGame] = useState(null);

  // Authentication & Admin state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Real-time Firestore sync for games and site announcements
  useEffect(() => {
    // 1. Subscribe to games in Firestore (real-time for all connected users)
    const unsubscribeGames = subscribeToGames((gamesList) => {
      if (gamesList && gamesList.length > 0) {
        // Automatically reset legacy mock stats (views and ratings > 100) to zero
        const hasLegacyStats = gamesList.some((g) => g.plays > 100 || (g.rating > 0 && !g.ratingCount));
        if (hasLegacyStats) {
          resetAllGameStatsInDb();
        }
        setGames(gamesList);
      }
    });

    // 2. Subscribe to global announcements in Firestore
    const unsubscribeAnnouncement = subscribeToAnnouncement((text) => {
      setAnnouncement(text || '');
    });

    // 3. Favorites & History from local storage
    setFavorites(getStoredFavorites());
    setRecentlyPlayedIds(getStoredRecentlyPlayed().map((item) => item.gameId));

    // 4. User Auth from local storage
    const storedUser = getStoredUserAuth();
    if (storedUser) {
      if (storedUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && storedUser.role === 'admin') {
        storedUser.role = 'admin';
      } else {
        storedUser.role = 'user';
      }
      setCurrentUser(storedUser);
    }

    return () => {
      unsubscribeGames();
      unsubscribeAnnouncement();
    };
  }, []);

  // Auth Handlers
  const handleSignIn = (user) => {
    setCurrentUser(user);
    saveStoredUserAuth(user);
    if (user.role === 'admin') {
      setIsAdminPanelOpen(true);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    saveStoredUserAuth(null);
    setIsAdminPanelOpen(false);
  };

  // Admin Game Management Handlers (Persisted directly to Firestore so everyone gets live updates)
  const handleAddGame = async (newGame) => {
    await saveGameToDb(newGame);
  };

  const handleUpdateGame = async (updatedGame) => {
    await saveGameToDb(updatedGame);
  };

  const handleDeleteGame = async (gameId) => {
    await deleteGameFromDb(gameId);
  };

  const handleToggleFeatured = async (gameId) => {
    const target = games.find((g) => g.id === gameId);
    if (target) {
      await saveGameToDb({ ...target, isFeatured: !target.isFeatured });
    }
  };

  const handleSaveAnnouncement = async (text) => {
    setAnnouncement(text);
    await saveAnnouncementToDb(text);
  };

  const handleResetCatalog = async () => {
    await resetGamesDbToDefaults();
  };

  // Keyboard Shortcuts for Search Bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !activeGame) {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          const searchInput = document.querySelector('input[type="text"]');
          if (searchInput) searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame]);

  // Handle Favorites toggle
  const handleToggleFavorite = useCallback((e, gameId) => {
    e.stopPropagation();
    const updated = toggleStoredFavorite(gameId);
    setFavorites(updated);
  }, []);

  // Handle Play Game Trigger
  const handlePlayGame = useCallback((game) => {
    setActiveGame(game);
    const updatedPlayed = recordGamePlay(game.id);
    setRecentlyPlayedIds(updatedPlayed.map((item) => item.gameId));

    // Record play in Firestore live for all connected users
    recordGamePlayInDb(game.id);
  }, []);

  // Handle Rate Game Trigger
  const handleRateGame = useCallback(async (gameId, starRating, previousRating) => {
    await rateGameInDb(gameId, starRating, previousRating);
  }, []);

  // Filter & Sort Logic
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        // Search query check
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = game.title.toLowerCase().includes(q);
          const matchesDesc = game.description.toLowerCase().includes(q);
          const matchesCategory = game.category.toLowerCase().includes(q);
          const matchesTags = (game.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesTags) {
            return false;
          }
        }

        // Category check
        if (selectedCategory !== 'All' && game.category !== selectedCategory) {
          return false;
        }

        // Selected Tags check
        if (selectedTags.length > 0) {
          const hasAllTags = selectedTags.every((st) => {
            if (st.toLowerCase() === 'popular') {
              return (
                (game.tags && game.tags.includes('popular')) ||
                (game.plays && game.plays >= 10) ||
                (game.rating && game.rating >= 4.5) ||
                game.isFeatured
              );
            }
            return game.tags && game.tags.includes(st);
          });
          if (!hasAllTags) return false;
        }

        // Favorites check
        if (showingFavoritesOnly && !favorites.includes(game.id)) {
          return false;
        }

        // Recently Played check
        if (showingRecentlyPlayedOnly && !recentlyPlayedIds.includes(game.id)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'popular':
            return (b.plays || 0) - (a.plays || 0);
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'newest':
            return new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime();
          default:
            return 0;
        }
      });
  }, [
    games,
    searchQuery,
    selectedCategory,
    selectedTags,
    showingFavoritesOnly,
    showingRecentlyPlayedOnly,
    favorites,
    recentlyPlayedIds,
    sortOption,
  ]);

  // Compute Tag & Category counts dynamically
  const categoryCounts = useMemo(() => {
    const counts = {};
    games.forEach((g) => {
      counts[g.category] = (counts[g.category] || 0) + 1;
    });
    return counts;
  }, [games]);

  const tagCounts = useMemo(() => {
    const counts = {};
    let popularCount = 0;
    games.forEach((g) => {
      const isPop =
        (g.tags && g.tags.includes('popular')) ||
        (g.plays && g.plays >= 10) ||
        (g.rating && g.rating >= 4.5) ||
        g.isFeatured;
      if (isPop) popularCount++;

      (g.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    counts['popular'] = popularCount;
    return counts;
  }, [games]);

  const availableTags = useMemo(() => {
    const set = new Set(['popular', ...defaultTagsData]);
    games.forEach((g) => (g.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [games]);

  const handleToggleTag = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTags([]);
    setShowingFavoritesOnly(false);
    setShowingRecentlyPlayedOnly(false);
  }, []);

  const handlePlayRandomGame = useCallback(() => {
    if (games.length === 0) return;
    const randomIndex = Math.floor(Math.random() * games.length);
    handlePlayGame(games[randomIndex]);
  }, [games, handlePlayGame]);

  const featuredGame = useMemo(() => {
    return games.find((g) => g.isFeatured || g.featured) || games[0];
  }, [games]);

  const relatedGames = useMemo(() => {
    if (!activeGame) return [];
    return games.filter(
      (g) => g.category === activeGame.category && g.id !== activeGame.id
    );
  }, [games, activeGame]);

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans antialiased selection:bg-purple-600 selection:text-white transition-colors">
      {/* Site Announcement Banner */}
      {announcement && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 border-b border-purple-500/30 px-4 py-2 text-center text-xs font-extrabold text-purple-200 flex items-center justify-center space-x-2 relative">
          <Megaphone className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{announcement}</span>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => handleSaveAnnouncement('')}
              className="p-1 rounded hover:bg-purple-800/50 text-purple-400 hover:text-white ml-2"
              title="Dismiss Announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Header Navbar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favorites.length}
        onOpenFavorites={() => {
          setShowingFavoritesOnly(!showingFavoritesOnly);
          setShowingRecentlyPlayedOnly(false);
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Hero Banner */}
        {!searchQuery &&
          selectedCategory === 'All' &&
          selectedTags.length === 0 &&
          !showingFavoritesOnly &&
          !showingRecentlyPlayedOnly && (
            <HeroBanner
              featuredGame={featuredGame}
              onPlayGame={handlePlayGame}
              onExploreClick={() => {
                const gridElement = document.getElementById('library-section');
                if (gridElement) gridElement.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}

        {/* Quick Stats Bar */}
        <DashboardStats
          totalGames={games.length}
          totalCategories={categoriesData.length}
          totalTags={availableTags.length}
          favoritesCount={favorites.length}
          recentlyPlayedCount={recentlyPlayedIds.length}
          onFilterFavorites={() => {
            setShowingFavoritesOnly(!showingFavoritesOnly);
            setShowingRecentlyPlayedOnly(false);
          }}
          onFilterRecentlyPlayed={() => {
            setShowingRecentlyPlayedOnly(!showingRecentlyPlayedOnly);
            setShowingFavoritesOnly(false);
          }}
          showingFavoritesOnly={showingFavoritesOnly}
          showingRecentlyPlayedOnly={showingRecentlyPlayedOnly}
        />

        {/* Category Navigation Pills */}
        <CategoryNav
          categories={categoriesData}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setShowingFavoritesOnly(false);
            setShowingRecentlyPlayedOnly(false);
          }}
          categoryCounts={categoryCounts}
        />

        {/* Tag Discovery Filter */}
        <TagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          onClearTags={() => setSelectedTags([])}
          tagCounts={tagCounts}
        />

        {/* Main Games Grid */}
        <div id="library-section">
          <GameGrid
            games={filteredGames}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onPlayGame={handlePlayGame}
            sortOption={sortOption}
            onSortChange={setSortOption}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            showingFavoritesOnly={showingFavoritesOnly}
            showingRecentlyPlayedOnly={showingRecentlyPlayedOnly}
            onResetFilters={handleResetFilters}
          />
        </div>
      </main>

      {/* Game Modal Stage iFrame Player */}
      {activeGame && (
        <GameModal
          game={games.find((g) => g.id === activeGame.id) || activeGame}
          onClose={() => setActiveGame(null)}
          isFavorite={favorites.includes(activeGame.id)}
          onToggleFavorite={handleToggleFavorite}
          relatedGames={relatedGames}
          onSelectGame={(g) => handlePlayGame(g)}
          onRateGame={handleRateGame}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSignIn={handleSignIn}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        games={games}
        onAddGame={handleAddGame}
        onUpdateGame={handleUpdateGame}
        onDeleteGame={handleDeleteGame}
        onToggleFeatured={handleToggleFeatured}
        announcement={announcement}
        onSaveAnnouncement={handleSaveAnnouncement}
        onResetCatalog={handleResetCatalog}
        onResetStats={resetAllGameStatsInDb}
        categories={categoriesData}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
