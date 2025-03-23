// A direct test endpoint that doesn't use Express
// This is a pure Vercel serverless function to test if the issue is Express-related

module.exports = (req, res) => {
  // Create a blockchain address
  const blockchainAddress = '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Create a response with blockchainAddress at multiple levels
  const response = {
    success: true,
    message: 'This is a direct Vercel function response without Express',
    info: 'Testing to see if this resolves blockchainAddress issues',
    timestamp: new Date().toISOString(),
    // Include blockchainAddress at multiple levels
    blockchainAddress,
    address: blockchainAddress,
    data: {
      blockchainAddress
    },
    user: {
      blockchainAddress
    },
    nested: {
      level1: {
        level2: {
          blockchainAddress
        }
      }
    }
  };
  
  // Send the response
  return res.status(200).json(response);
}; 