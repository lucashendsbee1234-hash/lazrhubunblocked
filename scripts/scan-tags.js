import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { autoTagGame } from '../src/utils/autoTagger.js';

// Read config
const configPath = path.resolve('./firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp({
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
});

const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

async function runScan() {
  console.log('Fetching games from Firestore...');
  const snapshot = await getDocs(collection(db, 'games'));
  const gamesList = [];
  snapshot.forEach((d) => {
    gamesList.push({ id: d.id, ...d.data() });
  });

  console.log(`Found ${gamesList.length} games in Firestore.`);

  const updatedGames = [];
  const allTagsSet = new Set();

  for (const game of gamesList) {
    const oldTags = game.tags || [];
    const newTags = autoTagGame(game);
    console.log(`Game: "${game.title}" (${game.id})`);
    console.log(`  Old tags: [${oldTags.join(', ')}]`);
    console.log(`  New tags: [${newTags.join(', ')}]`);

    newTags.forEach((t) => allTagsSet.add(t));

    const updatedGame = {
      ...game,
      tags: newTags,
      updatedAt: new Date().toISOString(),
    };
    updatedGames.push(updatedGame);

    // Save back to Firestore
    await setDoc(doc(db, 'games', game.id), updatedGame, { merge: true });
  }

  console.log('Firestore games updated successfully!');

  // Also update local src/data/games.json
  const defaultGamesPath = path.resolve('./src/data/games.json');
  if (fs.existsSync(defaultGamesPath)) {
    const defaultGames = JSON.parse(fs.readFileSync(defaultGamesPath, 'utf8'));
    const newDefaults = defaultGames.map((g) => {
      const newTags = autoTagGame(g);
      newTags.forEach((t) => allTagsSet.add(t));
      return {
        ...g,
        tags: newTags,
      };
    });
    fs.writeFileSync(defaultGamesPath, JSON.stringify(newDefaults, null, 2), 'utf8');
    console.log('src/data/games.json updated successfully!');
  }

  // Also update src/data/tags.json
  const tagsPath = path.resolve('./src/data/tags.json');
  if (fs.existsSync(tagsPath)) {
    const sortedTags = Array.from(allTagsSet).sort();
    fs.writeFileSync(tagsPath, JSON.stringify(sortedTags, null, 2), 'utf8');
    console.log('src/data/tags.json updated successfully!');
  }

  process.exit(0);
}

runScan().catch((err) => {
  console.error('Error running scan:', err);
  process.exit(1);
});
