import React from 'react';
import { Gamepad2, Heart, History, FolderKanban, Tags } from 'lucide-react';

export const DashboardStats = ({
  totalGames,
  totalCategories,
  totalTags,
  favoritesCount,
  recentlyPlayedCount,
  onFilterFavorites,
  onFilterRecentlyPlayed,
  showingFavoritesOnly,
  showingRecentlyPlayedOnly,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
          <Gamepad2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Games
          </span>
          <span className="text-base font-black text-white">
            {totalGames}
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
          <FolderKanban className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Categories
          </span>
          <span className="text-base font-black text-white">
            {totalCategories}
          </span>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-900/40 flex items-center space-x-3">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
          <Tags className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Tags Filterable
          </span>
          <span className="text-base font-black text-white">
            {totalTags}
          </span>
        </div>
      </div>

      <button
        onClick={onFilterFavorites}
        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
          showingFavoritesOnly
            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
            : 'bg-slate-900/90 border-purple-900/40 hover:border-purple-500/50 text-slate-200'
        }`}
      >
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
          <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'fill-current' : ''}`} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Favorites
          </span>
          <span className="text-base font-black text-white">
            {favoritesCount}
          </span>
        </div>
      </button>

      <button
        onClick={onFilterRecentlyPlayed}
        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
          showingRecentlyPlayedOnly
            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
            : 'bg-slate-900/90 border-purple-900/40 hover:border-purple-500/50 text-slate-200'
        }`}
      >
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
          <History className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Recent Played
          </span>
          <span className="text-base font-black text-white">
            {recentlyPlayedCount}
          </span>
        </div>
      </button>
    </div>
  );
};
