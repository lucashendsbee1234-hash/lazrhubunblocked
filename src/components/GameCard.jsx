import React from 'react';
import { Heart, Play, Star, Eye, Flame } from 'lucide-react';

export const GameCard = ({
  game,
  isFavorite,
  onToggleFavorite,
  onPlayGame,
  viewMode = 'grid',
}) => {
  const isPopular =
    (game.plays && game.plays >= 10) ||
    (game.rating && game.rating >= 4.5) ||
    (game.tags && game.tags.includes('popular')) ||
    game.isFeatured;
  if (viewMode === 'compact') {
    return (
      <div
        onClick={() => onPlayGame(game)}
        className="group bg-slate-900/90 border border-purple-900/40 rounded-2xl p-3 flex items-center justify-between gap-4 hover:border-purple-500 transition-all cursor-pointer shadow-xs"
      >
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative border border-purple-900/30">
            <img
              src={game.thumbnailUrl}
              alt={game.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors">
              {game.title}
            </h3>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
              <span className="font-semibold text-purple-400">{game.category}</span>
              <span>•</span>
              <span className="flex items-center space-x-0.5">
                <Star className="w-3 h-3 text-purple-400 fill-current" />
                <span>{game.rating ? game.rating.toFixed(1) : '0.0'}</span>
              </span>
              <span>•</span>
              <span>{(game.plays || 0).toLocaleString()} plays</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={(e) => onToggleFavorite(e, game.id)}
            className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-purple-400 transition-colors border border-purple-900/30"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'text-purple-400 fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onPlayGame(game)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center space-x-1 hover:bg-purple-500 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onPlayGame(game)}
      className="group bg-slate-900/90 border border-purple-900/40 hover:border-purple-500 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer flex flex-col h-full relative"
    >
      {/* Thumbnail Box */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
        <img
          src={game.thumbnailUrl}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-4 py-2 rounded-2xl bg-purple-600 text-white font-black text-xs flex items-center space-x-1.5 shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-4 h-4 fill-current" />
            <span>PLAY NOW</span>
          </span>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center space-x-1.5">
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-slate-950/80 backdrop-blur-md text-purple-300 border border-purple-900/40">
              {game.category}
            </span>
            {isPopular && (
              <span className="px-2 py-1 rounded-xl text-[10px] font-extrabold bg-amber-950/90 backdrop-blur-md text-amber-300 border border-amber-500/50 flex items-center space-x-1 shadow-md">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Popular</span>
              </span>
            )}
          </div>

          <button
            onClick={(e) => onToggleFavorite(e, game.id)}
            className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-purple-400 transition-colors pointer-events-auto border border-purple-900/40"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-purple-400 fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-slate-900">
        <div>
          <h3 className="text-base font-extrabold text-white group-hover:text-purple-400 transition-colors truncate">
            {game.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {game.description}
          </p>
        </div>

        <div className="pt-4 mt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1 text-purple-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{game.rating ? game.rating.toFixed(1) : '0.0'}</span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] font-medium">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{(game.plays || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
