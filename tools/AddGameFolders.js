const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Config
const username = 'alvieg';
const repo = 'Game-Files';
const outputDir = path.join(__dirname, '..', 'public', 'assets', 'games');
const gamesJsonUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/dir.json`;

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

async function downloadGameFolder(gameName) {
  try {
    console.log(`🚀 Downloading ${gameName}...`);
    
    // Create the game directory
    const gameDir = path.join(outputDir, gameName);
    fs.mkdirSync(gameDir, { recursive: true });
    
    // Download the game files from GitHub
    const gameUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/${gameName}`;
    
    // Get the directory contents
    const contentsUrl = `https://api.github.com/repos/${username}/${repo}/contents/${gameName}`;
    
    try {
      const response = await axios.get(contentsUrl);
      const contents = response.data;
      
      if (Array.isArray(contents)) {
        // It's a directory, download all files
        for (const item of contents) {
          if (item.type === 'file') {
            await downloadFile(item.download_url, path.join(gameDir, item.name));
          } else if (item.type === 'dir') {
            // Recursively download subdirectories
            await downloadSubdirectory(gameName, item.name, gameDir);
          }
        }
        console.log(`✅ Downloaded ${gameName}`);
      } else {
        console.warn(`⚠️ ${gameName} is not a directory`);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(`⚠️ ${gameName} not found in repository`);
      } else {
        console.error(`❌ Error downloading ${gameName}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to process ${gameName}:`, error.message);
  }
}

async function downloadSubdirectory(parentDir, subDirName, outputPath) {
  const subDirPath = path.join(outputPath, subDirName);
  fs.mkdirSync(subDirPath, { recursive: true });
  
  const contentsUrl = `https://api.github.com/repos/${username}/${repo}/contents/${parentDir}/${subDirName}`;
  
  try {
    const response = await axios.get(contentsUrl);
    const contents = response.data;
    
    for (const item of contents) {
      if (item.type === 'file') {
        await downloadFile(item.download_url, path.join(subDirPath, item.name));
      } else if (item.type === 'dir') {
        await downloadSubdirectory(`${parentDir}/${subDirName}`, item.name, subDirPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error downloading subdirectory ${subDirName}:`, error.message);
  }
}

async function downloadFile(url, filePath) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Error downloading file ${filePath}:`, error.message);
  }
}

async function main() {
  try {
    console.log('📋 Fetching game directory list...');
    const response = await axios.get(gamesJsonUrl);
    const games = response.data;
    
    console.log(`📦 Found ${games.length} games to download`);
    console.log('🎮 Starting download process...\n');
    
    // Download games sequentially to avoid rate limiting
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      console.log(`[${i + 1}/${games.length}] Processing ${game}...`);
      await downloadGameFolder(game);
      
      // Add a small delay to avoid GitHub API rate limiting
      if (i < games.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 All games downloaded successfully!');
    console.log(`📁 Games saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('🛑 Failed to fetch game directory list:', error.message);
    process.exit(1);
  }
}

// Run the script
main();