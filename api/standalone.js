// Minimal standalone API implementation
const express = require('express');
const app = express();

// Enable JSON parsing
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Path rewriting middleware to handle forwarded routes
app.use((req, res, next) => {
  // Strip off /api prefix if present
  const path = req.path;
  if (path.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api/, '');
    console.log(`Path rewritten from ${path} to ${req.url}`);
  }
  next();
});

// Also handle potential double /api/api prefixes (common in Vercel deployments)
app.use((req, res, next) => {
  // Check for double api prefix
  const path = req.path;
  if (path.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api/, '/api');
    console.log(`Fixed double api prefix: ${path} → ${req.url}`);
  }
  next();
});

// Root endpoint for API health check
app.get('/', (req, res) => {
  const blockchainAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  res.json({ 
    status: 'ok', 
    message: 'Blockchain File Transfer API is online',
    endpoints: ['/auth/register', '/auth/login', '/files/sent', '/files/received'],
    blockchainAddress
  });
});

// Health check route
app.get('/health', (req, res) => {
  const blockchainAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  res.json({ 
    status: 'ok', 
    message: 'Standalone API is working',
    blockchainAddress
  });
});

// Status check endpoint that frontend uses
app.get('/status', (req, res) => {
  const blockchainAddress = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  res.json({ 
    success: true, 
    message: 'API server is running', 
    timestamp: new Date().toISOString(),
    blockchainAddress
  });
});

// Mock user database (in-memory)
const users = [
  { 
    id: '1', 
    username: 'testuser', 
    email: 'test@example.com', 
    password: 'password123',
    blockchainAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }
];

// Mock file storage (in-memory)
const files = [];

// Auth routes
app.post('/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide username, email and password',
      blockchainAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
    });
  }
  
  // Check if user already exists
  if (users.some(user => user.email === email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'User with this email already exists',
      blockchainAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
    });
  }
  
  // Generate blockchain address for new user
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Create new user
  const newUser = { 
    id: Date.now().toString(), 
    username, 
    email, 
    password, // In a real app, this would be hashed
    blockchainAddress
  };
  
  users.push(newUser);
  
  // Create a simple token
  const token = `auth-token-${newUser.id}`;
  
  res.status(201).json({ 
    success: true, 
    message: 'User registered successfully',
    user: { 
      id: newUser.id, 
      username, 
      email,
      blockchainAddress
    },
    blockchainAddress,
    address: blockchainAddress,
    token,
    data: {
      blockchainAddress,
      user: {
        id: newUser.id,
        username,
        email,
        blockchainAddress
      }
    }
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide email and password',
      blockchainAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
    });
  }
  
  // Find user
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password',
      blockchainAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
    });
  }
  
  // Create a simple token
  const token = `auth-token-${user.id}`;
  
  res.json({ 
    success: true, 
    message: 'Login successful',
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      blockchainAddress: user.blockchainAddress
    },
    blockchainAddress: user.blockchainAddress,
    address: user.blockchainAddress,
    token,
    data: {
      blockchainAddress: user.blockchainAddress,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        blockchainAddress: user.blockchainAddress
      }
    }
  });
});

// File routes (with basic auth middleware)
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  // Extract user ID from token (very simplified)
  const userId = token.split('-')[2];
  
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
  
  // Find user in database
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Add user data to request
  req.userId = userId;
  req.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    blockchainAddress: user.blockchainAddress
  };
  
  next();
};

