import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import defaultGames from '../data/games.json';
import { autoTagGame } from './autoTagger';

const firebaseConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || '(default)');

const GAMES_COLLECTION = 'games';
const SETTINGS_COLLECTION = 'siteSettings';
const ANNOUNCEMENT_DOC = 'globalAnnouncement';
const LOGOS_DOC = 'siteLogos';
const DELETED_TAGS_DOC = 'deletedTags';

export const handleFirestoreError = (error, operationType, path) => {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
};

// Subscribe to real-time updates for games list across all connected users
export const subscribeToGames = (callback) => {
  const gamesRef = collection(db, GAMES_COLLECTION);
  
  return onSnapshot(
    gamesRef,
    async (snapshot) => {
      if (snapshot.empty) {
        callback(defaultGames);
        await seedDefaultGames();
      } else {
        const gamesList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        callback(gamesList);
      }
    },
    (err) => {
      handleFirestoreError(err, 'list', GAMES_COLLECTION);
      callback(defaultGames);
    }
  );
};

// Seed default games from games.json to Firestore
export const seedDefaultGames = async () => {
  try {
    for (const g of defaultGames) {
      const tagged = {
        ...g,
        tags: autoTagGame(g),
      };
      await setDoc(doc(db, GAMES_COLLECTION, g.id), tagged, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, 'write', GAMES_COLLECTION);
  }
};

// Add or update a game in Firestore (preserves existing views and rating stats)
export const saveGameToDb = async (gameData) => {
  try {
    const id = gameData.id || `game-${Date.now()}`;
    const gameRef = doc(db, GAMES_COLLECTION, id);
    const existingSnap = await getDoc(gameRef);

    let cleanGame;
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      cleanGame = {
        ...existingData,
        ...gameData,
        plays: existingData.plays ?? gameData.plays ?? 0,
        rating: existingData.rating ?? gameData.rating ?? 0,
        ratingCount: existingData.ratingCount ?? gameData.ratingCount ?? 0,
        ratingSum: existingData.ratingSum ?? gameData.ratingSum ?? 0,
        id,
        updatedAt: new Date().toISOString(),
      };
    } else {
      cleanGame = {
        plays: 0,
        rating: 0,
        ratingCount: 0,
        ratingSum: 0,
        ...gameData,
        id,
        updatedAt: new Date().toISOString(),
      };
    }

    cleanGame.tags = autoTagGame(cleanGame);

    await setDoc(gameRef, cleanGame, { merge: true });
    return cleanGame;
  } catch (err) {
    handleFirestoreError(err, 'write', `${GAMES_COLLECTION}/${gameData?.id}`);
    throw err;
  }
};

// Delete a game from Firestore (removes for everyone)
export const deleteGameFromDb = async (gameId) => {
  try {
    await deleteDoc(doc(db, GAMES_COLLECTION, gameId));
  } catch (err) {
    handleFirestoreError(err, 'delete', `${GAMES_COLLECTION}/${gameId}`);
    throw err;
  }
};

// Reset games catalog to defaults in Firestore
export const resetGamesDbToDefaults = async () => {
  try {
    const gamesRef = collection(db, GAMES_COLLECTION);
    const snapshot = await getDocs(gamesRef);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, GAMES_COLLECTION, d.id));
    }
    await seedDefaultGames();
  } catch (err) {
    handleFirestoreError(err, 'write', GAMES_COLLECTION);
    throw err;
  }
};

// Subscribe to real-time site announcement
export const subscribeToAnnouncement = (callback) => {
  const settingsRef = doc(db, SETTINGS_COLLECTION, ANNOUNCEMENT_DOC);
  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().text || '');
      } else {
        callback('');
      }
    },
    (err) => {
      handleFirestoreError(err, 'get', `${SETTINGS_COLLECTION}/${ANNOUNCEMENT_DOC}`);
      callback('');
    }
  );
};

// Save announcement to Firestore
export const saveAnnouncementToDb = async (text) => {
  try {
    await setDoc(
      doc(db, SETTINGS_COLLECTION, ANNOUNCEMENT_DOC),
      { text: text || '', updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, 'write', `${SETTINGS_COLLECTION}/${ANNOUNCEMENT_DOC}`);
  }
};

// Subscribe to real-time site profile pictures / logos
export const subscribeToSiteLogos = (callback) => {
  const settingsRef = doc(db, SETTINGS_COLLECTION, LOGOS_DOC);
  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          headerLogo: data.headerLogo || '/logo.png',
          footerLogo: data.footerLogo || '/logo.png',
        });
      } else {
        callback({
          headerLogo: '/logo.png',
          footerLogo: '/logo.png',
        });
      }
    },
    (err) => {
      handleFirestoreError(err, 'get', `${SETTINGS_COLLECTION}/${LOGOS_DOC}`);
      callback({
        headerLogo: '/logo.png',
        footerLogo: '/logo.png',
      });
    }
  );
};

