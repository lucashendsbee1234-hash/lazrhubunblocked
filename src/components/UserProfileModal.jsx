import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Coins,
  Award,
  Sparkles,
  Calendar,
  Clock,
  Globe,
  Link as LinkIcon,
  CheckCircle,
  Edit3,
  Share2,
  UserPlus,
  UserMinus,
  Flag,
  Ban,
  Gamepad2,
  Heart,
  Settings,
  Lock,
  MessageSquare,
  Copy,
  ChevronRight,
  Flame,
  Check,
} from 'lucide-react';
import { COSMETIC_ITEMS } from '../data/cosmeticsData';
import { ACHIEVEMENTS_LIST } from '../data/achievementsData';
import {
  updateUserProfileInDb,
  purchaseCosmeticInDb,
  followUserInDb,
  blockUserInDb,
  reportUserInDb,
  getLevelFromXp,
  getUserDocId,
} from '../utils/userManagement';

const AVATAR_PRESETS = [
  { emoji: '🎮', name: 'Controller (Default)', itemId: null },
  { emoji: '🥷', name: 'Cyber Ninja', itemId: 'avatar_cyber_ninja' },
  { emoji: '🐉', name: 'Emerald Dragon', itemId: 'avatar_dragon' },
  { emoji: '🦊', name: 'Mystic Fox', itemId: 'avatar_fox' },
  { emoji: '🤖', name: 'Mech Warrior', itemId: 'avatar_robot' },
  { emoji: '👾', name: 'Pixel Alien', itemId: 'avatar_alien' },
  { emoji: '👑', name: 'Golden Monarch', itemId: 'avatar_crown' },
  { emoji: '⚡', name: 'Cyber Skull', itemId: 'avatar_skull' },
  { emoji: '🐱', name: 'Cyber Cat', itemId: 'avatar_cat' },
];

