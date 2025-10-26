import axios from 'axios';
import logger from '../utils/logger';

// Set your backend URL here
const API_BASE_URL = 'http://localhost:8080';

// Only log in development
if (process.env.NODE_ENV === 'development') {
  logger.debug('API Service Initialized');
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // We'll handle credentials manually for now
});

// Request interceptor to conditionally add auth tokens and handle logging
api.interceptors.request.use(
  (config) => {
    // Create a safe version of config for logging
    const safeConfig = { ...config };
    
    // Skip auth for public endpoints or when _skipAuth flag is set
    const publicEndpoints = ['/auth/login', '/auth/register', '/users/verifyByEmail', '/auth/refresh-token'];
    const isPublic = publicEndpoints.some(endpoint => config.url.includes(endpoint)) || config._skipAuth;

    if (isPublic) {
      // For public endpoints, we can log more details
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`API Request (Public): ${config.method?.toUpperCase()} ${config.url}`, safeConfig);
      }
      return config;
    }

    // For authenticated requests, add the auth token
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user?.token;
    const jwt = user?.jwt;

    // Add JWT if available, otherwise use basic token
    if (jwt) {
      config.headers.Authorization = `Bearer ${jwt}`;
      safeConfig.headers = { ...safeConfig.headers, Authorization: '[REDACTED]' };
    } else if (token) {
      config.headers.Authorization = `Basic ${btoa(token + ':')}`;
      safeConfig.headers = { ...safeConfig.headers, Authorization: '[REDACTED]' };
    }
    
    // Log request info in development
    if (process.env.NODE_ENV === 'development') {
      // Add request ID for correlation
      const requestId = Math.random().toString(36).substring(2, 9);
      safeConfig.requestId = requestId;
      
      // For non-GET requests, we can log a bit more info
      if (config.method?.toUpperCase() !== 'GET' && config.data) {
        // Only log data for non-sensitive endpoints
        const sensitiveEndpoints = ['/auth', '/users'];
        const isSensitive = sensitiveEndpoints.some(ep => config.url?.includes(ep));
        
        if (!isSensitive) {
          safeConfig.data = config.data;
        } else {
          safeConfig.data = '[REDACTED - SENSITIVE]';
        }
      }
      
      logger.debug(`API Request [${requestId}]: ${config.method?.toUpperCase()} ${config.url}`, safeConfig);
      
      // Store the request ID in the config for response logging
      config.requestId = requestId;
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Helper function to create a safe version of the response for logging
const createSafeResponseLog = (response) => {
  if (!response) return null;
  
  const requestId = response.config?.requestId;
  const safeResponse = {
    status: response.status,
    statusText: response.statusText,
    url: response.config?.url,
    method: response.config?.method?.toUpperCase() || 'UNKNOWN',
    requestId,
    // Don't log response data by default as it may contain sensitive information
    data: '[REDACTED]'
  };
  
  // For non-sensitive endpoints, we can log more details
  const sensitiveEndpoints = ['/users', '/auth', '/profile', '/tickets'];
  const isSensitive = response.config?.url && 
    sensitiveEndpoints.some(ep => response.config.url.includes(ep));
  
  if (!isSensitive && response.data) {
    // Only include non-sensitive data
    if (Array.isArray(response.data)) {
      // For arrays, just log the count
      safeResponse.data = `[Array of ${response.data.length} items]`;
    } else if (typeof response.data === 'object') {
      // For objects, include keys but not values
      safeResponse.data = `{${Object.keys(response.data).join(', ')}}`;
    } else {
      // For other types, include the type
      safeResponse.data = `[${typeof response.data}]`;
    }
  }
  
  return safeResponse;
};

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      const safeResponse = createSafeResponseLog(response);
      logger.debug('API Response:', safeResponse);
    }
    return response;
  },
  async (error) => {
    // Create a safe error object for logging
    const safeError = {
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        // Don't include headers or data in the log
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        // Don't include response data in the log
      } : undefined,
      isAxiosError: error.isAxiosError
    };

    // Log the error in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('API Error:', safeError);
    } else {
      // In production, only log a generic error message
      logger.error('API Request Failed:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status
      });
    }

    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh JWT if refresh token exists
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.refreshToken) {
          // Don't log the refresh token request/response
          const response = await api({
            method: 'post',
            url: '/auth/refresh-token',
            data: { refreshToken: user.refreshToken },
            _skipAuth: true // Add a custom flag to skip auth for this request
          });
          
          if (response.data?.jwt) {
            // Update stored tokens
            const updatedUser = { ...user, jwt: response.data.jwt };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.jwt}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear auth data and redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // Handle other errors
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        message: error.response.data?.message || 'An error occurred'
      });
    } else if (error.request) {
      console.error('No response from server. Please check your connection.');
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth related endpoints
export const login = async (credentials) => {
  try {
    logger.debug('Attempting login with email:', credentials.email);
    
    // Create URL-encoded form data
    const params = new URLSearchParams();
    params.append('email', credentials.email);
    params.append('password', credentials.password);
    
    logger.debug('Sending login request to backend...');
    
    // Try both endpoints - first try /auth/login, fall back to /users/verifyByEmail
    let response;
    let endpoint = `${API_BASE_URL}/auth/login`;
    
    try {
      // First try with /auth/login
      response = await axios.post(
        endpoint,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3001'
          },
          withCredentials: false,
          timeout: 10000, // 10 second timeout
          mode: 'cors', // Ensure CORS mode
          credentials: 'same-origin' // Don't send credentials with CORS
        }
      );
      logger.debug('Login successful with /auth/login endpoint');
    } catch (firstTryError) {
      logger.debug('First login attempt failed, trying fallback endpoint...', firstTryError.message);
      
      // If first attempt fails, try with the verifyByEmail endpoint
      endpoint = `${API_BASE_URL}/users/verifyByEmail`;
      response = await axios.post(
        endpoint,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3001'
          },
          withCredentials: false,
          timeout: 10000, // 10 second timeout
          mode: 'cors', // Ensure CORS mode
          credentials: 'same-origin' // Don't send credentials with CORS
        }
      );
      logger.debug('Login successful with fallback endpoint');
    }
    
    logger.debug('Login response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data ? 'Received response data' : 'No data in response'
    });
    
    // Handle different response formats
    let userData = null;
    
    // Case 1: Direct user data in response
    if (response.data && response.data.id) {
      userData = response.data;
      logger.debug('Using direct user data from response');
    } 
    // Case 2: Nested data property
    else if (response.data && response.data.data) {
      userData = response.data.data;
      logger.debug('Using nested user data from response');
      
      // Include token if it's at the root level
      if (response.data.token) {
        userData.token = response.data.token;
        logger.debug('Included root-level token');
      }
    }
    
    if (userData) {
      // Ensure we have required fields
      if (!userData.id || !userData.email) {
        throw new Error('Invalid user data received from server');
      }
      
      // Store user data in localStorage
      const userToStore = {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: userData.role || 'user',
        token: userData.token
      };
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      return userToStore;
    }
    
    // If we get here, the response format is unexpected
    console.error('Unexpected login response format:', response.data);
    throw new Error('Invalid server response');
    
  } catch (error) {
    console.error('Login API error:', error);
    
    // Handle different error formats
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      if (status === 401) {
        throw new Error('Invalid email or password');
      } else if (status === 400) {
        throw new Error(data.message || 'Invalid request');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (data && data.message) {
        throw new Error(data.message);
      }
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from server. Please check your connection.');
    }
    
    // Something happened in setting up the request that triggered an Error
    throw new Error(error.message || 'Login failed. Please try again.');
  }
};

