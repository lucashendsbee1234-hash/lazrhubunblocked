import React from 'react';
import { X, Shield, FileText, Lock, CheckCircle2 } from 'lucide-react';

export const LegalModal = ({ isOpen, onClose, type = 'privacy' }) => {
  if (!isOpen) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl shadow-purple-950/50 flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-purple-900/40 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-900/40 border border-purple-500/30 text-purple-300">
              {isPrivacy ? <Lock className="w-5 h-5 text-purple-400" /> : <FileText className="w-5 h-5 text-indigo-400" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {isPrivacy ? 'LazrHub Privacy Policy' : 'LazrHub Terms of Service'}
              </h2>
              <p className="text-xs font-semibold text-purple-300">
                Last updated: March 2026 • Effective for all LazrHub visitors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-sm leading-relaxed custom-scrollbar">
          {isPrivacy ? (
            <>
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5 text-purple-300">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  COPPA & GDPR Privacy Commitment
                </p>
                <p>
                  LazrHub is designed to be safe, transparent, and non-intrusive. We do not sell personal data or track your offline browsing habits.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">1. Information We Collect</h3>
                <p className="text-slate-400 text-xs">
                  • <strong>Guest Users:</strong> We collect zero personal identity details. Anonymous telemetry (game launches and search count) is gathered to optimize server performance.<br />
                  • <strong>Registered Accounts:</strong> If you voluntarily create an account, we store your email address and preferred display name strictly for account authentication and favorite synchronization.<br />
                  • <strong>Local Storage:</strong> Your browser’s local storage saves game bookmarks, recent plays, dark mode preferences, and chat handle locally on your device.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">2. How We Use Information</h3>
                <p className="text-slate-400 text-xs">
                  We use aggregated usage data solely to improve game load times, replace broken iframe mirrors, moderate public chat rooms, and rank popular arcade games.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">3. Third-Party Game iFrames</h3>
                <p className="text-slate-400 text-xs">
                  Games hosted on LazrHub are rendered inside sandboxed iFrames. Third-party game developers may use standard HTML5 local storage for game save states.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">4. Your Data Rights</h3>
                <p className="text-slate-400 text-xs">
                  You can clear your local storage at any time via browser settings or request account deletion by contacting support.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5 text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  LazrHub Platform Guidelines
                </p>
                <p>
                  By accessing LazrHub (lazrhub.ink), you agree to adhere to these community terms and unblocked arcade usage guidelines.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">1. Acceptance of Terms</h3>
                <p className="text-slate-400 text-xs">
                  By using LazrHub, you agree to these Terms of Service. If you do not agree with any portion, please refrain from using our web services.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">2. Acceptable Use Policy</h3>
                <p className="text-slate-400 text-xs">
                  • Do not attempt to bypass LazrHub live chat filters or spam public chat channels.<br />
                  • Do not use automated bots to artificially inflate game play metrics or attack site infrastructure.<br />
                  • Maintain respectful interaction with other arcade users and moderators.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">3. Intellectual Property</h3>
                <p className="text-slate-400 text-xs">
                  All game titles, trademarks, and artwork belong to their respective original creators and game developers. LazrHub acts as a web catalog and embed engine for publicly distributed HTML5 web games.
                </p>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">4. Limitation of Liability</h3>
                <p className="text-slate-400 text-xs">
                  LazrHub is provided "as-is" without warranties of uninterrupted availability. We are not liable for temporary service downtime or external game server maintenance.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-purple-900/40 bg-slate-950/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
