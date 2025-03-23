const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const fs = require('fs');

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'production' ? undefined : err.message 
  });
});

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic route to check if API is working
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Try to import the backend server
let backendServer;
try {
  console.log('Current working directory:', process.cwd());
  console.log('Available files in /dist/server:', fs.existsSync(path.join(process.cwd(), 'dist/server')) ? 
    fs.readdirSync(path.join(process.cwd(), 'dist/server')).join(', ') : 'directory not found');
  
  // Setup environment variables
  process.env.UPLOADS_DIR = path.join(process.cwd(), 'dist/uploads');
  console.log('UPLOADS_DIR set to:', process.env.UPLOADS_DIR);
  
  // In Vercel, the serverless function runs in a different context
  // So we need to use a relative path
  backendServer = require('../dist/server/server');
  console.log('Backend server loaded successfully');
} catch (error) {
  console.error('Error loading backend server:', error);
  // Create a simple fallback server
  backendServer = express.Router();
  backendServer.use((req, res) => {
    res.status(500).json({ 
      success: false, 
      message: 'Backend server failed to load',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  });
}

// Mount the backend API
app.use('/', (req, res, next) => {
  console.log('API request received:', req.method, req.url);
  return backendServer(req, res, next);
});

// Export the Express API
module.exports = app; 