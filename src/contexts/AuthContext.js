import React, { createContext, useState, useEffect, useContext } from 'react';
import { logout as logoutApi } from '../services/api';
import logger from '../utils/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initial load
  useEffect(() => {
    let isMounted = true;
    
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Basic validation of stored user data
          if (userData && userData.id && userData.email) {
            setUser(userData);
          } else {
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUser();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    logger.debug('Starting login process');
    
    try {
      // Clear any existing user data
      localStorage.removeItem('user');
      setUser(null);
      
      const response = await fetch('http://localhost:8080/users/verifyByEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Origin': 'http://localhost:3001'
        },
        body: new URLSearchParams({ email, password }),
        credentials: 'omit',
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Login API error');
        throw new Error(errorData.message || 'Login failed');
      }
      
      const userData = await response.json();
      
      if (!userData) {
        logger.error('No user data received from login API');
        throw new Error('No user data received');
      }
      
      const actualUserData = userData.data || userData;
      const possibleRoleFields = ['role', 'userType', 'type', 'isAdmin', 'user_role'];
      let userRole = 'USER'; // Default to uppercase
      
      for (const field of possibleRoleFields) {
        if (actualUserData[field] !== undefined) {
          userRole = typeof actualUserData[field] === 'string' 
            ? actualUserData[field].toUpperCase() 
            : actualUserData[field];
          break;
        }
      }
      
      actualUserData.role = userRole;
      
      if (!actualUserData.id || !actualUserData.email) {
        logger.error('Invalid user data structure received');
        throw new Error('Invalid user data received from server');
      }
      
      logger.info('Login successful');
      
      localStorage.setItem('user', JSON.stringify(actualUserData));
      setUser(actualUserData);
      return actualUserData;
      
    } catch (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        status: error.response?.status,
        statusText: error.response?.statusText,
        hasResponseData: !!error.response?.data
      };
      logger.error('Login error:', errorDetails);
      
      localStorage.removeItem('user');
      setUser(null);
      let errorMessage = 'Login failed. Please try again.';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (error.response.status === 0) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('user');
      setUser(null);
      
      try {
        await logoutApi();
      } catch (apiError) {
        console.error('Logout API error (non-critical):', apiError);
      }
      
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
};

export const useAuth = () => {
  return useContext(AuthContext);
};
