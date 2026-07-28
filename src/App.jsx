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
import { SiteLogoModal } from './components/SiteLogoModal';
import { LiveChatWidget } from './components/LiveChatWidget';

import {
  getStoredFavorites,
  toggleStoredFavorite,
  getStoredRecentlyPlayed,
  recordGamePlay,
  clearStoredRecentlyPlayed,
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
  subscribeToSiteLogos,
  saveSiteLogosToDb,
  recordGamePlayInDb,
  rateGameInDb,
  subscribeToChatMessages,
  sendChatMessageToDb,
  deleteChatMessageFromDb,
  clearAllChatMessagesInDb,
  subscribeToChatModeration,
  saveChatModerationToDb,
  reportChatMessageToDb,
  subscribeToChatReports,
  deleteChatReportFromDb,
  subscribeToDeletedTags,
  deleteTagInDb,
} from './utils/firebase';
import {
  initAnalyticsSession,
  trackGameLaunch,
  trackSearchQuery,
  trackAdminAction,
} from './utils/analyticsTracker';
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
  const [isSiteLogoModalOpen, setIsSiteLogoModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [siteLogos, setSiteLogos] = useState({
    headerLogo: '/logo.png',
    footerLogo: '/logo.png',
  });

  // Live Chat & Moderation State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatModeration, setChatModeration] = useState({
    bannedEmails: [],
    timedOutUsers: {},
    slowModeSeconds: 0,
    aiModerationEnabled: true,
    pinnedMessage: null,
  });
  const [chatReports, setChatReports] = useState([]);
  const [deletedTags, setDeletedTags] = useState([]);

  // Real-time Firestore sync for games, announcements, logos, live chat + Real Analytics Session Init
  useEffect(() => {
    // 0. Initialize Real Analytics Session and Heartbeat
    let cleanupSession;
    initAnalyticsSession().then((cleanup) => {
      cleanupSession = cleanup;
    }).catch(console.error);

    // 1. Subscribe to games in Firestore (real-time for all connected users)
    const unsubscribeGames = subscribeToGames((gamesList) => {
      if (gamesList && gamesList.length > 0) {
        setGames(gamesList);
      }
    });

    // 2. Subscribe to global announcements in Firestore
    const unsubscribeAnnouncement = subscribeToAnnouncement((text) => {
      setAnnouncement(text || '');
    });

    // 3. Subscribe to site profile pictures & logos in Firestore
    const unsubscribeLogos = subscribeToSiteLogos((logos) => {
      setSiteLogos(logos);
    });

    // 4. Subscribe to real-time Live Chat messages
    const unsubscribeChat = subscribeToChatMessages((msgList) => {
      setChatMessages(msgList || []);
    });

    // 5. Subscribe to real-time Live Chat moderation settings
    const unsubscribeMod = subscribeToChatModeration((modData) => {
      if (modData) setChatModeration(modData);
    });

    // 6. Subscribe to user chat reports
    const unsubscribeReports = subscribeToChatReports((repList) => {
      setChatReports(repList || []);
    });

    // 7. Subscribe to deleted tags
    const unsubscribeDeletedTags = subscribeToDeletedTags((tags) => {
      setDeletedTags(tags || []);
    });

    // 4. Favorites & History from local storage
    setFavorites(getStoredFavorites().map(String));
    setRecentlyPlayedIds(getStoredRecentlyPlayed().map((item) => String(item.gameId)));

    // 5. User Auth from local storage
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
      unsubscribeLogos();
      unsubscribeChat();
      unsubscribeMod();
      unsubscribeReports();
      unsubscribeDeletedTags();
      if (cleanupSession) cleanupSession();
    };
  }, []);

  // Track search query events in real-time
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) return;
    const timer = setTimeout(() => {
      const matchCount = games.filter((g) => {
        const q = searchQuery.toLowerCase();
        return (
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
        );
      }).length;
      trackSearchQuery(searchQuery, matchCount);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery, games]);

  // Auth Handlers
  const handleSignIn = (user) => {
    setCurrentUser(user);
    saveStoredUserAuth(user);
    if (user.role === 'admin') {
      setIsAdminPanelOpen(true);
      trackAdminAction('Admin Login', 'Super Admin authenticated', user.email);
    }
  };

  const handleSignOut = () => {
    trackAdminAction('Admin Sign Out', 'Session terminated', currentUser?.email);
    setCurrentUser(null);
    saveStoredUserAuth(null);
    setIsAdminPanelOpen(false);
  };

  // Admin Game Management Handlers (Persisted directly to Firestore so everyone gets live updates)
  const handleAddGame = async (newGame) => {
    await saveGameToDb(newGame);
    trackAdminAction('Game Added', `Published "${newGame.title}"`, currentUser?.email || 'Admin');
  };

  const handleUpdateGame = async (updatedGame) => {
    await saveGameToDb(updatedGame);
    trackAdminAction('Game Updated', `Edited "${updatedGame.title}"`, currentUser?.email || 'Admin');
  };

  const handleDeleteGame = async (gameId) => {
    const target = games.find((g) => g.id === gameId);
    await deleteGameFromDb(gameId);
    trackAdminAction('Game Deleted', `Removed "${target?.title || gameId}"`, currentUser?.email || 'Admin');
  };

  const handleToggleFeatured = async (gameId) => {
    const target = games.find((g) => g.id === gameId);
    if (target) {
      const newStatus = !target.isFeatured;
      await saveGameToDb({ ...target, isFeatured: newStatus });
      trackAdminAction('Hero Status Toggle', `${newStatus ? 'Featured' : 'Unfeatured'} "${target.title}"`, currentUser?.email || 'Admin');
    }
  };

  const handleSaveAnnouncement = async (text) => {
    setAnnouncement(text);
    await saveAnnouncementToDb(text);
    trackAdminAction('Broadcast Announcement Updated', text ? `"${text.substring(0, 30)}..."` : 'Cleared', currentUser?.email || 'Admin');
  };

  const handleSaveSiteLogos = async (newLogos) => {
    setSiteLogos(newLogos);
    await saveSiteLogosToDb(newLogos);
    trackAdminAction('Updated Site Logos', 'Changed main header/footer profile pictures', currentUser?.email || 'Admin');
  };

  const handleResetCatalog = async () => {
    await resetGamesDbToDefaults();
    trackAdminAction('Catalog Reset', 'Restored default catalog', currentUser?.email || 'Admin');
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
    setRecentlyPlayedIds(updatedPlayed.map((item) => String(item.gameId)));

    // Optimistically update plays count in local state instantly
    setGames((prevGames) =>
      prevGames.map((g) =>
        String(g.id) === String(game.id) ? { ...g, plays: (g.plays || 0) + 1 } : g
      )
    );

    // Record play in Firestore live for all connected users and track real analytics event
    recordGamePlayInDb(game.id);
    trackGameLaunch(game);
  }, []);

  // Handle Clear Recently Played History
  const handleClearRecentlyPlayed = useCallback(() => {
    clearStoredRecentlyPlayed();
    setRecentlyPlayedIds([]);
  }, []);

  // Handle Rate Game Trigger
  const handleRateGame = useCallback(async (gameId, starRating, previousRating) => {
    const res = await rateGameInDb(gameId, starRating, previousRating);
    if (res && typeof res.rating === 'number') {
      setGames((prevGames) =>
        prevGames.map((g) =>
          g.id === gameId
            ? {
                ...g,
                rating: res.rating,
                ratingCount: res.ratingCount,
                ratingSum: res.ratingSum,
              }
            : g
        )
      );
    }
  }, []);

  // Filter & Sort Logic
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        const gameIdStr = String(game.id);

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
        if (showingFavoritesOnly && !favorites.includes(gameIdStr)) {
          return false;
        }

        // Recently Played check
        if (showingRecentlyPlayedOnly && !recentlyPlayedIds.includes(gameIdStr)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // If showing Recently Played tab, sort by recency order (most recently played first)
        if (showingRecentlyPlayedOnly) {
          const indexA = recentlyPlayedIds.indexOf(String(a.id));
          const indexB = recentlyPlayedIds.indexOf(String(b.id));
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
        }

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
    return Array.from(set).filter((t) => !deletedTags.includes(t));
  }, [games, deletedTags]);

  const handleToggleTag = useCallback((tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleDeleteTag = useCallback(async (tagToDelete) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagToDelete));
    setDeletedTags((prev) => [...prev, tagToDelete]);
    setGames((prevGames) =>
      prevGames.map((g) => ({
        ...g,
        tags: (g.tags || []).filter((t) => t !== tagToDelete),
      }))
    );
    try {
      await deleteTagInDb(tagToDelete);
    } catch (err) {
      console.error('Failed to delete tag:', err);
    }
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
          setSelectedCategory('All');
        }}
        recentlyPlayedCount={recentlyPlayedIds.length}
        onOpenRecentlyPlayed={() => {
          setShowingRecentlyPlayedOnly(!showingRecentlyPlayedOnly);
          setShowingFavoritesOnly(false);
          setSelectedCategory('All');
        }}
        showingFavoritesOnly={showingFavoritesOnly}
        showingRecentlyPlayedOnly={showingRecentlyPlayedOnly}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onSignOut={handleSignOut}
        siteLogos={siteLogos}
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
              games={games}
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
            setSelectedCategory('All');
          }}
          onFilterRecentlyPlayed={() => {
            setShowingRecentlyPlayedOnly(!showingRecentlyPlayedOnly);
            setShowingFavoritesOnly(false);
            setSelectedCategory('All');
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
          showingRecentlyPlayedOnly={showingRecentlyPlayedOnly}
          showingFavoritesOnly={showingFavoritesOnly}
          recentlyPlayedCount={recentlyPlayedIds.length}
          favoritesCount={favorites.length}
          onSelectRecentlyPlayed={() => {
            setShowingRecentlyPlayedOnly(!showingRecentlyPlayedOnly);
            setShowingFavoritesOnly(false);
            setSelectedCategory('All');
          }}
          onSelectFavorites={() => {
            setShowingFavoritesOnly(!showingFavoritesOnly);
            setShowingRecentlyPlayedOnly(false);
            setSelectedCategory('All');
          }}
        />

        {/* Tag Discovery Filter */}
        <TagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onToggleTag={handleToggleTag}
          onClearTags={() => setSelectedTags([])}
          tagCounts={tagCounts}
          currentUser={currentUser}
          onDeleteTag={handleDeleteTag}
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
            onClearRecentlyPlayed={handleClearRecentlyPlayed}
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
        onOpenSiteLogoModal={() => setIsSiteLogoModalOpen(true)}
        siteLogos={siteLogos}
        moderation={chatModeration}
        onSaveModeration={saveChatModerationToDb}
        chatReports={chatReports}
        onDeleteReport={deleteChatReportFromDb}
        onSendMessage={sendChatMessageToDb}
        onClearChat={clearAllChatMessagesInDb}
      />

      {/* Site Profile Pictures & Logo Customizer Modal */}
      <SiteLogoModal
        isOpen={isSiteLogoModalOpen}
        onClose={() => setIsSiteLogoModalOpen(false)}
        siteLogos={siteLogos}
        onSaveSiteLogos={handleSaveSiteLogos}
      />

      {/* Live Chat Floating Widget */}
      <LiveChatWidget
        currentUser={currentUser}
        messages={chatMessages}
        moderation={chatModeration}
        onSendMessage={sendChatMessageToDb}
        onDeleteMessage={deleteChatMessageFromDb}
        onClearChat={clearAllChatMessagesInDb}
        onSaveModeration={saveChatModerationToDb}
        onReportMessage={reportChatMessageToDb}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Footer */}
      <Footer siteLogos={siteLogos} />
    </div>
  );
}
