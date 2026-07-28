import React, { useState } from 'react';
import { Coins, Sparkles, ChevronDown, ChevronUp, Gift } from 'lucide-react';

export const CoinPileWidget = ({
  unclaimedCoins = 0,
  coinTimer = 30,
  onClaim,
  currentUser,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const progressPercent = Math.min(100, Math.max(0, ((30 - coinTimer) / 30) * 100));

  return (
    <div className="fixed bottom-4 left-4 z-40 transition-all duration-300">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`px-3 py-2 rounded-2xl bg-slate-950/95 border flex items-center space-x-2 shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105 ${
            unclaimedCoins > 0
              ? 'border-amber-400 text-amber-300 shadow-amber-500/30 animate-pulse'
              : 'border-purple-900/50 text-slate-300 hover:border-purple-500'
          }`}
          title="Open Coin Vault"
        >
          <div className="relative">
            <Coins className="w-5 h-5 text-amber-400 animate-bounce-slow" />
            {unclaimedCoins > 0 && (
              <span className="absolute -top-1 -right-1.5 px-1 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-black leading-none">
                {unclaimedCoins}
              </span>
            )}
          </div>
          <span className="text-xs font-black">
            +{unclaimedCoins} 🪙 ({coinTimer}s)
          </span>
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      ) : (
        <div className="w-64 p-3.5 rounded-2xl bg-slate-950/95 border border-amber-500/40 shadow-2xl shadow-amber-950/30 backdrop-blur-md space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Coins className="w-4 h-4 animate-bounce-slow" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-400/80 uppercase tracking-wider block leading-none">
                  PASSIVE COIN VAULT
                </span>
                <span className="text-xs font-black text-white block leading-none mt-0.5">
                  +1 Coin / 30 Sec
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              title="Minimize"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Unclaimed Coin Display */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-900/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">UNCLAIMED PILE</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black text-amber-300">+{unclaimedCoins}</span>
                <span className="text-xs text-amber-400 font-bold">Coins</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">NEXT COIN IN</span>
              <span className="text-xs font-mono font-black text-purple-300">{coinTimer}s</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Claim Button */}
          <button
            onClick={onClaim}
            disabled={unclaimedCoins === 0}
            className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              unclaimedCoins > 0
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/30 animate-pulse'
                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>
              {unclaimedCoins > 0 ? `CLAIM ${unclaimedCoins} COINS NOW` : `WAITING FOR COINS... (${coinTimer}s)`}
            </span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
