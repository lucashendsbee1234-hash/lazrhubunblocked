import React, { useState, useEffect } from 'react';
import {
  Search,
  User,
  Coins,
  Award,
  Sparkles,
  Shield,
  Ban,
  CheckCircle,
  Plus,
  Minus,
  RefreshCw,
  ShoppingBag,
  Clock,
  Flame,
} from 'lucide-react';
import {
  getUserProfileByEmail,
  awardCoinsAndXpInDb,
  updateUserProfileInDb,
  subscribeToLeaderboard,
} from '../utils/userManagement';
import { COSMETIC_ITEMS } from '../data/cosmeticsData';
import { ACHIEVEMENTS_LIST } from '../data/achievementsData';

export const AdminUserEconomyManager = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');

  // Form states for manual adjustments
  const [coinAdjustAmount, setCoinAdjustAmount] = useState(100);
  const [xpAdjustAmount, setXpAdjustAmount] = useState(250);
  const [selectedCosmeticToGrant, setSelectedCosmeticToGrant] = useState(COSMETIC_ITEMS[0]?.id || '');
  const [selectedAchievementToGrant, setSelectedAchievementToGrant] = useState(ACHIEVEMENTS_LIST[0]?.id || '');

  // Load top users as quick select list
  useEffect(() => {
    const unsub = subscribeToLeaderboard('level', 'all', (topUsers) => {
      setUserList(topUsers || []);
      if (topUsers && topUsers.length > 0 && !selectedUser) {
        setSelectedUser(topUsers[0]);
      }
    });
    return () => unsub();
  }, []);

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setIsLoading(true);
    try {
      const profile = await getUserProfileByEmail(searchEmail.trim().toLowerCase());
      if (profile) {
        setSelectedUser(profile);
      } else {
        alert('User profile not found in database.');
      }
    } catch (err) {
      alert('Error fetching user profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantCoins = async (isAdd = true) => {
    if (!selectedUser) return;
    const amount = Number(coinAdjustAmount);
    if (!amount || amount <= 0) return;

    const coinsToGive = isAdd ? amount : -amount;
    try {
      await awardCoinsAndXpInDb(selectedUser.email, {
        coins: coinsToGive,
        xp: 0,
        reason: isAdd ? 'Admin Grant' : 'Admin Deduction',
      });
      setNotice(`Updated coins by ${coinsToGive > 0 ? '+' : ''}${coinsToGive}`);
      setTimeout(() => setNotice(''), 3000);

      // Refresh selected user
      const updated = await getUserProfileByEmail(selectedUser.email);
      setSelectedUser(updated);
    } catch (err) {
      alert('Failed to update coins: ' + err.message);
    }
  };

  const handleGrantXp = async (isAdd = true) => {
    if (!selectedUser) return;
    const amount = Number(xpAdjustAmount);
    if (!amount || amount <= 0) return;

    const xpToGive = isAdd ? amount : -amount;
    try {
      await awardCoinsAndXpInDb(selectedUser.email, {
        coins: 0,
        xp: xpToGive,
        reason: isAdd ? 'Admin XP Grant' : 'Admin XP Deduction',
      });
      setNotice(`Updated XP by ${xpToGive > 0 ? '+' : ''}${xpToGive}`);
      setTimeout(() => setNotice(''), 3000);

      const updated = await getUserProfileByEmail(selectedUser.email);
      setSelectedUser(updated);
    } catch (err) {
      alert('Failed to update XP: ' + err.message);
    }
  };

  const handleGrantCosmetic = async () => {
    if (!selectedUser || !selectedCosmeticToGrant) return;
    const owned = selectedUser.ownedCosmetics || [];
    if (owned.includes(selectedCosmeticToGrant)) {
      alert('User already owns this cosmetic item.');
      return;
    }

    try {
      await updateUserProfileInDb(selectedUser.email, {
        ownedCosmetics: [...owned, selectedCosmeticToGrant],
      });
      setNotice('Cosmetic granted successfully!');
      setTimeout(() => setNotice(''), 3000);

      const updated = await getUserProfileByEmail(selectedUser.email);
      setSelectedUser(updated);
    } catch (err) {
      alert('Failed to grant cosmetic.');
    }
  };

  const handleGrantAchievement = async () => {
    if (!selectedUser || !selectedAchievementToGrant) return;
    const currentAch = selectedUser.achievements || {};
    if (currentAch[selectedAchievementToGrant]) {
      alert('User already unlocked this achievement.');
      return;
    }

    try {
      await updateUserProfileInDb(selectedUser.email, {
        achievements: {
          ...currentAch,
          [selectedAchievementToGrant]: { unlockedAt: new Date().toISOString() },
        },
      });
      setNotice('Achievement granted successfully!');
      setTimeout(() => setNotice(''), 3000);

      const updated = await getUserProfileByEmail(selectedUser.email);
      setSelectedUser(updated);
    } catch (err) {
      alert('Failed to grant achievement.');
    }
  };

  const handleToggleBan = async () => {
    if (!selectedUser) return;
    const newBanState = !selectedUser.isBanned;
    if (
      window.confirm(
        `Are you sure you want to ${newBanState ? 'BAN' : 'UNBAN'} user ${selectedUser.displayName}?`
      )
    ) {
      try {
        await updateUserProfileInDb(selectedUser.email, {
          isBanned: newBanState,
          banReason: newBanState ? 'Admin Ban via Economy Panel' : '',
        });
        setNotice(`User ${newBanState ? 'Banned' : 'Unbanned'} successfully.`);
        setTimeout(() => setNotice(''), 3000);

        const updated = await getUserProfileByEmail(selectedUser.email);
        setSelectedUser(updated);
      } catch (err) {
        alert('Failed to update ban status.');
      }
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Search Header */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchUser} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Search user by email address (e.g. lucas.hendsbee1234@gmail.com)..."
            className="w-full pl-10 pr-24 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
          >
            Search
          </button>
        </form>

        {notice && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-fadeIn">
            {notice}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Select Quick List */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <User className="w-4 h-4 text-purple-400" />
            <span>Registered Users ({userList.length})</span>
          </h4>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {userList.map((usr) => (
              <div
                key={usr.docId || usr.email}
                onClick={() => setSelectedUser(usr)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  selectedUser?.email === usr.email
                    ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h5 className="text-xs font-black text-white truncate">{usr.displayName}</h5>
                  <p className="text-[10px] text-slate-400 truncate">{usr.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-amber-400 block">{usr.coins || 0} C</span>
                  <span className="text-[10px] font-semibold text-purple-300 block">
                    Lvl {usr.level || 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Details & Controls */}
        <div className="lg:col-span-8 space-y-4">
          {selectedUser ? (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-5">
              {/* Selected User Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-500/50 flex items-center justify-center text-2xl shrink-0">
                    {selectedUser.avatarUrl || '🎮'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center space-x-2">
                      <span>{selectedUser.displayName}</span>
                      {selectedUser.isBanned && (
                        <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase">
                          BANNED
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-purple-300/80">{selectedUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleToggleBan}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    selectedUser.isBanned
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  <span>{selectedUser.isBanned ? 'Unban User' : 'Ban User'}</span>
                </button>
              </div>

              {/* Economy Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Give/Remove Coins */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>LazrCoins Management</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Current Balance: {selectedUser.coins || 0} Coins</p>
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="number"
                      value={coinAdjustAmount}
                      onChange={(e) => setCoinAdjustAmount(e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none"
                    />
                    <button
                      onClick={() => handleGrantCoins(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Give</span>
                    </button>
                    <button
                      onClick={() => handleGrantCoins(false)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Take</span>
                    </button>
                  </div>
                </div>

                {/* Give/Remove XP */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>XP & Level Management</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Level {selectedUser.level || 1} ({selectedUser.xp || 0} XP)
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="number"
                      value={xpAdjustAmount}
                      onChange={(e) => setXpAdjustAmount(e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-white outline-none"
                    />
                    <button
                      onClick={() => handleGrantXp(true)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Give XP</span>
                    </button>
                    <button
                      onClick={() => handleGrantXp(false)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Take XP</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grant Cosmetics & Achievements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                    <span>Grant Shop Cosmetic</span>
                  </h4>
                  <select
                    value={selectedCosmeticToGrant}
                    onChange={(e) => setSelectedCosmeticToGrant(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  >
                    {COSMETIC_ITEMS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.price} C)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleGrantCosmetic}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    Grant Cosmetic Item
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Grant Achievement</span>
                  </h4>
                  <select
                    value={selectedAchievementToGrant}
                    onChange={(e) => setSelectedAchievementToGrant(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  >
                    {ACHIEVEMENTS_LIST.map((ach) => (
                      <option key={ach.id} value={ach.id}>
                        {ach.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleGrantAchievement}
                    className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
                  >
                    Unlock Achievement
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs font-medium bg-slate-950/40 rounded-2xl border border-slate-800">
              Select a user from the list or search by email to manage their profile, coins, and achievements.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
