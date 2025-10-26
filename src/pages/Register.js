import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import { userService } from '../services/userService';
import '../styles/Register.css';

const Register = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    dob: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const navigate = useNavigate();

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

const formatDateForAPI = (dateStr) => {
    if (!dateStr) return '';
    // Convert from YYYY-MM-DD (HTML date input format) to DD/MM/YYYY
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    // If already in DD/MM/YYYY format, ensure proper padding
    const [day, month, year] = dateStr.split('/');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters and trim
    return phone.replace(/\D/g, '').trim();
  };

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!userData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    // Email validation
    if (!userData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!userData.password) {
      errors.password = 'Password is required';
    }
    
    // Phone number validation
    const phoneNumber = normalizePhoneNumber(userData.phoneNumber);
    if (!phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid 10-digit Indian mobile number';
    }
    
    // Address validation
    if (!userData.address?.trim()) {
      errors.address = 'Address is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Normalize phone number (remove +91 and any formatting)
      const normalizedPhone = normalizePhoneNumber(userData.phoneNumber);
      
      // Format the date to YYYY-MM-DD before sending
      const userDataToSend = {
        ...userData,
        phoneNumber: normalizedPhone,
        dob: formatDateForAPI(userData.dob)
      };
      
      // Check if phone number already exists
      try {
        const phoneCheckResponse = await userService.checkPhoneNumber(normalizedPhone);
        if (phoneCheckResponse.exists) {
          const errorMsg = 'This phone number is already registered. Please use a different number or try logging in.';
          setFormErrors(prev => ({
            ...prev,
            phoneNumber: errorMsg
          }));
          // Show error in snackbar
          setSnackbarMessage(errorMsg);
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
          // Scroll to the phone number field
          document.getElementById('phoneNumber')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } catch (error) {
        console.error('Error checking phone number:', error);
        // Continue with registration if there's an error checking the phone number
        // The backend will still validate it
      }
      
      // Proceed with registration if phone number is unique
      await userService.register(userDataToSend);
      
      setSnackbarMessage('Profile created successfully! Redirecting to login...');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
      // Redirect after 2 seconds to show notification
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle different error cases
      if (error.message?.toLowerCase().includes('duplicate')) {
        if (error.message.toLowerCase().includes('email')) {
          setFormErrors(prev => ({
            ...prev,
            email: 'This email is already registered. Please use a different email or try logging in.'
          }));
          document.getElementById('email')?.scrollIntoView({ behavior: 'smooth' });
          return;
        } else if (error.message.toLowerCase().includes('phone')) {
          setFormErrors(prev => ({
            ...prev,
            phoneNumber: 'This phone number is already registered. Please use a different number or try logging in.'
          }));
          document.getElementById('phoneNumber')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      
      // For other errors, show in snackbar
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      width: '100%',
      paddingTop: '20px',
      minHeight: 'auto',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      marginTop: '-65px'
    }}>
      <Container maxWidth="md" sx={{ mt: 0 }}>
        <Paper 
          elevation={3} 
          className="login-paper" 
          sx={{ 
            p: 4,
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Create Account
          </Typography>
          <form onSubmit={handleRegister}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  name="name"
                  label="Name"
                  variant="outlined"
                  value={userData.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                  fullWidth
                  autoComplete="name"
                />
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  variant="outlined"
                  value={userData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                  fullWidth
                  autoComplete="email"
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={userData.password}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  required
                  fullWidth
                  autoComplete="new-password"
                  inputProps={{
                    autoComplete: 'new-password',
                    form: {
                      autoComplete: 'off',
                    },
                  }}
                />
                <TextField
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Phone Number"
                  variant="outlined"
                  value={userData.phoneNumber}
                  onKeyDown={(e) => {
                    if ([46, 8, 9, 27, 13].includes(e.keyCode) || 
                        (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) || 
                        (e.keyCode >= 35 && e.keyCode <= 40)) {
                      return;
                    }
                    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    handleChange({ target: { name: 'phoneNumber', value } });
                    if (formErrors.phoneNumber) {
                      setFormErrors(prev => ({
                        ...prev,
                        phoneNumber: undefined
                      }));
                    }
                  }}
                  error={!!formErrors.phoneNumber}
                  helperText={formErrors.phoneNumber}
                  required
                  fullWidth
                  autoComplete="tel"
                  placeholder="10-digit number"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 10,
                    type: 'tel'
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  name="address"
                  label="Address"
                  variant="outlined"
                  value={userData.address}
                  onChange={handleChange}
                  error={!!formErrors.address}
                  helperText={formErrors.address}
                  required
                  fullWidth
                  multiline
                  rows={2}
                />
                <TextField
                  name="dob"
                  label="Date of Birth"
                  type="date"
                  variant="outlined"
                  value={userData.dob}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    max: new Date().toISOString().split('T')[0]
                  }}
                  fullWidth
                />
              </Box>
              
              <input type="hidden" name="role" value="USER" />
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 1 }}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Register;
