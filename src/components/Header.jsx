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
  onOpenAuth,
  onOpenAdminPanel,
  onSignOut,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/90 border-b border-purple-900/40 shadow-lg shadow-purple-950/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 shrink-0 cursor-pointer" onClick={() => onSearchChange('')}>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/50 shadow-md shadow-purple-600/30 bg-black flex items-center justify-center">
            <img src="/logo.png" alt="LAZRHUB Logo" className="w-full h-full object-cover" />
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
        <div className="flex-1 max-w-md hidden md:block relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-purple-400/70 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games, tags, or categories... (Press /)"
              className="w-full pl-10 pr-12 py-2 text-xs font-semibold rounded-2xl bg-slate-900/90 text-slate-100 placeholder-slate-500 border border-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
            <div className="absolute right-3 flex items-center space-x-1 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-purple-300 bg-slate-950 rounded border border-purple-900/60">
                /
              </kbd>
            </div>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Request a Game Form Link */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeZiD1iZLf-ZJeE85R-X9uypDfmg4Ig46XEvDVRK276XKxnHg/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 font-bold text-xs flex items-center space-x-1.5 transition-all border border-purple-500/30"
            title="Request a Game"
          >
            <MessageSquarePlus className="w-4 h-4 text-purple-300" />
            <span className="hidden sm:inline">Request a Game</span>
          </a>

          {/* Recently Played Filter Button */}
          <button
            onClick={onOpenRecentlyPlayed}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border relative ${
              showingRecentlyPlayedOnly
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-purple-900/40'
            }`}
            title="Recently Played Games"
          >
            <History className={`w-4 h-4 ${recentlyPlayedCount > 0 ? 'text-purple-300' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Recent</span>
            {recentlyPlayedCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                showingRecentlyPlayedOnly ? 'bg-purple-950 text-purple-200' : 'bg-purple-600 text-white'
              }`}>
                {recentlyPlayedCount}
              </span>
            )}
          </button>

          {/* Favorites Filter Button */}
          <button
            onClick={onOpenFavorites}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border relative ${
              showingFavoritesOnly
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-purple-900/40'
            }`}
            title="Favorites"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'text-purple-300 fill-current' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                showingFavoritesOnly ? 'bg-purple-950 text-purple-200' : 'bg-purple-600 text-white'
              }`}>
                {favoritesCount}
              </span>
            )}
          </button>

          {/* User / Admin Authentication State */}
          {currentUser ? (
            <div className="flex items-center space-x-1.5">
              {isAdmin ? (
                /* Admin Profile Tab Button */
                <button
                  onClick={onOpenAdminPanel}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-purple-600/30 border border-purple-400/40 transition-all transform active:scale-95"
                  title="Admin Control Panel & Profile"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">Admin Profile</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                    ADMIN
                  </span>
                </button>
              ) : (
                /* Standard User Profile Button */
                <button
                  onClick={onOpenAdminPanel}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center space-x-1.5 border border-purple-900/40"
                >
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">{currentUser.name || currentUser.email}</span>
                </button>
              )}

              {/* Quick Sign Out Button */}
              <button
                onClick={onSignOut}
                className="p-2 sm:p-2 rounded-xl bg-slate-900 hover:bg-red-950/70 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-colors border border-purple-900/40"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Sign In Button */
            <button
              onClick={onOpenAuth}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 transition-all border border-purple-400/30"
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


