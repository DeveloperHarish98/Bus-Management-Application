import React, { createContext, useState, useEffect, useContext } from 'react';
import api from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error('Failed to parse user data:', error);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Login with either email/password or token
   * @param {Object} credentials - Can be {email, password} or {token}
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      let response;
      
      // Clear any existing user data
      localStorage.removeItem('user');
      setUser(null);
      
      // If using token authentication
      if (credentials.token) {
        response = await api.post('/auth/token', { token: credentials.token });
        // Store basic token auth
        const userData = {
          token: credentials.token,
          ...response.data.user
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      } 
      // If using JWT authentication
      else if (credentials.email && credentials.password) {
        response = await api.post('/auth/login', {
          email: credentials.email,
          password: credentials.password
        });
        // Store JWT tokens
        const userData = {
          jwt: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData.user);
        return userData.user;
      } else {
        throw new Error('Invalid credentials format');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout and clear all auth data
   */
  const logout = async () => {
    try {
      // Call logout endpoint if JWT is being used
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.jwt) {
        try {
          await api.post('/auth/logout', { refreshToken: user.refreshToken });
        } catch (error) {
          console.error('Logout API call failed:', error);
        }
      }
    } finally {
      // Clear all auth data
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  /**
   * Get current user from state
   */
  const getCurrentUser = () => {
    return user;
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => {
    return !!user;
  };

  /**
   * Refresh JWT token
   */
  const refreshToken = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData?.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/refresh-token', {
        refreshToken: userData.refreshToken
      });
      
      // Update stored tokens
      const updatedUser = {
        ...userData,
        jwt: response.data.accessToken,
        refreshToken: response.data.refreshToken || userData.refreshToken
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser.user || updatedUser);
      
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  const value = {
    user: getCurrentUser(),
    login,
    logout,
    isAuthenticated,
    refreshToken,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