app.post('/files/upload', authenticate, (req, res) => {
  // In a real implementation, this would handle file uploads
  // For demo purposes, we'll just create a record
  
  // Create a deterministic file ID based on timestamp
  const fileId = Date.now().toString();
  
  // Generate deterministic IPFS hash and blockchain transaction based on file ID
  const fileIdSeed = parseInt(fileId.toString().slice(-8)) || Date.now();
  const ipfsHash = 'Qm' + Array.from({length: 44}, (_, i) => {
    // Use deterministic values based on fileId and position
    return '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
      (fileIdSeed + i) % 58
    ];
  }).join('');
  
  const txHash = '0x' + Array.from({length: 64}, (_, i) => {
    // Use deterministic hex values based on fileId and position 
    return '0123456789abcdef'[(fileIdSeed + i) % 16];
  }).join('');
  
  // Use receiver address from request or generate one
  const receiverAddress = req.body.receiverAddress || ('0x' + Array.from({length: 40}, (_, i) => {
    return '0123456789abcdef'[(fileIdSeed + i) % 16];
  }).join(''));
  
  // Get receiver details deterministically
  const receiverSeed = parseInt(receiverAddress.slice(-8), 16);
  const receiverUsername = `User_${receiverSeed % 1000}`;
  
  const newFile = {
    id: fileId,
    name: req.body.filename || `sample-file-${fileId}.txt`,
    size: req.body.size || 1024,
    senderId: req.userId,
    senderAddress: req.user.blockchainAddress,
    receiverId: receiverAddress,
    receiverAddress: receiverAddress,
    uploadedAt: new Date().toISOString(),
    ipfsHash: ipfsHash,
    blockchainTransaction: txHash,
    status: 'Confirmed',
    confirmations: 24,
    receiver: {
      address: receiverAddress,
      username: receiverUsername
    }
  };
  
  files.push(newFile);
  
  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    file: newFile,
    data: {
      file: newFile,
      ipfsHash: newFile.ipfsHash,
      blockchainTransaction: newFile.blockchainTransaction,
      receiver: newFile.receiver
    },
    blockchainAddress: req.user.blockchainAddress
  });
});

app.get('/files/sent', authenticate, (req, res) => {
  const sentFiles = files.filter(file => file.senderId === req.userId);
  
  res.json({
    success: true,
    files: sentFiles
  });
});

app.get('/files/received', authenticate, (req, res) => {
  const receivedFiles = files.filter(file => file.receiverId === req.userId);
  
  res.json({
    success: true,
    files: receivedFiles
  });
});

// Add user info endpoint
app.get('/user/info', authenticate, (req, res) => {
  // Return user info from the authenticate middleware
  res.json({
    success: true,
    user: req.user
  });
});

// Get user by ID endpoint
app.get('/user/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      blockchainAddress: user.blockchainAddress
    }
  });
});

// Blockchain related endpoints 
// 1. Address generation
app.get('/user/address', (req, res) => {
  console.log('Generating address via /user/address');
  // Generate a mock blockchain address
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address  // Add this field for frontend compatibility
  });
});

app.get('/user/generateAddress', (req, res) => {
  console.log('Generating address via /user/generateAddress');
  // Generate a mock blockchain address
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address  // Add this field for frontend compatibility
  });
});

app.get('/api/user/address', (req, res) => {
  console.log('Generating address via /api/user/address');
  // Generate a mock blockchain address
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address  // Add this field for frontend compatibility
  });
});

app.get('/api/user/generateAddress', (req, res) => {
  console.log('Generating address via /api/user/generateAddress');
  // Generate a mock blockchain address
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address  // Add this field for frontend compatibility
  });
});

// 2. Verify address
app.post('/blockchain/verify', (req, res) => {
  const { address } = req.body;
  
  // Simple validation - check if it's a hex string starting with 0x
  const isValid = /^0x[0-9a-f]{40}$/i.test(address);
  
  res.json({
    success: true,
    valid: isValid
  });
});

// Handle all combinations of address generation routes
app.get('/generateAddress', (req, res) => {
  console.log('Generating address via /generateAddress endpoint');
  // Generate a mock blockchain address
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address  // Add this field for frontend compatibility
  });
});

// Receiver address generation
app.post('/receiver/generate', (req, res) => {
  console.log('Generating receiver address via /receiver/generate');
  // Generate a mock blockchain address for receiver
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address  // Add this field for frontend compatibility
  });
});

// Also handle with /api prefix
app.post('/api/receiver/generate', (req, res) => {
  console.log('Generating receiver address via /api/receiver/generate');
  // Generate a mock blockchain address for receiver
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address  // Add this field for frontend compatibility
  });
});

