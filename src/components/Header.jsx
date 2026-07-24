import React from 'react';
import {
  Search,
  Heart,
  MessageSquarePlus,
} from 'lucide-react';

export const Header = ({
  searchQuery,
  onSearchChange,
  favoritesCount,
  onOpenFavorites,
}) => {
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
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center space-x-1.5 transition-all border border-purple-400/30 shadow-lg shadow-purple-600/30"
            title="Request a Game"
          >
            <MessageSquarePlus className="w-4 h-4 text-purple-200" />
            <span className="hidden sm:inline">Request a Game</span>
          </a>

          {/* Favorites Filter */}
          <button
            onClick={onOpenFavorites}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors border border-purple-900/40 relative"
            title="Favorites"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'text-purple-400 fill-current' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Favorites</span>
            {favoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] font-black">
                {favoritesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
