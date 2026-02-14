const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'dist', 'manifest.json');

if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // Fix the entry path for the dist version
    // If we load from 'dist' folder, the script is in the same folder, so just 'index.js'
    manifest.scripts[0].entry = 'index.js';

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('Fixed manifest.json entry path: dist/index.js -> index.js');
} else {
    console.error('dist/manifest.json not found!');
}
