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

import {
  getStoredFavorites,
  toggleStoredFavorite,
  getStoredRecentlyPlayed,
  recordGamePlay,
  getStoredCustomGames,
} from './utils/storage';

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

  // Load initial data and localStorage state
  useEffect(() => {
    const customGames = getStoredCustomGames();
    const allGamesList = [...initialGamesData, ...customGames];
    setGames(allGamesList);

    setFavorites(getStoredFavorites());
    setRecentlyPlayedIds(getStoredRecentlyPlayed().map((item) => item.gameId));
  }, []);

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
      prev.map((g) => (g.id === game.id ? { ...g, plays: g.plays + 1 } : g))
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
    return games.find((g) => g.featured) || games[0];
  }, [games]);

  const relatedGames = useMemo(() => {
    if (!activeGame) return [];
    return games.filter(
      (g) => g.category === activeGame.category && g.id !== activeGame.id
    );
  }, [games, activeGame]);

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans antialiased selection:bg-purple-600 selection:text-white transition-colors">
      {/* Header Navbar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favorites.length}
        onOpenFavorites={() => {
          setShowingFavoritesOnly(!showingFavoritesOnly);
          setShowingRecentlyPlayedOnly(false);
        }}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