// Save site profile pictures / logos to Firestore
export const saveSiteLogosToDb = async (logos) => {
  try {
    await setDoc(
      doc(db, SETTINGS_COLLECTION, LOGOS_DOC),
      {
        headerLogo: logos.headerLogo || '/logo.png',
        footerLogo: logos.footerLogo || '/logo.png',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, 'write', `${SETTINGS_COLLECTION}/${LOGOS_DOC}`);
  }
};

// Subscribe to real-time deleted tags list
export const subscribeToDeletedTags = (callback) => {
  const tagsRef = doc(db, SETTINGS_COLLECTION, DELETED_TAGS_DOC);
  return onSnapshot(
    tagsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().tags || []);
      } else {
        callback([]);
      }
    },
    (err) => {
      handleFirestoreError(err, 'get', `${SETTINGS_COLLECTION}/${DELETED_TAGS_DOC}`);
      callback([]);
    }
  );
};

// Delete tag in Firestore across all games and save to deletedTags settings
export const deleteTagInDb = async (tagToDelete) => {
  if (!tagToDelete) return;
  try {
    // 1. Save to deletedTags list in siteSettings
    const tagsRef = doc(db, SETTINGS_COLLECTION, DELETED_TAGS_DOC);
    const snap = await getDoc(tagsRef);
    let existingDeleted = [];
    if (snap.exists()) {
      existingDeleted = snap.data().tags || [];
    }
    if (!existingDeleted.includes(tagToDelete)) {
      await setDoc(tagsRef, { tags: [...existingDeleted, tagToDelete] }, { merge: true });
    }

    // 2. Remove tag from all existing games in Firestore
    const gamesRef = collection(db, GAMES_COLLECTION);
    const snapshot = await getDocs(gamesRef);
    for (const d of snapshot.docs) {
      const gData = d.data();
      if (gData.tags && Array.isArray(gData.tags) && gData.tags.includes(tagToDelete)) {
        const updatedTags = gData.tags.filter((t) => t !== tagToDelete);
        await updateDoc(doc(db, GAMES_COLLECTION, d.id), { tags: updatedTags });
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'write', `${SETTINGS_COLLECTION}/${DELETED_TAGS_DOC}`);
    throw err;
  }
};

// Increment play/view count in Firestore live for all users
export const recordGamePlayInDb = async (gameId) => {
  if (!gameId) return;
  try {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    await setDoc(
      gameRef,
      {
        plays: increment(1),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, 'write', `${GAMES_COLLECTION}/${gameId}`);
  }
};

// Reset all game stats (views/plays and ratings) to 0 in Firestore
export const resetAllGameStatsInDb = async () => {
  try {
    const gamesRef = collection(db, GAMES_COLLECTION);
    const snapshot = await getDocs(gamesRef);
    for (const d of snapshot.docs) {
      await setDoc(
        doc(db, GAMES_COLLECTION, d.id),
        {
          plays: 0,
          rating: 0,
          ratingCount: 0,
          ratingSum: 0,
        },
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, 'write', GAMES_COLLECTION);
  }
};

// Rate a game in Firestore live for all users (prevents vote manipulation/duplicate counting)
export const rateGameInDb = async (gameId, starRating, previousRating = null) => {
  if (!gameId || !starRating) return;
  try {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const gameSnap = await getDoc(gameRef);
    if (gameSnap.exists()) {
      const data = gameSnap.data();
      const currentCount = typeof data.ratingCount === 'number' ? data.ratingCount : 0;
      const currentSum = typeof data.ratingSum === 'number' ? data.ratingSum : 0;

      let newCount = currentCount;
      let newSum = currentSum;

      if (previousRating && previousRating > 0) {
        // User is updating their existing rating
        newSum = Math.max(0, currentSum - previousRating + starRating);
      } else {
        // First vote from this device/user
        newCount = currentCount + 1;
        newSum = currentSum + starRating;
      }

      const newRating = newCount > 0 ? Number((newSum / newCount).toFixed(1)) : starRating;

      await setDoc(
        gameRef,
        {
          rating: newRating,
          ratingCount: newCount,
          ratingSum: newSum,
        },
        { merge: true }
      );
      return { rating: newRating, ratingCount: newCount, ratingSum: newSum };
    } else {
      const newRating = Number(starRating.toFixed(1));
      await setDoc(
        gameRef,
        {
          rating: newRating,
          ratingCount: 1,
          ratingSum: starRating,
          plays: 0,
        },
        { merge: true }
      );
      return { rating: newRating, ratingCount: 1, ratingSum: starRating };
    }
  } catch (err) {
    handleFirestoreError(err, 'write', `${GAMES_COLLECTION}/${gameId}`);
  }
};

const CHAT_COLLECTION = 'chatMessages';
const CHAT_MODERATION_DOC = 'chatModeration';
const CHAT_REPORTS_COLLECTION = 'chatReports';

// ----------------------------------------------------
// Real-time Live Chat Functions
// ----------------------------------------------------

// Subscribe to real-time chat messages
export const subscribeToChatMessages = (callback) => {
  const chatRef = collection(db, CHAT_COLLECTION);
  const q = query(chatRef, orderBy('timestamp', 'asc'), limit(150));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(messages);
    },
    (err) => {
      handleFirestoreError(err, 'get', CHAT_COLLECTION);
      callback([]);
    }
  );
};

// Send a new chat message
export const sendChatMessageToDb = async (msgData) => {
  try {
    const chatRef = collection(db, CHAT_COLLECTION);
    const docRef = await addDoc(chatRef, {
      text: msgData.text,
      userEmail: msgData.userEmail || 'guest@lazrhub.com',
      userName: msgData.userName || 'Gamer',
      userAvatar: msgData.userAvatar || '🎮',
      userRole: msgData.userRole || 'user',
      timestamp: msgData.timestamp || new Date().toISOString(),
      isPinned: Boolean(msgData.isPinned),
      isSystemMsg: Boolean(msgData.isSystemMsg),
      flaggedReason: msgData.flaggedReason || null,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, 'write', CHAT_COLLECTION);
  }
};

// Delete a chat message (Admin)
export const deleteChatMessageFromDb = async (msgId) => {
  if (!msgId) return;
  try {
    await deleteDoc(doc(db, CHAT_COLLECTION, msgId));
  } catch (err) {
    handleFirestoreError(err, 'delete', `${CHAT_COLLECTION}/${msgId}`);
  }
};

// Clear all chat messages (Admin)
export const clearAllChatMessagesInDb = async () => {
  try {
    const chatRef = collection(db, CHAT_COLLECTION);
    const snapshot = await getDocs(chatRef);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, CHAT_COLLECTION, d.id));
    }
  } catch (err) {
    handleFirestoreError(err, 'delete', CHAT_COLLECTION);
  }
};