// Blockchain transaction endpoints
app.post('/blockchain/transaction', authenticate, (req, res) => {
  console.log('Creating blockchain transaction');
  const { fileId, receiverAddress } = req.body;
  
  // Create mock transaction hash
  const txHash = '0x' + Array.from({length: 64}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    message: 'Transaction created successfully',
    transaction: {
      hash: txHash,
      fileId,
      receiverAddress,
      timestamp: new Date().toISOString()
    }
  });
});

// Verify file ownership on blockchain
app.post('/blockchain/verify-ownership', authenticate, (req, res) => {
  console.log('Verifying file ownership');
  const { fileId } = req.body;
  
  // Mock verification result
  res.json({
    success: true,
    isOwner: true,
    verified: true
  });
});

// Mock blockchain status endpoint
app.get('/blockchain/status', (req, res) => {
  console.log('Checking blockchain connection status');
  res.json({
    success: true,
    connected: true,
    network: 'Ethereum Testnet',
    block: Math.floor(Math.random() * 10000000)
  });
});

// Add more address endpoint variations
app.get('/blockchain/address', (req, res) => {
  console.log('Generating address via /blockchain/address');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address
  });
});

app.get('/api/blockchain/address', (req, res) => {
  console.log('Generating address via /api/blockchain/address');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address
  });
});

// User-specific blockchain info with both GET and POST methods
app.get('/user/blockchain', (req, res) => {
  console.log('Getting user blockchain info via GET');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address,
    network: 'Ethereum Testnet',
    status: 'connected'
  });
});

app.post('/user/blockchain', (req, res) => {
  console.log('Getting user blockchain info via POST');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address,
    network: 'Ethereum Testnet',
    status: 'connected'
  });
});

// Special endpoint to get all blockchain data at once
app.get('/blockchain/data', (req, res) => {
  console.log('Getting all blockchain data');
  const userAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    user: {
      address: userAddress,
      blockchainAddress: userAddress
    },
    network: 'Ethereum Testnet',
    isConnected: true,
    balance: '0.5 ETH',
    gasPrice: '20 Gwei'
  });
});

// Add more address endpoint variations
app.get('/address', (req, res) => {
  console.log('Generating address via /address endpoint');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address
  });
});

app.get('/api/address', (req, res) => {
  console.log('Generating address via /api/address endpoint');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address
  });
});

// Handle potential frontend direct API calls
app.get('/api/blockchain', (req, res) => {
  console.log('Generating blockchain data via /api/blockchain');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    address,
    blockchainAddress: address,
    network: 'Ethereum Testnet',
    isConnected: true
  });
});

// Blockchain connection endpoint
app.post('/blockchain/connect', (req, res) => {
  console.log('Connecting to blockchain...');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    connected: true,
    address,
    blockchainAddress: address,
    network: 'Ethereum Testnet'
  });
});

// Add blockchain auth endpoints
app.post('/blockchain/auth', (req, res) => {
  console.log('Blockchain authentication request');
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    authenticated: true,
    address,
    blockchainAddress: address
  });
});

// Helper function to create consistent blockchain address responses
function generateBlockchainAddress() {
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return {
    address,
    blockchainAddress: address
  };
}

// Add a debug endpoint to validate API functionality
app.get('/debug', (req, res) => {
  console.log('DEBUG endpoint called');
  
  const addressData = generateBlockchainAddress();
  
  res.json({
    success: true,
    message: 'API is working properly',
    timestamp: new Date().toISOString(),
    requestInfo: {
      path: req.path,
      method: req.method,
      headers: req.headers
    },
    environment: process.env.NODE_ENV || 'development',
    apiVersion: '1.0.0',
    addressTest: addressData
  });
});

// Special endpoint to debug the specific blockchainAddress property issue
app.get('/debug/address', (req, res) => {
  console.log('Address debug endpoint called');
  
  const addressData = generateBlockchainAddress();
  
  res.json({
    success: true,
    message: 'Address debug information',
    addressData: addressData,
    addressDirectProperty: addressData.address,
    blockchainAddressDirectProperty: addressData.blockchainAddress,
    hasBlockchainAddressProperty: Object.prototype.hasOwnProperty.call(addressData, 'blockchainAddress'),
    propertyDescriptor: Object.getOwnPropertyDescriptor(addressData, 'blockchainAddress')
  });
});