export const UserProfileModal = ({
  isOpen,
  onClose,
  targetUserProfile,
  currentUser,
  onOpenShop,
  onOpenAchievements,
}) => {
  if (!isOpen || !targetUserProfile) return null;

  const isOwnProfile =
    currentUser &&
    targetUserProfile &&
    String(currentUser.email).toLowerCase() === String(targetUserProfile.email).toLowerCase();

  const [activeTab, setActiveTab] = useState('overview'); // overview, cosmetics, achievements, favorites
  const [isEditing, setIsEditing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState(targetUserProfile.displayName || '');
  const [editUsername, setEditUsername] = useState(targetUserProfile.username || '');
  const [editBio, setEditBio] = useState(targetUserProfile.bio || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(targetUserProfile.avatarUrl || '🎮');
  const [editBannerUrl, setEditBannerUrl] = useState(targetUserProfile.bannerUrl || 'banner_synthwave');
  const [editCountry, setEditCountry] = useState(targetUserProfile.country || '');
  const [editWebsite, setEditWebsite] = useState(targetUserProfile.website || '');
  const [editDiscord, setEditDiscord] = useState(targetUserProfile.socials?.discord || '');
  const [editYoutube, setEditYoutube] = useState(targetUserProfile.socials?.youtube || '');
  const [editTwitch, setEditTwitch] = useState(targetUserProfile.socials?.twitch || '');
  const [editPrivacy, setEditPrivacy] = useState(targetUserProfile.privacy || 'public');
  const [editEquippedChatColor, setEditEquippedChatColor] = useState(targetUserProfile.equippedChatColor || '');
  const [editEquippedChatBadge, setEditEquippedChatBadge] = useState(targetUserProfile.equippedChatBadge || '');
  const [editEquippedChatTitle, setEditEquippedChatTitle] = useState(targetUserProfile.equippedChatTitle || '');

  useEffect(() => {
    if (targetUserProfile) {
      setEditDisplayName(targetUserProfile.displayName || '');
      setEditUsername(targetUserProfile.username || '');
      setEditBio(targetUserProfile.bio || '');
      setEditAvatarUrl(targetUserProfile.avatarUrl || '🎮');
      setEditBannerUrl(targetUserProfile.bannerUrl || 'banner_synthwave');
      setEditCountry(targetUserProfile.country || '');
      setEditWebsite(targetUserProfile.website || '');
      setEditDiscord(targetUserProfile.socials?.discord || '');
      setEditYoutube(targetUserProfile.socials?.youtube || '');
      setEditTwitch(targetUserProfile.socials?.twitch || '');
      setEditPrivacy(targetUserProfile.privacy || 'public');
      setEditEquippedChatColor(targetUserProfile.equippedChatColor || '');
      setEditEquippedChatBadge(targetUserProfile.equippedChatBadge || '');
      setEditEquippedChatTitle(targetUserProfile.equippedChatTitle || '');

      if (currentUser && currentUser.email) {
        const targetDocId = getUserDocId(targetUserProfile.email);
        const following = currentUser.followingUserIds || [];
        setIsFollowing(following.includes(targetDocId));
      }
    }
  }, [targetUserProfile, currentUser]);

  const levelInfo = getLevelFromXp(targetUserProfile.xp || 0);

  // Equipped Cosmetics
  const equippedBorderObj = COSMETIC_ITEMS.find((c) => c.id === targetUserProfile.equippedBorder);
  const equippedBannerObj = COSMETIC_ITEMS.find((c) => c.id === targetUserProfile.equippedBanner);
  const equippedNameColorObj = COSMETIC_ITEMS.find((c) => c.id === targetUserProfile.equippedNameColor || c.id === targetUserProfile.equippedChatColor);

  const ownedItems = targetUserProfile.ownedCosmetics || [];
  const ownedChatColors = COSMETIC_ITEMS.filter((c) => c.category === 'chat_color' && ownedItems.includes(c.id));
  const ownedChatBadges = COSMETIC_ITEMS.filter((c) => c.category === 'chat_badge' && ownedItems.includes(c.id));
  const ownedChatTitles = COSMETIC_ITEMS.filter((c) => c.category === 'chat_title' && ownedItems.includes(c.id));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updates = {
        displayName: editDisplayName.trim(),
        username: editUsername.trim().startsWith('@') ? editUsername.trim() : `@${editUsername.trim()}`,
        bio: editBio.slice(0, 250),
        avatarUrl: editAvatarUrl,
        bannerUrl: editBannerUrl,
        country: editCountry.trim(),
        website: editWebsite.trim(),
        socials: {
          discord: editDiscord.trim(),
          youtube: editYoutube.trim(),
          twitch: editTwitch.trim(),
        },
        privacy: editPrivacy,
        equippedChatColor: editEquippedChatColor || null,
        equippedChatBadge: editEquippedChatBadge || null,
        equippedChatTitle: editEquippedChatTitle || null,
      };
      await updateUserProfileInDb(targetUserProfile.email, updates);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) return alert('Please sign in to follow users.');
    try {
      await followUserInDb(currentUser.email, targetUserProfile.email);
      setIsFollowing(!isFollowing);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}?profile=${encodeURIComponent(targetUserProfile.email)}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleBlock = async () => {
    if (!currentUser) return;
    if (window.confirm(`Are you sure you want to block ${targetUserProfile.displayName}?`)) {
      await blockUserInDb(currentUser.email, targetUserProfile.email);
      alert('User blocked successfully.');
      onClose();
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    await reportUserInDb({
      reportedUserEmail: targetUserProfile.email,
      reporterEmail: currentUser.email,
      reason: reportReason,
    });
    alert('User reported to administrators.');
    setIsReporting(false);
    setReportReason('');
  };

  // Role Badge Styling
  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg shadow-red-950/50">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span>Administrator</span>
          </span>
        );
      case 'moderator':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg shadow-emerald-950/50">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Moderator</span>
          </span>
        );
      case 'premium':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1 shadow-lg shadow-amber-950/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>VIP Premium</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>Gamer</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl shadow-purple-950/80 my-8 text-slate-100 overflow-hidden">
        {/* Banner Section */}
        <div
          className={`h-40 sm:h-48 w-full relative bg-gradient-to-r ${
            equippedBannerObj?.gradient || 'from-purple-900 via-indigo-900 to-slate-900'
          }`}
        >
          {equippedBannerObj?.bgImage && (
            <img
              src={equippedBannerObj.bgImage}
              alt="Banner"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
          )}

          {/* Top Actions */}
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
            <button
              onClick={handleCopyShareLink}
              className="p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-lg"
              title="Share Profile"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-purple-300" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {isOwnProfile ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-purple-600/30 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              currentUser && (
                <button
                  onClick={handleToggleFollow}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-lg ${
                    isFollowing
                      ? 'bg-slate-800 hover:bg-red-950/80 text-slate-200 border border-slate-700'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 text-red-400" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>Follow User</span>
                    </>
                  )}
                </button>
              )
            )}

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Avatar & Header Info */}
        <div className="px-6 sm:px-8 pb-6 relative -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Avatar with Border */}
            <div className="flex items-end space-x-4">
              <div
                className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-950 border-4 border-slate-900 flex items-center justify-center text-4xl sm:text-5xl shrink-0 shadow-2xl overflow-hidden ${
                  equippedBorderObj?.previewCss || ''
                }`}
              >
                {targetUserProfile.avatarUrl?.startsWith('http') ? (
                  <img
                    src={targetUserProfile.avatarUrl}
                    alt={targetUserProfile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{targetUserProfile.avatarUrl || '🎮'}</span>
                )}

                {/* Online Indicator */}
                <div
                  className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md"
                  title="Online Now"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h2
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      equippedNameColorObj?.colorCss || 'text-white'
                    }`}
                  >
                    {targetUserProfile.displayName || 'Gamer'}
                  </h2>
                  {getRoleBadge(targetUserProfile.role)}
                </div>

                <p className="text-xs font-semibold text-purple-300/80 flex items-center space-x-2 mt-0.5">
                  <span>{targetUserProfile.username || '@gamer'}</span>
                  <span>•</span>
                  <span className="text-slate-400">ID: {targetUserProfile.id?.slice(0, 16)}</span>
                </p>
              </div>
            </div>

            {/* Quick Economy Stats Pill */}
            <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300">
                  {targetUserProfile.coins || 0} Coins
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center space-x-2">
                <Flame className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-black text-purple-300">
                  {targetUserProfile.loginStreak || 1}d Streak
                </span>
              </div>
            </div>
          </div>

          {/* Bio section */}
          {targetUserProfile.bio && (
            <p className="mt-4 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
              "{targetUserProfile.bio}"
            </p>
          )}

          {/* Level & XP Progress Bar */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-950/60 border border-purple-900/40">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-black text-[11px]">
                  LVL {levelInfo.level}
                </span>
                <span>Level Progress</span>
              </div>
              <span className="text-purple-300">
                {levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNextLevel} XP ({levelInfo.progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400 transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Overview & Stats
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'achievements'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Achievements ({Object.keys(targetUserProfile.achievements || {}).length})
            </button>
            <button
              onClick={() => setActiveTab('cosmetics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'cosmetics'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Inventory ({targetUserProfile.ownedCosmetics?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-5">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                      <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Games Played</span>
                    </p>
                    <p className="text-xl font-black text-white mt-1">
                      {targetUserProfile.gamesPlayedCount || 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Play Time</span>
                    </p>
                    <p className="text-xl font-black text-white mt-1">
                      {Math.floor((targetUserProfile.totalPlayTimeMinutes || 0) / 60)}h{' '}
                      {(targetUserProfile.totalPlayTimeMinutes || 0) % 60}m
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>Total Earned</span>
                    </p>
                    <p className="text-xl font-black text-white mt-1">
                      {targetUserProfile.totalCoinsEarned || 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Followers</span>
                    </p>
                    <p className="text-xl font-black text-white mt-1">
                      {targetUserProfile.followersCount || 0}
                    </p>
                  </div>
                </div>

                {/* Account Badges & Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold text-white flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span>Account Details</span>
                    </h4>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Member Since:</span>
                      <span className="font-semibold">
                        {new Date(targetUserProfile.joinDate || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Country:</span>
                      <span className="font-semibold">{targetUserProfile.country || 'Global'}</span>
                    </div>
                    {targetUserProfile.website && (
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Website:</span>
                        <a
                          href={targetUserProfile.website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-purple-400 hover:underline truncate max-w-[180px]"
                        >
                          {targetUserProfile.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold text-white flex items-center space-x-1.5">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      <span>Social Media</span>
                    </h4>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Discord:</span>
                      <span className="font-semibold">
                        {targetUserProfile.socials?.discord || 'Not linked'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">YouTube:</span>
                      <span className="font-semibold">
                        {targetUserProfile.socials?.youtube || 'Not linked'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Twitch:</span>
                      <span className="font-semibold">
                        {targetUserProfile.socials?.twitch || 'Not linked'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Non-own profile report/block buttons */}
                {!isOwnProfile && currentUser && (
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      onClick={() => setIsReporting(true)}
                      className="text-xs font-semibold text-slate-400 hover:text-red-400 flex items-center space-x-1"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report User</span>
                    </button>
                    <button
                      onClick={handleBlock}
                      className="text-xs font-semibold text-slate-400 hover:text-red-400 flex items-center space-x-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Block User</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {ACHIEVEMENTS_LIST.map((ach) => {
                  const unlocked = Boolean(targetUserProfile.achievements?.[ach.id]);
                  return (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition-all ${
                        unlocked
                          ? 'bg-purple-950/30 border-purple-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-xl shrink-0">
                        {ach.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-white flex items-center space-x-2">
                          <span>{ach.title}</span>
                          {unlocked && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                              UNLOCKED
                            </span>
                          )}
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">{ach.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-400 block">
                          +{ach.coinsReward} Coins
                        </span>
                        <span className="text-[10px] font-bold text-purple-300 block">
                          +{ach.xpReward} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'cosmetics' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">
                    Owned Cosmetics ({targetUserProfile.ownedCosmetics?.length || 0})
                  </span>
                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenShop();
                      }}
                      className="text-xs font-bold text-purple-400 hover:underline flex items-center space-x-1"
                    >
                      <span>Visit Shop</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {COSMETIC_ITEMS.filter((item) =>
                    (targetUserProfile.ownedCosmetics || []).includes(item.id)
                  ).map((item) => {
                    const isEquipped =
                      targetUserProfile.equippedBorder === item.id ||
                      targetUserProfile.equippedBanner === item.id ||
                      targetUserProfile.equippedTheme === item.id ||
                      targetUserProfile.equippedNameColor === item.id ||
                      targetUserProfile.equippedChatColor === item.id ||
                      targetUserProfile.equippedChatBadge === item.id ||
                      targetUserProfile.equippedChatTitle === item.id ||
                      (item.category === 'avatar' && targetUserProfile.avatarUrl === item.icon);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl bg-slate-950 border text-left transition-all relative ${
                          isEquipped
                            ? 'border-purple-500 ring-2 ring-purple-500/50'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <h5 className="text-xs font-black text-white truncate">{item.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>

                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={async () => {
                              let updateKey = 'equippedBorder';
                              if (item.category === 'banner') updateKey = 'equippedBanner';
                              if (item.category === 'theme') updateKey = 'equippedTheme';
                              if (item.category === 'name_color') updateKey = 'equippedNameColor';
                              if (item.category === 'chat_color') updateKey = 'equippedChatColor';
                              if (item.category === 'chat_badge') updateKey = 'equippedChatBadge';
                              if (item.category === 'chat_title') updateKey = 'equippedChatTitle';
                              if (item.category === 'avatar') {
                                if (item.id === 'unlock_custom_avatar') {
                                  alert('Custom Image Avatar is unlocked! Enter your custom image URL in Edit Profile.');
                                  return;
                                }
                                await updateUserProfileInDb(targetUserProfile.email, {
                                  avatarUrl: isEquipped ? '🎮' : item.icon,
                                });
                                return;
                              }

                              await updateUserProfileInDb(targetUserProfile.email, {
                                [updateKey]: isEquipped ? null : item.id,
                              });
                            }}
                            className={`mt-2 w-full py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isEquipped
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {isEquipped ? 'Equipped (Unequip)' : 'Equip Item'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-purple-900/50 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <span>Edit Profile Settings</span>
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold">
              {/* Preset Avatars */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-300 font-bold">Choose Profile Avatar</label>
                  <span className="text-[10px] font-semibold text-purple-400">Default: 🎮 Controller</span>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {AVATAR_PRESETS.map((preset) => {
                    const isUnlocked =
                      !preset.itemId ||
                      (targetUserProfile.ownedCosmetics || []).includes(preset.itemId) ||
                      targetUserProfile.role === 'admin';
                    const isSelected = editAvatarUrl === preset.emoji;

                    return (
                      <button
                        type="button"
                        key={preset.emoji}
                        onClick={() => {
                          if (isUnlocked) {
                            setEditAvatarUrl(preset.emoji);
                          } else {
                            if (onOpenShop) {
                              setIsEditing(false);
                              onOpenShop();
                            } else {
                              alert(`Unlock the ${preset.name} in the Shop!`);
                            }
                          }
                        }}
                        title={isUnlocked ? preset.name : `${preset.name} (Locked - Shop)`}
                        className={`w-10 h-10 rounded-xl bg-slate-950 border flex items-center justify-center text-xl shrink-0 transition-all relative ${
                          isSelected
                            ? 'border-purple-500 ring-2 ring-purple-500/50 bg-purple-950/40'
                            : isUnlocked
                            ? 'border-slate-800 hover:border-slate-700'
                            : 'border-slate-800/60 opacity-50 hover:opacity-80'
                        }`}
                      >
                        <span>{preset.emoji}</span>
                        {!isUnlocked && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-amber-500/80 text-[9px] flex items-center justify-center text-amber-400">
                            🔒
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image Avatar URL & Unlock (2500 LazrCoins) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-bold flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Custom Image Avatar URL</span>
                  </label>
                  {!((targetUserProfile.ownedCosmetics || []).includes('unlock_custom_avatar') || targetUserProfile.role === 'admin') && (
                    <span className="text-[10px] font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                      2500 LazrCoins Item
                    </span>
                  )}
                </div>

                {((targetUserProfile.ownedCosmetics || []).includes('unlock_custom_avatar') || targetUserProfile.role === 'admin') ? (
                  <div>
                    <input
                      type="text"
                      value={editAvatarUrl || ''}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://i.imgur.com/your-avatar.png"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-white outline-none"
                    />
                    <p className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>Custom Image Avatar Unlocked! Enter any valid image URL.</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="text-slate-400 text-[11px]">
                        <span className="font-bold text-slate-200 block">Custom Avatar Upload Locked</span>
                        <span>Unlock custom image URLs for 2,500 LazrCoins.</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if ((targetUserProfile.coins || 0) < 2500) {
                            if (onOpenShop) {
                              setIsEditing(false);
                              onOpenShop();
                            } else {
                              alert(`You need 2500 LazrCoins to unlock Custom Image Avatars! You currently have ${targetUserProfile.coins || 0} LazrCoins.`);
                            }
                            return;
                          }
                          try {
                            const customItem = COSMETIC_ITEMS.find((c) => c.id === 'unlock_custom_avatar') || {
                              id: 'unlock_custom_avatar',
                              name: 'Custom Image Avatar Unlock',
                              price: 2500,
                              category: 'avatar'
                            };
                            await purchaseCosmeticInDb(currentUser.email, customItem);
                            alert('🎉 Custom Image Avatar unlocked successfully!');
                          } catch (err) {
                            alert('Unlock failed: ' + err.message);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[11px] shadow-md shrink-0"
                      >
                        Unlock (2500 🪙)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Display Name</label>
                  <input
                    type="text"
                    value={editDisplayName || ''}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Username Handle</label>
                  <input
                    type="text"
                    value={editUsername || ''}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">
                  Bio (Max 250 characters)
                </label>
                <textarea
                  value={editBio || ''}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={250}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Country</label>
                  <input
                    type="text"
                    value={editCountry || ''}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold">Website URL</label>
                  <input
                    type="text"
                    value={editWebsite || ''}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-bold">Discord</label>
                  <input
                    type="text"
                    value={editDiscord || ''}
                    onChange={(e) => setEditDiscord(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-bold">YouTube</label>
                  <input
                    type="text"
                    value={editYoutube || ''}
                    onChange={(e) => setEditYoutube(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 text-[11px] font-bold">Twitch</label>
                  <input
                    type="text"
                    value={editTwitch || ''}
                    onChange={(e) => setEditTwitch(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none text-[11px]"
                  />
                </div>
              </div>

              {/* Chat Cosmetics Section */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-900/40 space-y-3">
                <p className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Equipped Chat Cosmetics</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-300 mb-1 text-[11px] font-bold">Chat Name Color</label>
                    <select
                      value={editEquippedChatColor || ''}
                      onChange={(e) => setEditEquippedChatColor(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none text-xs"
                    >
                      <option value="">Default (White)</option>
                      {ownedChatColors.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 text-[11px] font-bold">Chat Badge</label>
                    <select
                      value={editEquippedChatBadge || ''}
                      onChange={(e) => setEditEquippedChatBadge(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none text-xs"
                    >
                      <option value="">None</option>
                      {ownedChatBadges.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 text-[11px] font-bold">Chat Title Tag</label>
                    <select
                      value={editEquippedChatTitle || ''}
                      onChange={(e) => setEditEquippedChatTitle(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none text-xs"
                    >
                      <option value="">None</option>
                      {ownedChatTitles.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">Privacy Settings</label>
                <select
                  value={editPrivacy}
                  onChange={(e) => setEditPrivacy(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                >
                  <option value="public">Public (Everyone can view)</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/30 hover:from-purple-500 hover:to-indigo-500"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {isReporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-red-500/50 text-white">
            <h3 className="text-base font-bold text-red-400 mb-2">
              Report User: {targetUserProfile.displayName}
            </h3>
            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
              <textarea
                value={reportReason || ''}
                onChange={(e) => setReportReason(e.target.value)}
                required
                placeholder="Describe why you are reporting this profile..."
                rows={4}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsReporting(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-red-600 text-white font-bold"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
