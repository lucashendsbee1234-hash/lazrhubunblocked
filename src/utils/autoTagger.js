// Utility for automatically scanning game metadata and generating clean, accurate tags

const BANNED_OR_MIGRATED_TAGS = new Set([
  'web',
  'web game',
  'html5',
  'unblocked',
  'game',
  'for',
  'to',
  'no',
  'play',
  'learn',
  'fun',
  'driving racing',
  'physics skill',
  'puzzle logic',
  'sports fitness',
  'strategy defense',
  'stragtegy',
]);

export function autoTagGame(game) {
  const newTags = new Set();

  // Scan text from title, category, description, controls, author, and iframeUrl
  const titleStr = (game.title || '').toLowerCase();
  const catStr = (game.category || '').toLowerCase();
  const descStr = (game.description || '').toLowerCase();
  const ctrlStr = (game.controls || '').toLowerCase();
  const authorStr = (game.author || '').toLowerCase();
  const urlStr = (game.iframeUrl || '').toLowerCase();

  const textToScan = `${titleStr} ${catStr} ${descStr} ${ctrlStr} ${authorStr} ${urlStr}`;

  // Preserve existing custom tags if they are clean and valid
  if (Array.isArray(game.tags)) {
    game.tags.forEach((t) => {
      if (typeof t === 'string') {
        const clean = t.toLowerCase().trim();
        if (clean && !BANNED_OR_MIGRATED_TAGS.has(clean) && clean.length > 2) {
          if (!clean.includes(' ')) {
            newTags.add(clean);
          }
        }
      }
    });
  }

  // 1. RACING / DRIVING / CARS / VEHICLES
  const isRacing = /\b(rac(e|ing)|polytrack|monstertracks|drift|drifting|asphalt|kart|rally|speedway|circuit|formula|nascar|stunt|stunts|speedway|grand prix|racing)\b/.test(textToScan);
  const isDriving = /\b(driv(e|ing)|car|cars|truck|trucks|vehicle|vehicles|auto|bus|wheel|wheels|highway|traffic|parking|motorcycle|motorbike|moto|bike|biking|monster truck)\b/.test(textToScan);
  const isCar = /\b(car|cars|truck|trucks|auto|vehicle|vehicles|kart|drift|asphalt|monstertracks|polytrack|taxi|bus|suv)\b/.test(textToScan);

  if (isRacing) newTags.add('racing');
  if (isDriving || isRacing) newTags.add('driving');
  if (isCar || (isRacing && /\b(car|cars|track|tracks|polytrack|monstertracks|drift)\b/.test(textToScan))) {
    newTags.add('car');
  }

  // 2. SPORTS / BALL GAMES
  const isSports = /\b(sport|sports|basket|basketball|football|soccer|tennis|golf|skate|skateboarding|boxing|baseball|hockey|volleyball|pool|billiards|bowling|archery|dunk|hoop|paddle|ping pong|table tennis|athlete|stadium|pitch|olympics|kick|field goal)\b/.test(textToScan);
  if (isSports) newTags.add('sports');

  if (/\b(basket|basketball|hoop|dunks|dunking|dunk)\b/.test(textToScan)) {
    newTags.add('basketball');
    newTags.add('sports');
  }
  if (/\b(soccer|football|kick|goalie|penalty)\b/.test(textToScan)) {
    newTags.add('soccer');
    newTags.add('sports');
  }
  if (/\b(golf|putting|tee)\b/.test(textToScan)) {
    newTags.add('golf');
    newTags.add('sports');
  }
  if (/\b(skate|skateboarding|skateboard|flip|grind)\b/.test(textToScan)) {
    newTags.add('skateboarding');
    newTags.add('sports');
  }

  // 3. PUZZLE / LOGIC / BRAIN / MATH
  const isPuzzle = /\b(puzzle|puzzles|brain|math|2048|sudoku|chess|checkers|block|blocks|match|matching|word|wordle|words|tetris|maze|memory|riddle|quiz|solitaire|card|cards|spatial|jigsaw)\b/.test(textToScan);
  if (isPuzzle) newTags.add('puzzle');

  if (/\b(logic|brain|mind|think|thinking|reasoning|solver)\b/.test(textToScan)) {
    newTags.add('logic');
    newTags.add('puzzle');
  }
  if (/\b(math|numbers|2048|calculation)\b/.test(textToScan)) {
    newTags.add('math');
    newTags.add('puzzle');
  }

  // 4. ACTION / REFLEX / SHOOTER / COMBAT / RUNNER
  if (/\b(action|reflex|shoot|shooter|gun|guns|weapon|weapons|battle|fight|fighting|combat|brawl|sword|ninja|zombie|zombies|survival|jump|runner|dodging|smash|blast|war|sniper|bullet|arena|defense|strike)\b/.test(textToScan)) {
    newTags.add('action');
  }
  if (/\b(shoot|shooter|shooting|gun|guns|weapon|weapons|sniper|bullet|fps|tps|crosshair)\b/.test(textToScan)) {
    newTags.add('shooter');
    newTags.add('action');
  }
  if (/\b(fight|fighting|combat|brawl|ninja|sword|karate|boxing|martial)\b/.test(textToScan)) {
    newTags.add('fighting');
    newTags.add('action');
  }
  if (/\b(zombie|zombies|survival|apocalypse|undead)\b/.test(textToScan)) {
    newTags.add('survival');
    newTags.add('action');
  }
  if (/\b(runner|run|running|dash|endless|subway|temple|parkour)\b/.test(textToScan)) {
    newTags.add('runner');
    newTags.add('endless');
    newTags.add('action');
  }

  // 5. 2-PLAYER / MULTIPLAYER
  if (
    /\b(2-player|2p|multiplayer|local|friend|friends|versus|1v1|2v2|dual|co-op|coop)\b/.test(textToScan) ||
    /player 1.*player 2/i.test(textToScan)
  ) {
    newTags.add('2-player');
  }

  // 6. STRATEGY / MANAGEMENT / SIMULATION
  if (/\b(strategy|management|mart|store|shop|tycoon|simulator|simulation|idle|clicker|build|factory|business|farm|farming|harvest|empire|tower defense|tactical|tactics)\b/.test(textToScan)) {
    newTags.add('strategy');
  }
  if (/\b(mart|store|shop|tycoon|factory|business|farm|farming|harvest|management)\b/.test(textToScan)) {
    newTags.add('management');
    newTags.add('strategy');
  }
  if (/\b(simulator|simulation|sim)\b/.test(textToScan)) {
    newTags.add('simulation');
  }

  // 7. CASUAL / ARCADE / QUICK PLAY / ENDLESS
  if (/\b(casual|quick|endless|score|relax|relaxing|arcade|simple|easy|pick-up|break|fun)\b/.test(textToScan)) {
    newTags.add('casual');
  }
  if (/\b(arcade|retro|classic|8-bit|16-bit|coin-op|cabinet)\b/.test(textToScan)) {
    newTags.add('arcade');
  }
  if (/\b(endless|infinite|forever)\b/.test(textToScan)) {
    newTags.add('endless');
  }
  if (/\b(quick|speed|fast|short)\b/.test(textToScan)) {
    newTags.add('quick-play');
  }

  // 8. GRAPHICS & PLATFORM
  if (/\b(3d|low-poly|poly|polygon|unity|unreal|three\.js|render)\b/.test(textToScan)) {
    newTags.add('3d');
  }
  if (/\b(2d|pixel|retro|8-bit|16-bit|sprites)\b/.test(textToScan)) {
    newTags.add('retro');
  }
  if (/\b(physics|ragdoll|gravity|momentum|balance|suspension)\b/.test(textToScan)) {
    newTags.add('physics');
  }
  if (/\b(singleplayer|1-player|solo|story|campaign)\b/.test(textToScan) || !newTags.has('2-player')) {
    newTags.add('singleplayer');
  }

  // Always keep HTML5 tag
  newTags.add('html5');

  return Array.from(newTags).filter(Boolean);
}
