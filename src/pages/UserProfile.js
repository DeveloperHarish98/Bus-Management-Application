import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  Grid, 
  Snackbar, 
  Alert,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Home as HomeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { log as logger } from '../utils/logger';

const UserProfile = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    dob: '',
    role: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });



  // Format date for display (dd/MM/yyyy)
  const formatDateForDisplay = React.useCallback((dateInput) => {
    if (!dateInput) return '';
    
    // If input is a LocalDate object (from Java backend)
    if (dateInput && typeof dateInput === 'object' && 'year' in dateInput && 'monthValue' in dateInput && 'dayOfMonth' in dateInput) {
      const day = String(dateInput.dayOfMonth).padStart(2, '0');
      const month = String(dateInput.monthValue).padStart(2, '0');
      const year = dateInput.year;
      return `${day}/${month}/${year}`;
    }
    
    // If already a string
    if (typeof dateInput === 'string') {
      // If the date is already in dd/MM/yyyy format, return as is
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
        return dateInput;
      }
      
      // Handle yyyy-MM-dd format (from database)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-');
        return `${day}/${month}/${year}`; // Convert to dd/MM/yyyy
      }
      
      // Handle old format (dd-MM-yyyy) if it exists
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateInput)) {
        return dateInput.replace(/-/g, '/');
      }
    }
    
    // For any other format, try to parse it as a date
    try {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.warn('Error parsing date:', e);
      return '';
    }
    
    return '';
  }, []); // Empty dependency array as it doesn't depend on any props or state

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const credentials = JSON.parse(sessionStorage.getItem('credentials') || '{}');
        
        logger.debug('Stored user data:', storedUser);
        logger.debug('Credentials from session:', credentials);
        
        // Function to create user data object with default values
        const createUserData = (data, isFromStorage = false) => {
          if (!data) return null;
          
          logger.debug('Creating user data from:', data);
          logger.debug(`DOB in createUserData input: ${data.dob}, type: ${typeof data.dob}`);
          
          // Handle null/undefined DOB
          if (data.dob === null || data.dob === undefined) {
            return {
              id: data.id || '',
              name: data.name || '',
              email: data.email || '',
              phoneNumber: data.phoneNumber || '',
              address: data.address || '',
              dob: '',
              role: data.role || 'USER'
            };
          }
          
          // Only format the date for display if it's not already in the display format
          // and we're not loading from localStorage
          let formattedDob = data.dob;
          if (data.dob && !isFromStorage) {
            formattedDob = formatDateForDisplay(data.dob);
          }
          
          logger.debug('Formatted DOB:', formattedDob);
          
          const userData = {
            id: data.id || '',
            name: data.name || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            address: data.address || '',
            dob: formattedDob,
            role: data.role || 'USER'
          };
          
          logger.debug('Created user data:', userData);
          return userData;
        };
        
        // Try to fetch fresh data if we have credentials
        if (credentials?.email && credentials?.password) {
          try {
            logger.debug('Attempting to fetch fresh user data...');
            const response = await userService.verifyByEmail(credentials.email, credentials.password);
            logger.debug('User data from API:', response?.data);
            
            if (response?.data) {
              const updatedUserData = createUserData(response.data);
              if (updatedUserData) {
                console.log('Updated user data for state:', updatedUserData);
                setProfileData(updatedUserData);
                localStorage.setItem('user', JSON.stringify(updatedUserData));
                setSnackbar({ 
                  open: true, 
                  message: 'Profile loaded successfully', 
                  severity: 'success' 
                });
                return;
              }
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setSnackbar({ 
              open: true, 
              message: 'Error loading profile. Using cached data.', 
              severity: 'warning' 
            });
          }
        }
        
        // Fallback to stored user data in localStorage if available
        if (storedUser && Object.keys(storedUser).length > 0) {
          console.log('Using stored user data');
          const userData = createUserData(storedUser);
          if (userData) {
            setProfileData(userData);
          }
        } else if (user) {
          // Fallback to user data from auth context
          console.log('Using user data from auth context');
          setProfileData(createUserData(user));
        } else {
          console.log('No user data available');
          setSnackbar({ open: true, message: 'Please login to view your profile', severity: 'error' });
        }
      } catch (error) {
        logger.error('Failed to fetch user profile:', error);
        setSnackbar({ open: true, message: 'Failed to load profile data. Please try again.', severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, formatDateForDisplay]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for date input
    if (name === 'dob') {
      // Only allow digits and slashes, and limit length to 10 characters (dd/MM/yyyy)
      const cleanedValue = value.replace(/[^\d/]/g, '').slice(0, 10);
      
      // Auto-format as user types (dd/MM/yyyy)
      let formattedValue = '';
      const numbers = cleanedValue.replace(/\D/g, '');
      
      if (numbers.length > 0) {
        formattedValue = numbers.slice(0, 2);
        if (numbers.length > 2) {
          formattedValue += '/' + numbers.slice(2, 4);
          if (numbers.length > 4) {
            formattedValue += '/' + numbers.slice(4, 8);
          }
        }
      }
      
      setProfileData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    
    // For all other fields
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date for backend (dd-MM-yyyy format)
  // This function is kept for potential future use
  // and will be exported if needed by other components
  // eslint-disable-next-line no-unused-vars
  const formatDateForBackend = (dateString) => {
    if (!dateString) return '';
    // Implementation remains the same for future use
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateString;
      }
      return '';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };



  /**
   * Validates if a date string is in dd/MM/yyyy format
   * @param {string} dateString - The date string to validate
   * @returns {boolean} True if valid, false otherwise
   */
  const isValidDate = (dateString) => {
    if (!dateString) return false;
    
    // Check format dd/MM/yyyy
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    // Parse the date components
    const [day, month, year] = dateString.split('/').map(Number);
    
    // Check if the date is valid
    const date = new Date(year, month - 1, day);
    return (
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate date format before sending
      if (profileData.dob && !isValidDate(profileData.dob)) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid date in DD/MM/YYYY format',
          severity: 'error'
        });
        setIsSaving(false);
        return;
      }
      
      // Format the date to match backend's expected format (dd/MM/yyyy)
      let formattedDob = null;
      if (profileData.dob) {
        // Ensure the date is in the correct format (dd/MM/yyyy)
        const [day, month, year] = profileData.dob.split('/');
        if (day && month && year) {
          formattedDob = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        } else {
          // If splitting by '/' doesn't work, try splitting by '-' (for backward compatibility)
          const altParts = profileData.dob.split('-');
          if (altParts.length === 3) {
            formattedDob = `${altParts[0].padStart(2, '0')}/${altParts[1].padStart(2, '0')}/${altParts[2]}`;
          }
        }
      }

      // Prepare the update data - ensure all required fields are included
      const updateData = {
        id: profileData.id,
        name: profileData.name || '',
        email: profileData.email || '',
        phoneNumber: profileData.phoneNumber || '',
        address: profileData.address || '',
        dob: formattedDob || '', // Use the formatted date or empty string
        role: profileData.role || 'USER'
      };
      
      // Log the data being sent for debugging
      console.log('Sending update data:', updateData);
      
      // Log minimal debug info in production, more in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('Sending update data to backend:', updateData);
      }

      // Call the update API
      let response;
      try {
        response = await userService.updateUser(updateData);
        
        if (process.env.NODE_ENV === 'development') {
          console.debug('Update API response received:', response);
        }
        
        // The backend returns { data: { user data }, statusCode, message }
        const responseData = response.data || {};
        const userData = responseData.data || responseData; // Handle both nested and direct user data
        
        if (userData) {
          // Ensure we have a consistent user object with all required fields
          const updatedUser = {
            id: userData.id || profileData.id,
            name: userData.name || profileData.name,
            email: userData.email || profileData.email,
            phoneNumber: userData.phoneNumber || userData.phone || profileData.phoneNumber,
            address: userData.address || profileData.address || '',
            dob: userData.dob || profileData.dob || '',
            role: (userData.role || profileData.role || 'USER').toUpperCase()
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.debug('Updated user data for storage');
          }
          
          // Store the complete user data in localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Ensure we have a properly formatted display user
          const displayUser = {
            ...updatedUser,
            // Format the date for display if it exists (convert to dd/MM/yyyy)
            dob: updatedUser.dob ? formatDateForDisplay(updatedUser.dob).replace(/-/g, '/') : ''
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.debug('Display user data updated:', displayUser);
          }
          
          // Update the auth context if user and setUser exists
          if (user && typeof setUser === 'function') {
            try {
              setUser(displayUser);
            } catch (error) {
              console.warn('Failed to update auth context:', error);
              // Continue even if updating auth context fails
            }
          }
          
          // Update the local state with the formatted data
          setProfileData(displayUser);
          
          setSnackbar({
            open: true,
            message: responseData.message || 'Profile updated successfully',
            severity: 'success'
          });
          
          // Reset editing mode
          setIsEditing(false);
          return; // Exit successfully
        }
      } catch (error) {
        console.error('API Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data
          }
        });
        throw error; // Re-throw to be caught by the outer catch block
      }
    } catch (error) {
      console.error('Update profile error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      logger.error('Failed to update profile', error);
      
      // Show more detailed error message in development
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Error: ${error.message}${error.response?.data?.message ? ` - ${error.response.data.message}` : ''}`
        : 'Failed to update profile. Please try again.';
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };



  const handleCancel = () => {
    // Reset form data when canceling
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setProfileData({
      id: storedUser.id || '',
      name: storedUser.name || '',
      email: storedUser.email || '',
      phoneNumber: storedUser.phoneNumber || '',
      address: storedUser.address || '',
      dob: storedUser.dob ? formatDateForDisplay(storedUser.dob) : '',
      role: storedUser.role || 'USER'
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Header Section */}
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          p: { xs: 1.5, sm: 2 },
          position: 'relative',
          height: 140
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-end' },
            position: 'relative',
            zIndex: 1,
            height: '100%',
            pt: 8
          }}>
            <Avatar 
              sx={{ 
                width: 90, 
                height: 90, 
                bgcolor: 'white',
                color: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold',
                border: '3px solid white',
                boxShadow: 2,
                position: 'absolute',
                top: { xs: -45, sm: -45 },
                left: { xs: '50%', sm: 16 },
                transform: { xs: 'translateX(-50%)', sm: 'none' },
                '&:hover': {
                  transform: { xs: 'translateX(-50%) scale(1.05)', sm: 'scale(1.05) translateY(-3px)' },
                  transition: 'all 0.2s ease'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {profileData.name ? profileData.name[0].toUpperCase() : 'U'}
            </Avatar>
            
            <Box sx={{ 
              ml: { sm: 20 },
              textAlign: { xs: 'center', sm: 'left' },
              width: '100%'
            }}>
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 'bold',
                mb: 0.5
              }}>
                {profileData.name || 'User Profile'}
              </Typography>
              <Chip 
                label={profileData.role || 'User'} 
                color="secondary"
                size="small"
                sx={{ 
                  color: 'white',
                  fontWeight: 'medium',
                  mb: 1
                }}
              />
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                Member since {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
            
            {!isEditing ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setIsEditing(true)}
                startIcon={<EditIcon />}
                sx={{ 
                  bgcolor: 'white',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    color: 'white'
                  },
                  minWidth: 150,
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: 2,
                  mt: { xs: 2, sm: 0 }
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, sm: 0 } }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCancel}
                  disabled={isSaving}
                  startIcon={<CancelIcon />}
                  sx={{ 
                    minWidth: 120,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    },
                    '&.Mui-disabled': {
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Profile Content */}
        <Box sx={{ p: { xs: 1.5, sm: 2.5 }, pt: { xs: 4, sm: 5 } }}>
          <Grid container spacing={3}>
            {/* Left Column - Personal Information */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'text.secondary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    pb: 1,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <PersonIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                    Personal Information
                  </Typography>
                  
                  <Box sx={{ '& > *:not(:last-child)': { mb: 3 } }}>
                    {/* Name Field */}
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                        Full Name
                      </Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <Typography variant="body1">
                          {profileData.name || 'Not provided'}
                        </Typography>
                      )}
                    </Box>


                    {/* Email Field */}
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        {profileData.email || 'Not provided'}
                      </Typography>
                    </Box>

                    {/* Phone Number Field */}
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                        Phone Number
                      </Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="phoneNumber"
                          value={profileData.phoneNumber}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <Typography variant="body1">
                          {profileData.phoneNumber || 'Not provided'}
                        </Typography>
                      )}
                    </Box>

                    {/* Date of Birth Field */}
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                        Date of Birth
                      </Typography>
                      {isEditing ? (
                        <Box>
                          <TextField
                            fullWidth
                            name="dob"
                            value={profileData.dob || ''}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            placeholder="DD-MM-YYYY"
                            InputLabelProps={{
                              shrink: true,
                            }}
                            inputProps={{
                              maxLength: 10,
                              pattern: '\\\\d{2}-\\\\d{2}-\\\\d{4}'
                            }}
                            error={!!(profileData.dob && !isValidDate(profileData.dob))}
                            helperText={profileData.dob && !isValidDate(profileData.dob) 
                              ? 'Invalid date format (DD-MM-YYYY)' 
                              : profileData.dob 
                                ? `Preview: ${formatDateForDisplay(profileData.dob)}` 
                                : 'Enter date in DD-MM-YYYY format'}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body1">
                          {profileData.dob ? formatDateForDisplay(profileData.dob) : 'Not set'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - Address */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'text.secondary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    pb: 1,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <HomeIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                    Address Information
                  </Typography>
                  
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                      Address
                    </Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        multiline
                        rows={4}
                        placeholder="Enter your address"
                      />
                    ) : (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {profileData.address || 'Not provided'}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ 
            width: '100%', 
            backgroundColor: '#fff', 
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserProfile;
