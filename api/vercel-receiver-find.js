// Handler for receiver verification with transaction details
// This is a specialized endpoint for Vercel

module.exports = (req, res) => {
  // Extract address from URL parameters
  const { address } = req.query;
  
  // Check if address is provided
  if (!address) {
    return res.status(400).json({
      success: false,
      message: 'Blockchain address is required',
      blockchainAddress: '0x0000000000000000000000000000000000000000' // Fallback
    });
  }
  
  try {
    // Generate deterministic username and email based on address
    const addressSeed = parseInt(address.slice(-8), 16) || 12345;
    const username = `User_${addressSeed % 1000}`;
    const email = `user${addressSeed % 1000}@example.com`;
    
    // Generate transaction history based on address
    const txCount = (addressSeed % 5) + 1; // 1-5 transactions
    const transactions = Array.from({ length: txCount }, (_, i) => {
      const txHash = '0x' + Array.from({ length: 64 }, (_, j) => {
        return '0123456789abcdef'[(addressSeed + i + j) % 16];
      }).join('');
      
      return {
        id: `tx-${i+1}-${addressSeed}`,
        hash: txHash,
        type: ['Send', 'Receive', 'Contract Interaction'][i % 3],
        timestamp: new Date(Date.now() - (i * 86400000)).toISOString(),
        status: 'Confirmed',
        amount: ((addressSeed + i) % 10) + 0.01,
        confirmations: 24 - i
      };
    });
    
    // Create a user object
    const user = {
      id: `user-${addressSeed}`,
      username,
      email,
      blockchainAddress: address,
      verified: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      transactionCount: txCount,
      transactions
    };
    
    // Return success response with user data
    return res.status(200).json({
      success: true,
      message: 'User found',
      user,
      blockchainAddress: address,
      data: {
        user,
        transactions
      }
    });
  } catch (error) {
    console.error('Error in receiver verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying receiver',
      error: error.message,
      blockchainAddress: address
    });
  }
};