// Add a diagnostic endpoint for the blockchainAddress issue
app.get('/diagnostic/blockchain-address', (req, res) => {
  console.log('Blockchain address diagnostic endpoint called');
  
  // Generate a blockchain address for testing
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Create a test response with blockchainAddress at multiple levels
  const testResponse = {
    success: true,
    message: 'Blockchain address diagnostic information',
    timestamp: new Date().toISOString(),
    // Add blockchainAddress at the top level
    blockchainAddress,
    // Also add it in a data object
    data: {
      blockchainAddress,
      value: 'test',
    },
    // And in a user object
    user: {
      blockchainAddress,
      id: 'test'
    },
    // Test object with circular references to blockchainAddress
    test: {
      nestedData: {
        blockchainAddress
      }
    }
  };
  
  // Send the test response
  console.log('Sending test response:', JSON.stringify(testResponse, null, 2));
  res.json(testResponse);
});

// Add specialized endpoint for client testing
app.get('/check-blockchain-address', (req, res) => {
  // Generate a test blockchain address
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Create response with various different nesting levels
  res.json({
    success: true,
    message: 'Check if you can access blockchainAddress from this response',
    blockchainAddress,
    address: blockchainAddress,
    user: {
      blockchainAddress
    },
    data: {
      blockchainAddress
    },
    nested: {
      level1: {
        level2: {
          blockchainAddress
        }
      }
    }
  });
});

// Catch-all for undefined routes should return JSON, not HTML
app.use('*', (req, res) => {
  console.log(`Endpoint not found: ${req.method} ${req.originalUrl}`);
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /status',
      'POST /auth/register',
      'POST /auth/login',
      'POST /files/upload',
      'GET /files/sent',
      'GET /files/received',
      'GET /user/address',
      'GET /user/generateAddress',
      'POST /receiver/generate',
      'GET /blockchain/address',
      'GET /user/blockchain',
      'POST /user/blockchain',
      'GET /blockchain/data',
      'GET /user/info',
      'GET /user/:id',
      'GET /address',
      'GET /api/address',
      'GET /api/blockchain',
      'POST /blockchain/connect',
      'POST /blockchain/auth',
      'GET /debug',
      'GET /debug/address',
      'POST /wallet/connect',
      'POST /blockchain/token',
      'GET /api/user',
      'GET /diagnostic/blockchain-address',
      'GET /check-blockchain-address',
      'GET /api/receiver/find/:address',
      'GET /api/receiver/address',
      'POST /api/receiver/generate'
    ],
    // Always include a blockchain address in the error response for robustness
    blockchainAddress: '0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  // Log detailed error info for debugging
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    headers: req.headers
  });
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: err.message,
    path: req.path
  });
});

// Add support for Web3 wallet connection simulation
app.post('/wallet/connect', (req, res) => {
  console.log('Wallet connection request received');
  
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Return in the format expected by frontend
  res.json({
    success: true,
    data: {
      address,
      blockchainAddress: address
    },
    blockchainAddress: address // Ensure it's available at the top level too
  });
});

// Add a blockchain token generation endpoint that matches what the frontend expects
app.post('/blockchain/token', (req, res) => {
  console.log('Blockchain token generation request');
  
  const address = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    token: 'blockchain-token-' + Date.now(),
    address,
    blockchainAddress: address,
    data: {
      address,
      blockchainAddress: address
    }
  });
});

// Ensure all user responses include blockchainAddress at multiple levels for robustness
app.get('/api/user', authenticate, (req, res) => {
  console.log('Get user profile request');
  
  const user = req.user;
  
  res.json({
    success: true,
    user: user,
    // Ensure it's available at multiple locations for robustness
    blockchainAddress: user.blockchainAddress,
    data: {
      user: user,
      blockchainAddress: user.blockchainAddress
    }
  });
});

