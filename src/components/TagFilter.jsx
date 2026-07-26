import React, { useState } from 'react';
import { Tag, X, ChevronDown, ChevronUp, Flame } from 'lucide-react';

export const TagFilter = ({
  availableTags,
  selectedTags,
  onToggleTag,
  onClearTags,
  tagCounts,
  currentUser,
  onDeleteTag,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const displayedTags = isExpanded ? availableTags : availableTags.slice(0, 10);

  return (
    <div className="w-full mb-8 bg-slate-900/60 p-4 rounded-2xl border border-purple-900/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Filter by Tags ({selectedTags.length} selected)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {selectedTags.length > 0 && (
            <button
              onClick={onClearTags}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Tags</span>
            </button>
          )}

          {availableTags.length > 10 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <span>{isExpanded ? 'Show Less' : `Show All (${availableTags.length})`}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {displayedTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const count = tagCounts[tag] || 0;
          const isPopularTag = tag.toLowerCase() === 'popular';

          return (
            <div
              key={tag}
              className={`inline-flex items-center rounded-xl text-xs font-semibold transition-all border overflow-hidden ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/30'
                  : isPopularTag
                  ? 'bg-amber-950/40 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                  : 'bg-slate-950 text-slate-300 border border-purple-900/40 hover:border-purple-500/50'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleTag(tag)}
                className="px-3 py-1 flex items-center space-x-1.5 focus:outline-none"
              >
                {isPopularTag ? (
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ) : null}
                <span>#{tag}</span>
                <span className="text-[10px] opacity-70 font-mono">({count})</span>
              </button>

              {isAdmin && onDeleteTag && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDeleteTag(tag);
                  }}
                  className="pr-2.5 pl-0.5 py-1 text-slate-400 hover:text-red-400 transition-colors focus:outline-none"
                  title={`Delete tag #${tag}`}
                >
                  <X className="w-3.5 h-3.5 p-0.5 rounded-full hover:bg-red-500/20" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
