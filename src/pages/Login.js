import React, { useState } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
// import { userService } from '../services/api.js';
import '../styles/Login.css';
import logger from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear any previous messages
    setOpenSnackbar(false);
    
    // Basic validation
    if (!email || !password) {
      setSnackbarMessage('Please enter both email and password');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnackbarMessage('Please enter a valid email address');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Attempting to login with:', { email });
      
      // Use AuthContext login method with credentials
      const response = await fetch('http://localhost:8080/users/verifyByEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({ email, password }),
        credentials: 'omit',
        mode: 'cors'
      });
      
      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }
      
      const userData = await response.json();
      
      if (!userData) {
        throw new Error('No user data received');
      }
      
      // Handle different response formats
      const actualUserData = userData.data || userData;
      
      if (!actualUserData.id || !actualUserData.email) {
        throw new Error('Invalid user data received from server');
      }
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(actualUserData));
      
      // Update auth context
      await login(email, password);
      
      logger.info('Login successful');
      setSnackbarMessage('Login successful! Redirecting...');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Login error in component:', error);
      
      // Log the error with more context
      logger.error('Login failed', {
        message: error.message,
        stack: error.stack,
        email: email
      });
      
      // Show appropriate error message
      let errorMessage = error.message || 'Login failed. Please try again.';
      
      // Handle specific error cases
      if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to the server. Please check your internet connection and make sure the backend is running.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. The server is taking too long to respond.';
      } else if (error.message.includes('401') || error.message.includes('credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error. Please check your backend CORS configuration.';
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      width: '100%',
      padding: '50px 20px',
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      background: 'transparent',
      position: 'relative',
      zIndex: 1,
      marginTop: '-100px'
    }}> 
      <Container maxWidth="lg" sx={{ 
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        padding: '20px'
      }}>
        {/* Left side - Welcome Text */}
        <Box sx={{ 
          maxWidth: '500px',
          textAlign: 'left',
          color: '#333',
          p: 3
        }}>
          <Typography 
            component="h1"
            sx={{
              background: 'linear-gradient(45deg, #f8b600 10%, #ff8a00 30%, #ff0080 60%, #9c27b0 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              display: 'inline-block',
              fontFamily: '"Dancing Script", cursive',
              fontSize: { xs: '3.5rem', md: '4.5rem' },
              fontWeight: 700,
              margin: 0,
              lineHeight: 1,
              textShadow: [
                '2px 2px 4px rgba(0,0,0,0.1)',
                '0 0 0 transparent',
                '0 0 0 transparent',
                '0 0 0 transparent',
                '0 0 0 transparent',
                '0 0 6px rgba(0,0,0,0.1)'
              ].join(','),
              position: 'relative',
              transform: 'rotate(-2deg)',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: '5px',
                left: '5%',
                width: '90%',
                height: '15px',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 70%)',
                zIndex: -1,
                filter: 'blur(4px)'
              },
              mb: 4,
              mt: -2,
              backgroundSize: '200% 200%',
              animation: 'gradient 8s ease infinite',
              '@keyframes gradient': {
                '0%': {
                  backgroundPosition: '0% 50%',
                },
                '50%': {
                  backgroundPosition: '100% 50%',
                },
                '100%': {
                  backgroundPosition: '0% 50%',
                },
              },
              // Fallback for browsers that don't support background-clip: text
              '& > span': {
                background: 'linear-gradient(45deg, #f8b600 10%, #ff8a00 30%, #ff0080 60%, #9c27b0 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              },
            }}
          >
          Busotrip
          </Typography>
          <Typography variant="h3" component="h3" gutterBottom sx={{ 
            fontWeight: 'bold',
            mb: 3,
            color: 'skyblue',
            fontSize: { xs: '1rem', md: '1.5rem' }
          }}>
            The new Era of Traveling
          </Typography>
          {/* <Typography variant="h6" component="h2" sx={{ 
            mb: 3,
            fontWeight: '500',
            lineHeight: 1.6,
            fontSize: { xs: '1.1rem', md: '1.25rem' }
          }}>
            Busotrip, the New Era of Traveling.
          </Typography> */}
          <Typography variant="body1" sx={{ 
            color: 'white',
            lineHeight: 1.8,
            fontSize: '1.1rem',
            mb: 3
          }}>
            Book your bus tickets online and enjoy a comfortable journey. We provide the best bus services with premium amenities.
          </Typography>
        </Box>

        {/* Right side - Login Form */}
        <Box sx={{ 
          width: '100%',
          maxWidth: '400px',
          flexShrink: 0
        }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4,
              width: '100%',
              borderRadius: 2
            }}
          >
            <Typography component="h2" variant="h5" align="center" gutterBottom sx={{ 
              fontWeight: 'bold',
              mb: 3,
              color: '#333'
            }}>
              Welcome Back!
            </Typography>
          <form onSubmit={handleLogin}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email"
                variant="outlined"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </Box>
          </form>
          </Paper>
        </Box>
      </Container>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
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
      
      {/* Animated Advertisement Bar */}
      <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        color: 'white',
        padding: '12px 0',
        overflow: 'hidden',
        zIndex: 1000
      }}>
        <Box sx={{
          display: 'flex',
          animation: 'scroll 20s linear infinite',
          whiteSpace: 'nowrap',
          width: 'fit-content',
          '@keyframes scroll': {
            '0%': { transform: 'translateX(0%)' },
            '100%': { transform: 'translateX(-50%)' }
          },
          '&:hover': {
            animationPlayState: 'paused'
          }
        }}>
          {[...Array(8)].map((_, i) => (
            <Box key={i} sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 4,
              mx: 2,
              '&:hover': {
                opacity: 0.8
              }
            }}>
              <Typography variant="body2" sx={{ 
                fontWeight: 500, 
                color: '#DFDDD7',
                opacity: 1,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap'
              }}>
                {[ 
                  '🔥 Up to 50% OFF on weekend getaways!',
                  '🚌 Book 2 tickets, get 1 FREE! Limited time only!',
                  '✨ Premium buses now available on all major routes!',
                  '🎁 Special discount for first-time users! Use code: WELCOME20',
                  '🔔 New routes added! Check out our latest destinations!',
                  '💺 Window seats available! Book now for the best views!',
                  '🚀 Flash Sale! 30% OFF on all night journeys!',
                  '👨‍👩‍👧‍👦 Family Pack: 15% OFF for groups of 4+'
                ][i]}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </div>
  );
};

export default Login;