// Add API middleware to ensure all responses from any endpoint have blockchainAddress
function ensureBlockchainAddress(req, res, next) {
  // Store the original methods we're going to override
  const originalJson = res.json;
  const originalSend = res.send;
  const originalEnd = res.end;
  
  // Force blockchainAddress to be available in the response
  function addBlockchainAddress(obj) {
    if (!obj) return obj;
    
    // Only process objects
    if (typeof obj !== 'object') return obj;
    
    // Generate address if needed
    if (!obj.blockchainAddress) {
      obj.blockchainAddress = '0x' + Array.from({length: 40}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
    }
    
    // Add to nested objects
    if (obj.data && typeof obj.data === 'object' && !obj.data.blockchainAddress) {
      obj.data.blockchainAddress = obj.blockchainAddress;
    }
    
    if (obj.user && typeof obj.user === 'object' && !obj.user.blockchainAddress) {
      obj.user.blockchainAddress = obj.blockchainAddress;
    }
    
    return obj;
  }
  
  // Override json method
  res.json = function(body) {
    return originalJson.call(this, addBlockchainAddress(body));
  };
  
  // Override send method to handle string JSON
  res.send = function(body) {
    if (typeof body === 'string') {
      try {
        // Try to parse as JSON
        const obj = JSON.parse(body);
        if (typeof obj === 'object') {
          // Add blockchainAddress and stringify
          body = JSON.stringify(addBlockchainAddress(obj));
        }
      } catch (e) {
        // Not JSON, continue
      }
    } else if (typeof body === 'object') {
      // Add blockchainAddress to object
      body = addBlockchainAddress(body);
    }
    
    return originalSend.call(this, body);
  };
  
  // Ensure even raw end calls include blockchainAddress
  res.end = function(chunk, encoding) {
    if (chunk) {
      let body;
      try {
        body = JSON.parse(chunk.toString());
        if (typeof body === 'object') {
          // Add blockchainAddress
          body = addBlockchainAddress(body);
          chunk = Buffer.from(JSON.stringify(body));
        }
      } catch (e) {
        // Not JSON, continue
      }
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

// Apply the middleware at the application level
app.use(ensureBlockchainAddress);

// For Vercel serverless functions, we need to export a function that can handle requests
// This is a common pattern for Vercel deployments
module.exports = async (req, res) => {
  // This is a hard-coded fallback in case the middleware doesn't work
  const generateAddress = () => '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  try {
    // Handle CORS directly in case middleware doesn't run
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Directly set blockchainAddress for test endpoints
    if (req.url === '/api/direct-test') {
      const blockchainAddress = generateAddress();
      return res.json({
        success: true,
        message: 'Direct test endpoint for Vercel',
        blockchainAddress,
        data: { blockchainAddress },
        user: { blockchainAddress }
      });
    }
    
    // Process the request with the Express app
    return new Promise((resolve) => {
      app(req, res, (err) => {
        if (err) {
          console.error('Express app error:', err);
          const blockchainAddress = generateAddress();
          res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message,
            blockchainAddress,
            data: { blockchainAddress },
            user: { blockchainAddress }
          });
        }
        resolve();
      });
    });
  } catch (error) {
    // Final backup: directly return response with blockchainAddress
    console.error('Global handler error:', error);
    const blockchainAddress = generateAddress();
    
    res.status(500).json({
      success: false,
      message: 'Unexpected server error',
      blockchainAddress,
      data: { blockchainAddress },
      error: error.message
    });
  }
};

// Add a super simple endpoint for Vercel testing
app.get('/api/blockchain-vercel-test', (req, res) => {
  console.log('Vercel test endpoint called');
  
  // Create a very simple response with blockchain address
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    message: 'Vercel deployment test',
    timestamp: Date.now(),
    blockchainAddress
  });
});

// Add an endpoint directly at '/api' as well
app.get('/api', (req, res) => {
  console.log('Root API endpoint called on Vercel');
  
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  res.json({
    success: true,
    message: 'Blockchain API root endpoint',
    blockchainAddress,
    data: {
      blockchainAddress
    },
    user: {
      blockchainAddress
    }
  });
});

