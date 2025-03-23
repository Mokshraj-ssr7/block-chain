const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create dist directory
console.log('Creating dist directory...');
if (fs.existsSync('dist')) {
  console.log('Cleaning existing dist directory...');
  // Use fs-extra to recursively remove directory
  try {
    fs.rmSync('dist', { recursive: true, force: true });
  } catch (error) {
    console.log('Error removing dist directory, trying to continue...');
  }
}
fs.mkdirSync('dist');

// Function to copy directories recursively (Windows-compatible)
function copyDir(src, dest) {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDir(srcPath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy frontend files to dist
console.log('Copying frontend files...');
copyDir('src/frontend', 'dist');

// Create server directory to store backend files
console.log('Creating server directory...');
if (!fs.existsSync('dist/server')) {
  fs.mkdirSync('dist/server', { recursive: true });
}

// Copy backend files to server directory (for import by the API function)
console.log('Copying backend files...');
copyDir('src/backend', 'dist/server');

// Create uploads directory
console.log('Creating uploads directory...');
if (!fs.existsSync('dist/uploads')) {
  fs.mkdirSync('dist/uploads');
}

// Create a package.json for dist
console.log('Creating package.json for deployment...');
const packageJson = {
  "name": "blockchain-file-transfer",
  "version": "1.0.0",
  "main": "index.html",
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "express": "^4.17.1",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "path": "^0.12.7",
    "dotenv": "^10.0.0",
    "crypto": "^1.0.1"
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));

// Create a vercel.json file in the dist directory
console.log('Creating vercel.json in dist...');
const vercelConfig = {
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" }
  ],
  "env": {
    "NODE_ENV": "production"
  }
};

fs.writeFileSync('dist/vercel.json', JSON.stringify(vercelConfig, null, 2));

// Update API URL in the frontend
console.log('Updating API URL in frontend...');
const apiJsPath = 'dist/js/api.js';
if (fs.existsSync(apiJsPath)) {
  let apiJsContent = fs.readFileSync(apiJsPath, 'utf8');
  
  // Replace any existing BASE_URL assignment with the correct one for production
  apiJsContent = apiJsContent.replace(
    /const BASE_URL = .*?;/,
    'const BASE_URL = \'/api\';  // Using relative API path for Vercel deployment'
  );
  
  fs.writeFileSync(apiJsPath, apiJsContent);
  console.log('Updated API URL in frontend');
}

console.log('Build completed successfully!'); 