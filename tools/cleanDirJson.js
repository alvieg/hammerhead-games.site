//For using dir.json to add games.

const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '..', 'public', 'assets', 'games');
const dirJsonPath = path.join(__dirname, '..', 'dir.json');

// Get all folder names in assets/games
const folders = fs.readdirSync(gamesDir).filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory());

// Read dir.json
let dirJson = JSON.parse(fs.readFileSync(dirJsonPath, 'utf-8'));

// Remove entries that match folders in assets/games (with or without leading '/')
dirJson = dirJson.filter(entry => {
  const name = entry.startsWith('/') ? entry.slice(1) : entry;
  return !folders.includes(name);
});

// Write back to dir.json
fs.writeFileSync(dirJsonPath, JSON.stringify(dirJson, null, 2));
console.log('✅ Cleaned dir.json');