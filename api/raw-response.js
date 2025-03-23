// Custom raw response handler for debugging and testing
// This exports a function that can be used as a serverless endpoint

// Helper to generate deterministic transaction data
function generateTransactionData(seed) {
  const txHash = '0x' + Array.from({length: 64}, (_, i) => {
    return '0123456789abcdef'[(seed + i) % 16];
  }).join('');
  
  const ipfsHash = 'Qm' + Array.from({length: 44}, (_, i) => {
    return '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
      (seed + i) % 58
    ];
  }).join('');
  
  return {
    txHash,
    ipfsHash,
    confirmations: 24,
    status: 'Confirmed',
    timestamp: new Date().toISOString()
  };
}

module.exports = (req, res) => {
  // Use address from query or request body, or generate a fallback
  const blockchainAddress = req.query.address || 
                            (req.body && req.body.blockchainAddress) ||
                            '0x' + Array.from({length: 40}, () => {
                              return '0123456789abcdef'[Math.floor(Math.random() * 16)];
                            }).join('');
  
  // Generate deterministic data based on address
  const addressSeed = parseInt(blockchainAddress.slice(-8), 16) || Date.now();
  const txData = generateTransactionData(addressSeed);
  
  // Generate a deterministic username
  const username = `User_${addressSeed % 1000}`;
  
  // Build response object
  const responseObject = {
    success: true,
    message: 'Raw API response',
    timestamp: new Date().toISOString(),
    requestPath: req.url,
    requestMethod: req.method,
    query: req.query,
    body: req.body,
    blockchainAddress,
    user: {
      username,
      email: `user${addressSeed % 1000}@example.com`,
      blockchainAddress
    },
    data: {
      transaction: txData.txHash,
      ipfsHash: txData.ipfsHash,
      status: txData.status,
      confirmations: txData.confirmations,
      receiver: {
        address: blockchainAddress,
        username
      }
    }
  };
  
  res.status(200).json(responseObject);
}; 
