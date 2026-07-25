import React, { useState } from 'react';
import { extractIframeUrl } from '../utils/storage';
import {
  X,
  PlusCircle,
  Gamepad2,
  Trash2,
  Edit3,
  Star,
  Settings,
  UserCheck,
  Megaphone,
  CheckCircle2,
  LogOut,
  Download,
  RotateCcw,
  Tag,
  LayoutGrid,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const AdminPanelModal = ({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
  games,
  onAddGame,
  onUpdateGame,
  onDeleteGame,
  onToggleFeatured,
  announcement,
  onSaveAnnouncement,
  onResetCatalog,
  onResetStats,
  categories,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'add' : 'profile'); // 'add', 'catalog', 'settings', 'profile'
  const [editingGame, setEditingGame] = useState(null);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');
  const [announcementInput, setAnnouncementInput] = useState(announcement || '');
  const [savedNotice, setSavedNotice] = useState('');
  const [deletingGameId, setDeletingGameId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State for Add / Edit Game
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0]?.name || 'Action & Reflex',
    description: '',
    iframeUrl: '',
    thumbnailUrl: '',
    rating: 0,
    plays: 0,
    isFeatured: false,
    tags: 'physics, action, singleplayer',
    author: 'LAZRHUB Admin',
    controls: 'WASD or Arrow keys to play',
  });

  if (!isOpen) return null;

  const showFeedback = (msg) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 3000);
  };

  const handleStartEdit = (game) => {
    setEditingGame(game);
    setFormData({
      title: game.title || '',
      category: game.category || categories[0]?.name || 'Action & Reflex',
      description: game.description || '',
      iframeUrl: game.iframeUrl || '',
      thumbnailUrl: game.thumbnailUrl || '',
      rating: game.rating || 0,
      plays: game.plays || 0,
      isFeatured: !!game.isFeatured,
      tags: Array.isArray(game.tags) ? game.tags.join(', ') : game.tags || '',
      author: game.author || 'LAZRHUB Admin',
      controls: game.controls || 'WASD or Arrow keys to play',
    });
    setActiveTab('add');
  };

  const handleResetForm = () => {
    setEditingGame(null);
    setFormError('');
    setFormData({
      title: '',
      category: categories[0]?.name || 'Action & Reflex',
      description: '',
      iframeUrl: '',
      thumbnailUrl: '',
      rating: 0,
      plays: 0,
      isFeatured: false,
      tags: 'physics, action, singleplayer',
      author: 'LAZRHUB Admin',
      controls: 'WASD or Arrow keys to play',
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    const cleanIframeUrl = extractIframeUrl(formData.iframeUrl);
    if (!formData.title.trim() || !cleanIframeUrl) {
      setFormError('Please fill in at least the Game Title and a valid iFrame Embed Code or URL.');
      return;
    }

    const parsedTags = formData.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const gamePayload = {
      id: editingGame ? editingGame.id : `custom-${Date.now()}`,
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim() || 'Exciting unblocked game on LAZRHUB.',
      iframeUrl: cleanIframeUrl,
      thumbnailUrl:
        formData.thumbnailUrl.trim() ||
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
      rating: editingGame ? (editingGame.rating ?? 0) : (parseFloat(formData.rating) || 0),
      plays: editingGame ? (editingGame.plays ?? 0) : (parseInt(formData.plays) || 0),
      ratingCount: editingGame ? (editingGame.ratingCount ?? 0) : 0,
      ratingSum: editingGame ? (editingGame.ratingSum ?? 0) : 0,
      isFeatured: Boolean(formData.isFeatured),
      tags: parsedTags.length > 0 ? parsedTags : ['action', 'html5'],
      author: formData.author.trim() || 'LAZRHUB Admin',
      controls: formData.controls.trim() || 'WASD or Arrow keys to play.',
    };

    if (editingGame) {
      onUpdateGame(gamePayload);
      showFeedback(`Successfully updated "${gamePayload.title}"!`);
    } else {
      onAddGame(gamePayload);
      showFeedback(`Successfully added "${gamePayload.title}" to LAZRHUB!`);
    }

    handleResetForm();
  };

  const filteredCatalog = games.filter((g) => {
    if (!searchCatalogQuery.trim()) return true;
    const q = searchCatalogQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.id.toLowerCase().includes(q)
    );
  });

  const handleSaveAnnouncementForm = (e) => {
    e.preventDefault();
    onSaveAnnouncement(announcementInput.trim());
    showFeedback('Announcement banner updated successfully!');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(games, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lazrhub_games_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl shadow-purple-950/60 flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-6 border-b border-purple-900/40 bg-slate-950/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {isAdmin ? 'Admin Profile & Site Control' : 'User Account & Profile'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isAdmin ? 'bg-purple-600 text-white' : 'bg-slate-800 text-purple-300'
                  }`}
                >
                  {isAdmin ? 'SUPER ADMIN' : 'MEMBER'}
                </span>
              </div>
              <p className="text-xs text-purple-300/80 font-medium truncate max-w-xs sm:max-w-md">
                Signed in as <span className="font-mono font-bold text-white">{currentUser?.email}</span>
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

        {/* Feedback Banner */}
        {savedNotice && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center space-x-2 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 pt-3 border-b border-purple-900/30 bg-slate-950/40 shrink-0 overflow-x-auto no-scrollbar">
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveTab('add');
                  if (editingGame) handleResetForm();
                }}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap border-b-2 ${
                  activeTab === 'add'
                    ? 'bg-purple-900/30 text-purple-300 border-purple-500'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{editingGame ? 'Edit Game' : 'Add New Game'}</span>
              </button>

              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap border-b-2 ${
                  activeTab === 'catalog'
                    ? 'bg-purple-900/30 text-purple-300 border-purple-500'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Manage Games ({games.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap border-b-2 ${
                  activeTab === 'settings'
                    ? 'bg-purple-900/30 text-purple-300 border-purple-500'
                    : 'text-slate-400 hover:text-slate-200 border-transparent'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Website Control</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'profile'
                ? 'bg-purple-900/30 text-purple-300 border-purple-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{isAdmin ? 'Admin Profile' : 'My Profile'}</span>
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ADD / EDIT GAME */}
          {activeTab === 'add' && (
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl mx-auto">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-500/60 text-red-200 text-xs font-bold flex items-center space-x-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <PlusCircle className="w-4 h-4 text-purple-400" />
                  <span>{editingGame ? `Editing: "${editingGame.title}"` : 'Add a New Game to LAZRHUB'}</span>
                </h3>
                {editingGame && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-purple-400 hover:underline font-bold"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Game Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Subway Surfers, Moto X3M"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-white outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    iFrame Embed Code or Game URL *
                  </label>
                  {formData.iframeUrl && extractIframeUrl(formData.iframeUrl) !== formData.iframeUrl.trim() && (
                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      ✓ iFrame HTML Tag Detected
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  required
                  value={formData.iframeUrl}
                  onChange={(e) => setFormData({ ...formData, iframeUrl: e.target.value })}
                  placeholder={`Paste full HTML snippet, e.g:\n<iframe id="gameframe" src="https://games.pizzaedition.com/harvestsimulator/1/index.html?v=10" allow="..."></iframe>\nOR direct URL: https://...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs font-mono text-purple-300 outline-none resize-y"
                />
                {formData.iframeUrl && (
                  <div className="mt-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-purple-300 flex items-center space-x-2">
                    <span className="font-bold text-slate-400 shrink-0">Extracted URL:</span>
                    <span className="truncate text-purple-200">
                      {extractIframeUrl(formData.iframeUrl) || 'No valid URL detected'}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  You can paste either a full HTML <code className="text-purple-400">&lt;iframe&gt;</code> code snippet or a direct HTTPS URL. LAZRHUB will automatically parse out the game link!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Thumbnail Cover Image URL</label>
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs font-mono text-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of gameplay, objectives, and fun mechanics..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="physics, 3d, racing"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Author / Studio</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Pizza Edition"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Control Instructions</label>
                <input
                  type="text"
                  value={formData.controls}
                  onChange={(e) => setFormData({ ...formData, controls: e.target.value })}
                  placeholder="e.g. WASD or Arrow keys to steer, Spacebar to jump"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isFeaturedCheck"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500"
                />
                <label htmlFor="isFeaturedCheck" className="text-xs font-bold text-purple-300 cursor-pointer">
                  Feature this game in the Top Hero Banner
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                {editingGame && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{editingGame ? 'Save Game Changes' : 'Publish Game to Website'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchCatalogQuery}
                    onChange={(e) => setSearchCatalogQuery(e.target.value)}
                    placeholder="Search catalog games by title or category..."
                    className="w-full px-3.5 py-1.5 rounded-xl bg-slate-900 text-xs text-white border border-purple-900/40 focus:outline-none"
                  />
                </div>
                <div className="text-xs text-slate-400 font-medium px-2">
                  Showing <strong className="text-purple-300">{filteredCatalog.length}</strong> of {games.length} games
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {filteredCatalog.map((game) => (
                  <div
                    key={game.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-purple-900/30 hover:border-purple-600/50 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <img
                        src={game.thumbnailUrl}
                        alt={game.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-white truncate">{game.title}</h4>
                          {game.isFeatured && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                              ★ HERO FEATURED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {game.category} • <span className="text-purple-400">{game.plays} plays</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => onToggleFeatured(game.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          game.isFeatured
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                        }`}
                        title="Toggle Hero Banner Feature"
                      >
                        <Star className={`w-4 h-4 ${game.isFeatured ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleStartEdit(game)}
                        className="p-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 transition-colors"
                        title="Edit Game"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {deletingGameId === game.id ? (
                        <div className="flex items-center space-x-1 bg-red-950/90 p-1 rounded-xl border border-red-500/60 animate-fadeIn shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteGame(game.id);
                              setDeletingGameId(null);
                              showFeedback(`Deleted "${game.title}"`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase transition-all shadow-md"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingGameId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingGameId(game.id)}
                          className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900 text-red-400 hover:text-red-200 transition-colors"
                          title="Delete Game"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: WEBSITE CONTROL */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Live Announcement Banner Setting */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-purple-900/40 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  <span>Site Announcement Banner</span>
                </div>
                <p className="text-xs text-slate-400">
                  Set a custom broadcast message displayed at the top of the LAZRHUB navbar for all visitors.
                </p>
                <form onSubmit={handleSaveAnnouncementForm} className="space-y-3">
                  <input
                    type="text"
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    placeholder="e.g. Welcome Lucas! 6+ games unblocked and fully operational."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-purple-500 outline-none"
                  />
                  <div className="flex justify-end space-x-2">
                    {announcementInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnnouncementInput('');
                          onSaveAnnouncement('');
                          showFeedback('Cleared announcement banner.');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
                      >
                        Clear Banner
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30"
                    >
                      Save Banner
                    </button>
                  </div>
                </form>
              </div>

              {/* Export & Data Backup */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-purple-900/40 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Backup & Data Export</span>
                </div>
                <p className="text-xs text-slate-400">
                  Export the active catalog as a JSON backup file or restore default catalog datasets.
                </p>
                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-900/40 text-xs font-bold text-purple-300 flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download games.json</span>
                  </button>

                  {showResetConfirm ? (
                    <div className="flex items-center space-x-2 bg-red-950/80 p-1.5 rounded-xl border border-red-500/50">
                      <span className="text-xs font-bold text-red-200">Reset default games?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onResetCatalog();
                          setShowResetConfirm(false);
                          showFeedback('Catalog reset to initial default games!');
                        }}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md"
                      >
                        Yes, Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-xs font-bold text-red-300 flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset to Default Games</span>
                      </button>
                      {onResetStats && (
                        <button
                          type="button"
                          onClick={() => {
                            onResetStats();
                            showFeedback('All views and ratings reset to 0!');
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-900/40 text-xs font-bold text-amber-300 flex items-center space-x-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset Views & Ratings (0)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & SIGN OUT */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-6 rounded-3xl bg-slate-950 border border-purple-900/50 shadow-xl space-y-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-600/40 border-2 border-purple-400/50">
                  <UserCheck className="w-10 h-10 text-white" />
                </div>

                <div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 text-xs font-extrabold uppercase mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAdmin ? 'SUPER ADMIN OWNER' : 'LAZRHUB MEMBER'}</span>
                  </div>
                  <h3 className="text-xl font-black text-white">{currentUser?.name || currentUser?.email}</h3>
                  <p className="text-xs font-mono font-bold text-purple-400 mt-0.5">{currentUser?.email}</p>
                  {currentUser?.provider === 'google' && (
                    <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300">
                      Signed in with Google
                    </span>
                  )}
                </div>

                {isAdmin ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-left">
                      <div className="p-2">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Catalog Games</span>
                        <span className="text-base font-black text-purple-300">{games.length}</span>
                      </div>
                      <div className="p-2 border-l border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Plays</span>
                        <span className="text-base font-black text-purple-300">
                          {games.reduce((acc, g) => acc + (g.plays || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 border-l border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Categories</span>
                        <span className="text-base font-black text-purple-300">{categories.length}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-left bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      <span className="text-xs font-bold text-purple-300 block mb-1">Admin Permissions & Privileges</span>
                      <div className="flex items-center space-x-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Add, edit, or delete any game iframe on LAZRHUB</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Feature games on the top Hero Banner</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Publish live site announcement banners</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
                    <span className="font-bold text-purple-300 block">Account Privileges</span>
                    <p>• Save favorite unblocked games to your custom library</p>
                    <p>• Track recently played history across browser sessions</p>
                    <p>• Submit custom game requests to site management</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="w-full py-3 rounded-2xl bg-red-950/60 hover:bg-red-900 border border-red-900/50 text-red-300 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
