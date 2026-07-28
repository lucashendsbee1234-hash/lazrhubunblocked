import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Star, Flame, Gamepad2, MessageSquarePlus, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';

// Seeded pseudo-random generator for deterministic hourly picks
function getSeededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getHourlyFeaturedGames(gamesList, count = 5) {
  if (!gamesList || gamesList.length === 0) return [];
  if (gamesList.length <= count) return [...gamesList];

  // Current hour seed: hours since Unix epoch
  const currentHourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
  
  const pool = [...gamesList];
  const selected = [];
  let seed = currentHourSeed * 1337;

  for (let i = 0; i < count && pool.length > 0; i++) {
    const r = getSeededRandom(seed + i * 31);
    const randomIndex = Math.floor(r * pool.length);
    selected.push(pool.splice(randomIndex, 1)[0]);
  }

  return selected;
}

export const HeroBanner = ({
  games = [],
  featuredGame,
  onPlayGame,
  onExploreClick,
}) => {
  const [currentHour, setCurrentHour] = useState(() => Math.floor(Date.now() / (1000 * 60 * 60)));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch gesture state
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Keep track of hourly changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newHour = Math.floor(Date.now() / (1000 * 60 * 60));
      if (newHour !== currentHour) {
        setCurrentHour(newHour);
        setCurrentIndex(0);
      }
    }, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [currentHour]);

  // Compute 5 featured games for the current hour
  const featuredList = useMemo(() => {
    const hourlyPicks = getHourlyFeaturedGames(games, 5);
    if (hourlyPicks.length > 0) return hourlyPicks;
    if (featuredGame) return [featuredGame];
    return [];
  }, [games, currentHour, featuredGame]);

  // Ensure index remains in bounds
  useEffect(() => {
    if (currentIndex >= featuredList.length && featuredList.length > 0) {
      setCurrentIndex(0);
    }
  }, [featuredList, currentIndex]);

  // Auto-advance slideshow every 5 seconds (paused on hover)
  useEffect(() => {
    if (featuredList.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featuredList.length, isHovered]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + featuredList.length) % featuredList.length);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featuredList.length);
  };

  // Mobile swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Empty state fallback
  if (featuredList.length === 0) {
    return (
      <div className="relative w-full rounded-3xl overflow-hidden mb-8 border border-purple-900/40 shadow-2xl bg-slate-950 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-xl shadow-purple-600/30 bg-black mb-6 flex items-center justify-center">
          <img src="/logo.png" alt="LAZRHUB Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
          WELCOME TO <span className="text-purple-400">LAZRHUB</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mb-6 leading-relaxed">
          The ultimate unblocked web arcade. Request your favorite games to be added to our library!
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSeZiD1iZLf-ZJeE85R-X9uypDfmg4Ig46XEvDVRK276XKxnHg/viewform?usp=publish-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center space-x-2 shadow-xl shadow-purple-600/40 transition-all transform hover:-translate-y-0.5"
        >
          <MessageSquarePlus className="w-5 h-5" />
          <span>REQUEST A GAME NOW</span>
        </a>
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden mb-8 border border-purple-900/40 shadow-2xl bg-slate-950 group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Horizontal Carousel Track */}
      <div
        className="flex transition-transform duration-700 ease-out w-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {featuredList.map((game, idx) => (
          <div
            key={game.id || idx}
            className="w-full shrink-0 relative min-h-[380px] sm:min-h-[440px] flex items-center p-6 sm:p-10 lg:p-12"
          >
            {/* Background Image & Overlays */}
            <div className="absolute inset-0">
              <img
                src={game.thumbnailUrl}
                alt={game.title}
                className="w-full h-full object-cover object-center filter brightness-[0.38] transition-transform duration-1000 scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
            </div>

            {/* Slide Content */}
            <div className="relative z-10 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 border border-purple-400/30">
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-current" />
                  <span>HOURLY SPOTLIGHT</span>
                </span>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Rotates Hourly</span>
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950/80 backdrop-blur-md text-purple-300 border border-purple-800/50 flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 text-purple-400 fill-current" />
                  <span>{game.rating ? game.rating.toFixed(1) : '5.0'}</span>
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-900/40 text-purple-200 border border-purple-700/40">
                  {game.category}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3 drop-shadow-lg leading-tight">
                {game.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 line-clamp-2 sm:line-clamp-3 mb-6 leading-relaxed">
                {game.description || 'Launch this featured arcade game now and start playing instantly on LAZRHUB!'}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onPlayGame(game)}
                  className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center space-x-2 shadow-xl shadow-purple-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>PLAY NOW</span>
                </button>

                <button
                  onClick={onExploreClick}
                  className="px-6 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm backdrop-blur-md border border-purple-900/40 flex items-center space-x-2 transition-all"
                >
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                  <span>BROWSE ALL GAMES</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrow Controls (Visible when multiple games exist) */}
      {featuredList.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Featured Game"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-2xl bg-slate-900/70 hover:bg-purple-600 text-white backdrop-blur-md border border-purple-500/30 shadow-xl transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Featured Game"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-2xl bg-slate-900/70 hover:bg-purple-600 text-white backdrop-blur-md border border-purple-500/30 shadow-xl transition-all opacity-80 hover:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Slideshow Navigation & Progress Indicators */}
          <div className="absolute bottom-4 left-6 sm:left-10 lg:left-12 z-20 flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-purple-900/50 shadow-lg">
            <span className="text-[11px] font-extrabold text-purple-300 font-mono tracking-wider">
              {currentIndex + 1} / {featuredList.length}
            </span>

            <div className="h-3 w-[1px] bg-purple-800/60" />

            <div className="flex items-center space-x-1.5">
              {featuredList.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? 'w-6 bg-purple-500 shadow-sm shadow-purple-500'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
