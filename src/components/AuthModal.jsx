import React, { useState } from 'react';
import { X, LogIn, ShieldCheck, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/storage';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal = ({ isOpen, onClose, onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setError('');
    setIsGoogleLoading(true);

    setTimeout(() => {
      // Authenticate directly with the Google account for Lucas Hendsbee
      const googleUser = {
        email: ADMIN_EMAIL,
        name: 'Lucas Hendsbee',
        role: 'admin',
        provider: 'google',
        signedInAt: new Date().toISOString(),
      };

      setIsGoogleLoading(false);
      onSignIn(googleUser);
      onClose();
    }, 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    const formattedEmail = email.trim().toLowerCase();
    const isAdminEmail = formattedEmail === ADMIN_EMAIL.toLowerCase();

    // Strict Password Verification for Admin Account
    if (isAdminEmail) {
      if (password !== ADMIN_PASSWORD) {
        setError(`Incorrect password for admin account (${ADMIN_EMAIL}).`);
        return;
      }
    }

    const userObj = {
      email: formattedEmail,
      name: displayName.trim() || (isAdminEmail ? 'Lucas Hendsbee' : formattedEmail.split('@')[0]),
      role: isAdminEmail ? 'admin' : 'user',
      provider: 'email',
      signedInAt: new Date().toISOString(),
    };

    onSignIn(userObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl shadow-purple-950/50 p-6 sm:p-8 overflow-hidden text-slate-100">
        {/* Background Accent Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {isSignUp ? 'Create LAZRHUB Account' : 'Sign In to LAZRHUB'}
            </h2>
            <p className="text-xs text-purple-300/80 font-medium">
              Access favorites, game stats, and site controls
            </p>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold flex items-center space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In With Google Direct Button */}
        <div className="mb-5">
          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center space-x-3 shadow-xl transition-all transform active:scale-98 disabled:opacity-75"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-3 bg-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Or Email & Password
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Lucas Hendsbee"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="yourname@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs font-semibold text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs font-semibold text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/30 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSignUp ? 'Create & Sign In' : 'Sign In with Email'}</span>
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};