// Subscribe to Chat Moderation settings (Bans, Timeouts, Slow Mode, AI Moderation toggle)
export const subscribeToChatModeration = (callback) => {
  const modRef = doc(db, SETTINGS_COLLECTION, CHAT_MODERATION_DOC);
  return onSnapshot(
    modRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          bannedEmails: data.bannedEmails || [],
          timedOutUsers: data.timedOutUsers || {}, // { "email@example.com": "2026-07-25T22:00:00Z" }
          slowModeSeconds: data.slowModeSeconds || 0,
          aiModerationEnabled: data.aiModerationEnabled !== undefined ? data.aiModerationEnabled : true,
          pinnedMessage: data.pinnedMessage || null,
        });
      } else {
        callback({
          bannedEmails: [],
          timedOutUsers: {},
          slowModeSeconds: 0,
          aiModerationEnabled: true,
          pinnedMessage: null,
        });
      }
    },
    (err) => {
      handleFirestoreError(err, 'get', `${SETTINGS_COLLECTION}/${CHAT_MODERATION_DOC}`);
      callback({
        bannedEmails: [],
        timedOutUsers: {},
        slowModeSeconds: 0,
        aiModerationEnabled: true,
        pinnedMessage: null,
      });
    }
  );
};

// Save Chat Moderation Settings
export const saveChatModerationToDb = async (modData) => {
  try {
    await setDoc(
      doc(db, SETTINGS_COLLECTION, CHAT_MODERATION_DOC),
      {
        bannedEmails: modData.bannedEmails || [],
        timedOutUsers: modData.timedOutUsers || {},
        slowModeSeconds: modData.slowModeSeconds !== undefined ? modData.slowModeSeconds : 0,
        aiModerationEnabled: modData.aiModerationEnabled !== undefined ? modData.aiModerationEnabled : true,
        pinnedMessage: modData.pinnedMessage || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, 'write', `${SETTINGS_COLLECTION}/${CHAT_MODERATION_DOC}`);
  }
};

// Report a chat message for admin review
export const reportChatMessageToDb = async (reportData) => {
  try {
    const reportRef = collection(db, CHAT_REPORTS_COLLECTION);
    await addDoc(reportRef, {
      messageId: reportData.messageId,
      messageText: reportData.messageText,
      reportedUserEmail: reportData.reportedUserEmail,
      reportedUserName: reportData.reportedUserName,
      reporterEmail: reportData.reporterEmail || 'Guest',
      reason: reportData.reason || 'Inappropriate content',
      timestamp: new Date().toISOString(),
      status: 'pending',
    });
  } catch (err) {
    handleFirestoreError(err, 'write', CHAT_REPORTS_COLLECTION);
  }
};

// Subscribe to Chat Reports for Admin
export const subscribeToChatReports = (callback) => {
  const reportsRef = collection(db, CHAT_REPORTS_COLLECTION);
  return onSnapshot(
    reportsRef,
    (snapshot) => {
      const reports = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(reports);
    },
    (err) => {
      handleFirestoreError(err, 'get', CHAT_REPORTS_COLLECTION);
      callback([]);
    }
  );
};

// Delete / Resolve Chat Report
export const deleteChatReportFromDb = async (reportId) => {
  if (!reportId) return;
  try {
    await deleteDoc(doc(db, CHAT_REPORTS_COLLECTION, reportId));
  } catch (err) {
    handleFirestoreError(err, 'delete', `${CHAT_REPORTS_COLLECTION}/${reportId}`);
  }
};

