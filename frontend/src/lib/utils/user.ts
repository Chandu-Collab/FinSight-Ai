// User management utilities
// Matches the user_data format used by expenses and income pages

export const getCurrentUserId = (): string => {
  // Try to get user_data from localStorage (matches expenses/income pattern)
  const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
  if (userData) {
    try {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData.id) {
        return parsedUserData.id;
      }
    } catch (error) {
      console.error('Error parsing user_data:', error);
    }
  }

  // Fallback to user_id field (for backward compatibility)
  const storedUserId = localStorage.getItem('user_id');
  if (storedUserId) {
    return storedUserId;
  }

  // Try session storage
  const sessionUserId = sessionStorage.getItem('user_id');
  if (sessionUserId) {
    return sessionUserId;
  }

  // For development/demo purposes only
  // In production, this should redirect to login or throw an error
  console.warn('No user ID found in storage. Using demo user ID for development.');
  return '05f70790-f66b-41e8-8a5a-e7befd3fa7f0'; // Match the original user ID
};

export const setCurrentUserId = (userId: string): void => {
  // Set both user_id and user_data for compatibility
  localStorage.setItem('user_id', userId);
  
  // Create user_data object format
  const userData = {
    id: userId,
    email: 'user@example.com',
    name: 'Demo User'
  };
  localStorage.setItem('user_data', JSON.stringify(userData));
  
  sessionStorage.setItem('user_id', userId);
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_data');
  sessionStorage.removeItem('user_id');
};

export const isAuthenticated = (): boolean => {
  // Check for user_data first (primary method)
  const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
  if (userData) {
    try {
      const parsedUserData = JSON.parse(userData);
      return !!parsedUserData.id;
    } catch (error) {
      return false;
    }
  }
  
  // Fallback to user_id
  return !!getCurrentUserId();
};

// Demo user data for development
export const DEMO_USERS = {
  '05f70790-f66b-41e8-8a5a-e7befd3fa7f0': {
    id: '05f70790-f66b-41e8-8a5a-e7befd3fa7f0',
    name: 'Demo User',
    email: 'demo@example.com'
  }
};

// Helper function to set up demo user for testing
export const setupDemoUser = (): void => {
  const demoUserId = '05f70790-f66b-41e8-8a5a-e7befd3fa7f0';
  setCurrentUserId(demoUserId);
  console.log('✅ Demo user set up with ID:', demoUserId);
};
