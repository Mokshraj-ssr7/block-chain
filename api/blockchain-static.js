// Completely static blockchain function with hard-coded values
module.exports = (req, res) => {
  // Hard-coded blockchain address
  const blockchainAddress = "0xabcdef1234567890abcdef1234567890abcdef12";
  
  // Set headers manually
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // OPTIONS request handling
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Construct a hard-coded response with blockchain address at every possible level
  const responseObj = {
    // Top level
    blockchainAddress: blockchainAddress,
    address: blockchainAddress,
    
    // In data object
    data: {
      blockchainAddress: blockchainAddress
    },
    
    // In user object
    user: {
      blockchainAddress: blockchainAddress
    },
    
    // In nested objects
    nested: {
      blockchainAddress: blockchainAddress,
      deeper: {
        blockchainAddress: blockchainAddress
      }
    },
    
    // In an array of objects
    items: [
      { blockchainAddress: blockchainAddress },
      { blockchainAddress: blockchainAddress }
    ],
    
    // Additional metadata
    success: true,
    timestamp: new Date().toISOString()
  };
  
  // Convert to JSON string and back to ensure it's a plain object
  const jsonStr = JSON.stringify(responseObj);
  const finalResponse = JSON.parse(jsonStr);
  
  // Send plain JSON response
  return res.status(200).json(finalResponse);
}; 