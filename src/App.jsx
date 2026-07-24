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
  getStoredCustomGames,
  getStoredAllGamesOverride,
  saveAllGamesOverride,
  getStoredAnnouncement,
  saveStoredAnnouncement,
  getStoredUserAuth,
  saveStoredUserAuth,
  ADMIN_EMAIL,
} from './utils/storage';
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

  // Load initial data and localStorage state
  useEffect(() => {
    // Games catalog
    const override = getStoredAllGamesOverride();
    if (override && Array.isArray(override) && override.length > 0) {
      setGames(override);
    } else {
      const customGames = getStoredCustomGames();
      const allGamesList = [...initialGamesData, ...customGames];
      setGames(allGamesList);
    }

    // Favorites & History
    setFavorites(getStoredFavorites());
    setRecentlyPlayedIds(getStoredRecentlyPlayed().map((item) => item.gameId));

    // Auth & Announcement
    const storedUser = getStoredUserAuth();
    if (storedUser) {
      // Re-verify strictly: only lucas.hendsbee1234@gmail.com authenticated as admin retains admin role
      if (storedUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && storedUser.role === 'admin') {
        storedUser.role = 'admin';
      } else {
        storedUser.role = 'user';
      }
      setCurrentUser(storedUser);
    }
    setAnnouncement(getStoredAnnouncement());
  }, []);

  // Update persistent game catalog whenever games list is modified
  const syncGamesCatalog = (newList) => {
    setGames(newList);
    saveAllGamesOverride(newList);
  };

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

  // Admin Game Management Handlers
  const handleAddGame = (newGame) => {
    const updated = [newGame, ...games];
    syncGamesCatalog(updated);
  };

  const handleUpdateGame = (updatedGame) => {
    const updated = games.map((g) => (g.id === updatedGame.id ? updatedGame : g));
    syncGamesCatalog(updated);
  };

  const handleDeleteGame = (gameId) => {
    const updated = games.filter((g) => g.id !== gameId);
    syncGamesCatalog(updated);
  };

  const handleToggleFeatured = (gameId) => {
    const updated = games.map((g) =>
      g.id === gameId ? { ...g, isFeatured: !g.isFeatured } : g
    );
    syncGamesCatalog(updated);
  };

  const handleSaveAnnouncement = (text) => {
    setAnnouncement(text);
    saveStoredAnnouncement(text);
  };

  const handleResetCatalog = () => {
    setGames(initialGamesData);
    saveAllGamesOverride(initialGamesData);
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

    // Increment play count locally
    setGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, plays: (g.plays || 0) + 1 } : g))
    );
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
          const matchesTags = game.tags.some((t) => t.toLowerCase().includes(q));
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
          const hasAllTags = selectedTags.every((st) => game.tags.includes(st));
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
            return b.plays - a.plays;
          case 'rating':
            return b.rating - a.rating;
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'newest':
            return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
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
    games.forEach((g) => {
      g.tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [games]);

  const availableTags = useMemo(() => {
    const set = new Set(defaultTagsData);
    games.forEach((g) => g.tags.forEach((t) => set.add(t)));
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
          game={activeGame}
          onClose={() => setActiveGame(null)}
          isFavorite={favorites.includes(activeGame.id)}
          onToggleFavorite={handleToggleFavorite}
          relatedGames={relatedGames}
          onSelectGame={(g) => handlePlayGame(g)}
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
        categories={categoriesData}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
