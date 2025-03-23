// Static blockchain API response handler
// This exports a function that can be used as a Vercel serverless endpoint

// Helper to generate deterministic transaction details
function generateTransactionDetails(address) {
  const addressSeed = parseInt(address.slice(-8), 16) || 12345;
  
  const txHash = '0x' + Array.from({length: 64}, (_, i) => {
    return '0123456789abcdef'[(addressSeed + i) % 16];
  }).join('');
  
  const ipfsHash = 'Qm' + Array.from({length: 44}, (_, i) => {
    return '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[
      (addressSeed + i) % 58
    ];
  }).join('');
  
  return {
    transaction: txHash,
    ipfsHash: ipfsHash,
    status: 'Confirmed',
    confirmations: 24,
    timestamp: new Date().toISOString(),
    gas: 21000 + (addressSeed % 10000)
  };
}

module.exports = (req, res) => {
  // Extract address from query, body, or generate a fallback
  const address = req.query.address || 
                  (req.body && req.body.address) ||
                  '0x' + Array.from({length: 40}, () => {
                    return '0123456789abcdef'[Math.floor(Math.random() * 16)];
                  }).join('');
  
  // Generate deterministic transaction details
  const transactionDetails = generateTransactionDetails(address);
  
  // Generate deterministic receiver details
  const addressSeed = parseInt(address.slice(-8), 16) || 12345;
  const receiverUsername = `User_${addressSeed % 1000}`;
  
  // Respond with blockchain token (address) and transaction details
  res.status(200).json({
    success: true,
    message: 'Blockchain token retrieved',
    blockchainAddress: address,
    data: {
      address,
      balance: (addressSeed % 100) / 10, // Random balance between 0 and 10
      transaction: transactionDetails.transaction,
      ipfsHash: transactionDetails.ipfsHash,
      status: transactionDetails.status,
      confirmations: transactionDetails.confirmations,
      receiver: {
        address: address,
        username: receiverUsername,
        email: `user${addressSeed % 1000}@example.com`
      }
    }
  });
}; 
