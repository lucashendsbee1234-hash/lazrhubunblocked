import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Sparkles,
  Gamepad2,
  User,
  MessageSquare,
  Cpu,
  Lock,
  LifeBuoy,
  ChevronDown,
  Copy,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Flame,
  Clock,
  TrendingUp,
  ExternalLink,
  MessageSquarePlus,
  Bug,
  HelpCircle,
  X,
  Check,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Radio,
  Zap,
} from 'lucide-react';
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../data/faqData';
import { LegalModal } from './LegalModal';
import { getStoredFaqs, incrementFaqViews, voteFaqHelpfulness } from '../utils/storage';

// Helper to highlight matching query string inside text
function HighlightedText({ text, query }) {
  if (!query || !query.trim()) return <span>{text}</span>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={index}
            className="bg-purple-500/30 text-purple-200 font-bold px-1 py-0.5 rounded border border-purple-400/40"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}

// Icon mapper for categories
const CATEGORY_ICONS = {
  Sparkles: Sparkles,
  Gamepad2: Gamepad2,
  User: User,
  MessageSquare: MessageSquare,
  Cpu: Cpu,
  Lock: Lock,
  LifeBuoy: LifeBuoy,
};

export const FAQPage = ({ onNavigateHome, siteLogos }) => {
  const [faqs, setFaqs] = useState(() => getStoredFaqs(FAQ_ITEMS));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openItems, setOpenItems] = useState(() => {
    // Check URL hash e.g. #q1
    const hash = window.location.hash.replace('#', '');
    return hash ? [hash] : ['q1'];
  });
  const [popularTab, setPopularTab] = useState('most-viewed');
  const [copiedId, setCopiedId] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Modals state
  const [legalModalType, setLegalModalType] = useState(null); // 'privacy' | 'terms'
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [contactFeedback, setContactFeedback] = useState('');

  const searchInputRef = useRef(null);

  // Sync faqs with localStorage on mount and on custom update event
  useEffect(() => {
    const reloadFaqs = () => {
      setFaqs(getStoredFaqs(FAQ_ITEMS));
    };
    reloadFaqs();

    window.addEventListener('lazrhub_faqs_updated', reloadFaqs);
    return () => window.removeEventListener('lazrhub_faqs_updated', reloadFaqs);
  }, []);

  // 1. Inject JSON-LD FAQ Schema into <head> & SEO tags
  useEffect(() => {
    document.title = 'LazrHub FAQ | Frequently Asked Questions';

    // Set meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Find answers about LazrHub including games, accounts, chat, troubleshooting, privacy, and support.';

    // Inject Open Graph tags
    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.content = 'LazrHub FAQ | Frequently Asked Questions';
    document.head.appendChild(ogTitle);

    const ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    ogDesc.content = 'Find answers to common questions about LazrHub unblocked web arcade.';
    document.head.appendChild(ogDesc);

    // Create JSON-LD FAQ Schema
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'lazrhub-faq-schema';
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      // Cleanup script & meta tags on unmount
      const existingScript = document.getElementById('lazrhub-faq-schema');
      if (existingScript) existingScript.remove();
      if (ogTitle) ogTitle.remove();
      if (ogDesc) ogDesc.remove();
    };
  }, [faqs]);

  // 2. Load stored votes & recently viewed from localStorage
  useEffect(() => {
    try {
      const savedVotes = localStorage.getItem('lazrhub_faq_votes');
      if (savedVotes) setUserVotes(JSON.parse(savedVotes));

      const savedRecent = localStorage.getItem('lazrhub_faq_recently_viewed');
      if (savedRecent) setRecentlyViewed(JSON.parse(savedRecent));
    } catch (e) {
      console.error('Error loading FAQ local state:', e);
    }
  }, []);

  // 3. Keyboard Shortcut '/' listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setShowSuggestions(true);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle accordion open state & increment real views
  const toggleItem = (id) => {
    setOpenItems((prev) => {
      const isOpening = !prev.includes(id);
      if (isOpening) {
        const updatedFaqs = incrementFaqViews(id);
        setFaqs(updatedFaqs);

        // Record in recently viewed
        const item = updatedFaqs.find((q) => q.id === id);
        if (item) {
          setRecentlyViewed((prevRecent) => {
            const filtered = prevRecent.filter((r) => r.id !== id);
            const updated = [item, ...filtered].slice(0, 5);
            localStorage.setItem('lazrhub_faq_recently_viewed', JSON.stringify(updated));
            return updated;
          });
        }
        return [...prev, id];
      } else {
        return prev.filter((item) => item !== id);
      }
    });
  };

  // Vote handler
  const handleVote = (id, voteType) => {
    if (userVotes[id] === voteType) return; // already voted
    const isHelpful = voteType === 'yes';
    const updatedFaqs = voteFaqHelpfulness(id, isHelpful);
    setFaqs(updatedFaqs);

    const newVotes = { ...userVotes, [id]: voteType };
    setUserVotes(newVotes);
    try {
      localStorage.setItem('lazrhub_faq_votes', JSON.stringify(newVotes));
    } catch (e) {
      console.error('Failed to save vote:', e);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = (id, e) => {
    if (e) e.stopPropagation();
    const link = `${window.location.origin}/FAQ#${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Share question
  const handleShare = (item, e) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/FAQ#${item.id}`;
    if (navigator.share) {
      navigator.share({
        title: `LazrHub FAQ: ${item.question}`,
        text: item.answer,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopyLink(item.id);
    }
  };

  // Filtered FAQ Items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return faqs.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!q) return matchesCategory;

      const matchesQ = item.question.toLowerCase().includes(q);
      const matchesA = item.answer.toLowerCase().includes(q);
      const matchesCatName = (
        FAQ_CATEGORIES.find((c) => c.id === item.category)?.name || ''
      ).toLowerCase().includes(q);

      return matchesCategory && (matchesQ || matchesA || matchesCatName);
    });
  }, [faqs, searchQuery, selectedCategory]);

  // Group filtered items by category
  const groupedCategories = useMemo(() => {
    const groups = {};
    FAQ_CATEGORIES.forEach((cat) => {
      const catItems = filteredItems.filter((i) => i.category === cat.id);
      if (catItems.length > 0) {
        groups[cat.id] = {
          category: cat,
          items: catItems,
        };
      }
    });
    return groups;
  }, [filteredItems]);

  // Popular questions selection
  const popularQuestions = useMemo(() => {
    if (popularTab === 'most-viewed') {
      return [...faqs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
    }
    if (popularTab === 'trending') {
      return [...faqs].sort((a, b) => ((b.helpfulYes || 0) - (b.helpfulNo || 0)) - ((a.helpfulYes || 0) - (a.helpfulNo || 0))).slice(0, 4);
    }
    if (popularTab === 'recently-added') {
      return [...faqs].slice().reverse().slice(0, 4);
    }
    return faqs.slice(0, 4);
  }, [faqs, popularTab]);

  // Autocomplete search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return faqs.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [faqs, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden animate-fade-in selection:bg-purple-600 selection:text-white">
      {/* Background Animated Orbs & Floating Particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] animate-pulse" />
        <div className="absolute top-[35%] right-[-5%] w-[450px] h-[450px] rounded-full bg-pink-600/15 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] animate-pulse" style={{ animationDelay: '3s' }} />
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b0764_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={onNavigateHome}
            className="px-4 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-purple-900/50 text-slate-300 hover:text-white font-bold text-xs border border-purple-900/40 backdrop-blur-md flex items-center space-x-2 transition-all transform hover:-translate-x-1 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Return to Arcade Home</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-purple-900/40 text-xs font-bold text-purple-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
            <span>LAZRHUB FAQ CENTER</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-purple-900/50 p-8 sm:p-12 mb-10 shadow-2xl shadow-purple-950/40 overflow-hidden text-center">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <HelpCircle className="w-64 h-64 text-purple-400" />
          </div>

          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider mb-4 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Help & Knowledge Base</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Questions</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Find answers to common questions about LazrHub, games, accounts, live chat, troubleshooting, performance, privacy, and support.
          </p>

          {/* Search Bar Container */}
          <div className="max-w-2xl mx-auto relative z-30">
            <div className="relative flex items-center shadow-2xl shadow-purple-900/30">
              <Search className="w-5 h-5 absolute left-4 text-purple-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search questions, keywords, or features... (Press /)"
                className="w-full pl-12 pr-28 py-4 text-sm font-semibold rounded-2xl bg-slate-950/90 text-white placeholder-slate-400 border-2 border-purple-900/60 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all shadow-inner"
              />

              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-12 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}

              <div className="absolute right-4 flex items-center space-x-1 pointer-events-none">
                <kbd className="px-2 py-1 text-xs font-mono font-bold text-purple-300 bg-slate-900 rounded-lg border border-purple-800/60 shadow">
                  /
                </kbd>
              </div>
            </div>

            {/* Search Autocomplete Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-slate-900 border border-purple-900/60 shadow-2xl overflow-hidden z-50 text-left divide-y divide-slate-800/60 animate-scale-up">
                <div className="p-2 text-[10px] font-bold text-purple-400 uppercase tracking-wider px-4">
                  Suggested Questions ({searchSuggestions.length})
                </div>
                {searchSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    onClick={() => {
                      setSearchQuery(suggestion.question);
                      setShowSuggestions(false);
                      if (!openItems.includes(suggestion.id)) {
                        setOpenItems((prev) => [...prev, suggestion.id]);
                      }
                      // Smooth scroll to card
                      setTimeout(() => {
                        const el = document.getElementById(`faq-card-${suggestion.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    className="p-3 px-4 hover:bg-purple-900/30 cursor-pointer flex items-center justify-between text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <span className="truncate pr-2">{suggestion.question}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800/50 shrink-0">
                      {suggestion.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Count Banner */}
          {searchQuery && (
            <div className="mt-4 text-xs font-bold text-purple-300 flex items-center justify-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-purple-900/50 border border-purple-500/30">
                {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} found
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white underline text-xs"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* FAQ Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-900/40 flex items-center space-x-3 shadow-lg">
            <div className="p-3 rounded-xl bg-purple-900/40 text-purple-400 border border-purple-500/30">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white block">{faqs.length}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Questions</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-900/40 flex items-center space-x-3 shadow-lg">
            <div className="p-3 rounded-xl bg-pink-900/40 text-pink-400 border border-pink-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white block">{FAQ_CATEGORIES.length}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categories</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-900/40 flex items-center space-x-3 shadow-lg">
            <div className="p-3 rounded-xl bg-indigo-900/40 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white block">
                {faqs.reduce((acc, f) => acc + (f.views || 0), 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Views</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-purple-900/40 flex items-center space-x-3 shadow-lg">
            <div className="p-3 rounded-xl bg-emerald-900/40 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-white block">
                {faqs.reduce((acc, f) => acc + (f.helpfulYes || 0), 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Helpful Votes</span>
            </div>
          </div>
        </div>

        {/* Popular Questions Carousel / Tabs Section */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-md border border-purple-900/40 p-6 sm:p-8 mb-10 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400 fill-current" />
                <span>Popular Questions</span>
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                Quick answers to the most queried topics across LazrHub.
              </p>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-purple-900/50 text-xs font-bold">
              <button
                onClick={() => setPopularTab('most-viewed')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  popularTab === 'most-viewed'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Most Viewed
              </button>

              <button
                onClick={() => setPopularTab('trending')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  popularTab === 'trending'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trending
              </button>

              <button
                onClick={() => setPopularTab('recently-added')}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  popularTab === 'recently-added'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recently Added
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularQuestions.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!openItems.includes(item.id)) {
                    setOpenItems((prev) => [...prev, item.id]);
                  }
                  setSelectedCategory('all');
                  const el = document.getElementById(`faq-card-${item.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="p-4 rounded-2xl bg-slate-950/70 hover:bg-purple-900/20 border border-purple-900/40 hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider mb-2">
                    <span className="text-purple-400">{item.category}</span>
                    {item.tag && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                    {item.question}
                  </h3>
                </div>

                <div className="pt-2 border-t border-purple-950 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>{item.views.toLocaleString()} views</span>
                  <ChevronDown className="w-4 h-4 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Viewed Bar */}
        {recentlyViewed.length > 0 && (
          <div className="mb-10 p-4 rounded-2xl bg-slate-900/60 border border-purple-900/30 flex items-center space-x-3 overflow-x-auto custom-scrollbar">
            <span className="text-xs font-black text-purple-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Recently Opened:
            </span>
            <div className="flex items-center space-x-2 shrink-0">
              {recentlyViewed.map((rv) => (
                <button
                  key={rv.id}
                  onClick={() => {
                    if (!openItems.includes(rv.id)) {
                      setOpenItems((prev) => [...prev, rv.id]);
                    }
                    const el = document.getElementById(`faq-card-${rv.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="px-3 py-1 rounded-xl bg-slate-950 border border-purple-900/50 hover:border-purple-500 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center space-x-1.5"
                >
                  <span className="truncate max-w-[160px]">{rv.question}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links Section */}
        <div className="mb-10">
          <h2 className="text-xs font-extrabold text-purple-400 uppercase tracking-widest mb-3">
            Quick Actions & Links
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setShowBugReportModal(true)}
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-purple-900/40 border border-purple-900/40 text-xs font-bold text-purple-200 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <Bug className="w-4 h-4 text-rose-400" />
              <span>Report a Bug</span>
            </button>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeZiD1iZLf-ZJeE85R-X9uypDfmg4Ig46XEvDVRK276XKxnHg/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-purple-900/40 border border-purple-900/40 text-xs font-bold text-purple-200 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
              <span>Request Game</span>
            </a>

            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-purple-900/40 border border-purple-900/40 text-xs font-bold text-purple-200 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              <span>Discord</span>
            </a>

            <button
              onClick={() => setShowContactSupportModal(true)}
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-purple-900/40 border border-purple-900/40 text-xs font-bold text-purple-200 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              <span>Contact Support</span>
            </button>

            <button
              onClick={() => setLegalModalType('privacy')}
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-purple-900/40 border border-purple-900/40 text-xs font-bold text-purple-200 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setLegalModalType('terms')}
              className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-purple-900/40 border border-purple-900/40 text-xs font-bold text-purple-200 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <FileText className="w-4 h-4 text-pink-400" />
              <span>Terms of Service</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-4 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs shrink-0 flex items-center space-x-2 transition-all border ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 scale-105'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-purple-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>All Categories</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-purple-300 font-mono">
              {FAQ_ITEMS.length}
            </span>
          </button>

          {FAQ_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon] || HelpCircle;
            const count = FAQ_ITEMS.filter((i) => i.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs shrink-0 flex items-center space-x-2 transition-all border ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 scale-105'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-purple-900/40'
                }`}
              >
                <Icon className="w-4 h-4 text-purple-300" />
                <span>{cat.name}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-purple-300 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion Sections */}
        {Object.keys(groupedCategories).length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-purple-900/40 max-w-xl mx-auto my-12">
            <HelpCircle className="w-16 h-16 text-purple-400/50 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-white mb-2">No Matching Questions Found</h3>
            <p className="text-xs text-slate-400 mb-6">
              We couldn't find any questions matching "{searchQuery}". Try searching with a different term or browse categories.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="space-y-10 mb-16">
            {Object.values(groupedCategories).map(({ category, items }) => {
              const CategoryIcon = CATEGORY_ICONS[category.icon] || HelpCircle;

              return (
                <section key={category.id} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center space-x-3 pb-2 border-b border-purple-900/40">
                    <div className={`p-2.5 rounded-2xl bg-gradient-to-r ${category.color} text-white shadow-lg ${category.glowColor}`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
                        <span>{category.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-purple-900/40 text-purple-300 border border-purple-800/50">
                          {items.length} {items.length === 1 ? 'question' : 'questions'}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 font-semibold">{category.description}</p>
                    </div>
                  </div>

                  {/* Accordion List for this category */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      const isOpen = openItems.includes(item.id);
                      const myVote = userVotes[item.id];

                      return (
                        <div
                          key={item.id}
                          id={`faq-card-${item.id}`}
                          className={`rounded-2xl transition-all duration-300 border overflow-hidden ${
                            isOpen
                              ? 'bg-slate-900/95 border-purple-500/70 shadow-2xl shadow-purple-900/20 ring-1 ring-purple-500/30'
                              : 'bg-slate-900/60 hover:bg-slate-900/90 border-purple-900/30 hover:border-purple-800/60 shadow-md'
                          }`}
                        >
                          {/* Accordion Question Header */}
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            aria-expanded={isOpen}
                            aria-controls={`faq-answer-${item.id}`}
                            className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-2xl"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                              <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                                <HighlightedText text={item.question} query={searchQuery} />
                              </h3>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {item.tag && (
                                <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800/50">
                                  {item.tag}
                                </span>
                              )}
                              <div
                                className={`p-2 rounded-xl bg-slate-800/80 text-purple-300 transition-transform duration-300 ${
                                  isOpen ? 'rotate-180 bg-purple-600 text-white' : ''
                                }`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </button>

                          {/* Accordion Answer Content */}
                          {isOpen && (
                            <div
                              id={`faq-answer-${item.id}`}
                              role="region"
                              aria-labelledby={`faq-card-${item.id}`}
                              className="px-5 pb-5 pt-2 border-t border-purple-900/30 text-slate-300 text-xs sm:text-sm leading-relaxed animate-fade-in"
                            >
                              <div className="mb-4">
                                <HighlightedText text={item.answer} query={searchQuery} />
                              </div>

                              {/* Accordion Card Actions Bar */}
                              <div className="pt-4 border-t border-purple-950 flex flex-wrap items-center justify-between gap-3 text-xs">
                                {/* Voting Feedback */}
                                <div className="flex items-center space-x-2">
                                  <span className="text-slate-400 font-bold text-[11px]">Was this helpful?</span>
                                  <button
                                    onClick={() => handleVote(item.id, 'yes')}
                                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all border ${
                                      myVote === 'yes'
                                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-purple-900/40'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span>Yes</span>
                                  </button>

                                  <button
                                    onClick={() => handleVote(item.id, 'no')}
                                    className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all border ${
                                      myVote === 'no'
                                        ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-purple-900/40'
                                    }`}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                    <span>No</span>
                                  </button>

                                  {myVote && (
                                    <span className="text-[10px] text-purple-300 font-semibold animate-fade-in">
                                      Thanks for your feedback!
                                    </span>
                                  )}
                                </div>

                                {/* Link & Share Controls */}
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => handleCopyLink(item.id, e)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-purple-300 font-bold flex items-center space-x-1.5 border border-purple-900/40 transition-all"
                                  >
                                    {copiedId === item.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-emerald-400">Link Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Link</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={(e) => handleShare(item, e)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-purple-300 font-bold flex items-center space-x-1.5 border border-purple-900/40 transition-all"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>Share</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Contact Help Section Card */}
        <div className="relative rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 p-8 sm:p-10 mb-12 shadow-2xl text-center overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300 mx-auto flex items-center justify-center shadow-lg">
              <LifeBuoy className="w-6 h-6 text-purple-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Still Need Help?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Can't find the answer you're looking for? Reach out to our active community moderators or submit a request directly to the LazrHub tech team.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Join Discord</span>
              </a>

              <button
                onClick={() => setShowContactSupportModal(true)}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5"
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Contact Support</span>
              </button>

              <button
                onClick={() => setShowBugReportModal(true)}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-purple-300 font-extrabold text-xs border border-purple-900/50 flex items-center space-x-2 transition-all"
              >
                <Bug className="w-4 h-4 text-rose-400" />
                <span>Report Bug</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 pb-12 border-t border-purple-900/40 text-center text-xs text-slate-400 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <button onClick={onNavigateHome} className="hover:text-purple-300 transition-colors">
              Arcade Home
            </button>
            <span>•</span>
            <button onClick={() => setLegalModalType('privacy')} className="hover:text-purple-300 transition-colors">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => setLegalModalType('terms')} className="hover:text-purple-300 transition-colors">
              Terms of Service
            </button>
            <span>•</span>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSeZiD1iZLf-ZJeE85R-X9uypDfmg4Ig46XEvDVRK276XKxnHg/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-300 transition-colors"
            >
              Submit Game
            </a>
          </div>

          <p>© {new Date().getFullYear()} LazrHub Web Arcade. Built for web game discovery and unblocked play.</p>
        </footer>
      </div>

      {/* Legal Privacy & Terms Modal */}
      <LegalModal
        isOpen={Boolean(legalModalType)}
        onClose={() => setLegalModalType(null)}
        type={legalModalType}
      />

      {/* Contact Support Modal */}
      {showContactSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-purple-900/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-amber-400" />
                Contact LazrHub Support
              </h3>
              <button
                onClick={() => setShowContactSupportModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Have a question or request? Send a direct message to our moderation team.
            </p>

            <textarea
              rows={4}
              value={contactFeedback}
              onChange={(e) => setContactFeedback(e.target.value)}
              placeholder="Type your question or issue details here..."
              className="w-full p-3 rounded-2xl bg-slate-950 text-xs font-semibold text-white border border-purple-900/50 focus:border-purple-500 focus:outline-none"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowContactSupportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (contactFeedback.trim()) {
                    alert('Thank you! Your support ticket has been logged and sent to LazrHub admins.');
                    setContactFeedback('');
                    setShowContactSupportModal(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Bug Modal */}
      {showBugReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-purple-900/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-400" />
                Report a Bug or Broken Link
              </h3>
              <button
                onClick={() => setShowBugReportModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Is a game failing to load or showing an iframe error? Describe the issue below so we can fix it.
            </p>

            <textarea
              rows={4}
              value={contactFeedback}
              onChange={(e) => setContactFeedback(e.target.value)}
              placeholder="e.g. Polytrack shows a blank screen on Chrome..."
              className="w-full p-3 rounded-2xl bg-slate-950 text-xs font-semibold text-white border border-purple-900/50 focus:border-purple-500 focus:outline-none"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowBugReportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (contactFeedback.trim()) {
                    alert('Bug report submitted successfully! Thank you for helping keep LazrHub running smoothly.');
                    setContactFeedback('');
                    setShowBugReportModal(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Submit Bug Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
