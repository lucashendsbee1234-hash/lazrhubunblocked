import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, Coins, Clock, Gamepad2, Award, Shield, User } from 'lucide-react';
import { subscribeToLeaderboard } from '../utils/userManagement';

export const LeaderboardModal = ({ isOpen, onClose, onSelectUser }) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState('level'); // level, coins, playtime, games, streak
  const [timeframe, setTimeframe] = useState('all'); // all, monthly, weekly
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(category, timeframe, (leaderboardUsers) => {
      setUsers(leaderboardUsers || []);
    });
    return () => unsubscribe();
  }, [category, timeframe]);

  const getTrophyIcon = (rank) => {
    if (rank === 1) return <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">🥇</span>;
    if (rank === 2) return <span className="text-2xl drop-shadow-[0_0_8px_rgba(203,213,225,0.8)]">🥈</span>;
    if (rank === 3) return <span className="text-2xl drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]">🥉</span>;
    return <span className="text-xs font-black text-slate-400">#{rank}</span>;
  };

  const getMetricDisplay = (user) => {
    switch (category) {
      case 'coins':
        return `${user.totalCoinsEarned || 0} Coins`;
      case 'playtime':
        return `${Math.floor((user.totalPlayTimeMinutes || 0) / 60)}h ${(user.totalPlayTimeMinutes || 0) % 60}m`;
      case 'games':
        return `${user.gamesPlayedCount || 0} Games`;
      case 'streak':
        return `${user.loginStreak || 1} Days`;
      default:
        return `Level ${user.level || 1} (${user.xp || 0} XP)`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl shadow-purple-950/80 my-8 text-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 font-black">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Global Leaderboards
              </h2>
              <p className="text-xs text-amber-200/80 font-medium">
                Top players ranked live across the entire LazrHub Arcade
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

        {/* Category Selector Tabs */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'level', label: 'Highest Level', icon: Award },
              { id: 'coins', label: 'Most Coins', icon: Coins },
              { id: 'playtime', label: 'Play Time', icon: Clock },
              { id: 'games', label: 'Games Played', icon: Gamepad2 },
              { id: 'streak', label: 'Login Streak', icon: Flame },
            ].map((cat) => {
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    category === cat.id
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['all', 'monthly', 'weekly'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                  timeframe === tf
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Rankings List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5">
          {users.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              No leaderboard entries found for this category yet. Start playing to rank #1!
            </div>
          ) : (
            users.map((user, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={user.docId || idx}
                  onClick={() => onSelectUser && onSelectUser(user)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    rank === 1
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/40'
                      : rank === 2
                      ? 'bg-slate-800/40 border-slate-600/50'
                      : rank === 3
                      ? 'bg-amber-950/20 border-amber-700/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-8 text-center shrink-0 font-bold">{getTrophyIcon(rank)}</div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                      {user.avatarUrl?.startsWith('http') ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user.avatarUrl || '🎮'}</span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate flex items-center space-x-1.5">
                        <span>{user.displayName || 'Gamer'}</span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-600/20 text-purple-300 text-[10px] font-bold">
                          Lvl {user.level || 1}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {user.username || '@gamer'}
                      </p>
                    </div>
                  </div>

                  {/* Metric Result */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-300 block">
                      {getMetricDisplay(user)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
