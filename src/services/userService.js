import api from './api';
import logger from '../utils/logger';

export const userService = {
  // User Login and Verification
  loginUser: async (email, password) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const response = await api.post('/users/verifyByEmail', null, {
        params: { email, password }
      });
      
      if (!response.data) {
        throw new Error('No user data received');
      }
      
      // Return a safe copy of the user data
      const userData = response.data;
      if (userData) {
        // Remove sensitive data before returning
        const { password: _, ...safeUserData } = userData;
        return safeUserData;
      }
      
      return userData;
    } catch (error) {
      // Don't expose error details in production
      const errorMessage = process.env.NODE_ENV === 'production'
        ? 'Login failed. Please check your credentials and try again.'
        : error.message || 'Login failed. Please try again.';
      
      // Log a generic error message
      logger.error('Login failed');
      
      throw new Error(errorMessage);
    }
  },

  // Verify user by email
  verifyByEmail: (email, password) => 
    api.post('/users/verifyByEmail', null, { 
      params: { email, password } 
    }),
  
  // Verify user by phone
  verifyByPhone: (phoneNumber, password) => 
    api.post('/users/verifyByPhone', null, { 
      params: { phoneNumber, password } 
    }),

  // User Registration
  register: async (userData) => {
    try {
      const response = await api.post('/users', userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Registration failed. Please try again.';
      
      throw new Error(errorMessage);
    }
  },

  // Get User Profile
  getUserProfile: () => api.get('/users/profile'),

  // Update User Profile
  updateUser: async (userData) => {
    try {
      if (!userData || !userData.id) {
        throw new Error('User ID is required for update');
      }
      
      // Format the data to match backend expectations
      const formattedData = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phone || userData.phoneNumber,
        address: userData.address || '',
        role: userData.role ? String(userData.role).toUpperCase() : 'USER',
        dob: userData.dob || ''
      };
      
      const response = await api.put('/users', formattedData);
      
      // Remove sensitive data before returning
      const { password: _, ...updatedUser } = response.data;
      return updatedUser;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error updating user profile';
      logger.error('Error updating user profile:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Delete User
  deleteUser: (userId) => api.delete(`/users/${userId}`),

  // Get All Users
  getAllUsers: () => api.get('/users'),

  // Get User by ID
  getUserById: (userId) => api.get(`/users/${userId}`),
  
  // Find user by phone number
  findByPhoneNumber: (phoneNumber) => 
    api.post('/users/findByPhoneNumber', null, { 
      params: { phoneNumber } 
    }),
    
  // Get user by email
  getUserByEmail: async (email) => {
    return await api.get(`/users/email/${email}`);
  },

  // Check if phone number already exists
  checkPhoneNumber: async (phoneNumber) => {
    try {
      if (!phoneNumber) {
        return { exists: false };
      }
      
      // Normalize the phone number (remove all non-digit characters)
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      
      // Try to find user by phone number
      const response = await api.get(`/users/phone/${normalizedPhone}`);
      
      // If we get a successful response and user data exists, phone is in use
      return { 
        exists: !!response.data,
        user: response.data 
      };
    } catch (error) {
      // If user not found (404) or other error, treat as available
      if (error.response?.status === 404) {
        return { exists: false };
      }
      
      return { exists: false };
    }
  }
};