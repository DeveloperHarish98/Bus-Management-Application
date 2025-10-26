import React from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const PaymentStatus = ({ status, transactionId, amount, onClose, error }) => {
  if (status === 'processing') {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>Processing Payment</Typography>
        <Typography color="text.secondary">Please wait while we process your payment</Typography>
      </Paper>
    );
  }

  if (status === 'success') {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" gutterBottom>Payment Successful!</Typography>
        <Typography variant="body1" gutterBottom>
          ₹{amount} has been deducted from your account.
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Transaction ID: {transactionId}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onClose}
          sx={{ mt: 3 }}
        >
          Done
        </Button>
      </Paper>
    );
  }

  if (status === 'error') {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" gutterBottom>Payment Failed</Typography>
        <Typography color="error" paragraph>{error || 'An error occurred while processing your payment.'}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={onClose}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Paper>
    );
  }

  return null;
};

export default PaymentStatus;
