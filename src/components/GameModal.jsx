import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Heart,
  Star,
  Share2,
  Gamepad2,
  Keyboard,
  Check,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { setUserRating, getStoredUserRatings, extractIframeUrl } from '../utils/storage';

export const GameModal = ({
  game,
  onClose,
  isFavorite,
  onToggleFavorite,
  relatedGames,
  onSelectGame,
  onRateGame,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [userStars, setUserStars] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const modalRef = useRef(null);

  useEffect(() => {
    if (!game) return;
    const ratings = getStoredUserRatings();
    setUserStars(ratings[game.id] || 0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [game?.id, onClose]);

  if (!game) return null;

  const handleRating = (stars) => {
    const previousRating = userStars > 0 ? userStars : null;
    setUserStars(stars);
    setUserRating(game.id, stars);
    if (onRateGame) {
      onRateGame(game.id, stars, previousRating);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error('Exit fullscreen failed', err));
      setIsFullscreen(false);
    }
  };

  const reloadIframe = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in">
      <div
        ref={modalRef}
        className={`relative w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col transition-all duration-300 ${
          isFullscreen ? 'h-screen w-screen max-w-none rounded-none border-none p-0' : isTheater ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Modal Header Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 shrink-0">
              <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-white truncate">{game.title}</h2>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <span className="font-semibold text-purple-400">{game.category}</span>
                <span>•</span>
                <span>By {game.author || 'Web Game Studio'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={reloadIframe}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
              title="Reload Game iFrame"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {!isFullscreen && (
              <button
                onClick={() => setIsTheater(!isTheater)}
                className={`hidden sm:flex px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isTheater ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Toggle Theater Mode"
              >
                Theater
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-xl text-slate-300 transition-colors ${
                isFullscreen ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {!isFullscreen && (
              <button
                onClick={(e) => onToggleFavorite(e, game.id)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                title="Favorite"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'text-purple-400 fill-current' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-red-600/80 rounded-xl text-slate-300 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Game Stage iFrame Container */}
        <div className={`relative w-full bg-slate-950 flex items-center justify-center overflow-hidden ${
          isFullscreen ? 'flex-1 h-full p-0' : 'min-h-[420px] p-2 sm:p-4'
        }`}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold tracking-wider uppercase text-purple-400">
                Loading Game...
              </span>
            </div>
          )}

          <div className={`w-full relative bg-black ${
            isFullscreen ? 'h-full w-full rounded-none border-none' : 'aspect-[16/9] max-h-[620px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl'
          }`}>
            <iframe
              key={iframeKey}
              src={extractIframeUrl(game.iframeUrl) || 'about:blank'}
              title={game.title}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-none"
              allow="autoplay; gamepad; fullscreen; keyboard"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </div>

        {/* Details & Controls Footer - HIDE in Fullscreen Mode */}
        {!isFullscreen && (
          <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Description & Controls */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">
                  About Game
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{game.description}</p>
              </div>

              {/* Controls Scheme */}
              {game.controls && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Keyboard className="w-4 h-4 text-purple-400" />
                    <span>Control Schemes</span>
                  </h3>
                  {Array.isArray(game.controls) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {game.controls.map((ctrl, i) => (
                        <div
                          key={i}
                          className="bg-slate-950 p-2.5 rounded-xl border border-purple-900/30 flex items-center justify-between text-xs"
                        >
                          <span className="font-mono font-bold text-purple-400 bg-slate-900 px-2 py-0.5 rounded border border-purple-900/40">
                            {ctrl.key}
                          </span>
                          <span className="text-slate-300 font-medium">{ctrl.action}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-3 rounded-xl border border-purple-900/30 text-xs text-purple-300 leading-relaxed font-medium">
                      {game.controls}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rating & Share Box */}
            <div className="md:col-span-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Rate This Game
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-400 flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 fill-current text-purple-400" />
                    <span>{game.rating ? game.rating.toFixed(1) : '0.0'}</span>
                    <span className="text-[10px] text-slate-500 font-sans">({game.ratingCount || 0})</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                      title={`Rate ${star} Stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (userStars || Math.round(game.rating || 0))
                            ? 'text-purple-400 fill-current'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  {userStars ? `Your rating: ${userStars} Stars` : 'Click stars to cast live rating'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-purple-400" />
                      <span>Share Game</span>
                    </>
                  )}
                </button>

                {game.iframeUrl && (
                  <a
                    href={game.iframeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center"
                    title="Open Source in New Tab"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Related Games Row */}
          {relatedGames.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                More in {game.category}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedGames.slice(0, 4).map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => onSelectGame(rel)}
                    className="group bg-slate-950 p-2 rounded-xl border border-slate-800/80 hover:border-purple-500/60 flex items-center space-x-2.5 text-left transition-all"
                  >
                    <img
                      src={rel.thumbnailUrl}
                      alt={rel.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white group-hover:text-purple-400 truncate block">
                        {rel.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        ★ {rel.rating ? rel.rating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