// Add endpoint for verifying receiver address
app.get('/api/receiver/find/:address', (req, res) => {
  console.log(`Verifying address: ${req.params.address}`);
  
  const address = req.params.address;
  
  if (!address) {
    return res.status(400).json({
      success: false,
      message: 'Address is required',
      blockchainAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
    });
  }
  
  // Generate a deterministic username based on the address
  // This ensures the same address always gets the same username
  const addressSeed = parseInt(address.slice(-8), 16);
  const username = `User_${addressSeed % 1000}`;
  
  // For this example, we'll create consistent data based on the address
  const user = {
    id: 'user_' + (addressSeed % 1000),
    username: username,
    email: `user${addressSeed % 1000}@example.com`,
    blockchainAddress: address
  };
  
  return res.json({
    success: true,
    message: 'Address verified successfully',
    data: {
      username: user.username,
      blockchainAddress: user.blockchainAddress
    },
    blockchainAddress: user.blockchainAddress
  });
});

// Get current user's blockchain address
app.get('/api/receiver/address', (req, res) => {
  console.log('Getting user blockchain address');
  
  // Generate a blockchain address if one doesn't exist yet
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return res.json({
    success: true,
    message: 'Address retrieved successfully',
    data: {
      blockchainAddress
    },
    blockchainAddress
  });
});

// Generate a new blockchain address
app.post('/api/receiver/generate', (req, res) => {
  console.log('Generating new blockchain address');
  
  // Generate a new blockchain address
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return res.json({
    success: true,
    message: 'New blockchain address generated',
    data: {
      blockchainAddress
    },
    blockchainAddress
  });
});

// Direct route handler for receiver find (without /api prefix)
app.get('/receiver/find/:address', (req, res) => {
  console.log(`Verifying address (direct route): ${req.params.address}`);
  
  const address = req.params.address;
  
  if (!address) {
    return res.status(400).json({
      success: false,
      message: 'Address is required',
      blockchainAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')
    });
  }
  
  // Generate a deterministic username based on the address
  // This ensures the same address always gets the same username
  const addressSeed = parseInt(address.slice(-8), 16);
  const username = `User_${addressSeed % 1000}`;
  
  // For this example, we'll create consistent data based on the address
  const user = {
    id: 'user_' + (addressSeed % 1000),
    username: username,
    email: `user${addressSeed % 1000}@example.com`,
    blockchainAddress: address
  };
  
  return res.json({
    success: true,
    message: 'Address verified successfully',
    data: {
      username: user.username,
      blockchainAddress: user.blockchainAddress
    },
    blockchainAddress: user.blockchainAddress
  });
});

// Get current user's blockchain address - direct route
app.get('/receiver/address', (req, res) => {
  console.log('Getting user blockchain address (direct route)');
  
  // Generate a blockchain address if one doesn't exist yet
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return res.json({
    success: true,
    message: 'Address retrieved successfully',
    data: {
      blockchainAddress
    },
    blockchainAddress
  });
});

// Generate a new blockchain address - direct route
app.post('/receiver/generate', (req, res) => {
  console.log('Generating new blockchain address (direct route)');
  
  // Generate a new blockchain address
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return res.json({
    success: true,
    message: 'New blockchain address generated',
    data: {
      blockchainAddress
    },
    blockchainAddress
  });
});

