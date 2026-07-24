import React from 'react';
import { Play, Star, Flame, Gamepad2, MessageSquarePlus } from 'lucide-react';

export const HeroBanner = ({
  featuredGame,
  onPlayGame,
  onExploreClick,
}) => {
  if (!featuredGame) {
    return (
      <div className="relative w-full rounded-3xl overflow-hidden mb-8 border border-purple-900/40 shadow-2xl bg-slate-950 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-xl shadow-purple-600/30 bg-black mb-6 flex items-center justify-center">
          <img src="/logo.png" alt="LAZRHUB Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
          WELCOME TO <span className="text-purple-400">LAZRHUB</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mb-6 leading-relaxed">
          The ultimate unblocked web arcade. Request your favorite games to be added to our library!
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSeZiD1iZLf-ZJeE85R-X9uypDfmg4Ig46XEvDVRK276XKxnHg/viewform?usp=publish-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center space-x-2 shadow-xl shadow-purple-600/40 transition-all transform hover:-translate-y-0.5"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span>REQUEST A GAME NOW</span>
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden mb-8 border border-purple-900/40 shadow-2xl bg-slate-950 group">
      {/* Background Banner Image */}
      <div className="absolute inset-0">
        <img
          src={featuredGame.thumbnailUrl}
          alt={featuredGame.title}
          className="w-full h-full object-cover object-center filter brightness-[0.35] group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-600 text-white flex items-center space-x-1 shadow-lg shadow-purple-600/30">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>FEATURED ARCADE</span>
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950/80 backdrop-blur-md text-purple-300 border border-purple-800/50 flex items-center space-x-1">
            <Star className="w-3.5 h-3.5 text-purple-400 fill-current" />
            <span>{featuredGame.rating ? featuredGame.rating.toFixed(1) : '5.0'} Rating</span>
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-900/40 text-purple-200 border border-purple-700/40">
            {featuredGame.category}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3 drop-shadow-md">
          {featuredGame.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 line-clamp-2 sm:line-clamp-3 mb-6 leading-relaxed">
          {featuredGame.description}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => onPlayGame(featuredGame)}
            className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center space-x-2 shadow-xl shadow-purple-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>PLAY NOW</span>
          </button>

          <button
            onClick={onExploreClick}
            className="px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm backdrop-blur-md border border-purple-900/40 flex items-center space-x-2 transition-all"
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>BROWSE ALL GAMES</span>
          </button>
        </div>
      </div>
    </div>
  );
};
