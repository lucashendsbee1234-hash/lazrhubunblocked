import React from 'react';
import {
  Search,
  Heart,
  History,
  MessageSquarePlus,
  UserCheck,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  Gamepad2,
  Coins,
  Trophy,
  Award,
  ShoppingBag,
  Flame,
  User,
} from 'lucide-react';

export const Header = ({
  searchQuery,
  onSearchChange,
  favoritesCount,
  onOpenFavorites,
  recentlyPlayedCount = 0,
  onOpenRecentlyPlayed,
  showingFavoritesOnly = false,
  showingRecentlyPlayedOnly = false,
  currentUser,
  userProfile,
  onOpenAuth,
  onOpenAdminPanel,
  onOpenProfile,
  onOpenShop,
  onOpenLeaderboard,
  onOpenAchievements,
  onClaimDailyStreak,
  unclaimedCoins = 0,
  coinTimer = 30,
  onClaimCoinPile,
  onSignOut,
  siteLogos,
  currentRoute = '/',
  onNavigate,
}) => {
  const isAdmin = currentUser?.role === 'admin' || userProfile?.role === 'admin' || userProfile?.role === 'owner';
  const isFAQ = currentRoute === '/FAQ';

  const handleBrandClick = () => {
    if (onNavigate) onNavigate('/');
    if (onSearchChange) onSearchChange('');
  };

  const coinBalance = userProfile?.coins ?? currentUser?.coins ?? 100;
  const userLevel = userProfile?.level ?? 1;
  const streak = userProfile?.loginStreak ?? 1;
  const canClaimDaily = !userProfile?.claimedToday;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/90 border-b border-purple-900/40 shadow-lg shadow-purple-950/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 shrink-0 cursor-pointer" onClick={handleBrandClick}>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/50 shadow-md shadow-purple-600/30 bg-black flex items-center justify-center">
            <img src={siteLogos?.headerLogo || "/logo.png"} alt="LAZRHUB Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white block leading-none">
              LAZR<span className="text-purple-400">HUB</span>
            </span>
            <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest block mt-0.5">
              Unblocked Arcade
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        {!isFAQ ? (
          <div className="flex-1 max-w-sm hidden md:block relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-purple-400/70 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search games..."
                className="w-full pl-10 pr-12 py-1.5 text-xs font-semibold rounded-2xl bg-slate-900/90 text-slate-100 placeholder-slate-500 border border-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => onNavigate('/')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center space-x-1.5 border border-purple-900/40 transition-all"
            >
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span>Back to Arcade</span>
            </button>
          </div>
        )}

        {/* Economy & Quick Actions Bar */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Coins & Shop Button */}
          <button
            onClick={onOpenShop}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 font-black text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
            title="Coins Balance & Shop"
          >
            <Coins className="w-4 h-4 text-amber-400 animate-bounce-slow" />
            <span>{coinBalance}</span>
            <span className="text-[10px] text-amber-400/80 font-bold uppercase">Shop</span>
          </button>

          {/* Daily Streak Claim Button */}
          {currentUser && (
            <button
              onClick={onClaimDailyStreak}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all border relative cursor-pointer ${
                canClaimDaily
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-300 animate-pulse'
                  : 'bg-slate-900 text-slate-300 border-purple-900/40 hover:bg-slate-800'
              }`}
              title="Daily Login Streak Rewards"
            >
              <Flame className={`w-4 h-4 ${canClaimDaily ? 'text-slate-950 fill-current' : 'text-purple-400'}`} />
              <span className="hidden sm:inline">{streak}d</span>
              {canClaimDaily && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              )}
            </button>
          )}

          {/* Request Game Button */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeZiD1iZLf-ZJeE85R-X9uypDfmg4Ig46XEvDVRK276XKxnHg/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center space-x-1 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
            title="Request a Game"
          >
            <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Request</span>
          </a>

          {/* Recently Played Button */}
          <button
            onClick={onOpenRecentlyPlayed}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all border cursor-pointer ${
              showingRecentlyPlayedOnly
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-purple-900/40'
            }`}
            title="Recently Played Games"
          >
            <History className={`w-4 h-4 ${showingRecentlyPlayedOnly ? 'text-white' : 'text-purple-400'}`} />
            <span className="hidden md:inline">Recent</span>
            {recentlyPlayedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-black">
                {recentlyPlayedCount}
              </span>
            )}
          </button>

          {/* Favorites Button */}
          <button
            onClick={onOpenFavorites}
            className={`p-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all border cursor-pointer ${
              showingFavoritesOnly
                ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-purple-900/40'
            }`}
            title="Favorites"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'text-purple-300 fill-current' : 'text-slate-400'}`} />
          </button>

          {/* User Auth & Profile Button */}
          {currentUser ? (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={onOpenProfile}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold text-xs flex items-center space-x-2 border border-purple-900/40 transition-all cursor-pointer"
                title="View Profile"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {userProfile?.avatarUrl || '🎮'}
                </div>
                <span className="hidden md:inline">{userProfile?.displayName || currentUser.name || 'Gamer'}</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-black text-[9px]">
                  Lvl {userLevel}
                </span>
              </button>

              {isAdmin && (
                <button
                  onClick={onOpenAdminPanel}
                  className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 text-white font-extrabold text-xs shadow-lg shadow-red-950/50 border border-red-500/50"
                  title="Admin Control Panel"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                </button>
              )}

              <button
                onClick={onSignOut}
                className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/70 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-colors border border-purple-900/40"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 transition-all border border-purple-400/30"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