// Get file details - enhanced with blockchain info
app.get('/files/detail/:fileId', authenticate, (req, res) => {
  console.log(`Getting file details for: ${req.params.fileId}`);
  
  // Find the file by ID
  const file = files.find(f => f.id === req.params.fileId);
  
  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found',
      blockchainAddress: req.user?.blockchainAddress || '0x' + Array.from({length: 40}, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
    });
  }
  
  // Generate deterministic IPFS hash and blockchain transaction based on file ID
  const fileIdSeed = parseInt(file.id.toString().slice(-8)) || Date.now();
  const ipfsHash = 'Qm' + Array.from({length: 44}, (_, i) => {
    // Use deterministic values based on fileId and position
    return '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
      (fileIdSeed + i) % 58
    ];
  }).join('');
  
  const txHash = '0x' + Array.from({length: 64}, (_, i) => {
    // Use deterministic hex values based on fileId and position 
    return '0123456789abcdef'[(fileIdSeed + i) % 16];
  }).join('');
  
  // Generate receiver data deterministically
  let receiverAddress = file.receiverAddress;
  if (!receiverAddress) {
    receiverAddress = '0x' + Array.from({length: 40}, (_, i) => {
      return '0123456789abcdef'[(fileIdSeed + i) % 16];
    }).join('');
  }
  
  // Deterministic receiver details
  const receiverSeed = parseInt(receiverAddress.slice(-8), 16);
  const receiverUsername = `User_${receiverSeed % 1000}`;
  
  // Create an enhanced response with blockchain details
  res.json({
    success: true,
    file: {
      ...file,
      ipfsHash: ipfsHash,
      blockchainTransaction: txHash,
      receiver: {
        address: receiverAddress,
        username: receiverUsername
      },
      blockchainStatus: 'Confirmed',
      confirmations: 24
    },
    blockchainAddress: req.user.blockchainAddress
  });
});

// Get transaction history for a file
app.get('/blockchain/transactions/:fileId', authenticate, (req, res) => {
  console.log(`Getting blockchain transactions for file: ${req.params.fileId}`);
  
  const { fileId } = req.params;
  
  // Generate deterministic transaction data based on file ID
  const fileIdSeed = parseInt(fileId.toString().slice(-8)) || Date.now();
  
  // Create a main transaction hash
  const mainTxHash = '0x' + Array.from({length: 64}, (_, i) => {
    return '0123456789abcdef'[(fileIdSeed + i) % 16];
  }).join('');
  
  // Generate 2-3 transactions related to this file
  const transactionCount = (fileIdSeed % 2) + 2; // 2 or 3 transactions
  const transactions = [];
  
  for (let i = 0; i < transactionCount; i++) {
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - i * 2); // Spread out over time
    
    transactions.push({
      hash: i === 0 ? mainTxHash : '0x' + Array.from({length: 64}, (_, j) => {
        return '0123456789abcdef'[(fileIdSeed + i + j) % 16];
      }).join(''),
      type: i === 0 ? 'IPFS Storage' : (i === 1 ? 'Access Grant' : 'Verification'),
      status: 'Confirmed',
      timestamp: timestamp.toISOString(),
      block: 12345000 + fileIdSeed + i,
      gas: 21000 + (i * 5000),
      confirmations: 24 - (i * 4)
    });
  }
  
  res.json({
    success: true,
    fileId: fileId,
    transactions: transactions,
    blockchainAddress: req.user.blockchainAddress
  });
});

// Get IPFS details for a file
app.get('/ipfs/detail/:fileId', authenticate, (req, res) => {
  console.log(`Getting IPFS details for file: ${req.params.fileId}`);
  
  const { fileId } = req.params;
  
  // Generate deterministic IPFS data based on file ID
  const fileIdSeed = parseInt(fileId.toString().slice(-8)) || Date.now();
  
  // Create a stable IPFS hash for this file
  const ipfsHash = 'Qm' + Array.from({length: 44}, (_, i) => {
    return '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
      (fileIdSeed + i) % 58
    ];
  }).join('');
  
  // Mock gateway URLs
  const gateway1 = `https://ipfs.io/ipfs/${ipfsHash}`;
  const gateway2 = `https://gateway.ipfs.io/ipfs/${ipfsHash}`;
  const gateway3 = `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`;
  
  res.json({
    success: true,
    fileId: fileId,
    ipfsHash: ipfsHash,
    size: 1024 * (1 + (fileIdSeed % 1024)), // Random size between 1KB and 1MB
    created: new Date().toISOString(),
    pinned: true,
    gateways: [gateway1, gateway2, gateway3],
    blockchainAddress: req.user.blockchainAddress
  });
}); 
