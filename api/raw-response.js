// Raw response handler with no dependencies on libraries
module.exports = (req, res) => {
  // Set the content type explicitly
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }
  
  // Create a response with blockchainAddress
  const responseObject = {
    blockchainAddress: '0x9876543210abcdef9876543210abcdef98765432',
    success: true,
    message: 'Raw response test',
    data: {
      blockchainAddress: '0x9876543210abcdef9876543210abcdef98765432'
    }
  };
  
  // Stringify it manually
  const responseString = JSON.stringify(responseObject);
  
  // Set status code
  res.statusCode = 200;
  
  // Send the raw response
  return res.end(responseString);
}; 