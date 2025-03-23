// Direct test endpoint with transaction data included
// This exports a function that can be used as a serverless endpoint

module.exports = (req, res) => {
  // Set headers explicitly for maximum compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Use address from query, body, or generate a fallback
    const address = req.query.address || 
                    (req.body && req.body.address) ||
                    '0x' + Array.from({length: 40}, () => {
                      return '0123456789abcdef'[Math.floor(Math.random() * 16)];
                    }).join('');
    
    // Generate deterministic transaction details based on address
    const addressSeed = parseInt(address.slice(-8), 16) || Date.now();
    
    // Create transaction hash based on address
    const txHash = '0x' + Array.from({length: 64}, (_, i) => {
      return '0123456789abcdef'[(addressSeed + i) % 16];
    }).join('');
    
    // Create IPFS hash based on address
    const ipfsHash = 'Qm' + Array.from({length: 44}, (_, i) => {
      return '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
        (addressSeed + i) % 58
      ];
    }).join('');
    
    // Generate deterministic username
    const username = `User_${addressSeed % 1000}`;
    
    // Create response with consistent data
    const responseData = {
      success: true,
      blockchainAddress: address,
      message: 'Direct test successful',
      timestamp: new Date().toISOString(),
      data: {
        address: address,
        transaction: txHash,
        ipfsHash: ipfsHash,
        status: 'Confirmed',
        confirmations: 24,
        receiver: {
          address: address,
          username: username,
          email: `user${addressSeed % 1000}@example.com`
        }
      }
    };
    
    // Send response directly
    return res.status(200).send(JSON.stringify(responseData));
  } catch (error) {
    // If anything fails, send a fallback response
    console.error('Error in direct-test endpoint:', error);
    
    // Generate fallback address
    const fallbackAddress = '0x' + Array.from({length: 40}, () => {
      return '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }).join('');
    
    // Create fallback response with basic data
    return res.status(500).json({
      success: false,
      message: 'Error in direct test endpoint',
      error: error.message,
      blockchainAddress: fallbackAddress
    });
  }
}; 