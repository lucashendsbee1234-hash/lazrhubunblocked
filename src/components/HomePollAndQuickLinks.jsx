import React, { useState, useEffect } from 'react';
import {
  getStoredPolls,
  getUserVotedOption,
  recordPollVote,
} from '../utils/storage';
import {
  Vote,
  BarChart2,
  Users,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  MessageSquare,
  Bug,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Trophy,
  Award,
  ShoppingBag,
} from 'lucide-react';

export const HomePollAndQuickLinks = ({
  onNavigate,
  onOpenShop,
  onOpenLeaderboard,
  onOpenAchievements,
}) => {
  const [polls, setPolls] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [hasVotedOption, setHasVotedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [voteSuccessMsg, setVoteSuccessMsg] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    const syncPolls = () => {
      const loaded = getStoredPolls();
      setPolls(loaded);
      const active = loaded.find((p) => p.isActive) || loaded[0] || null;
      setActivePoll(active);

      if (active) {
        const votedOpt = getUserVotedOption(active.id);
        if (votedOpt) {
          setHasVotedOption(votedOpt);
          setSelectedOption(votedOpt);
        } else {
          setHasVotedOption(null);
          setSelectedOption('');
        }
      } else {
        setHasVotedOption(null);
        setSelectedOption('');
      }
    };

    syncPolls();

    window.addEventListener('lazrhub_polls_updated', syncPolls);
    return () => window.removeEventListener('lazrhub_polls_updated', syncPolls);
  }, []);

  const handleVote = () => {
    if (!activePoll || !selectedOption || hasVotedOption || isVoting) return;

    setIsVoting(true);
    const updatedPolls = recordPollVote(activePoll.id, selectedOption);
    setPolls(updatedPolls);
    const updatedActive = updatedPolls.find((p) => p.id === activePoll.id);
    setActivePoll(updatedActive);
    setHasVotedOption(selectedOption);
    setIsVoting(false);

    setVoteSuccessMsg(true);
    setTimeout(() => {
      setVoteSuccessMsg(false);
    }, 4000);
  };

  const calculateDaysLeft = (endsAtStr) => {
    if (!endsAtStr) return '7 Days';
    const diff = new Date(endsAtStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} Days` : 'Ending Soon';
  };

  return (
    <section className="w-full my-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: COMMUNITY POLL (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 shadow-2xl shadow-purple-950/30 relative overflow-hidden group">
          {/* Subtle Ambient Glowing Backdrop */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/25 transition-all duration-500" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

          {!activePoll ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Vote className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-white">No Active Community Polls</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                There are currently no active polls. Check back soon or join our Discord to request new poll topics!
              </p>
            </div>
          ) : (
            <>
              <div>
                {/* Header Title Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-purple-900/40 mb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                      <Vote className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-black tracking-wider text-white uppercase flex items-center space-x-2">
                          <span>📊 COMMUNITY POLL</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-widest animate-pulse">
                          LIVE
                        </span>
                      </div>
                      <p className="text-xs text-purple-300/80 font-medium">Shape LazrHub by casting your vote!</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowResultsModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-purple-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 border border-purple-500/30 transition-all shadow-md shrink-0"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Results</span>
                  </button>
                </div>

                {/* Poll Question */}
                <div className="mb-4">
                  <h4 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    {activePoll.question}
                  </h4>
                </div>

                {/* Voting Success Confirmation Banner */}
                {voteSuccessMsg && (
                  <div className="mb-4 p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center space-x-2.5 animate-fadeIn shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                    <span>Your vote has been recorded successfully!</span>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-2.5 mb-5">
                  {activePoll.options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    const isUserVotedThis = hasVotedOption === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={Boolean(hasVotedOption)}
                        onClick={() => setSelectedOption(option.id)}
                        className={`w-full p-3 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group/opt ${
                          isUserVotedThis
                            ? 'bg-purple-900/50 border-purple-400 text-white shadow-lg ring-1 ring-purple-400'
                            : isSelected
                            ? 'bg-purple-950/60 border-purple-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-purple-500/50 hover:bg-slate-900/90 hover:text-white'
                        } ${hasVotedOption ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isUserVotedThis || isSelected
                                ? 'border-purple-400 bg-purple-600 text-white'
                                : 'border-slate-600 group-hover/opt:border-purple-400'
                            }`}
                          >
                            {(isUserVotedThis || isSelected) && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white animate-scaleIn" />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm font-bold truncate">{option.text}</span>
                        </div>

                        {hasVotedOption && (
                          <span className="text-[10px] font-mono font-bold text-purple-300 ml-2 shrink-0">
                            {option.votes.toLocaleString()} votes ({Math.round((option.votes / (activePoll.totalVotes || 1)) * 100)}%)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-3 border-t border-purple-900/30 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 text-[11px] font-medium text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>Votes: <strong className="text-white font-mono">{activePoll.totalVotes.toLocaleString()}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                    <span>Ends: <strong className="text-white">{calculateDaysLeft(activePoll.endsAt)}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedOption || Boolean(hasVotedOption) || isVoting}
                  onClick={handleVote}
                  className={`px-5 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all duration-300 shadow-xl ${
                    hasVotedOption
                      ? 'bg-purple-950/80 border border-purple-500/40 text-purple-300 cursor-not-allowed'
                      : selectedOption
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/40 hover:scale-[1.02] cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {hasVotedOption ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Voted ✓</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-3.5 h-3.5" />
                      <span>Vote</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* CENTER COLUMN: BRAND NEW HUB UI FOR RANKS, BADGES, SHOP (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 shadow-2xl shadow-amber-950/20 relative overflow-hidden group">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />

          <div>
            {/* Center UI Title Bar */}
            <div className="flex items-center space-x-3 pb-4 border-b border-amber-900/40 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950">
                <Trophy className="w-5 h-5 font-black fill-current" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wider text-white uppercase">🏆 REWARDS & HUB</h3>
                <p className="text-xs text-amber-300/80 font-medium">Leaderboards, cosmetics & badges</p>
              </div>
            </div>

            {/* Feature Action Grid */}
            <div className="space-y-3 mb-5">
              {/* Leaderboards & Ranks Button */}
              {onOpenLeaderboard && (
                <button
                  type="button"
                  onClick={onOpenLeaderboard}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-950 to-slate-950 border border-amber-500/40 hover:border-amber-400 text-white font-extrabold text-xs flex items-center justify-between group/hub transition-all duration-300 shadow-md hover:shadow-amber-500/20 hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-black text-xs">Leaderboards & Ranks</span>
                      <span className="block text-[10px] text-amber-400/80 font-medium">Compete for top XP & Coin standings</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400 group-hover/hub:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Achievements & Badges Button */}
              {onOpenAchievements && (
                <button
                  type="button"
                  onClick={onOpenAchievements}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-950 to-slate-950 border border-purple-500/40 hover:border-purple-400 text-white font-extrabold text-xs flex items-center justify-between group/hub transition-all duration-300 shadow-md hover:shadow-purple-500/20 hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-sm">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-black text-xs">Achievements & Badges</span>
                      <span className="block text-[10px] text-purple-300/80 font-medium">Unlock rare badges & profile titles</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover/hub:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Cosmetics Shop Button */}
              {onOpenShop && (
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-slate-950 border border-emerald-500/40 hover:border-emerald-400 text-white font-extrabold text-xs flex items-center justify-between group/hub transition-all duration-300 shadow-md hover:shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-sm">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-black text-xs">Cosmetics & Shop</span>
                      <span className="block text-[10px] text-emerald-300/80 font-medium">Equip custom colors, tags & avatars</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 group-hover/hub:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Perks Footer */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="text-[11px]">Earn +1 Coin every 30s actively on site!</span>
            </div>
            <button
              onClick={onOpenShop}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black text-[10px] hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              SHOP
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK LINKS (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 shadow-2xl shadow-purple-950/30 relative overflow-hidden group">
          {/* Subtle Floating Discord Watermark SVG in Background */}
          <div className="absolute -bottom-8 -right-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
            <svg className="w-44 h-44 text-purple-400 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a73.51,73.51,0,0,0,64.32,0c.87.69,1.76,1.37,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.91-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.48,0,11.62,5.77,11.43,12.74C53.88,60,48.78,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74c6.48,0,11.62,5.77,11.44,12.74C96.13,60,91,65.69,84.69,65.69Z" />
            </svg>
          </div>

          <div>
            {/* Title Bar */}
            <div className="flex items-center space-x-3 pb-4 border-b border-purple-900/40 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wider text-white uppercase">📌 QUICK LINKS</h3>
                <p className="text-xs text-purple-300/80 font-medium">Community hub & support</p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2.5 mb-5">
              {/* Discord Link */}
              <a
                href="https://discord.gg/pjDMucS3Fc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 hover:border-indigo-400 text-white font-extrabold text-xs flex items-center justify-between group/link transition-all duration-300 shadow-md hover:shadow-indigo-600/30 hover:scale-[1.02]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span>💬 Join Discord</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-300 group-hover/link:translate-x-0.5 transition-transform" />
              </a>

              {/* Report Bug Link */}
              <a
                href="https://discordapp.com/channels/1507849685329514667/1507851452071022592"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-pink-500/50 text-slate-200 hover:text-white font-extrabold text-xs flex items-center justify-between group/link transition-all duration-300 shadow-md hover:scale-[1.02]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-pink-950 border border-pink-500/40 flex items-center justify-center text-pink-400">
                    <Bug className="w-4 h-4" />
                  </div>
                  <span>🐞 Report a Bug</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/link:translate-x-0.5 transition-transform" />
              </a>

              {/* FAQ Navigation Button */}
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('/FAQ')}
                className="w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 text-slate-200 hover:text-white font-extrabold text-xs flex items-center justify-between group/link transition-all duration-300 shadow-md hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span>❓ FAQ</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover/link:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Need Help Box */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-900/40 space-y-2">
            <h4 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Need Help?</span>
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">Join our Discord to:</p>
            <ul className="text-[11px] text-slate-300 space-y-1 font-medium pl-1">
              <li className="flex items-center space-x-1.5">
                <span className="text-purple-400">•</span>
                <span>Report bugs & glitches</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-purple-400">•</span>
                <span>Request unblocked games</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-purple-400">•</span>
                <span>Suggest new features</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-purple-400">•</span>
                <span>Get real-time updates</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* RESULTS MODAL WITH ANIMATED PROGRESS BARS */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl p-6 text-white space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                  <BarChart2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Poll Breakdown</h3>
                  <p className="text-xs text-purple-300">{activePoll.totalVotes.toLocaleString()} total votes cast</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowResultsModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-200">{activePoll.question}</h4>

              {activePoll.options.map((option) => {
                const percentage = activePoll.totalVotes > 0
                  ? Math.round((option.votes / activePoll.totalVotes) * 100)
                  : 0;

                return (
                  <div key={option.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white flex items-center space-x-1.5">
                        <span>{option.text}</span>
                        {hasVotedOption === option.id && (
                          <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-black">YOUR VOTE</span>
                        )}
                      </span>
                      <span className="font-mono text-purple-300">
                        {option.votes.toLocaleString()} ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-purple-900/30 flex justify-end">
              <button
                type="button"
                onClick={() => setShowResultsModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
