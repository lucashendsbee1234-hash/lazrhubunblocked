import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  addDoc,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { ACHIEVEMENTS_LIST } from '../data/achievementsData';
import { playCoinSound, playLevelUpSound, playAchievementSound, playPurchaseSound } from './audioEffects';

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'userLogs';
const PURCHASES_COLLECTION = 'purchases';
const FOLLOWERS_COLLECTION = 'followers';
const USER_REPORTS_COLLECTION = 'userReports';

export const getUserDocId = (email) => {
  if (!email) return 'guest_user';
  return 'user_' + String(email).toLowerCase().replace(/[^a-z0-9]/g, '_');
};

// Calculate level and XP progress
// Level 1: 0, Level 2: 150, Level 3: 350, Level 4: 700...
export const getXpForLevel = (level) => {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level, 1.45));
};

export const getLevelFromXp = (totalXp) => {
  let level = 1;
  while (totalXp >= getXpForLevel(level + 1) && level < 100) {
    level++;
  }
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercent,
  };
};

// Default User Profile
export const getDefaultUserProfile = (email, name = 'Gamer', role = 'user') => {
  const docId = getUserDocId(email);
  const formattedEmail = email ? email.toLowerCase() : 'guest@lazrhub.com';
  const handle = formattedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');

  return {
    id: docId,
    email: formattedEmail,
    displayName: name || handle || 'Gamer',
    username: `@${handle || 'gamer'}`,
    userId: docId,
    role: role || (formattedEmail === 'lucas.hendsbee1234@gmail.com' ? 'admin' : 'user'),
    avatarUrl: '🎮', // preset emoji or image URL
    bannerUrl: 'banner_synthwave',
    bio: 'Arcade player on LazrHub! 🎮',
    joinDate: new Date().toISOString(),
    lastOnline: new Date().toISOString(),
    isOnline: true,
    country: 'United States',
    website: '',
    socials: {
      discord: '',
      youtube: '',
      twitch: '',
    },
    privacy: 'public', // public, friends, private

    // Economy & Progression
    coins: 100, // Welcome bonus
    totalCoinsEarned: 100,
    coinsEarnedToday: 0,
    lastCoinResetDate: new Date().toISOString().split('T')[0],
    level: 1,
    xp: 0,

    // Stats
    gamesPlayedCount: 0,
    chatMessagesCount: 0,
    totalPlayTimeMinutes: 0,
    favoriteGameId: '',
    favoritedGameIds: [],
    loginStreak: 1,
    lastLoginDate: new Date().toISOString().split('T')[0],

    // Cosmetics & Inventory
    ownedCosmetics: ['banner_synthwave', 'theme_neon_purple'],
    equippedBorder: null,
    equippedBanner: 'banner_synthwave',
    equippedTheme: 'theme_neon_purple',
    equippedNameColor: null,
    equippedNameEffect: null,
    equippedChatColor: null,
    equippedChatBadge: null,
    equippedChatTitle: null,
    equippedBadges: ['badge_welcome'],

    // Achievements & Social
    achievements: {
      welcome: { unlockedAt: new Date().toISOString() },
    },
    followersCount: 0,
    followingCount: 0,
    followingUserIds: [],
    blockedUserIds: [],

    isBanned: false,
    banReason: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Real-time listener for current user profile
export const subscribeToUserProfile = (email, callback) => {
  if (!email) {
    callback(null);
    return () => {};
  }

  const docId = getUserDocId(email);
  const userRef = doc(db, USERS_COLLECTION, docId);

  return onSnapshot(
    userRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback(data);
      } else {
        // Create initial default profile in Firestore
        const defaultProf = getDefaultUserProfile(email);
        try {
          await setDoc(userRef, defaultProf);
          callback(defaultProf);
        } catch (err) {
          handleFirestoreError(err, 'write', `${USERS_COLLECTION}/${docId}`);
          callback(defaultProf);
        }
      }
    },
    (err) => {
      handleFirestoreError(err, 'get', `${USERS_COLLECTION}/${docId}`);
      callback(getDefaultUserProfile(email));
    }
  );
};

// Update User Profile fields
export const updateUserProfileInDb = async (email, updates) => {
  if (!email) return;
  const docId = getUserDocId(email);
  try {
    const userRef = doc(db, USERS_COLLECTION, docId);
    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, cleanUpdates, { merge: true });
  } catch (err) {
    handleFirestoreError(err, 'write', `${USERS_COLLECTION}/${docId}`);
    throw err;
  }
};

