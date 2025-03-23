// Direct blockchain address test endpoint for Vercel
module.exports = (req, res) => {
  try {
    // Generate a blockchain address
    const blockchainAddress = '0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Multiple formats - one should work
    const response = JSON.stringify({
      success: true,
      blockchainAddress,
      data: {
        blockchainAddress
      },
      user: {
        blockchainAddress
      },
      timestamp: new Date().toISOString()
    });
    
    // Sending directly with explicit content-type
    return res.status(200).send(response);
  } catch (error) {
    // Fallback error handling
    console.error('Error in blockchain-test endpoint:', error);
    const fallbackAddress = '0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    return res.status(500).json({
      success: false,
      message: 'Error in blockchain test endpoint',
      blockchainAddress: fallbackAddress,
      data: {
        blockchainAddress: fallbackAddress
      }
    });
  }
}; 