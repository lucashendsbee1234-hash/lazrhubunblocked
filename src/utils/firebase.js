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
  onSnapshot,
  increment,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import defaultGames from '../data/games.json';

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
      await setDoc(doc(db, GAMES_COLLECTION, g.id), g, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, 'write', GAMES_COLLECTION);
  }
};

// Add or update a game in Firestore
export const saveGameToDb = async (gameData) => {
  try {
    const id = gameData.id || `game-${Date.now()}`;
    const cleanGame = {
      ...gameData,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, GAMES_COLLECTION, id), cleanGame, { merge: true });
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

// Increment play/view count in Firestore live for all users
export const recordGamePlayInDb = async (gameId) => {
  if (!gameId) return;
  try {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
      plays: increment(1),
    });
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
      return newRating;
    }
  } catch (err) {
    handleFirestoreError(err, 'write', `${GAMES_COLLECTION}/${gameId}`);
  }
};

