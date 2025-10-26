import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { processPayment } from '../services/paymentService';
import { Container, Typography, Grid, Box, Paper, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import OrderSummary from '../components/Booking/OrderSummary';
import PaymentMethod from '../payment/components/PaymentMethod';
import PaymentStatus from '../payment/components/PaymentStatus';
import { formatCurrency } from '../utils/formatters';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);

  // Get data from location state or use defaults for development
  const {
    seatNumbers = ['02'],
    busNumber = 'CG04RP1000',
    phoneNumber = '8074667867',
    amount = 1000,
    bookingData = {}
  } = location.state || {};

  const totalAmount = amount;

  const handlePaymentSuccess = (result) => {
    setPaymentStatus('success');
    setTransactionDetails({
      transactionId: result.transactionId,
      amount: totalAmount,
      method: result.method
    });
    
    // In a real app, you would save this to your database here
    console.log('Payment successful:', result);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError(error.message || 'Payment failed. Please try again.');
    setPaymentStatus('error');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleComplete = () => {
    // Ensure we have all necessary booking data
    const confirmedBookingData = {
      ...bookingData,
      // Include payment details
      paymentDetails: transactionDetails,
      // Set status to confirmed
      status: 'CONFIRMED',
      // Ensure we have a booking ID
      bookingId: transactionDetails?.transactionId || `BKG-${Date.now()}`,
      // Include ticket details
      ticketDetails: {
        ticketNumber: transactionDetails?.transactionId || `TKT-${Date.now()}`,
        status: 'CONFIRMED',
        bookingTime: new Date().toISOString()
      },
      // Ensure we have the ticket ID for the URL
      ticketId: transactionDetails?.transactionId || `TKT-${Date.now()}`
    };

    console.log('Navigating to booking confirmation with data:', confirmedBookingData);
    
    // Navigate to the booking confirmation page with all the necessary data
    navigate('/booking-confirmation', { 
      state: confirmedBookingData,
      replace: true
    });
  };

  // If no seat numbers are provided, navigate back
  useEffect(() => {
    if (!seatNumbers || seatNumbers.length === 0) {
      console.error('No seat numbers provided for payment');
      navigate('/booking-confirmation', { state: { error: 'No seats selected for payment' } });
    }
  }, [seatNumbers, navigate]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Complete Your Payment
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          {paymentStatus === null ? (
            <PaymentMethod 
              amount={totalAmount}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          ) : paymentStatus === 'success' ? (
            <PaymentStatus
              status="success"
              transactionId={transactionDetails.transactionId}
              amount={transactionDetails.amount}
              onClose={handleComplete}
            />
          ) : (
            <PaymentStatus
              status="error"
              error={error}
              onClose={() => setPaymentStatus(null)}
            />
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <OrderSummary
            seatNumbers={seatNumbers}
            busNumber={busNumber}
            amount={totalAmount}
            paymentMethod={paymentStatus === 'success' ? 'Paid' : 'Pending'}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default PaymentPage;
