// Authentication Module
const Auth = (function() {
  // Base URL for API calls - use window.location.origin for cross-browser compatibility
  const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3001' 
    : window.location.origin;
  
  // Get authentication token from storage
  function getToken() {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Found auth token (masked): ' + token.substring(0, 8) + '...');
    } else {
      console.log('No auth token found');
    }
    return token;
  }
  
  // Check if user is logged in
  function isLoggedIn() {
    return !!getToken();
  }
  
  // Save user data in localStorage
  function saveUser(userData) {
    if (!userData) return;
    
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('User data saved to localStorage');
  }
  
  // Get current user data
  function getUser() {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      
      // Ensure user has a blockchainAddress
      if (!user.blockchainAddress) {
        user.blockchainAddress = '0x' + Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        // Save it back to localStorage
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Added missing blockchainAddress to user:', user.blockchainAddress);
      }
      
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  
  // Get current user data (for internal use)
  function getCurrentUser() {
    return getUser();
  }
  
  // Login user
  async function login(email, password) {
    try {
      console.log(`Logging in user: ${email}`);
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      console.log('Login response:', data);
      
      // Save token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Auth token saved');
      }
      
      // Ensure user data has blockchainAddress
      let userData = data.data || {};
      if (!userData.blockchainAddress && data.blockchainAddress) {
        userData.blockchainAddress = data.blockchainAddress;
      } else if (!userData.blockchainAddress) {
        // Generate address if not present anywhere
        userData.blockchainAddress = '0x' + Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        console.log('Generated blockchainAddress for login:', userData.blockchainAddress);
      }
      
      if (userData) {
        saveUser(userData);
      }
      
      // Dispatch custom event for auth status change
      window.dispatchEvent(new CustomEvent('auth-status-changed', { 
        detail: { isLoggedIn: true, user: userData } 
      }));
      
      return {
        success: true,
        user: userData
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Register new user
  async function register(username, email, password) {
    try {
      console.log(`Registering new user: ${username} (${email})`);
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      console.log('Registration response:', data);
      
      // Save token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Auth token saved');
      }
      
      // Ensure user data has blockchainAddress
      let userData = data.data || {};
      if (!userData.blockchainAddress && data.blockchainAddress) {
        userData.blockchainAddress = data.blockchainAddress;
      } else if (!userData.blockchainAddress) {
        // Generate address if not present anywhere
        userData.blockchainAddress = '0x' + Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        console.log('Generated blockchainAddress for registration:', userData.blockchainAddress);
      }
      
      if (userData) {
        saveUser(userData);
      }
      
      // Dispatch custom event for auth status change
      window.dispatchEvent(new CustomEvent('auth-status-changed', { 
        detail: { isLoggedIn: true, user: userData } 
      }));
      
      return {
        success: true,
        user: userData
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Logout user
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('User logged out, auth data cleared');
    
    // Dispatch custom event for auth status change
    window.dispatchEvent(new CustomEvent('auth-status-changed', { 
      detail: { isLoggedIn: false } 
    }));
  }
  
  // Update the current user data in storage
  function updateCurrentUser(userData) {
    if (!userData) return false;
    
    try {
      // Get existing data first
      const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Ensure blockchainAddress exists - either from the update or from existing data
      if (!userData.blockchainAddress && !existingUser.blockchainAddress) {
        userData.blockchainAddress = '0x' + Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        console.log('Generated new blockchainAddress during update:', userData.blockchainAddress);
      }
      
      // Merge the new data with existing data
      const updatedUser = { ...existingUser, ...userData };
      
      // Store updated user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('User data updated:', updatedUser);
      
      // Dispatch event to notify the rest of the app that user data has changed
      window.dispatchEvent(new CustomEvent('user-data-updated', { 
        detail: { user: updatedUser } 
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  }
  
  // Return public methods
  return {
    login,
    register,
    logout,
    isLoggedIn,
    getToken,
    getUser,
    getCurrentUser,
    updateCurrentUser
  };
})(); 