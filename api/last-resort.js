// Super simple endpoint that does nothing but return blockchainAddress
module.exports = (req, res) => {
  // Hard-coded blockchain address - no generation, just a fixed value
  const blockchainAddress = "0x1234567890abcdef1234567890abcdef12345678";
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Create the most basic possible response
  const response = {
    blockchainAddress: blockchainAddress,
    success: true
  };
  
  // Send the response directly
  return res.status(200).json(response);
}; 