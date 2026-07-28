import React, { useState, useEffect, useMemo, useCallback } from 'react';
import initialGamesData from './data/games.json';
import categoriesData from './data/categories.json';
import defaultTagsData from './data/tags.json';

import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { HeroBanner } from './components/HeroBanner';
import { CategoryNav } from './components/CategoryNav';
import { HomePollAndQuickLinks } from './components/HomePollAndQuickLinks';
import { GameGrid } from './components/GameGrid';
import { GameModal } from './components/GameModal';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SiteLogoModal } from './components/SiteLogoModal';
import { LiveChatWidget } from './components/LiveChatWidget';
import { FAQPage } from './components/FAQPage';
import { LegalModal } from './components/LegalModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ShopModal } from './components/ShopModal';
import { AchievementsModal } from './components/AchievementsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CoinAnimationOverlay } from './components/CoinAnimationOverlay';
import { CoinPileWidget } from './components/CoinPileWidget';

import {
  subscribeToUserProfile,
  claimDailyLoginInDb,
  awardCoinsAndXpInDb,
  incrementGamesPlayedInDb,
  getUserProfileByEmail,
  getDefaultUserProfile,
} from './utils/userManagement';
import {
  playCoinSound,
  playLevelUpSound,
  playAchievementSound,
} from './utils/audioEffects';

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
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    return path.startsWith('/faq') ? '/FAQ' : '/';
  });
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  const [games, setGames] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortOption, setSortOption] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');

  // Synchronize route with browser history (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      setCurrentRoute(path.startsWith('/faq') ? '/FAQ' : '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((route) => {
    if (route !== window.location.pathname) {
      window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [showingFavoritesOnly, setShowingFavoritesOnly] = useState(false);
  const [showingRecentlyPlayedOnly, setShowingRecentlyPlayedOnly] = useState(false);

  const [activeGame, setActiveGame] = useState(null);

  // Authentication & Admin state
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSiteLogoModalOpen, setIsSiteLogoModalOpen] = useState(false);

  // Economy & Profile Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewedUserProfile, setViewedUserProfile] = useState(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [coinAnimationData, setCoinAnimationData] = useState(null);

  const handleOpenProfile = async (targetEmail) => {
    if (typeof targetEmail === 'string' && targetEmail.includes('@')) {
      const prof = await getUserProfileByEmail(targetEmail);
      setViewedUserProfile(prof || getDefaultUserProfile(targetEmail));
      setIsProfileOpen(true);
      return;
    }
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setViewedUserProfile(userProfile || currentUser);
    setIsProfileOpen(true);
  };
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

  // Real-Time Profile Listener & Daily Streak Check
  useEffect(() => {
    if (!currentUser?.email) {
      setUserProfile(null);
      return;
    }

    const unsubProfile = subscribeToUserProfile(currentUser.email, (prof) => {
      setUserProfile(prof);
    });

    return () => unsubProfile();
  }, [currentUser?.email]);

  // 30-Second Passive Coin Vault State
  const [unclaimedCoinPile, setUnclaimedCoinPile] = useState(() => {
    const saved = localStorage.getItem('lazrhub_unclaimed_coins');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [coinTimerSeconds, setCoinTimerSeconds] = useState(30);

  // Interval for 30-second passive coin pile accumulation (ONLY ticks when user is active on site)
  useEffect(() => {
    const timer = setInterval(() => {
      // Do not accumulate or tick if the tab/page is hidden, minimized, or inactive
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      setCoinTimerSeconds((prev) => {
        if (prev <= 1) {
          setUnclaimedCoinPile((pile) => {
            const nextPile = pile + 1;
            localStorage.setItem('lazrhub_unclaimed_coins', String(nextPile));
            return nextPile;
          });
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handler to claim accumulated passive coin pile
  const handleClaimCoinPile = async () => {
    if (unclaimedCoinPile <= 0) return;

    const coinsToClaim = unclaimedCoinPile;
    setUnclaimedCoinPile(0);
    localStorage.setItem('lazrhub_unclaimed_coins', '0');

    playCoinSound();
    setCoinAnimationData({
      amount: coinsToClaim,
      xp: coinsToClaim * 2,
      type: 'game',
      reason: `Claimed ${coinsToClaim} Passive Vault Coins!`,
    });

    if (currentUser?.email) {
      try {
        await awardCoinsAndXpInDb(currentUser.email, {
          coins: coinsToClaim,
          xp: coinsToClaim * 2,
          reason: '30s Passive Coin Vault Claim',
        });
      } catch (err) {
        console.error('Error saving claimed coins to database:', err);
      }
    } else {
      setCurrentUser((prev) => (prev ? { ...prev, coins: (prev.coins || 0) + coinsToClaim } : prev));
    }
  };

  // Handler to claim daily streak
  const handleClaimDailyStreak = async () => {
    if (!currentUser?.email) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await claimDailyLoginInDb(currentUser.email);
      if (res.claimed) {
        playCoinSound();
        setCoinAnimationData({
          amount: res.coinsAwarded,
          xp: res.xpAwarded,
          type: 'daily',
          reason: `Daily Login Streak Day ${res.streak}!`,
        });
      } else {
        alert(`You already claimed today's daily streak reward! Next reward available tomorrow.`);
      }
    } catch (err) {
      console.error('Error claiming daily streak:', err);
    }
  };

  // Handler to award play time (triggered by GameModal)
  const handleAwardPlayTime = useCallback(async (gameId, minutes, totalSessionMinutes) => {
    if (!currentUser?.email) return;

    // Award bonus coins at milestones: 10m (+15), 30m (+50), 60m (+120)
    let coinBonus = 0;
    let xpBonus = minutes * 5; // 5 XP per minute played

    if (totalSessionMinutes === 10) coinBonus = 15;
    else if (totalSessionMinutes === 30) coinBonus = 50;
    else if (totalSessionMinutes === 60) coinBonus = 120;

    try {
      await awardCoinsAndXpInDb(currentUser.email, {
        coins: coinBonus,
        xp: xpBonus,
        reason: coinBonus > 0 ? `${totalSessionMinutes}m Active Playtime Reward!` : 'Active Playtime XP',
      });

      if (coinBonus > 0) {
        playCoinSound();
        setCoinAnimationData({
          amount: coinBonus,
          xp: xpBonus,
          type: 'playtime',
          reason: `${totalSessionMinutes} Minutes Played Bonus!`,
        });
      }
    } catch (err) {
      console.error('Play time award error:', err);
    }
  }, [currentUser?.email]);

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

    if (currentUser?.email) {
      incrementGamesPlayedInDb(currentUser.email, game.id).catch(console.error);
    }
  }, [currentUser?.email]);

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
          if (currentRoute !== '/') navigateTo('/');
          setShowingFavoritesOnly(!showingFavoritesOnly);
          setShowingRecentlyPlayedOnly(false);
          setSelectedCategory('All');
        }}
        recentlyPlayedCount={recentlyPlayedIds.length}
        onOpenRecentlyPlayed={() => {
          if (currentRoute !== '/') navigateTo('/');
          setShowingRecentlyPlayedOnly(!showingRecentlyPlayedOnly);
          setShowingFavoritesOnly(false);
          setSelectedCategory('All');
        }}
        showingFavoritesOnly={showingFavoritesOnly}
        showingRecentlyPlayedOnly={showingRecentlyPlayedOnly}
        currentUser={currentUser}
        userProfile={userProfile}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenProfile={() => handleOpenProfile()}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onClaimDailyStreak={handleClaimDailyStreak}
        unclaimedCoins={unclaimedCoinPile}
        coinTimer={coinTimerSeconds}
        onClaimCoinPile={handleClaimCoinPile}
        onSignOut={handleSignOut}
        siteLogos={siteLogos}
        currentRoute={currentRoute}
        onNavigate={navigateTo}
      />

      {/* Standalone FAQ Page Route or Main Arcade Home Route */}
      {currentRoute === '/FAQ' ? (
        <FAQPage
          onNavigateHome={() => navigateTo('/')}
          siteLogos={siteLogos}
        />
      ) : (
        /* Main Container */
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

          {/* Community Poll & Quick Links Section */}
          <HomePollAndQuickLinks
            onNavigate={navigateTo}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
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
      )}

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
          onAwardPlayTime={handleAwardPlayTime}
        />
      )}

      {/* User Profile System Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        targetUserProfile={viewedUserProfile || userProfile || currentUser}
        currentUser={userProfile || currentUser}
        onOpenShop={() => {
          setIsProfileOpen(false);
          setIsShopOpen(true);
        }}
        onOpenAchievements={() => {
          setIsProfileOpen(false);
          setIsAchievementsOpen(true);
        }}
      />

      {/* LazrCoins Economy Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        currentUser={userProfile || currentUser}
        onNotify={(data) => {
          setCoinAnimationData(data);
          playCoinSound();
        }}
      />

      {/* Achievements System Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        currentUser={userProfile || currentUser}
      />

      {/* Global Leaderboards Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        onSelectUser={(user) => {
          setIsLeaderboardOpen(false);
          handleOpenProfile(user.email);
        }}
      />

      {/* Coin & Reward Animation Overlay */}
      <CoinAnimationOverlay
        data={coinAnimationData}
        onClose={() => setCoinAnimationData(null)}
      />

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
        chatMessages={chatMessages}
        onSendMessage={sendChatMessageToDb}
        onDeleteChatMessage={deleteChatMessageFromDb}
        onClearChat={clearAllChatMessagesInDb}
      />

      {/* Site Profile Pictures & Logo Customizer Modal */}
      <SiteLogoModal
        isOpen={isSiteLogoModalOpen}
        onClose={() => setIsSiteLogoModalOpen(false)}
        siteLogos={siteLogos}
        onSaveSiteLogos={handleSaveSiteLogos}
      />

      {/* Legal Privacy & Terms Modal */}
      <LegalModal
        isOpen={Boolean(activeLegalModal)}
        onClose={() => setActiveLegalModal(null)}
        type={activeLegalModal}
      />

      {/* Live Chat Floating Widget */}
      <LiveChatWidget
        currentUser={currentUser}
        userProfile={userProfile}
        messages={chatMessages}
        moderation={chatModeration}
        onSendMessage={sendChatMessageToDb}
        onDeleteMessage={deleteChatMessageFromDb}
        onClearChat={clearAllChatMessagesInDb}
        onSaveModeration={saveChatModerationToDb}
        onReportMessage={reportChatMessageToDb}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={(email) => handleOpenProfile(email)}
      />

      {/* 30s Passive Coin Vault Floating Widget */}
      <CoinPileWidget
        unclaimedCoins={unclaimedCoinPile}
        coinTimer={coinTimerSeconds}
        onClaim={handleClaimCoinPile}
        currentUser={currentUser}
      />

      {/* Footer */}
      {currentRoute !== '/FAQ' && (
        <Footer
          siteLogos={siteLogos}
          onNavigate={navigateTo}
          onOpenLegal={(type) => setActiveLegalModal(type)}
        />
      )}
    </div>
  );
}
