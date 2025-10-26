import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Container, CircularProgress, Typography, Button, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobalStyles from '../styles/GlobalStyles';

// Context Providers
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { BusBookingProvider } from '../contexts/BusBookingContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';

// Theme
import theme from '../theme';

// Pages
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import UserProfile from './UserProfile';
import BusSearch from './BusSearch';
import BusList from './BusList';
import BusRoutes from './BusRoutes';
import PassengerDetails from './PassengerDetails';
import BookingConfirmation from './BookingConfirmation';
import BookingSummary from './BookingSummary';
import MyBookings from './MyBookings';
import HelpPage from './HelpPage';
import SeatSelection from '../components/SeatSelection';

// Import admin components individually to avoid export/import issues
import AdminDashboard from './admin/AdminDashboard';
import Analytics from './admin/Analytics';
import Bookings from './admin/Bookings';
import Users from './admin/Users';
import Buses from './admin/Buses';
import AdminLayout from '../layouts/AdminLayout';

// Components
import Navbar from '../components/Navbar';

import ProtectedRoute from '../components/ProtectedRoute';

// Styled background component
const AppBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${theme.palette.background.default} 100%)`,
  backgroundAttachment: 'fixed',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  paddingTop: '70px', // Add padding to account for fixed navbar
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("/images/hero2.jpg") center/cover no-repeat',
    backgroundAttachment: 'fixed',
    opacity: 0.9, // Increased opacity for better visibility
    zIndex: 0, // Changed to 0 to be behind content
    filter: 'blur(2px)',
    pointerEvents: 'none', // Ensure clicks pass through to elements below
  },
  '& > *': {
    position: 'relative',
    zIndex: 1, // Ensure all direct children are above the background
  },
}));

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Component to handle protected routes
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Component to handle public routes (login, register, etc.)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    // Don't redirect if we're already on an admin route
    if (location.pathname.startsWith('/admin')) {
      return children;
    }
    
    // For admin users, always go to admin dashboard (checking for uppercase 'ADMIN')
    if (user?.role === 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // For regular users, go to intended URL or dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    
    // Prevent redirecting back to login page
    if (from === '/login') {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Navigate to={from} replace />;
  }

  return children;
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AppBackground>
      <Navbar />
      <Box component="main" sx={{ flex: 1 }}>
        <ErrorBoundary>
          <BusBookingProvider>
            <Container maxWidth="xl" sx={{ 
              py: 4, 
              minHeight: 'calc(100vh - 200px)',
              mt: 8
            }}>
              <ScrollToTop />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } />

                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <ProtectedLayout>
                      <Outlet />
                    </ProtectedLayout>
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* Booking Flow */}
                  <Route path="search" element={<BusSearch />} />
                  <Route path="bus-routes" element={<BusRoutes />} />
                  <Route path="buses" element={<BusList />} />
                  <Route path="seats" element={<SeatSelection />} />
                  <Route path="passenger-details" element={<PassengerDetails />} />
                  <Route path="booking-summary" element={<BookingSummary />} />
                  <Route path="booking-confirmation" element={<BookingConfirmation />}>
                    <Route path=":ticketId" element={<BookingConfirmation />} />
                  </Route>
                  
                  {/* User Routes */}
                  <Route path="my-bookings" element={<MyBookings />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="help" element={<HelpPage />} />
                  
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
                
                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminLayout>
                        <Outlet />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="buses" element={<Buses />} />
                  <Route path="users" element={<Users />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>
                
                {/* Unauthorized Route */}
                <Route path="/unauthorized" element={
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="h4" color="error" gutterBottom>
                      Unauthorized Access
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      You don't have permission to access this page.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      component={Link} 
                      to="/"
                    >
                      Return to Home
                    </Button>
                  </Box>
                } />
                
                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Container>
          </BusBookingProvider>
        </ErrorBoundary>
      </Box>

    </AppBackground>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles />
      <ErrorBoundary>
        <AuthProvider>
          <BusBookingProvider>
            <WebSocketProvider>
              <SnackbarProvider 
                maxSnack={3}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                autoHideDuration={5000}
                style={{
                  '& .SnackbarItem-variantSuccess': {
                    backgroundColor: theme.palette.success.main,
                  },
                  '& .SnackbarItem-variantError': {
                    backgroundColor: theme.palette.error.main,
                  },
                }}
              >
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <AppContent />
                </Router>
              </SnackbarProvider>
            </WebSocketProvider>
          </BusBookingProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
    