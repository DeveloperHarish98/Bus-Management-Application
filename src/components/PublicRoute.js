import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If user is authenticated, handle redirection based on role
  if (isAuthenticated && user) {
    // For admin users, ensure they're on an admin route
    if (user.role === 'ADMIN' && !location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // For regular users, redirect to dashboard if they're on a public route
    if (user.role !== 'ADMIN' && (location.pathname === '/login' || location.pathname === '/register')) {
      const from = location.state?.from?.pathname || '/dashboard';
      return <Navigate to={from} replace />;
    }
  }

  // If not authenticated or no redirection needed, render the children
  return children;
};

export default PublicRoute;
