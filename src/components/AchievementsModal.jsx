import React, { useState } from 'react';
import { X, Award, CheckCircle, Lock, Coins, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { ACHIEVEMENTS_LIST } from '../data/achievementsData';

export const AchievementsModal = ({ isOpen, onClose, currentUser }) => {
  if (!isOpen) return null;

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, unlocked, locked

  const userAchievements = currentUser?.achievements || {};

  const filteredList = ACHIEVEMENTS_LIST.filter((ach) => {
    if (filterCategory !== 'all' && ach.category !== filterCategory) return false;
    const isUnlocked = Boolean(userAchievements[ach.id]);
    if (filterStatus === 'unlocked' && !isUnlocked) return false;
    if (filterStatus === 'locked' && isUnlocked) return false;
    return true;
  });

  const totalUnlockedCount = Object.keys(userAchievements).length;
  const progressPercent = Math.min(
    100,
    Math.floor((totalUnlockedCount / ACHIEVEMENTS_LIST.length) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl shadow-purple-950/80 my-8 text-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 text-white font-black text-2xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                LazrHub Achievements
              </h2>
              <p className="text-xs text-purple-300/80 font-medium">
                Complete milestones to earn LazrCoins, XP, and Exclusive Badges
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Progress Header */}
        <div className="p-5 bg-purple-950/30 border-b border-purple-900/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span>Overall Completion Progress</span>
            <span className="text-purple-300">
              {totalUnlockedCount} / {ACHIEVEMENTS_LIST.length} Completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Category & Status Filter */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {['all', 'gaming', 'economy', 'progression', 'social', 'special'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                filterStatus === 'all' ? 'text-purple-300 underline' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('unlocked')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                filterStatus === 'unlocked' ? 'text-purple-300 underline' : 'text-slate-400'
              }`}
            >
              Unlocked
            </button>
            <button
              onClick={() => setFilterStatus('locked')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                filterStatus === 'locked' ? 'text-purple-300 underline' : 'text-slate-400'
              }`}
            >
              Locked
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredList.map((ach) => {
            const isUnlocked = Boolean(userAchievements[ach.id]);
            const unlockInfo = userAchievements[ach.id];

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all ${
                  isUnlocked
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  {ach.icon}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-black text-white">{ach.title}</h4>
                    {isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>UNLOCKED</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                  {isUnlocked && unlockInfo?.unlockedAt && (
                    <p className="text-[10px] text-purple-300/70 mt-1">
                      Unlocked on {new Date(unlockInfo.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Rewards */}
                <div className="text-right shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center space-x-1 mb-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{ach.coinsReward} Coins</span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-300 block">
                    +{ach.xpReward} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
