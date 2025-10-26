import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserBookings, cancelBooking } from '../services/bookingService';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { 
  Box, Button, CircularProgress, Container, 
  Dialog, DialogActions, DialogContent, DialogTitle, 
  Divider, FormControl, FormControlLabel, Grid, IconButton, 
  MenuItem, Paper, Radio, RadioGroup, Snackbar, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, 
  Typography, Alert, Slide, Chip, Tooltip
} from '@mui/material';
import { UPI_DETAILS, BANK_DETAILS, CARD_DETAILS } from '../utils/Bank';
import {
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  EventSeat as SeatIcon,
  DirectionsBus as BusIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const MyBookings = () => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [paymentFormData, setPaymentFormData] = useState({
    upiId: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    bankName: ''
  });
  
  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setLoading(false);
        setError('Please login to view your bookings');
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await getUserBookings(user.phoneNumber || user.phone);
        const bookingsData = response?.data?.data || response?.data || response;
        
        if (Array.isArray(bookingsData)) {
          if (bookingsData.length > 0) {
          }
          setBookings(bookingsData);
        } else if (bookingsData) {
          setBookings([bookingsData]);
        } else {
          setBookings([]);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setError('Your session has expired. Please login again.');
          logout();
        } else {
          setError('Failed to load bookings. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, logout]);

  const getTicketId = (booking) => {
    const id = booking?.ticketId || booking?.ticketNumber || booking?.bookingId || booking?.id || 'N/A';
    return id === 'N/A' ? id : `#${String(id).padStart(8, '0')}`;
  };
  
  const getBookingId = getTicketId;
  
  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) {
      setError('Invalid booking ID');
      return false;
    }

    const bookingToCancel = bookings.find(booking => getBookingId(booking) === bookingId);
    if (!bookingToCancel) {
      setError('Booking not found');
      return false;
    }

    const confirmMessage = `Are you sure you want to cancel booking ${bookingId}?\n` +
      `Bus: ${bookingToCancel.busNumber || 'N/A'}\n` +
      `From: ${bookingToCancel.source || 'N/A'} to ${bookingToCancel.destination || 'N/A'}\n` +
      `Date: ${formatDate(bookingToCancel.journeyDate) || 'N/A'}`;

    if (!window.confirm(confirmMessage)) {
      return false;
    }
    
    try {
      setCancellingId(bookingId);
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          getBookingId(booking) === bookingId 
            ? { ...booking, status: 'CANCELLING' } 
            : booking
        )
      );
      
      await cancelBooking(bookingId);
      
      setBookings(prevBookings => 
        prevBookings.filter(booking => getBookingId(booking) !== bookingId)
      );
      
      setError('');
      alert(`Booking ${bookingId} has been cancelled successfully.`);
      return true;
      
    } catch (err) {
      console.error('Error in handleCancelBooking:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        stack: err.stack
      });
      
      setBookings(bookings);
      
      let errorMessage = 'Failed to cancel booking. Please try again.';
      
      if (err.isNetworkError) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.response) {
        switch (err.response.status) {
          case 401:
            setError('Your session has expired. Please login again.');
            logout();
            return false;
          case 403:
            errorMessage = 'You do not have permission to cancel this booking.';
            break;
          case 404:
            errorMessage = 'Booking not found or already cancelled.';
            break;
          case 400:
            errorMessage = err.message || 'Cannot cancel this booking. It may be too close to departure time.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = err.message || 'An unexpected error occurred.';
        }
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenDialog = (booking) => {
    setSelectedBooking(booking);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenPaymentDialog = (booking) => {
    setSelectedBooking(booking);
    setPaymentLoading(true);
    setOpenPaymentDialog(true);
    
    // Fetch payment details
    axios.post('http://localhost:8080/payment/status/bySeats', {
      seatNumbers: [booking.seatNumber || '1'],
      busNumber: booking.busNumber
    })
    .then(response => {
      setPaymentDetails(response.data);
    })
    .catch(err => {
      console.error('Error fetching payment details:', err);
      setError('Failed to fetch payment details. Please try again.');
    })
    .finally(() => {
      setPaymentLoading(false);
    });
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setPaymentDetails(null);
    setPaymentMethod('UPI');
  };

  // Map imported bank details to TEST_ACCOUNTS format
  const TEST_ACCOUNTS = {
    UPI: UPI_DETAILS.map(account => ({
      id: account.upiId,
      pin: account.upiPin,
      balance: account.balance,
      app: account.app
    })),
    CARD: CARD_DETAILS.map(card => ({
      number: card.cardNumber.replace(/\s/g, ''), // Remove spaces from card number
      expiry: card.expiryDate,
      cvv: card.cvv,
      pin: card.pin,
      balance: card.balance,
      cardholderName: card.cardholderName,
      cardType: card.cardType
    })),
    NETBANKING: BANK_DETAILS.map(bank => ({
      bank: bank.bankCode,
      username: bank.bankCode, // Using bank code as username
      password: bank.password,
      balance: bank.balance,
      accountNumber: bank.accountNumber,
      accountHolderName: bank.accountHolderName,
      ifscCode: bank.ifscCode
    }))
  };

  const validatePaymentForm = () => {
    if (!paymentMethod) {
      throw new Error('Please select a payment method');
    }

    switch (paymentMethod) {
      case 'UPI':
        if (!paymentFormData.upiId || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(paymentFormData.upiId)) {
          throw new Error('Please enter a valid UPI ID (e.g., name@upi)');
        }
        if (!paymentFormData.upiPin) {
          throw new Error('Please enter your UPI PIN');
        }
        // Verify test UPI account (case-insensitive match)
        const upiAccount = TEST_ACCOUNTS.UPI.find(acc => 
          acc.id.toLowerCase() === paymentFormData.upiId.toLowerCase()
        );
        if (!upiAccount) {
          const testAccounts = TEST_ACCOUNTS.UPI.map(acc => `• ${acc.id} (PIN: ${acc.pin})`).join('\n');
          throw new Error('Test UPI account not found. Please use one of these test accounts:\n' + testAccounts);
        }
        if (upiAccount.pin !== paymentFormData.upiPin) {
          throw new Error('Incorrect UPI PIN');
        }
        break;

      case 'CARD':
        if (!paymentFormData.cardNumber || !/^\d{13,19}$/.test(paymentFormData.cardNumber.replace(/\s/g, ''))) {
          throw new Error('Please enter a valid 13-19 digit card number');
        }
        if (!paymentFormData.cardName || paymentFormData.cardName.trim().length < 3) {
          throw new Error('Please enter cardholder name');
        }
        if (!paymentFormData.expiryDate || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(paymentFormData.expiryDate)) {
          throw new Error('Please enter a valid expiry date (MM/YY)');
        }
        if (!paymentFormData.cvv || !/^\d{3,4}$/.test(paymentFormData.cvv)) {
          throw new Error('Please enter a valid 3-4 digit CVV');
        }
        // Verify test card
        const cardAccount = TEST_ACCOUNTS.CARD.find(acc => 
          acc.number === paymentFormData.cardNumber.replace(/\s/g, '')
        );
        if (!cardAccount) {
          throw new Error('Test card not found. Use: 4111 1111 1111 1111 or 5555 5555 5555 4444');
        }
        if (cardAccount.expiry !== paymentFormData.expiryDate) {
          throw new Error('Incorrect expiry date');
        }
        if (cardAccount.cvv !== paymentFormData.cvv) {
          throw new Error('Incorrect CVV');
        }
        break;

      case 'NETBANKING':
        if (!paymentFormData.bankName) {
          throw new Error('Please select a bank');
        }
        if (!paymentFormData.accountHolderName || paymentFormData.accountHolderName.trim().length < 3) {
          throw new Error('Please enter account holder name');
        }
        if (!paymentFormData.netBankingPassword) {
          throw new Error('Please enter net banking password');
        }
        // Verify test net banking account
        const netBankingAccount = TEST_ACCOUNTS.NETBANKING.find(acc => 
          acc.bank === paymentFormData.bankName && 
          acc.password === paymentFormData.netBankingPassword
        );
        if (!netBankingAccount) {
          throw new Error('Invalid net banking credentials');
        }
        break;

      default:
        throw new Error('Unsupported payment method');
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const showSuccessSnackbar = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
      autoHideDuration: 3000 // Auto close after 3 seconds
    });
    
    // Auto-close the payment dialog after a short delay
    setTimeout(() => {
      handleClosePaymentDialog();
    }, 1000);
  };

  const showErrorSnackbar = (message) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedBooking || !paymentDetails?.seats?.[0]) {
      const errorMsg = 'Invalid booking details - missing selectedBooking or paymentDetails';
      console.error(errorMsg, { selectedBooking, paymentDetails });
      setError(errorMsg);
      return false;
    }
    
    const seat = paymentDetails.seats[0];
    const amount = parseFloat(seat.price || 0);
    
    try {
      setPaymentLoading(true);
      setError('');
      validatePaymentForm();
      
      const account = getTestAccount();
      
      if (account.balance < amount) {
        const errorMsg = `Insufficient balance in test account. Required: ${amount}, Available: ${account.balance}`;
        console.error(errorMsg);
        showErrorSnackbar(errorMsg);
        return false;
      }
      
      const paymentStatus = account.balance >= amount ? 'BOOKED' : 'PAYMENT_FAILED';
      
      const paymentPayload = {
        seatNumbers: [seat.seatNumber],
        busNumber: paymentDetails.busNumber,
        profileUserPhone: user.phoneNumber || user.phone,
        status: paymentStatus,
        price: amount
      };
      
      const response = await axios.post('http://localhost:8080/payment/send', paymentPayload);
      
      if (response.data && response.data.success) {
        account.balance -= amount;
        const updatedBookings = await getUserBookings(user.phoneNumber || user.phone);
        setBookings(Array.isArray(updatedBookings) ? updatedBookings : [updatedBookings]);
        showSuccessSnackbar('Payment completed successfully! Your booking is now confirmed.');
        // Removed handleClosePaymentDialog() as it's now handled in showSuccessSnackbar
        return true;
      } else {
        throw new Error(response.data?.message || 'Payment processing failed');
      }
      
    } catch (err) {
      console.error('Payment error details:', {
        name: err.name,
        message: err.message,
        response: err.response?.data,
        stack: err.stack
      });
      
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Payment failed. Please check the console for details.';
      showErrorSnackbar(errorMessage);
      return false;
    } finally {
      setPaymentLoading(false);
    }
  };
  
  const getTestAccount = () => {
    switch (paymentMethod) {
      case 'UPI':
        return TEST_ACCOUNTS.UPI.find(acc => acc.id === paymentFormData.upiId);
      case 'CARD':
        return TEST_ACCOUNTS.CARD.find(acc => 
          acc.number === paymentFormData.cardNumber.replace(/\s/g, '')
        );
      case 'NETBANKING':
        return TEST_ACCOUNTS.NETBANKING.find(acc => 
          acc.bank === paymentFormData.bankName
        );
      default:
        return'this payment method is not available';
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    
    const success = await handleCancelBooking(selectedBooking.id);
    if (success) {
      handleCloseDialog();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle different date formats
      let date;
      
      // Try parsing as ISO date
      if (typeof dateString === 'string' && dateString.includes('T')) {
        date = parseISO(dateString);
      } 
      // Try parsing as timestamp
      else if (!isNaN(dateString)) {
        date = new Date(parseInt(dateString));
      } 
      // Try parsing as date string
      else {
        date = new Date(dateString);
      }
      
      // If date is valid, format it
      if (date && !isNaN(date.getTime())) {
        return format(date, 'dd/MM/yyyy');
      }
      
      return dateString || 'N/A';
    } catch (e) {
      console.error('Error formatting date:', e, dateString);
      return 'N/A';
    }
  };
  
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      let date;
      
      // If it's already a Date object
      if (dateString instanceof Date) {
        date = dateString;
      }
      // Try parsing as ISO date
      else if (typeof dateString === 'string' && dateString.includes('T')) {
        date = parseISO(dateString);
      } 
      // Try parsing as timestamp
      else if (!isNaN(dateString)) {
        date = new Date(parseInt(dateString));
      } 
      // Try parsing as date string
      else {
        date = new Date(dateString);
      }
      
      // If date is valid, format it as time only
      if (date && !isNaN(date.getTime())) {
        // Check if the time is 00:00:00, which might indicate time wasn't set
        if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
          return '--:--';
        }
        return format(date, 'HH:mm');
      }
      
      // If we have a string that looks like a time (e.g., "14:30"), return it as is
      if (typeof dateString === 'string' && /^\d{1,2}:\d{2}/.test(dateString)) {
        return dateString;
      }
      
      return '--:--';
    } catch (e) {
      console.error('Error formatting time:', e, dateString);
      return '--:--';
    }
  };

  const getStatusChip = (status, booking) => {
    if (!status) return <Chip label="Unknown" size="small" />;
    
    const statusText = status.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
    
    const upperStatus = status.toUpperCase();
    
    if (upperStatus === 'PAYMENT_PENDING' || upperStatus === 'PENDING_PAYMENT') {
      return (
        <Chip 
          label="Payment Pending" 
          color="warning" 
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPaymentDialog(booking);
          }}
          style={{ cursor: 'pointer' }}
        />
      );
    }
    
    switch (upperStatus) {
      case 'CONFIRMED':
      case 'PAYMENT_DONE':
        return <Chip label={statusText} color="success" size="small" />;
      case 'BOOKED':
        return <Chip label={statusText} size="small" sx={{ bgcolor: '#e0e0e0' }} />;
      case 'CANCELLED':
        return <Chip label={statusText} color="error" size="small" />;
      default:
        return <Chip label={statusText || 'Unknown'} size="small" />;
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container sx={{ textAlign: 'center', my: 5 }}>
        <Alert 
          severity="info" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/login')}>
              Log in
            </Button>
          }
        >
          Please log in to view your bookings
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/login', { state: { from: '/my-bookings' } })}
        >
          Login
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 0, pb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} mt={-10}>
        <Typography variant="h4" component="h1">
          <EventIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />
          My Bookings
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SeatIcon />}
          onClick={() => navigate('/')}
        >
          Book New Ticket
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      ) : bookings.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'background.paper' }}>
          <Box mb={2}>
            <SeatIcon color="disabled" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Bookings Found
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            You don't have any bookings yet. Book your next journey now!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
            startIcon={<BusIcon />}
          >
            Book a Bus
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>Ticket Number</TableCell>
                <TableCell sx={{ color: 'white' }}>Bus Details</TableCell>
                <TableCell sx={{ color: 'white' }}>Journey</TableCell>
                <TableCell sx={{ color: 'white' }}>Passenger</TableCell>
                <TableCell sx={{ color: 'white' }}>Date & Time</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Amount</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => {
                const bookingId = getBookingId(booking);
                return (
                  <TableRow 
                    key={bookingId}
                    hover 
                    sx={{ '&:last-child td': { border: 0 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {booking.ticketId || booking.ticketNumber || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <BusIcon color="action" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="subtitle2">
                            {booking.busNumber || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {booking.busName || booking.busType || 'Bus'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <LocationIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {booking.source || 'N/A'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <LocationIcon color="secondary" fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {booking.destination || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PersonIcon color="action" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2">
                            {booking.passengerName || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Seat: {booking.seatNumber || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(booking.journeyDate || booking.bookingDate || '')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {booking.departureTime || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(booking.status || booking.bookingStatus, booking)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        ₹{booking.fare || booking.amount || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(booking)}
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel Booking">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelBooking(bookingId)}
                              disabled={
                                (booking.status === 'CANCELLED' || 
                                booking.bookingStatus === 'CANCELLED' ||
                                cancellingId === bookingId)
                              }
                            >
                              {cancellingId === bookingId ? (
                                <CircularProgress size={20} />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedBooking?.status === 'CANCELLED' || selectedBooking?.bookingStatus === 'CANCELLED' 
            ? 'Booking Details' 
            : 'Cancel Booking'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">Ticket ID</Typography>
                      <Typography variant="h6">{selectedBooking.ticketNumber || selectedBooking.ticketId || '--'}</Typography>
                    </Box>
                    <Box>
                      {getStatusChip(selectedBooking.status || selectedBooking.bookingStatus)}
                    </Box>
                  </Box>
                </Grid>
                {/* Journey Details */}
                <Grid item xs={12}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: 'text.primary' }}>Journey Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={5}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box>
                            <Typography variant="caption" display="block" color="text.secondary">From</Typography>
                            <Typography variant="h6" color="primary">{selectedBooking.source || '--'}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" display="block" color="text.secondary">To</Typography>
                            <Typography variant="h6" color="primary">{selectedBooking.destination || '--'}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={7}>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="caption" display="block" color="text.secondary">Date</Typography>
                            <Typography color="text.primary">
                              {formatDate(selectedBooking.journeyDate) || 
                               formatDate(selectedBooking.bookingDate) || '--'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" display="block" color="text.secondary">Time</Typography>
                            <Typography color="text.primary">
                              {formatTime(selectedBooking.departureTime) || '--:--'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" display="block" color="text.secondary">Bus</Typography>
                            <Typography color="text.primary">
                              {selectedBooking.busNumber || selectedBooking.bus?.busNumber || '--'}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Passenger & Seat Details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Passenger & Seat Details</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Passenger Name</Typography>
                        <Typography>{selectedBooking.passengerName || '--'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Seat Number</Typography>
                        <Typography>{selectedBooking.seatNumber || '--'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Phone Number</Typography>
                        <Typography>{selectedBooking.passengerPhoneNumber || selectedBooking.phoneNumber || '--'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Bus Type</Typography>
                        <Typography>
                          {selectedBooking.busType === 'AC' || selectedBooking.bus?.type === 'AC' || 
                           selectedBooking.type === 'AC' ? 'AC' : 'Non-AC'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Passenger Details</Typography>
                  {selectedBooking.passengers?.length > 0 ? (
                    selectedBooking.passengers.map((passenger, index) => {
                      // Handle case where passenger might be a string (seat number)
                      if (typeof passenger === 'string') {
                        return (
                          <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2">
                              <strong>Seat:</strong> {passenger || '--'}
                            </Typography>
                          </Box>
                        );
                      }
                      
                      // Handle case where passenger is an object
                      return (
                        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>Name:</strong> {passenger.name || passenger.passengerName || '--'}
                          </Typography>
                          {passenger.age && (
                            <Typography variant="body2">
                              <strong>Age:</strong> {passenger.age}
                            </Typography>
                          )}
                          {passenger.gender && (
                            <Typography variant="body2">
                              <strong>Gender:</strong> {passenger.gender}
                            </Typography>
                          )}
                          <Typography variant="body2">
                            <strong>Seat:</strong> {passenger.seatNumber || passenger.seat || '--'}
                          </Typography>
                        </Box>
                      );
                    })
                  ) : selectedBooking.passengerName ? (
                    // Fallback to top-level passenger details if available
                    <Box sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedBooking.passengerName || '--'}
                      </Typography>
                      {selectedBooking.passengerAge && (
                        <Typography variant="body2">
                          <strong>Age:</strong> {selectedBooking.passengerAge}
                        </Typography>
                      )}
                      {selectedBooking.passengerGender && (
                        <Typography variant="body2">
                          <strong>Gender:</strong> {selectedBooking.passengerGender}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2">No passenger details available</Typography>
                  )}
                </Grid>
                {/* Payment Summary */}
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Total Amount: ₹{selectedBooking.price || selectedBooking.totalFare || '0.00'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedBooking.status === 'PAYMENT_DONE' ? 'Payment Successful' : 'Payment Pending'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            color="inherit"
          >
            Close
          </Button>
          {selectedBooking?.status !== 'CANCELLED' && selectedBooking?.bookingStatus !== 'CANCELLED' && (
            <Button 
              onClick={handleConfirmCancel} 
              color="error" 
              variant="contained"
              disabled={cancellingId === (selectedBooking?.id || selectedBooking?.bookingId)}
              startIcon={
                cancellingId === (selectedBooking?.id || selectedBooking?.bookingId) 
                  ? <CircularProgress size={20} color="inherit" /> 
                  : <DeleteIcon />
              }
            >
              Cancel Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration || 6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            '&.MuiAlert-filledSuccess': {
              backgroundColor: '#4caf50', // Brighter green for success
              color: '#fff',
              '& .MuiAlert-icon': {
                color: '#fff'
              }
            },
            '&.MuiAlert-filledError': {
              backgroundColor: '#f44336', // Standard red for errors
              color: '#fff'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Payment Dialog */}
      <Dialog 
        open={openPaymentDialog} 
        onClose={handleClosePaymentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogContent dividers>
          {paymentLoading && !paymentDetails ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : paymentDetails ? (
            <Grid container spacing={3}>
              {/* Left Column - Booking Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Booking Details</Typography>
                
                {/* Journey Details */}
                <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Journey Details</Typography>
                  <Box mb={2}>
                    <Typography variant="body2">
                      <strong>From:</strong> {selectedBooking.source || '--'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>To:</strong> {selectedBooking.destination || '--'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {formatDate(selectedBooking.journeyDate)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Bus:</strong> {selectedBooking.busNumber || '--'} ({selectedBooking.busName || '--'})
                    </Typography>
                  </Box>
                </Paper>

                {/* Passenger Details */}
                <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Passenger Details</Typography>
                  {selectedBooking.passengers?.length > 0 ? (
                    selectedBooking.passengers.map((passenger, index) => {
                      // Handle case where passenger might be a string (seat number)
                      if (typeof passenger === 'string') {
                        return (
                          <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2">
                              <strong>Seat:</strong> {passenger || '--'}
                            </Typography>
                          </Box>
                        );
                      }
                      
                      // Handle case where passenger is an object
                      return (
                        <Box key={index} sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>Name:</strong> {passenger.name || passenger.passengerName || '--'}
                          </Typography>
                          {passenger.age && (
                            <Typography variant="body2">
                              <strong>Age:</strong> {passenger.age}
                            </Typography>
                          )}
                          {passenger.gender && (
                            <Typography variant="body2">
                              <strong>Gender:</strong> {passenger.gender}
                            </Typography>
                          )}
                          <Typography variant="body2">
                            <strong>Seat:</strong> {passenger.seatNumber || passenger.seat || '--'}
                          </Typography>
                        </Box>
                      );
                    })
                  ) : selectedBooking.passengerName ? (
                    // Fallback to top-level passenger details if available
                    <Box sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedBooking.passengerName || '--'}
                      </Typography>
                      {selectedBooking.passengerAge && (
                        <Typography variant="body2">
                          <strong>Age:</strong> {selectedBooking.passengerAge}
                        </Typography>
                      )}
                      {selectedBooking.passengerGender && (
                        <Typography variant="body2">
                          <strong>Gender:</strong> {selectedBooking.passengerGender}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2">No passenger details available</Typography>
                  )}
                </Paper>

                {/* Seat Details */}
                <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Fare Details</Typography>
                  {paymentDetails.seats?.map((seat, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">
                        Seat {seat.seatNumber} ({seat.type || 'Standard'})
                      </Typography>
                      <Typography variant="body2">
                        ₹{parseFloat(seat.price || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Typography variant="subtitle1"><strong>Total Amount</strong></Typography>
                    <Typography variant="h6">
                      ₹{paymentDetails.seats?.reduce((sum, seat) => sum + (parseFloat(seat.price) || 0), 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Right Column - Payment Form */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Payment Method</Typography>
                <Paper 
                  component="form" 
                  onSubmit={handlePayment}
                  elevation={0} 
                  variant="outlined" 
                  sx={{ p: 2 }}
                >
                  <Box mb={3} component="fieldset" sx={{ border: 'none', p: 0, m: 0 }}>
                    <FormControl component="div" fullWidth>
                      <RadioGroup 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <FormControlLabel 
                          value="UPI" 
                          control={<Radio />} 
                          label="UPI" 
                        />
                        {paymentMethod === 'UPI' && (
                          <Box ml={4} mt={1}>
                            <TextField
                              fullWidth
                              size="small"
                              label="UPI ID"
                              name="upiId"
                              value={paymentFormData.upiId}
                              onChange={handlePaymentFormChange}
                              placeholder="yourname@upi"
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              type="password"
                              label="UPI PIN"
                              name="upiPin"
                              value={paymentFormData.upiPin || ''}
                              onChange={handlePaymentFormChange}
                              placeholder="Enter UPI PIN"
                              inputProps={{ 
                                maxLength: 6, 
                                inputMode: 'numeric',
                                pattern: '\\d{1,6}'
                              }}
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Popular UPI Apps: Google Pay, PhonePe, Paytm, BHIM
                            </Typography>
                          </Box>
                        )}

                        <FormControlLabel 
                          value="CARD" 
                          control={<Radio />} 
                          label="Credit/Debit Card" 
                        />
                        {paymentMethod === 'CARD' && (
                          <Box ml={4} mt={1}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Card Number"
                              name="cardNumber"
                              value={paymentFormData.cardNumber}
                              onChange={handlePaymentFormChange}
                              placeholder="1234 5678 9012 3456"
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              label="Cardholder Name"
                              name="cardName"
                              value={paymentFormData.cardName}
                              onChange={handlePaymentFormChange}
                              placeholder="Name on card"
                              sx={{ mb: 2 }}
                            />
                            <Box display="flex" gap={2} mb={2}>
                              <TextField
                                size="small"
                                label="Expiry (MM/YY)"
                                name="expiryDate"
                                value={paymentFormData.expiryDate}
                                onChange={handlePaymentFormChange}
                                placeholder="MM/YY"
                                sx={{ flex: 2 }}
                              />
                              <TextField
                                size="small"
                                label="CVV"
                                name="cvv"
                                value={paymentFormData.cvv}
                                onChange={handlePaymentFormChange}
                                placeholder="123"
                                sx={{ flex: 1 }}
                              />
                            </Box>
                          </Box>
                        )}

                        <FormControlLabel 
                          value="NETBANKING" 
                          control={<Radio />} 
                          label="Net Banking" 
                        />
                        {paymentMethod === 'NETBANKING' && (
                          <Box ml={4} mt={1}>
                            <TextField
                              fullWidth
                              select
                              size="small"
                              label="Select Bank"
                              name="bankName"
                              value={paymentFormData.bankName}
                              onChange={handlePaymentFormChange}
                              sx={{ mb: 2 }}
                              required
                            >
                              <MenuItem value="">Select your bank</MenuItem>
                              <MenuItem value="SBI">State Bank of India</MenuItem>
                              <MenuItem value="HDFC">HDFC Bank</MenuItem>
                              <MenuItem value="ICICI">ICICI Bank</MenuItem>
                              <MenuItem value="AXIS">Axis Bank</MenuItem>
                              <MenuItem value="PNB">Punjab National Bank</MenuItem>
                              <MenuItem value="BOB">Bank of Baroda</MenuItem>
                              <MenuItem value="KOTAK">Kotak Mahindra Bank</MenuItem>
                              <MenuItem value="IDFC">IDFC First Bank</MenuItem>
                            </TextField>
                            <TextField
                              fullWidth
                              size="small"
                              label="Account Holder Name"
                              name="accountHolderName"
                              value={paymentFormData.accountHolderName || ''}
                              onChange={handlePaymentFormChange}
                              placeholder="Name as per bank records"
                              sx={{ mb: 2 }}
                              required
                            />
                            <TextField
                              fullWidth
                              size="small"
                              type="password"
                              label="Net Banking Password"
                              name="netBankingPassword"
                              value={paymentFormData.netBankingPassword || ''}
                              onChange={handlePaymentFormChange}
                              placeholder="Enter your net banking password"
                              required
                              inputProps={{
                                autoComplete: 'current-password',
                                'aria-describedby': 'netbanking-password-helper'
                              }}
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="caption" id="netbanking-password-helper" color="textSecondary">
                              For demo purposes, use the bank code as password (e.g., '123456' for SBI)
                            </Typography><Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1, mb: 1 }}>
                              Your bank details are secure and encrypted
                            </Typography>
                          </Box>
                        )}

                        <FormControlLabel 
                          value="WALLET" 
                          control={<Radio />} 
                          label="Wallet" 
                        />
                        {paymentMethod === 'WALLET' && (
                          <Box ml={4} mt={1}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Mobile Number"
                              name="walletNumber"
                              value={paymentFormData.walletNumber}
                              onChange={handlePaymentFormChange}
                              placeholder="Enter registered mobile number"
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Popular Wallets: Paytm, PhonePe, Amazon Pay
                            </Typography>
                          </Box>
                        )}
                      </RadioGroup>
                    </FormControl>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
                    <Typography variant="h6">
                      Amount to Pay: ₹{paymentDetails.seats?.reduce((sum, seat) => sum + (parseFloat(seat.price) || 0), 0).toFixed(2)}
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      size="large"
                      onClick={handlePayment}
                      disabled={!paymentDetails || paymentLoading}
                      sx={{ minWidth: 150 }}
                    >
                      {paymentLoading ? <CircularProgress size={24} /> : 'Pay Now'}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Typography color="error">Failed to load payment details.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default MyBookings;