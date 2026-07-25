import React from 'react';
import {
  Gamepad2,
  Puzzle,
  Flame,
  Clock,
  Swords,
  Brain,
  Coffee,
  Trophy,
  Users,
  Grid,
  Zap,
  Grid3x3,
  Sparkles,
  Dumbbell,
  Rocket,
  Shield,
  Crosshair,
  Car,
  History,
  Heart,
} from 'lucide-react';

export const CategoryNav = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  showingRecentlyPlayedOnly = false,
  showingFavoritesOnly = false,
  recentlyPlayedCount = 0,
  favoritesCount = 0,
  onSelectRecentlyPlayed,
  onSelectFavorites,
}) => {
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Gamepad2':
      case 'Arcade':
        return <Gamepad2 className="w-4 h-4" />;
      case 'Puzzle':
        return <Puzzle className="w-4 h-4" />;
      case 'Brain':
        return <Brain className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'Clock':
        return <Clock className="w-4 h-4" />;
      case 'Swords':
        return <Swords className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      case 'Trophy':
        return <Trophy className="w-4 h-4" />;
      case 'Users':
        return <Users className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'Grid3X3':
      case 'Grid3x3':
        return <Grid3x3 className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Dumbbell':
        return <Dumbbell className="w-4 h-4" />;
      case 'Rocket':
        return <Rocket className="w-4 h-4" />;
      case 'Shield':
        return <Shield className="w-4 h-4" />;
      case 'Crosshair':
        return <Crosshair className="w-4 h-4" />;
      case 'Car':
        return <Car className="w-4 h-4" />;
      default:
        return <Grid className="w-4 h-4" />;
    }
  };

  const totalCount = Object.values(categoryCounts).reduce(
    (a, b) => a + Number(b),
    0
  );

  return (
    <div className="w-full mb-6 overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center space-x-2 min-w-max">
        {/* All Games Pill */}
        <button
          onClick={() => onSelectCategory('All')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 border ${
            selectedCategory === 'All' && !showingRecentlyPlayedOnly && !showingFavoritesOnly
              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
              : 'bg-slate-900/90 text-slate-300 border-purple-900/40 hover:border-purple-500/50'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>All Games</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'All' && !showingRecentlyPlayedOnly && !showingFavoritesOnly
                ? 'bg-purple-950 text-purple-200'
                : 'bg-slate-950 text-slate-400 border border-purple-900/30'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Recently Played Pill */}
        {onSelectRecentlyPlayed && (
          <button
            onClick={onSelectRecentlyPlayed}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 border ${
              showingRecentlyPlayedOnly
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                : 'bg-slate-900/90 text-slate-300 border-purple-900/40 hover:border-purple-500/50'
            }`}
          >
            <History className="w-4 h-4 text-purple-300" />
            <span>Recently Played</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                showingRecentlyPlayedOnly
                  ? 'bg-purple-950 text-purple-200'
                  : 'bg-slate-950 text-slate-400 border border-purple-900/30'
              }`}
            >
              {recentlyPlayedCount}
            </span>
          </button>
        )}

        {/* Favorites Pill */}
        {onSelectFavorites && (
          <button
            onClick={onSelectFavorites}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 border ${
              showingFavoritesOnly
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                : 'bg-slate-900/90 text-slate-300 border-purple-900/40 hover:border-purple-500/50'
            }`}
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-current text-purple-300' : ''}`} />
            <span>Favorites</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                showingFavoritesOnly
                  ? 'bg-purple-950 text-purple-200'
                  : 'bg-slate-950 text-slate-400 border border-purple-900/30'
              }`}
            >
              {favoritesCount}
            </span>
          </button>
        )}

        {/* Dynamic Genre Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name && !showingRecentlyPlayedOnly && !showingFavoritesOnly;
          const count = categoryCounts[cat.name] || 0;
          const iconKey = cat.icon || cat.iconName;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                  : 'bg-slate-900/90 text-slate-300 border-purple-900/40 hover:border-purple-500/50'
              }`}
            >
              {getCategoryIcon(iconKey)}
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-purple-950 text-purple-200'
                    : 'bg-slate-950 text-slate-400 border border-purple-900/30'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
