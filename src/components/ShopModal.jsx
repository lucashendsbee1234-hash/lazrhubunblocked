import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Coins,
  Search,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Tag,
  Filter,
  Flame,
  ArrowUpDown,
  Lock,
  History,
} from 'lucide-react';
import { COSMETIC_CATEGORIES, COSMETIC_ITEMS } from '../data/cosmeticsData';
import { purchaseCosmeticInDb, updateUserProfileInDb } from '../utils/userManagement';

export const ShopModal = ({ isOpen, onClose, currentUser, onNotify }) => {
  if (!isOpen) return null;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('popular'); // popular, price_low, price_high, name
  const [filterOwned, setFilterOwned] = useState('all'); // all, unowned, owned
  const [activeTab, setActiveTab] = useState('shop'); // shop, history
  const [confirmItem, setConfirmItem] = useState(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccessItem, setPurchaseSuccessItem] = useState(null);

  const ownedItems = currentUser?.ownedCosmetics || [];
  const coinBalance = currentUser?.coins || 0;

  // Filter items
  const filteredItems = COSMETIC_ITEMS.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    const isOwned = ownedItems.includes(item.id);
    if (filterOwned === 'owned' && !isOwned) return false;
    if (filterOwned === 'unowned' && isOwned) return false;
    return true;
  }).sort((a, b) => {
    if (sortOption === 'price_low') return a.price - b.price;
    if (sortOption === 'price_high') return b.price - a.price;
    if (sortOption === 'name') return a.name.localeCompare(b.name);
    return 0; // default order
  });

  const featuredItem = COSMETIC_ITEMS.find((item) => item.isFeatured) || COSMETIC_ITEMS[0];

  const handlePurchase = async (item) => {
    setPurchaseError('');
    if (!currentUser) {
      setPurchaseError('Please sign in to buy items in the shop.');
      return;
    }
    try {
      await purchaseCosmeticInDb(currentUser.email, item, onNotify);
      setConfirmItem(null);
      setPurchaseSuccessItem(item);
      setTimeout(() => setPurchaseSuccessItem(null), 3000);
    } catch (err) {
      setPurchaseError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl shadow-purple-950/80 my-8 text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 font-black">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                <span>LazrHub Cosmetics Shop</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  SEASON 1
                </span>
              </h2>
              <p className="text-xs text-purple-300/80 font-medium">
                Customize your user profile with borders, themes, banners, & name colors
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Coin Balance Pill */}
            <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2 shadow-inner">
              <Coins className="w-5 h-5 text-amber-400 animate-bounce-slow" />
              <div>
                <span className="text-[10px] text-amber-200/80 font-bold block leading-none">
                  BALANCE
                </span>
                <span className="text-sm font-black text-amber-300 leading-none">
                  {coinBalance} Coins
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="px-6 py-2 bg-purple-950/40 border-b border-purple-900/30 flex items-center justify-between text-xs text-purple-300 font-semibold">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Note: LazrCoins are earned by playing games & daily logins. Refunds are disabled for cosmetic unlocks.</span>
          </div>
        </div>

        {/* Search, Filter & Categories Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cosmetics..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none"
              />
            </div>

            {/* Filters & Sorting */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <select
                value={filterOwned}
                onChange={(e) => setFilterOwned(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 outline-none"
              >
                <option value="all">All Items</option>
                <option value="unowned">Unowned Only</option>
                <option value="owned">Owned Items</option>
              </select>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 outline-none"
              >
                <option value="popular">Popular First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
            {COSMETIC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-purple-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Daily Deal */}
        {selectedCategory === 'all' && !searchQuery && featuredItem && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-2xl bg-slate-950 border-2 border-purple-400 flex items-center justify-center text-3xl shrink-0 ${
                  featuredItem.previewCss || ''
                }`}
              >
                🎮
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                    <Flame className="w-3 h-3 fill-slate-950" />
                    <span>DAILY FEATURED DEAL</span>
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">{featuredItem.name}</h3>
                <p className="text-xs text-purple-200/80">{featuredItem.description}</p>
              </div>
            </div>

            <button
              onClick={() => setConfirmItem(featuredItem)}
              disabled={ownedItems.includes(featuredItem.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 transition-all shadow-lg shrink-0 ${
                ownedItems.includes(featuredItem.id)
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/20'
              }`}
            >
              {ownedItems.includes(featuredItem.id) ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ALREADY OWNED</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>BUY NOW FOR {featuredItem.price} COINS</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Cosmetics Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isOwned = ownedItems.includes(item.id);
            const canAfford = coinBalance >= item.price;

            return (
              <div
                key={item.id}
                className={`group p-4 rounded-2xl bg-slate-950/80 border transition-all flex flex-col justify-between ${
                  isOwned
                    ? 'border-emerald-500/30'
                    : 'border-slate-800 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/40'
                }`}
              >
                <div>
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.category.replace('_', ' ')}
                    </span>
                    {item.tag && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-black">
                        {item.tag}
                      </span>
                    )}
                  </div>

                  {/* Visual Preview Box */}
                  <div className="h-24 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center p-3 relative overflow-hidden my-2">
                    {item.category === 'avatar' && (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-purple-500/50 flex items-center justify-center text-2xl shadow-md">
                          {item.icon || '🎮'}
                        </div>
                        <span className="text-[10px] text-purple-300 font-bold">Avatar Unlock</span>
                      </div>
                    )}

                    {item.category.includes('border') && (
                      <div
                        className={`w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-2xl ${
                          item.previewCss || ''
                        }`}
                      >
                        🎮
                      </div>
                    )}

                    {item.category === 'banner' && (
                      <div
                        className={`w-full h-full rounded-lg bg-gradient-to-r ${item.gradient} flex items-center justify-center text-xs font-bold text-white shadow-inner`}
                      >
                        {item.name} Preview
                      </div>
                    )}

                    {item.category === 'name_color' && (
                      <span className={`text-base font-black ${item.colorCss}`}>
                        Sample User Handle
                      </span>
                    )}

                    {item.category === 'chat_color' && (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <span className={`text-base font-black ${item.colorCss}`}>
                          GamerNickname
                        </span>
                        <span className="text-[10px] text-slate-400">Live Chat Preview</span>
                      </div>
                    )}

                    {item.category === 'chat_badge' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl animate-bounce-slow">{item.icon || '👑'}</span>
                        <span className="text-xs font-bold text-slate-300">Chat Badge</span>
                      </div>
                    )}

                    {item.category === 'chat_title' && (
                      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-500/40">
                        <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white font-black text-[10px]">
                          [{item.titleText || 'TITLE'}]
                        </span>
                        <span className="text-xs font-bold text-white">Gamer</span>
                      </div>
                    )}

                    {item.category === 'badge' && (
                      <div className="text-4xl animate-bounce-slow">{item.icon || '💎'}</div>
                    )}

                    {item.category === 'theme' && (
                      <div className={`p-2 rounded-lg text-xs font-bold border ${item.themeClass}`}>
                        Theme Preview
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-black text-white">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-black text-amber-300">{item.price}</span>
                  </div>

                  {isOwned ? (
                    (() => {
                      const isEquipped =
                        currentUser?.equippedBorder === item.id ||
                        currentUser?.equippedBanner === item.id ||
                        currentUser?.equippedTheme === item.id ||
                        currentUser?.equippedNameColor === item.id ||
                        currentUser?.equippedChatColor === item.id ||
                        currentUser?.equippedChatBadge === item.id ||
                        currentUser?.equippedChatTitle === item.id ||
                        (item.category === 'avatar' && currentUser?.avatarUrl === item.icon);

                      return (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!currentUser?.email) return;
                            let updateKey = 'equippedBorder';
                            if (item.category === 'banner') updateKey = 'equippedBanner';
                            if (item.category === 'theme') updateKey = 'equippedTheme';
                            if (item.category === 'name_color') updateKey = 'equippedNameColor';
                            if (item.category === 'chat_color') updateKey = 'equippedChatColor';
                            if (item.category === 'chat_badge') updateKey = 'equippedChatBadge';
                            if (item.category === 'chat_title') updateKey = 'equippedChatTitle';
                            if (item.category === 'avatar') {
                              if (item.id === 'unlock_custom_avatar') {
                                alert('Custom Image Avatar is unlocked! Go to Edit Profile to set your custom image URL.');
                                return;
                              }
                              await updateUserProfileInDb(currentUser.email, {
                                avatarUrl: isEquipped ? '🎮' : item.icon,
                              });
                              return;
                            }

                            await updateUserProfileInDb(currentUser.email, {
                              [updateKey]: isEquipped ? null : item.id,
                            });
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isEquipped ? 'EQUIPPED' : 'EQUIP'}</span>
                        </button>
                      );
                    })()
                  ) : (
                    <button
                      onClick={() => setConfirmItem(item)}
                      disabled={!canAfford}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>PURCHASE</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl text-slate-100">
            <h3 className="text-lg font-black text-white mb-2">Confirm Cosmetic Unlock</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to unlock <strong className="text-white">{confirmItem.name}</strong> for{' '}
              <span className="text-amber-400 font-bold">{confirmItem.price} LazrCoins</span>?
            </p>

            {purchaseError && (
              <div className="mt-3 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold">
                {purchaseError}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(confirmItem)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/30 hover:brightness-110"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
