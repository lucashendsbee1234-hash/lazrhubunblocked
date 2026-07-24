import React from 'react';
import { Gamepad2, Heart, Shield, Code2, Keyboard, MessageSquarePlus } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white block leading-none">
                LAZR<span className="text-amber-500">HUB</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mt-0.5">
                Curated Web iFrame Arcade
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeZiD1iZLf-ZJeE85R-X9uypDfmg4Ig46XEvDVRK276XKxnHg/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl transition-colors border border-emerald-500/20"
            >
              <MessageSquarePlus className="w-4 h-4 text-emerald-500" />
              <span>Request a Game</span>
            </a>

            <span className="flex items-center space-x-1.5 bg-slate-200/60 dark:bg-slate-900 px-3 py-1.5 rounded-xl">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>100% Client-Side Ready</span>
            </span>

            <span className="flex items-center space-x-1.5 bg-slate-200/60 dark:bg-slate-900 px-3 py-1.5 rounded-xl">
              <Code2 className="w-4 h-4 text-indigo-500" />
              <span>JSON iFrame Engine</span>
            </span>

            <span className="flex items-center space-x-1.5 bg-slate-200/60 dark:bg-slate-900 px-3 py-1.5 rounded-xl">
              <Keyboard className="w-4 h-4 text-amber-500" />
              <span>Press / to Search</span>
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} lazrhub. All rights reserved.</p>
          <p className="flex items-center space-x-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            <span>for Web Game Discovery</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
