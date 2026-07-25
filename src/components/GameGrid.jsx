import React from 'react';
import { GameCard } from './GameCard';
import { ArrowUpDown, Grid, List, SearchX, X, MessageSquarePlus, History, Heart, Trash2 } from 'lucide-react';

export const GameGrid = ({
  games,
  favorites,
  onToggleFavorite,
  onPlayGame,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  selectedCategory,
  selectedTags,
  showingFavoritesOnly,
  showingRecentlyPlayedOnly,
  onResetFilters,
  onClearRecentlyPlayed,
}) => {
  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'All' ||
    selectedTags.length > 0 ||
    showingFavoritesOnly ||
    showingRecentlyPlayedOnly;

  return (
    <div className="w-full">
      {/* Grid Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-purple-900/40">
        <div>
          <h2 className="text-xl font-black text-white flex items-center space-x-2">
            {showingRecentlyPlayedOnly ? (
              <>
                <History className="w-5 h-5 text-purple-400 shrink-0" />
                <span>Recently Played Games</span>
              </>
            ) : showingFavoritesOnly ? (
              <>
                <Heart className="w-5 h-5 text-purple-400 fill-current shrink-0" />
                <span>Favorite Games</span>
              </>
            ) : (
              <span>Library Games</span>
            )}
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-900 text-purple-300 border border-purple-900/40">
              {games.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {showingRecentlyPlayedOnly
              ? 'Showing games you played recently (Most recent first)'
              : showingFavoritesOnly
              ? 'Your bookmarked favorite games'
              : hasActiveFilters
              ? 'Filtered results based on your selection'
              : 'Browse all available unblocked games'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Clear History Button for Recently Played */}
          {showingRecentlyPlayedOnly && games.length > 0 && onClearRecentlyPlayed && (
            <button
              onClick={onClearRecentlyPlayed}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/40 border border-red-900/60 flex items-center space-x-1.5 hover:bg-red-900/60 transition-colors"
              title="Clear Recent Games History"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Clear History</span>
            </button>
          )}

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-400 bg-purple-950/40 border border-purple-800/80 flex items-center space-x-1 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}

          {/* Sort Selector */}
          {!showingRecentlyPlayedOnly && (
            <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-purple-900/40">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="popular" className="bg-slate-950 text-white">Most Popular</option>
                <option value="rating" className="bg-slate-950 text-white">Top Rated</option>
                <option value="newest" className="bg-slate-950 text-white">Recently Added</option>
                <option value="title-asc" className="bg-slate-950 text-white">Title (A - Z)</option>
                <option value="title-desc" className="bg-slate-950 text-white">Title (Z - A)</option>
              </select>
            </div>
          )}

          {/* View Toggles */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-purple-900/40">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('compact')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'compact'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {games.length === 0 ? (
        showingRecentlyPlayedOnly ? (
          <div className="w-full bg-slate-900/60 rounded-3xl p-12 border border-purple-900/40 text-center flex flex-col items-center justify-center my-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-900/40">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              No Recently Played Games Yet
            </h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              You haven't played any games in this session yet. Launch any game from the catalog and it will automatically be saved here for quick access!
            </p>
            <button
              onClick={onResetFilters}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition-all"
            >
              Browse Catalog
            </button>
          </div>
        ) : showingFavoritesOnly ? (
          <div className="w-full bg-slate-900/60 rounded-3xl p-12 border border-purple-900/40 text-center flex flex-col items-center justify-center my-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-900/40">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              No Favorite Games Saved
            </h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              Click the heart icon on any game card to bookmark it to your favorites list!
            </p>
            <button
              onClick={onResetFilters}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition-all"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="w-full bg-slate-900/60 rounded-3xl p-12 border border-purple-900/40 text-center flex flex-col items-center justify-center my-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-900/40">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              No games currently in LAZRHUB library
            </h3>
            <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
              There are currently no games matching your selection. Submit your favorite unblocked game using the request form!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSeZiD1iZLf-ZJeE85R-X9uypDfmg4Ig46XEvDVRK276XKxnHg/viewform?usp=publish-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Request a Game</span>
              </a>
              {hasActiveFilters && (
                <button
                  onClick={onResetFilters}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-purple-900/40 text-slate-200 font-bold text-sm transition-all"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        /* Game Items */
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-3'
          }
        >
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorite={favorites.includes(game.id)}
              onToggleFavorite={onToggleFavorite}
              onPlayGame={onPlayGame}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
