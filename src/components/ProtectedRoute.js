import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, adminOnly = false, element }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Store the intended URL to redirect after login
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Check for admin access if required
  if (adminOnly) {
    if (!user || user.role !== 'ADMIN') {
      console.warn('Unauthorized admin access attempt by user:', user);
      return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
    }
    
    // Handle base admin path
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    return children || <Outlet />;
  }

  // If element is a function (render prop), call it with auth state
  if (typeof element === 'function') {
    return element({ isAuthenticated, isAdmin: user?.role === 'ADMIN' });
  }

  // Render child routes if authenticated and authorized
  return children || <Outlet />;
};

export default ProtectedRoute;