// Award coins and XP securely with daily cap checks
export const awardCoinsAndXpInDb = async (email, { coins = 0, xp = 0, reason = 'Game Reward' }, notifyCallback) => {
  if (!email) return null;
  const docId = getUserDocId(email);
  const userRef = doc(db, USERS_COLLECTION, docId);

  try {
    const snap = await getDoc(userRef);
    let userData = snap.exists() ? snap.data() : getDefaultUserProfile(email);

    const todayStr = new Date().toISOString().split('T')[0];
    let coinsEarnedToday = userData.coinsEarnedToday || 0;
    if (userData.lastCoinResetDate !== todayStr) {
      coinsEarnedToday = 0;
    }

    // Daily Cap Enforcement (5000 coins max/day - cap increased)
    const DAILY_MAX_COINS = 5000;
    const remainingCap = Math.max(0, DAILY_MAX_COINS - coinsEarnedToday);
    const actualCoinsToAward = Math.min(coins, remainingCap);

    const newTotalCoins = (userData.coins || 0) + actualCoinsToAward;
    const newTotalCoinsEarned = (userData.totalCoinsEarned || 0) + actualCoinsToAward;
    const newCoinsEarnedToday = coinsEarnedToday + actualCoinsToAward;

    const newTotalXp = (userData.xp || 0) + xp;
    const oldLevelInfo = getLevelFromXp(userData.xp || 0);
    const newLevelInfo = getLevelFromXp(newTotalXp);

    const leveledUp = newLevelInfo.level > oldLevelInfo.level;

    const updatedProfile = {
      ...userData,
      coins: newTotalCoins,
      totalCoinsEarned: newTotalCoinsEarned,
      coinsEarnedToday: newCoinsEarnedToday,
      lastCoinResetDate: todayStr,
      xp: newTotalXp,
      level: newLevelInfo.level,
      lastOnline: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore
    await setDoc(userRef, updatedProfile, { merge: true });

    // Audio effect & notification
    if (actualCoinsToAward > 0) {
      playCoinSound();
    }
    if (leveledUp) {
      playLevelUpSound();
    }

    // Log transaction
    try {
      await addDoc(collection(db, LOGS_COLLECTION), {
        userEmail: email,
        type: 'reward',
        coinsAwarded: actualCoinsToAward,
        xpAwarded: xp,
        reason,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      // Non-blocking log write
    }

    // Check automatic achievements
    await checkAndUnlockAchievements(email, updatedProfile, notifyCallback);

    if (notifyCallback) {
      notifyCallback({
        coinsAwarded: actualCoinsToAward,
        xpAwarded: xp,
        reason,
        leveledUp,
        newLevel: newLevelInfo.level,
      });
    }

    return {
      coinsAwarded: actualCoinsToAward,
      xpAwarded: xp,
      leveledUp,
      newLevel: newLevelInfo.level,
    };
  } catch (err) {
    handleFirestoreError(err, 'write', `${USERS_COLLECTION}/${docId}`);
  }
};

// Check and unlock achievements
export const checkAndUnlockAchievements = async (email, userProfile, notifyCallback) => {
  if (!email || !userProfile) return;
  const docId = getUserDocId(email);
  const existingAchievements = userProfile.achievements || {};

  const unlockedNow = [];

  for (const ach of ACHIEVEMENTS_LIST) {
    if (existingAchievements[ach.id]) continue; // Already unlocked

    let conditionMet = false;

    switch (ach.id) {
      case 'welcome':
        conditionMet = true;
        break;
      case 'first_game':
        conditionMet = (userProfile.gamesPlayedCount || 0) >= 1;
        break;
      case 'games_10':
        conditionMet = (userProfile.gamesPlayedCount || 0) >= 10;
        break;
      case 'games_25':
        conditionMet = (userProfile.gamesPlayedCount || 0) >= 25;
        break;
      case 'games_100':
        conditionMet = (userProfile.gamesPlayedCount || 0) >= 100;
        break;
      case 'games_200':
        conditionMet = (userProfile.gamesPlayedCount || 0) >= 200;
        break;
      case 'games_500':
        conditionMet = (userProfile.gamesPlayedCount || 0) >= 500;
        break;
      case 'chat_first_msg':
        conditionMet = (userProfile.chatMessagesCount || 0) >= 1;
        break;
      case 'chat_50_msg':
        conditionMet = (userProfile.chatMessagesCount || 0) >= 50;
        break;
      case 'first_friend':
        conditionMet = (userProfile.followingCount || 0) >= 1;
        break;
      case 'first_review':
        conditionMet = Boolean(userProfile.hasReviewedGame);
        break;
      case 'fav_5_games':
        conditionMet = (userProfile.favoritedGameIds || []).length >= 5;
        break;
      case 'coins_1000':
        conditionMet = (userProfile.totalCoinsEarned || 0) >= 1000;
        break;
      case 'coins_5000':
        conditionMet = (userProfile.totalCoinsEarned || 0) >= 5000;
        break;
      case 'coins_10000':
        conditionMet = (userProfile.totalCoinsEarned || 0) >= 10000;
        break;
      case 'coins_20000':
        conditionMet = (userProfile.totalCoinsEarned || 0) >= 20000;
        break;
      case 'profile_complete':
        conditionMet = Boolean(userProfile.bio && userProfile.avatarUrl);
        break;
      case 'streak_7':
        conditionMet = (userProfile.loginStreak || 0) >= 7;
        break;
      case 'streak_14':
        conditionMet = (userProfile.loginStreak || 0) >= 14;
        break;
      case 'streak_30':
        conditionMet = (userProfile.loginStreak || 0) >= 30;
        break;
      case 'shopaholic':
        conditionMet = (userProfile.ownedCosmetics || []).length >= 5;
        break;
      case 'cosmetic_chat_style':
        conditionMet = Boolean(userProfile.equippedChatColor || userProfile.equippedChatBadge || userProfile.equippedChatTitle);
        break;
      case 'lvl_5':
        conditionMet = (userProfile.level || 1) >= 5;
        break;
      case 'veteran':
        conditionMet = (userProfile.level || 1) >= 10;
        break;
      case 'lvl_20':
        conditionMet = (userProfile.level || 1) >= 20;
        break;
      case 'lvl_50':
        conditionMet = (userProfile.level || 1) >= 50;
        break;
      case 'playtime_1h':
        conditionMet = (userProfile.totalPlayTimeMinutes || 0) >= 60;
        break;
      case 'playtime_10h':
        conditionMet = (userProfile.totalPlayTimeMinutes || 0) >= 600;
        break;
      default:
        break;
    }

    if (conditionMet) {
      unlockedNow.push(ach);
    }
  }

  if (unlockedNow.length > 0) {
    playAchievementSound();

    let totalCoins = userProfile.coins || 0;
    let totalXp = userProfile.xp || 0;
    const updatedAchievements = { ...existingAchievements };
    const updatedBadges = [...(userProfile.equippedBadges || [])];

    unlockedNow.forEach((ach) => {
      updatedAchievements[ach.id] = { unlockedAt: new Date().toISOString() };
      totalCoins += ach.coinsReward || 0;
      totalXp += ach.xpReward || 0;
      if (ach.badgeReward && !updatedBadges.includes(ach.badgeReward)) {
        updatedBadges.push(ach.badgeReward);
      }

      if (notifyCallback) {
        notifyCallback({
          type: 'achievement',
          title: `Achievement Unlocked: ${ach.title}`,
          description: `${ach.description} (+${ach.coinsReward} Coins, +${ach.xpReward} XP)`,
          icon: ach.icon,
        });
      }
    });

    const levelInfo = getLevelFromXp(totalXp);

    await setDoc(
      doc(db, USERS_COLLECTION, docId),
      {
        achievements: updatedAchievements,
        equippedBadges: updatedBadges,
        coins: totalCoins,
        xp: totalXp,
        level: levelInfo.level,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
};

// Daily Login Claiming System
export const claimDailyLoginInDb = async (email, notifyCallback) => {
  if (!email) return null;
  const docId = getUserDocId(email);
  const userRef = doc(db, USERS_COLLECTION, docId);

  const snap = await getDoc(userRef);
  const profile = snap.exists() ? snap.data() : getDefaultUserProfile(email);

  const todayStr = new Date().toISOString().split('T')[0];
  if (profile.lastLoginDate === todayStr && profile.claimedToday) {
    return { alreadyClaimed: true };
  }

  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let streak = profile.loginStreak || 1;
  if (profile.lastLoginDate === yesterdayStr) {
    streak = streak + 1;
  } else if (profile.lastLoginDate !== todayStr) {
    streak = 1; // reset streak if missed a day
  }

  if (streak > 7) streak = 1; // cycle back after Day 7

  const REWARD_SCHEDULE = {
    1: 25,
    2: 35,
    3: 50,
    4: 70,
    5: 90,
    6: 110,
    7: 200,
  };

  const coinReward = REWARD_SCHEDULE[streak] || 25;
  const xpReward = coinReward * 2;

  await awardCoinsAndXpInDb(
    email,
    { coins: coinReward, xp: xpReward, reason: `Daily Login Streak (Day ${streak})` },
    notifyCallback
  );

  await setDoc(
    userRef,
    {
      loginStreak: streak,
      lastLoginDate: todayStr,
      claimedToday: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return {
    alreadyClaimed: false,
    streak,
    coinReward,
    xpReward,
  };
};

// Shop Cosmetic Purchase
export const purchaseCosmeticInDb = async (email, item, notifyCallback) => {
  if (!email || !item) return;
  const docId = getUserDocId(email);
  const userRef = doc(db, USERS_COLLECTION, docId);

  const snap = await getDoc(userRef);
  const profile = snap.exists() ? snap.data() : getDefaultUserProfile(email);

  const owned = profile.ownedCosmetics || [];
  if (owned.includes(item.id)) {
    throw new Error('You already own this item!');
  }

  if ((profile.coins || 0) < item.price) {
    throw new Error(`Insufficient LazrCoins! You need ${item.price - (profile.coins || 0)} more coins.`);
  }

  const remainingCoins = (profile.coins || 0) - item.price;
  const updatedOwned = [...owned, item.id];

  playPurchaseSound();

  let autoEquipField = {};
  if (item.category === 'chat_color') autoEquipField.equippedChatColor = item.id;
  else if (item.category === 'chat_badge') autoEquipField.equippedChatBadge = item.id;
  else if (item.category === 'chat_title') autoEquipField.equippedChatTitle = item.id;
  else if (item.category === 'border_static' || item.category === 'border_animated') autoEquipField.equippedBorder = item.id;
  else if (item.category === 'banner') autoEquipField.equippedBanner = item.id;
  else if (item.category === 'theme') autoEquipField.equippedTheme = item.id;
  else if (item.category === 'name_color') autoEquipField.equippedNameColor = item.id;
  else if (item.category === 'avatar' && item.icon) autoEquipField.avatarUrl = item.icon;

  await setDoc(
    userRef,
    {
      coins: remainingCoins,
      ownedCosmetics: updatedOwned,
      ...autoEquipField,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // Log purchase
  try {
    await addDoc(collection(db, PURCHASES_COLLECTION), {
      userEmail: email,
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.category,
      price: item.price,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {}

  if (notifyCallback) {
    notifyCallback({
      type: 'purchase',
      title: 'Purchase Successful!',
      description: `Unlocked "${item.name}" for ${item.price} LazrCoins.`,
      icon: '🛒',
    });
  }

  // Check shopaholic achievement
  const updatedProfile = { ...profile, coins: remainingCoins, ownedCosmetics: updatedOwned };
  await checkAndUnlockAchievements(email, updatedProfile, notifyCallback);

  return updatedProfile;
};

// Real-time Global Leaderboards listener
export const subscribeToLeaderboard = (category = 'level', timeframe = 'all', callback) => {
  const usersRef = collection(db, USERS_COLLECTION);
  let orderField = 'level';
  if (category === 'coins') orderField = 'totalCoinsEarned';
  if (category === 'playtime') orderField = 'totalPlayTimeMinutes';
  if (category === 'games') orderField = 'gamesPlayedCount';
  if (category === 'streak') orderField = 'loginStreak';

  const q = query(usersRef, orderBy(orderField, 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const topUsers = snapshot.docs.map((d, index) => ({
        rank: index + 1,
        docId: d.id,
        ...d.data(),
      }));
      callback(topUsers);
    },
    (err) => {
      handleFirestoreError(err, 'get', USERS_COLLECTION);
      callback([]);
    }
  );
};

// Follow / Unfollow User
export const followUserInDb = async (currentEmail, targetEmail) => {
  if (!currentEmail || !targetEmail || currentEmail === targetEmail) return;

  const currentDocId = getUserDocId(currentEmail);
  const targetDocId = getUserDocId(targetEmail);

  const currentUserRef = doc(db, USERS_COLLECTION, currentDocId);
  const targetUserRef = doc(db, USERS_COLLECTION, targetDocId);

  const currentSnap = await getDoc(currentUserRef);
  if (!currentSnap.exists()) return;
  const currentData = currentSnap.data();

  const following = currentData.followingUserIds || [];
  const isFollowing = following.includes(targetDocId);

  if (isFollowing) {
    // Unfollow
    await updateDoc(currentUserRef, {
      followingUserIds: arrayRemove(targetDocId),
      followingCount: increment(-1),
    });
    await updateDoc(targetUserRef, {
      followersCount: increment(-1),
    });
  } else {
    // Follow
    await updateDoc(currentUserRef, {
      followingUserIds: arrayUnion(targetDocId),
      followingCount: increment(1),
    });
    await updateDoc(targetUserRef, {
      followersCount: increment(1),
    });

    // Check first friend achievement
    const updatedProf = { ...currentData, followingCount: (currentData.followingCount || 0) + 1 };
    await checkAndUnlockAchievements(currentEmail, updatedProf);
  }
};

// Block User
export const blockUserInDb = async (currentEmail, targetEmail) => {
  if (!currentEmail || !targetEmail) return;
  const currentDocId = getUserDocId(currentEmail);
  const targetDocId = getUserDocId(targetEmail);

  await updateDoc(doc(db, USERS_COLLECTION, currentDocId), {
    blockedUserIds: arrayUnion(targetDocId),
  });
};

// Report User
export const reportUserInDb = async (reportData) => {
  try {
    await addDoc(collection(db, USER_REPORTS_COLLECTION), {
      reportedUserEmail: reportData.reportedUserEmail,
      reporterEmail: reportData.reporterEmail,
      reason: reportData.reason || 'Inappropriate profile/behavior',
      details: reportData.details || '',
      timestamp: new Date().toISOString(),
      status: 'pending',
    });
  } catch (e) {
    handleFirestoreError(e, 'write', USER_REPORTS_COLLECTION);
  }
};

// Fetch user profile by email or doc ID
export const getUserProfileByEmail = async (email) => {
  if (!email) return null;
  const docId = getUserDocId(email);
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, docId));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {}
  return getDefaultUserProfile(email);
};

// Increment games played count for a user
export const incrementGamesPlayedInDb = async (email, gameId) => {
  if (!email) return;
  const docId = getUserDocId(email);
  const userRef = doc(db, USERS_COLLECTION, docId);

  try {
    const snap = await getDoc(userRef);
    const profile = snap.exists() ? snap.data() : getDefaultUserProfile(email);

    const updatedCount = (profile.gamesPlayedCount || 0) + 1;
    const updatedProfile = {
      ...profile,
      gamesPlayedCount: updatedCount,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, { gamesPlayedCount: updatedCount, updatedAt: new Date().toISOString() }, { merge: true });

    // Award +5 XP per game played
    await awardCoinsAndXpInDb(email, { coins: 0, xp: 5, reason: 'Game Played XP' });

    // Check game count achievements
    await checkAndUnlockAchievements(email, updatedProfile);
  } catch (err) {
    console.error('Error incrementing games played count:', err);
  }
};

// Increment chat message count for a user & check chat achievements
export const incrementChatMessageCountInDb = async (email) => {
  if (!email) return;
  const docId = getUserDocId(email);
  const userRef = doc(db, USERS_COLLECTION, docId);

  try {
    const snap = await getDoc(userRef);
    const profile = snap.exists() ? snap.data() : getDefaultUserProfile(email);

    const updatedCount = (profile.chatMessagesCount || 0) + 1;
    const updatedProfile = {
      ...profile,
      chatMessagesCount: updatedCount,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(userRef, { chatMessagesCount: updatedCount, updatedAt: new Date().toISOString() }, { merge: true });

    // Award +2 XP per chat message sent
    await awardCoinsAndXpInDb(email, { coins: 0, xp: 2, reason: 'Live Chat Activity' });

    // Check chat achievements
    await checkAndUnlockAchievements(email, updatedProfile);
  } catch (err) {
    console.error('Error incrementing chat message count:', err);
  }
};
