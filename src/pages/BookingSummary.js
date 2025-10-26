import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBusBooking } from '../contexts/BusBookingContext';
import { processPayment } from '../services/paymentService';
import { createTicket } from '../services/ticketService';

import {
  Container, Typography, Box, Button, List, ListItem, ListItemText,
  Divider, Grid, CircularProgress, Card, CardContent, CardHeader, Avatar,
  Stepper, Step, StepLabel, Table, TableBody, TableCell, TableContainer, Alert,
  TableRow, IconButton, Checkbox, FormControlLabel, Radio, RadioGroup, FormControl, 
  Paper, TextField, InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  ArrowBack as ArrowBackIcon,
  DirectionsBus as DirectionsBusIcon,
  Payment as PaymentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

const PAYMENT_METHODS = {
  UPI: 'UPI',
  CARD: 'CARD',
  NETBANKING: 'NETBANKING'
};

const BookingSummary = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { passengers: contextPassengers, selectedBus: contextBus, selectedSeats: contextSeats } = useBusBooking();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.UPI);
  const [, setTransactionId] = useState('');
  
  // Use passengers from location state if available, otherwise use from context
  const [localState, setLocalState] = useState({
    passengers: [],
    bus: null,
    selectedSeats: []
  });
  
  // Initialize state from props or context
  useEffect(() => {
    setLocalState({
      passengers: state?.passengers || contextPassengers || [],
      bus: state?.bus || contextBus || null,
      selectedSeats: state?.selectedSeats || contextSeats || []
    });
  }, [state, contextPassengers, contextBus, contextSeats]);
  
  // Payment form states
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    upiPin: '',
    saveForFuture: false,
    showPassword: false
  });
  
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveCard: false
  });
  
  const [netbankingForm, setNetbankingForm] = useState({
    bank: '',
    username: '',
    password: ''
  });

  const steps = ['Review Journey & Passenger Details', 'Make Payment'];
  
  const getPaymentMethods = () => {
    return [
      { 
        id: PAYMENT_METHODS.UPI, 
        label: 'UPI', 
        icon: <PaymentIcon />,
        accounts: [] 
      },
      { 
        id: PAYMENT_METHODS.CARD, 
        label: 'Credit/Debit Card', 
        icon: <CreditCardIcon />,
        accounts: [] 
      },
      { 
        id: PAYMENT_METHODS.NETBANKING, 
        label: 'Net Banking', 
        icon: <AccountBalanceIcon />,
        accounts: [] 
      }
    ];
  };

  const validateUpiId = (upiId) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return upiRegex.test(upiId);
  };

  const validateUpiPin = (pin) => {
    // Accept any numeric PIN from 1 to 6 digits to match test accounts
    return /^\d{1,6}$/.test(pin);
  };
  
  const validateCardNumber = (cardNumber) => {
    const digits = cardNumber.replace(/\s/g, '');
    return /^\d{13,19}$/.test(digits);
  };
  
  const validateExpiryDate = (expiryDate) => {
    // Format: MM/YY or MM/YYYY
    const regex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;
    if (!regex.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    
    // Convert 2-digit year to 4-digit
    const fullYear = year.length === 2 ? 2000 + parseInt(year, 10) : parseInt(year, 10);
    
    // Check if the expiry date is in the future
    if (fullYear > currentYear) return true;
    if (fullYear === currentYear && parseInt(month, 10) >= currentMonth) return true;
    
    return false;
  };
  
  const validateCVV = (cvv) => {
    return /^\d{3,4}$/.test(cvv);
  };

  React.useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  // Use local state for all data with proper null checks
  const { bus = null, selectedSeats = [], passengers = [] } = localState;
  const journeyDate = bus?.departureTime || new Date().toISOString();
  const source = bus?.source || '';
  const destination = bus?.destination || '';
  
  // Add a loading state while data is being loaded
  if (!bus) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading booking details...</Typography>
      </Container>
    );
  }

  const calculateTotalFare = () => {
    const seatPrices = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
    const gst = seatPrices * 0.05; // 5% GST
    // Total is just the seat prices as GST is waived
    const total = seatPrices;
    
    return {
      baseFare: seatPrices,
      gst: gst,
      total: total,
      seatBreakdown: selectedSeats.map(seat => ({
        seatNumber: seat.seatNumber,
        price: seat.price || 0,
        type: seat.type || 'Standard'
      }))
    };
  };

  const fareDetails = calculateTotalFare() || {};

  const handleProceedToPayment = async () => {
    console.log('handleProceedToPayment called');
    // Validate form based on payment method
    let formValid = true;
    setError('');
    
    console.log('Payment method:', paymentMethod);
    console.log('Accepted terms:', acceptedTerms);
    
    // Common validations
    if (!acceptedTerms) {
      setError('Please accept the terms and conditions');
      return;
    }
    
    // Payment method specific validations
    if (paymentMethod === PAYMENT_METHODS.UPI) {
      if (!upiForm.upiId || !upiForm.upiPin) {
        formValid = false;
        setError('Please enter both UPI ID and PIN');
      } else if (!validateUpiId(upiForm.upiId)) {
        formValid = false;
        setError('Please enter a valid UPI ID (e.g., name@upi)');
      } else if (!validateUpiPin(upiForm.upiPin)) {
        formValid = false;
        setError('Please enter a valid UPI PIN (1-6 digits)');
      }
    } else if (paymentMethod === PAYMENT_METHODS.CARD) {
      if (!cardForm.cardNumber || !cardForm.cardName || !cardForm.expiryDate || !cardForm.cvv) {
        formValid = false;
        setError('Please fill in all card details');
      } else if (!validateCardNumber(cardForm.cardNumber)) {
        formValid = false;
        setError('Please enter a valid 16-digit card number');
      } else if (!validateExpiryDate(cardForm.expiryDate)) {
        formValid = false;
        setError('Please enter a valid expiry date (MM/YY)');
      } else if (!validateCVV(cardForm.cvv)) {
        formValid = false;
        setError('Please enter a valid CVV (3-4 digits)');
      }
    } else if (paymentMethod === PAYMENT_METHODS.NETBANKING) {
      if (!netbankingForm.bank || !netbankingForm.username || !netbankingForm.password) {
        formValid = false;
        setError('Please fill in all netbanking details');
      }
    }
    
    if (!formValid) return;
    
    setLoading(true);
    setError('');
    setPaymentStatus('processing');
    
    try {
      // Format journeyDate as dd/MM/yyyy with no time component
      const formatDate = (dateString) => {
        try {
          let date;
          
          // Handle case where date is already in the correct format
          if (typeof dateString === 'string') {
            // If it contains a space, take only the date part
            const datePart = dateString.split(' ')[0];
            // If it's already in dd/MM/yyyy format, return as is
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
              return datePart;
            }
            // Try to parse the date string
            date = new Date(dateString);
          } else {
            date = dateString ? new Date(dateString) : new Date();
          }
          
          // If date is invalid, use current date as fallback
          if (isNaN(date.getTime())) {
            console.warn('Invalid date provided, using current date as fallback');
            const today = new Date();
            return `${String(today.getDate()).padStart(2, '0')}/${
              String(today.getMonth() + 1).padStart(2, '0')}/${
              today.getFullYear()}`;
          }
          
          // Format as dd/MM/yyyy with no time component
          return `${String(date.getDate()).padStart(2, '0')}/${
            String(date.getMonth() + 1).padStart(2, '0')}/${
            date.getFullYear()}`;
        } catch (error) {
          console.error('Error formatting date:', error);
          // Return current date as fallback
          const today = new Date();
          return `${String(today.getDate()).padStart(2, '0')}/${
            String(today.getMonth() + 1).padStart(2, '0')}/${
            today.getFullYear()}`;
        }
      };

      // Prepare ticket data in the format expected by the backend
      const ticketData = {
        profileUserPhone: user?.phoneNumber || '',
        busNumber: bus?.busNumber || '',
        journeyDate: formatDate(bus?.departureTime || journeyDate),
        source: source,
        destination: destination,
        seatNumbers: selectedSeats.map(seat => seat.seatNumber),
        passengers: passengers.map((passenger) => {
          const passengerName = passenger.name || passenger.passengerName || 'Passenger';
          const passengerData = {
            name: passenger.passengerName || passengerName || passenger.name,
            age: passenger.age || 25,
            gender: (passenger.gender || 'MALE').toUpperCase(),
            phoneNumber: passenger.phoneNumber || user?.phoneNumber || ''
          };
          
          console.log('Processed passenger data:', passengerData);
          return passengerData;
        })
      };
      
      console.log('Creating ticket with data:', JSON.stringify(ticketData, null, 2));
      
      // Step 1: Create ticket with PAYMENT_PENDING status
      const ticketResponse = await createTicket(ticketData);
      console.log('Ticket created:', ticketResponse);
      
      // Prepare payment data
      const paymentData = {
        seatNumbers: selectedSeats.map(seat => seat.seatNumber),
        busNumber: bus?.busNumber || '',
        profileUserPhone: user?.phoneNumber || '',
        amount: fareDetails.total || 0,
        paymentMethod,
        paymentDetails: paymentMethod === PAYMENT_METHODS.UPI ? upiForm : 
                       paymentMethod === PAYMENT_METHODS.CARD ? cardForm : netbankingForm
      };
      
      console.log('Payment data:', JSON.stringify(paymentData, null, 2));
      
      // Process payment
      const result = await processPayment(paymentData);
      
      if (result.success) {
        setPaymentStatus('success');
        setTransactionId(result.transactionId);
        
        // Navigate to confirmation page after a short delay
        const confirmationState = {
          bookingId: result.bookingId || `B${Date.now()}`,
          transactionId: result.transactionId,
          amount: paymentData.amount,
          bus: state?.bus || bus,
          selectedSeats: state?.selectedSeats || selectedSeats || [],
          passengers: state?.passengers || passengers || [],
          paymentMethod: paymentMethod,
          source: source,
          destination: destination,
          journeyDate: journeyDate,
          status: 'CONFIRMED',
          ticketDetails: {
            ...(result.data || {}),
            ticketNumber: result.bookingId || `TKT-${Date.now()}`,
            status: 'CONFIRMED',
            bookingTime: new Date().toISOString()
          }
        };

        console.log('Navigating to confirmation with state:', confirmationState);
        
        // Use replace: true to prevent going back to payment page
        navigate('/booking-confirmation', { 
          state: confirmationState,
          replace: true 
        });
      } else {
        setPaymentStatus('failed');
        setError(result.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      setError(error.message || 'An error occurred during payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    console.log('Next button clicked. Active step:', activeStep);
    console.log('Total steps:', steps.length);
    
    if (activeStep === steps.length - 1) {
      console.log('Last step - proceeding to payment');
      handleProceedToPayment();
    } else {
      console.log('Moving to next step');
      setActiveStep((prevStep) => {
        const nextStep = prevStep + 1;
        console.log('Updating step from', prevStep, 'to', nextStep);
        return nextStep;
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleTermsChange = (event) => {
    setAcceptedTerms(event.target.checked);
    if (error) setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '--';
    }
  };

  const calculateTravelTime = (departure, arrival) => {
    if (!departure || !arrival) return '--';
    
    try {
      const [depHours, depMins] = departure.split(':').map(Number);
      const [arrHours, arrMins] = arrival.split(':').map(Number);
      
      let hours = arrHours - depHours;
      let mins = arrMins - depMins;
      
      if (mins < 0) {
        hours -= 1;
        mins += 60;
      }
      
      return `${hours}h ${mins}m`;
    } catch (error) {
      console.error('Error calculating travel time:', error);
      return '--';
    }
  };

  const handleClickShowPassword = () => {
    setUpiForm({ ...upiForm, showPassword: !upiForm.showPassword });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case PAYMENT_METHODS.UPI:
        return (
          <Box component="form" noValidate autoComplete="off" mt={2}>
            <TextField
              label="UPI ID"
              value={upiForm.upiId}
              onChange={(e) => setUpiForm({...upiForm, upiId: e.target.value})}
              fullWidth
              margin="normal"
              placeholder="username@upi"
              autoComplete="off"
            />
            <TextField
              label="UPI PIN"
              type={upiForm.showPassword ? 'text' : 'password'}
              value={upiForm.upiPin}
              onChange={(e) => setUpiForm({...upiForm, upiPin: e.target.value})}
              fullWidth
              margin="normal"
              placeholder="Enter 4-6 digit UPI PIN"
              autoComplete="off"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {upiForm.showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={upiForm.saveForFuture}
                  onChange={(e) => setUpiForm({...upiForm, saveForFuture: e.target.checked})}
                  color="primary"
                />
              }
              label="Save this UPI ID for future payments"
            />
          </Box>
        );
      case PAYMENT_METHODS.CARD:
        return (
          <Box mt={2}>
            <TextField
              label="Card Number"
              value={cardForm.cardNumber}
              onChange={(e) => setCardForm({...cardForm, cardNumber: e.target.value})}
              fullWidth
              margin="normal"
              placeholder="1234 5678 9012 3456"
            />
            <TextField
              label="Name on Card"
              value={cardForm.cardName}
              onChange={(e) => setCardForm({...cardForm, cardName: e.target.value})}
              fullWidth
              margin="normal"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Expiry Date (MM/YY)"
                  value={cardForm.expiryDate}
                  onChange={(e) => setCardForm({...cardForm, expiryDate: e.target.value})}
                  fullWidth
                  margin="normal"
                  placeholder="MM/YY"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="CVV"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({...cardForm, cvv: e.target.value})}
                  fullWidth
                  margin="normal"
                  placeholder="123"
                  type="password"
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Checkbox
                  checked={cardForm.saveCard}
                  onChange={(e) => setCardForm({...cardForm, saveCard: e.target.checked})}
                  color="primary"
                />
              }
              label="Save card details for future payments"
            />
          </Box>
        );
      case PAYMENT_METHODS.NETBANKING:
        return (
          <Box mt={2}>
            <TextField
              label="Bank Name"
              value={netbankingForm.bank}
              onChange={(e) => setNetbankingForm({...netbankingForm, bank: e.target.value})}
              fullWidth
              margin="normal"
              select
              SelectProps={{
                native: true,
              }}
            >
              <option value=""></option>
              <option value="SBI">State Bank of India</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="AXIS">Axis Bank</option>
            </TextField>
            <TextField
              label="Account Holder Name"
              value={netbankingForm.username}
              onChange={(e) => setNetbankingForm({...netbankingForm, username: e.target.value})}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              value={netbankingForm.password}
              onChange={(e) => setNetbankingForm({...netbankingForm, password: e.target.value})}
              fullWidth
              margin="normal"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Card sx={{ mb: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <DirectionsBusIcon />
                </Avatar>
              }
              title={`${bus?.busName || 'Bus'} - ${bus?.busNumber || ''}`}
              subheader={`${bus?.type || 'AC Sleeper'} | ${bus?.amenities || 'No amenities'}`}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Journey Details</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">{source}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(journeyDate)} at {bus?.departureTime || '--:--'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary">
                        {calculateTravelTime(bus?.departureTime, bus?.arrivalTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight="bold">{destination}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(journeyDate)} at {bus?.arrivalTime || '--:--'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Fare Summary</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        {fareDetails.seatBreakdown?.map((seat, index) => (
                          <TableRow key={index}>
                            <TableCell>Seat {seat.seatNumber} ({seat.type})</TableCell>
                            <TableCell align="right">₹{seat.price.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell><strong>Total Amount</strong></TableCell>
                          <TableCell align="right"><strong>₹{(fareDetails.total || 0).toFixed(2)}</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
              <Typography variant="h6" gutterBottom>Passenger Details</Typography>
              <Divider sx={{ mb: 2 }} />
              {console.log('Rendering passenger details:', { passengers, selectedSeats })}
              {passengers.map((passenger, index) => (
                <Box key={index} mb={2} p={2} border={1} borderRadius={1} borderColor="divider">
                  <Typography variant="subtitle1">
                    Passenger {passenger.passengerName || passenger.name} (Seat: {selectedSeats[index]?.seatNumber || '--'})
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Age: {passenger.age} | Gender: {passenger.gender}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        );
      
      case 1:
        return (
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title="Review & Payment"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>Select Payment Method</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {getPaymentMethods().map((method) => (
                    <Card 
                      key={method.id} 
                      variant="outlined" 
                      sx={{ mb: 2, cursor: 'pointer', borderColor: paymentMethod === method.id ? 'primary.main' : 'divider' }}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" alignItems="center">
                          <Radio value={method.id} checked={paymentMethod === method.id} />
                          <Box ml={1} display="flex" alignItems="center">
                            <Box sx={{ color: 'primary.main', mr: 1 }}>{method.icon}</Box>
                            <Typography>{method.label}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </FormControl>

              {renderPaymentForm()}
              
              <Box mt={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedTerms}
                      onChange={handleTermsChange}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'primary.main' }}>Terms and Conditions</a> and 
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'primary.main', marginLeft: 4 }}>Privacy Policy</a>
                    </Typography>
                  }
                />
                
                {paymentStatus === 'success' && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Payment successful! Redirecting to booking confirmation...
                  </Alert>
                )}
                
                {paymentStatus === 'error' && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Booking Summary
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ color: 'error.main', textAlign: 'center', my: 4 }}>
          <Typography>{error}</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {renderStepContent(activeStep)}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardHeader title="Fare Summary" />
              <CardContent>
                <List disablePadding>
                  {fareDetails.seatBreakdown?.map((seat, index) => (
                    <React.Fragment key={index}>
                      <ListItem disableGutters>
                        <ListItemText 
                          primary={`Seat ${seat.seatNumber} (${seat.type})`}
                          secondary="Base Fare"
                        />
                        <Typography>₹{seat.price.toFixed(2)}</Typography>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                  <ListItem disableGutters>
                    <ListItemText 
                      primary="Subtotal"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                    <Typography>₹{fareDetails.baseFare?.toFixed(2)}</Typography>
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText 
                      primary="GST (5%)" 
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondary="Waived"
                    />
                    <Box display="flex" alignItems="center">
                      <Typography sx={{ textDecoration: 'line-through', color: 'text.secondary', mr: 1 }}>
                        ₹{fareDetails.gst?.toFixed(2)}
                      </Typography>
                      <Typography color="success.main" fontWeight="medium">
                        ₹0.00
                      </Typography>
                    </Box>
                  </ListItem>
                  <Divider />
                  <ListItem disableGutters>
                    <ListItemText 
                      primary={<Typography variant="subtitle1">Total Amount</Typography>} 
                    />
                    <Typography variant="h6" color="primary">
                      ₹{fareDetails.total?.toFixed(2)}
                    </Typography>
                  </ListItem>
                </List>
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  color="primary"
                  onClick={handleNext}
                  disabled={loading || (activeStep === steps.length - 1 && !acceptedTerms)}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                  sx={{ mt: 3, height: 48 }}
                >
                  {loading ? 'Processing...' : 
                   activeStep === steps.length - 1 ? 'Pay ₹' + fareDetails.total.toFixed(2) : 'Next'}
                </Button>
                
                {activeStep > 0 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handleBack}
                    sx={{ mt: 2 }}
                  >
                    Back
                  </Button>
                )}
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    By proceeding, you agree to our Terms of Service and Privacy Policy
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Need help?</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">+1 234 567 890</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">support@busbooking.com</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default BookingSummary;
