import React, { useEffect, useState } from 'react';
import { Coins, Award, Sparkles, TrendingUp, ShoppingBag, X } from 'lucide-react';

export const CoinAnimationOverlay = ({ notifications = [], onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto relative p-4 rounded-2xl bg-slate-900/95 border border-purple-500/40 shadow-2xl shadow-purple-950/80 backdrop-blur-md text-white flex items-start space-x-3 animate-slideInRight overflow-hidden"
        >
          {/* Animated Glow Accent */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/20 rounded-full blur-xl animate-pulse pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shrink-0 text-xl shadow-lg shadow-amber-500/30">
            {notif.icon || <Coins className="w-5 h-5 text-slate-950 font-bold" />}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-sm font-black text-white flex items-center space-x-1.5 tracking-tight">
              <span>{notif.title || 'Reward Received!'}</span>
            </h4>
            <p className="text-xs text-amber-200/90 font-medium mt-0.5 leading-snug">
              {notif.description || `+${notif.coins} LazrCoins Earned!`}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => onDismiss(notif.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
