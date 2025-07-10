const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Config
const username = 'alvieg';
const repo = 'Game-Files';
const outputDir = path.join(__dirname, '..', 'public', 'assets', 'games');
const gamesJsonUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/dir.json`;

// GitHub Token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Store your token in an environment variable

// Add headers to avoid rate limiting
const axiosConfig = {
  headers: {
    'User-Agent': 'Game-Downloader/1.0',
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {})
  }
};

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

async function downloadGameFolder(gameName) {
  try {
    console.log(`🚀 Downloading ${gameName}...`);

    // Create the game directory
    const gameDir = path.join(outputDir, gameName);

    // If the directory exists, remove it first to replace it
    if (fs.existsSync(gameDir)) {
      fs.rmSync(gameDir, { recursive: true, force: true });
      console.log(`  ♻️  Existing folder ${gameName} removed.`);
    }
    fs.mkdirSync(gameDir, { recursive: true });

    // Get the directory contents
    const contentsUrl = `https://api.github.com/repos/${username}/${repo}/contents/${gameName}`;

    try {
      console.log(`  📂 Fetching contents for ${gameName}...`);
      const response = await axios.get(contentsUrl, axiosConfig);
      const contents = response.data;

      if (Array.isArray(contents)) {
        console.log(`  📁 Found ${contents.length} items in ${gameName}`);

        // It's a directory, download all files
        for (const item of contents) {
          if (item.type === 'file') {
            console.log(`    📄 Downloading ${item.name}...`);
            await downloadFile(item.download_url, path.join(gameDir, item.name));
          } else if (item.type === 'dir') {
            console.log(`    📁 Downloading subdirectory ${item.name}...`);
            // Recursively download subdirectories
            await downloadSubdirectory(gameName, item.name, gameDir);
          }
        }
        console.log(`✅ Downloaded ${gameName}`);
      } else {
        console.warn(`⚠️ ${gameName} is not a directory`);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.warn(`⚠️ ${gameName} not found in repository`);
        } else if (error.response.status === 403) {
          console.error(`❌ Rate limit exceeded for ${gameName}. Waiting 60 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          return await downloadGameFolder(gameName); // Retry
        } else {
          console.error(`❌ HTTP ${error.response.status} error downloading ${gameName}:`, error.response.data?.message || error.message);
        }
      } else {
        console.error(`❌ Network error downloading ${gameName}:`, error.message);
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
    const response = await axios.get(contentsUrl, axiosConfig);
    const contents = response.data;
    
    for (const item of contents) {
      if (item.type === 'file') {
        console.log(`      📄 Downloading ${item.name}...`);
        await downloadFile(item.download_url, path.join(subDirPath, item.name));
      } else if (item.type === 'dir') {
        console.log(`      📁 Downloading subdirectory ${item.name}...`);
        await downloadSubdirectory(`${parentDir}/${subDirName}`, item.name, subDirPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error downloading subdirectory ${subDirName}:`, error.message);
  }
}

async function downloadFile(url, filePath) {
  try {
    const response = await axios.get(url, { 
      responseType: 'stream',
      ...axiosConfig
    });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`        ✅ Downloaded ${path.basename(filePath)}`);
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Error downloading file ${path.basename(filePath)}:`, error.message);
  }
}

async function testConnection() {
  try {
    console.log('🔍 Testing connection to GitHub...');
    const response = await axios.get('https://api.github.com/rate_limit', axiosConfig);
    console.log('✅ GitHub API connection successful');
    console.log(`📊 Rate limit remaining: ${response.data.resources.core.remaining}/${response.data.resources.core.limit}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to GitHub API:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🎮 Game Downloader Starting...\n');
    
    // Test connection first
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.error('🛑 Cannot proceed without GitHub API access');
      process.exit(1);
    }
    
    console.log('📋 Fetching game directory list...');
    const response = await axios.get(gamesJsonUrl, axiosConfig);
    const games = response.data;
    
    if (!Array.isArray(games)) {
      console.error('❌ Invalid games data received:', typeof games);
      console.log('Received:', games);
      process.exit(1);
    }
    
    console.log(`📦 Found ${games.length} games to download`);
    console.log('🎮 Starting download process...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Download games sequentially to avoid rate limiting
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      console.log(`\n[${i + 1}/${games.length}] Processing ${game}...`);
      
      try {
        await downloadGameFolder(game);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to download ${game}:`, error.message);
        errorCount++;
      }
      
      // Add a delay to avoid rate limiting
      if (i < games.length - 1) {
        console.log('⏳ Waiting 2 seconds before next download...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n🎉 Download process completed!');
    console.log(`✅ Successfully downloaded: ${successCount} games`);
    console.log(`❌ Failed downloads: ${errorCount} games`);
    console.log(`📁 Games saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('🛑 Failed to fetch game directory list:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('🛑 Unexpected error:', error);
  process.exit(1);
});