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
} from 'lucide-react';

export const CategoryNav = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 className="w-4 h-4" />;
      case 'Puzzle':
        return <Puzzle className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'Clock':
        return <Clock className="w-4 h-4" />;
      case 'Swords':
        return <Swords className="w-4 h-4" />;
      case 'Brain':
        return <Brain className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      case 'Trophy':
        return <Trophy className="w-4 h-4" />;
      case 'Users':
        return <Users className="w-4 h-4" />;
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
            selectedCategory === 'All'
              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
              : 'bg-slate-900/90 text-slate-300 border-purple-900/40 hover:border-purple-500/50'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>All Games</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedCategory === 'All'
                ? 'bg-purple-950 text-purple-200'
                : 'bg-slate-950 text-slate-400 border border-purple-900/30'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Dynamic Genre Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const count = categoryCounts[cat.name] || 0;

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
              {getCategoryIcon(cat.icon)}
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