export const verifyUser = async () => {
  try {
    const response = await api.get('/users/me');
    
    // Handle the response format: { data: { ...userData }, statusCode, message }
    if (response.data && response.data.data) {
      const userData = response.data.data;
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
    
    throw new Error(response.data?.message || 'Failed to verify user');
  } catch (error) {
    console.error('Error verifying user session:', error);
    // Don't logout here, let the caller handle it
    throw error;
  }
};

export const logout = async () => {
  try {
    // Use fetch directly to avoid CORS issues with credentials
    const response = await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'omit', // Don't send credentials to avoid CORS issues
      mode: 'cors'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Logout failed:', response.status, errorData);
      throw new Error(errorData.message || 'Logout failed');
    }

    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// User related endpoints
export const fetchUser = (userId) => {
  return api.get(`/users/${userId}`);
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// Bus and Route related endpoints
export const fetchAllBuses = () => {
  return api.get('/buses');
};

export const fetchRouteDetails = () => {
  return api.get('/buses/routes');
};

export const searchBuses = (searchData) => {
  logger.debug('Searching buses with data:', searchData);
  // The date should already be in DD/MM/YYYY format from the BusSearch component
  return api.post('/buses/search', searchData);
};

export const getBusById = (id) => {
  return api.get(`/buses/id/${id}`);
};

// Seat selection functionality has been removed

export const createTicket = async (ticketData) => {
  try {
    const response = await api.post('/tickets', ticketData);
    
    // Log the raw response for debugging
    logger.debug('Raw API response:', JSON.stringify(response, null, 2));
    
    // Handle different response formats
    const responseData = response.data || response;
    
    if (!responseData) {
      throw new Error('Empty response from server');
    }
    
    // Return a consistent response format
    return {
      success: true,
      bookingId: responseData.bookingId || responseData.id || responseData.ticketId,
      ...responseData
    };
    
  } catch (error) {
    console.error('Error in createTicket:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    });
    
    // Create a more informative error
    const errorMessage = error.response?.data?.message || 
                       error.message || 
                       'Failed to create ticket. Please try again.';
    
    const apiError = new Error(errorMessage);
    apiError.status = error.response?.status || 500;
    apiError.response = error.response?.data;
    
    throw apiError;
  }
};

export const getTicketsByBusNumber = (busNumber) => {
  return api.get(`/buses/listofTickets/${busNumber}`);
};

// Export the axios instance as default
export default api;

// Admin endpoints
export const adminService = {
  // User management
  getAllUsers: () => api.get('/admin/users'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  
  // Bus management
  getAllBuses: () => api.get('/admin/buses'),
  createBus: (busData) => api.post('/admin/buses', busData),
  updateBus: (busId, busData) => api.put(`/admin/buses/${busId}`, busData),
  deleteBus: (busId) => api.delete(`/admin/buses/${busId}`),
  
  // Ticket management
  getAllTickets: () => api.get('/admin/tickets'),
  getTicket: (ticketId) => api.get(`/admin/tickets/${ticketId}`),
  cancelTicket: (ticketId) => api.put(`/admin/tickets/${ticketId}/cancel`),
  
  // Dashboard stats
  getDashboardStats: () => api.get('/admin/dashboard/stats')
};

// Export individual services for named imports
export const authService = {
  login,
  verifyUser,
  logout
};

export const busService = {
  fetchAllBuses,
  fetchRouteDetails,
  searchBuses,
  getBusById
};

export const getMyBookings = async (phoneNumber) => {
  try {
    const response = await api.get(`/tickets/my-bookings?phoneNumber=${encodeURIComponent(phoneNumber)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const ticketService = {
  createTicket,
  getTicketsByBusNumber,
  getMyBookings
};

export const userService = {
  fetchUser,
  getCurrentUser
};
