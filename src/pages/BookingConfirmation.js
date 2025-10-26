import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBusBooking } from '../contexts/BusBookingContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  TableContainer,
  Table,
  TableRow,
  TableCell,
  Snackbar,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PhoneIcon from '@mui/icons-material/Phone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticketId: ticketIdFromPath } = useParams();
  const { fetchBookingDetails } = useBusBooking();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [ticketNumber, setTicketNumber] = useState('');
  
  // Extract booking data from location state
  const stateData = location.state || {};
  
  // Handle both direct state and nested bookingData structure
  const {
    bus = stateData.bus || stateData.busDetails || {},
    source = stateData.source || '',
    destination = stateData.destination || '',
    selectedSeats = stateData.selectedSeats || stateData.seats || [],
    passengers = stateData.passengers || stateData.passengerDetails || [],
    bookingTime = stateData.bookingTime || new Date().toISOString(),
    departureDateTime = stateData.departureDateTime || stateData.departureTime || bus.departureTime,
    arrivalDateTime = stateData.arrivalDateTime || stateData.arrivalTime || bus.arrivalTime
  } = stateData;
  
  // Format dates and times
  const formatDateTime = (dateTime) => {
    if (!dateTime) return new Date();
    if (dateTime instanceof Date) return dateTime;
    const date = new Date(dateTime);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Set default departure and arrival times from bus data if not provided
  const departureTime = formatDateTime(departureDateTime || bus?.departureTime || bus?.departureDateTime);
  const arrivalTime = formatDateTime(arrivalDateTime || bus?.arrivalTime || bus?.arrivalDateTime || 
    (departureTime ? new Date(departureTime.getTime() + (2 * 60 * 60 * 1000)) : new Date()));
    
  // Get bus number from various possible locations
  const busNumber = bus?.busNumber || bus?.bus_number || bus?.number || '--';
  const busName = bus?.busName || bus?.name || bus?.bus_name || '--';
  const busType = bus?.type || bus?.busType || bus?.bus_type || '--';
  const amenities = bus?.amenities || bus?.amenitiesList || [];
  
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if we have a ticketId in URL path but no state (direct link to confirmation)
        if (ticketIdFromPath && !location.state) {
          // Fetch booking details using the ticket ID
          try {
            const booking = await fetchBookingDetails(ticketIdFromPath);
            if (booking) {
              setBookingData(prev => ({
                ...prev,
                ...booking,
                status: 'CONFIRMED',
                ticketId: ticketIdFromPath,
                ticketDetails: booking.ticketDetails || {
                  ticketNumber: ticketIdFromPath,
                  status: 'CONFIRMED',
                  bookingTime: booking.bookingTime || new Date().toISOString()
                }
              }));
              setTicketNumber(ticketIdFromPath);
            } else {
              throw new Error('Booking not found');
            }
          } catch (fetchError) {
            console.error('Error fetching booking details:', fetchError);
            setError('Failed to load booking details. Please check your ticket number and try again.');
            return;
          }
        } else if (location.state) {
          // Process the state data from navigation
          const stateData = location.state;
          const confirmedStatuses = ['CONFIRMED', 'PAYMENT_DONE', 'BOOKED'];
          const isConfirmed = confirmedStatuses.includes(stateData.status) || 
                            stateData.ticketDetails || 
                            stateData.paymentDetails;
          
          // Set the booking data with proper defaults
          const bookingData = {
            ...stateData,
            status: isConfirmed ? (stateData.status || 'CONFIRMED') : (stateData.status || 'PENDING'),
            ticketId: stateData.ticketId || stateData.bookingId || `TKT-${Date.now()}`,
            ticketDetails: stateData.ticketDetails || (isConfirmed ? {
              ticketNumber: stateData.ticketId || stateData.bookingId || `TKT-${Date.now()}`,
              status: 'CONFIRMED',
              bookingTime: stateData.bookingTime || new Date().toISOString()
            } : null)
          };
          
          setBookingData(bookingData);
          
          if (isConfirmed) {
            const ticketNum = bookingData.ticketDetails?.ticketNumber || bookingData.ticketId;
            setTicketNumber(ticketNum);
            
            // Update URL with the ticket ID in the path for sharing/bookmarking
            if (ticketNum && !window.location.pathname.includes(ticketNum)) {
              const newPath = `/booking-confirmation/${ticketNum}`;
              window.history.replaceState(bookingData, '', newPath);
            }
          }
        } else {
          // No valid data to show confirmation
          navigate('/');
          return;
        }
      } catch (err) {
        console.error('Error loading booking data:', err);
        setError('Failed to load booking details. Please try again.');
        // Redirect to home after a short delay
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [location.state, navigate, fetchBookingDetails, ticketIdFromPath]);
  
  const handleNewBooking = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);
  
  // Helper function to safely parse dates
  const safeDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };
  
  const formatDateDisplay = (date) => {
    if (!date) return '--';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '--';
      
      return dateObj.toLocaleDateString('en-IN', { 
        weekday: 'short',
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      console.error('Error formatting date display:', e, date);
      return '--';
    }
  };
  
  const formatTime = (date) => {
    if (!date) return '--:--';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '--:--';
      
      return dateObj.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch (e) {
      console.error('Error formatting time:', e, date);
      return '--:--';
    }
  };
  
  const getTravelDuration = (start, end) => {
    const startDate = safeDate(start);
    const endDate = safeDate(end);
    if (!startDate || !endDate) return '--';
    
    const diffMs = endDate - startDate;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  };
  
  const getSeatNumber = (seat) => {
    if (!seat) return '--';
    if (typeof seat === 'string') return seat;
    return seat.number || seat.seatNumber || seat.seat_number || '--';
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const formatBookingDate = (dateString) => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--';
      
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '--';
    }
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (!bookingData) {
    return null;
  }

  // Total fare is now calculated directly in the JSX

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Back to Home
      </Button>
      
      <Paper elevation={3} sx={{ p: { xs:2, md:4 }, mb:4 }}>
        <Box textAlign="center" mb={4}>
          <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Booking Confirmed!
          </Typography>
          {ticketNumber && (
            <Typography variant="h5" gutterBottom>
              Ticket Number: {ticketNumber}
            </Typography>
          )}
          {bookingTime && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Booking Date: {formatBookingDate(bookingTime)}
            </Typography>
          )}
          <Typography color="text.secondary">
            We've sent the booking details to your email and phone number.
          </Typography>
        </Box>

        <Card variant="outlined" sx={{ mb: 4 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DirectionsBusIcon color="primary" />
                <Typography variant="h6" component="div">Journey & Passenger Details</Typography>
              </Box>
            }
            sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText', py:1.5 }}
          />
          <CardContent sx={{ p:3 }}>
            <Grid container spacing={3}>
              {/* Journey Details */}
              <Grid item xs={12} md={5}>
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <DirectionsBusIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Box>
                        <Typography variant="subtitle1" noWrap>{busName}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>Bus No: {busNumber}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>{busType} • {Array.isArray(amenities) ? amenities.join(' • ') : amenities}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Box>
                      <Typography variant="h6" noWrap>{source || '--'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateDisplay(departureTime)}
                      </Typography>
                      <Typography variant="body1" color="primary" noWrap>
                        {formatTime(departureTime)}
                      </Typography>
                    </Box>
                    <Box textAlign="center" sx={{ alignSelf: 'center', px: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {getTravelDuration(departureTime, arrivalTime)}
                      </Typography>
                      <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
                      <Typography variant="caption" color="text.secondary" display="block">
                        {bus.travelDuration ? `${bus.travelDuration} mins` : 'Direct'}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="h6" noWrap>{destination || '--'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateDisplay(arrivalTime)}
                      </Typography>
                      <Typography variant="body1" color="primary" noWrap>
                        {formatTime(arrivalTime)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Selected Seats</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedSeats && selectedSeats.length > 0 ? (
                        selectedSeats.map((seat, idx) => {
                          const seatNum = getSeatNumber(seat);
                          return (
                            <Chip 
                              key={idx} 
                              label={`Seat ${seatNum}`} 
                              color="primary" 
                              variant="outlined"
                              size="small"
                            />
                          );
                        })
                      ) : (
                        <Typography variant="body2" color="text.secondary">No seats selected</Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Passenger Details in horizontal table style */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle1" gutterBottom>Passenger Details</Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer sx={{ maxHeight: 350 }}>
                  <Table stickyHeader size="small" aria-label="Passenger Details Table">
                    <thead>
                      <TableRow>
                        <TableCell>Passenger</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Seat</TableCell>
                      </TableRow>
                    </thead>
                    <tbody>
                      {passengers && passengers.length > 0 ? (
                        passengers.map((passenger, idx) => {
                          const passengerName = passenger.name || passenger.passengerName || `Passenger ${idx + 1}`;
                          const phoneNumber = passenger.phoneNumber || passenger.phone || '--';
                          const seatNumber = selectedSeats[idx] ? getSeatNumber(selectedSeats[idx]) : `Seat ${idx + 1}`;
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ 
                                    bgcolor: (passenger.gender || '').toUpperCase() === 'FEMALE' ? 'pink' : 
                                            ((passenger.gender || '').toUpperCase() === 'MALE' ? 'lightblue' : 'grey') 
                                  }}>
                                    {passengerName.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Typography variant="subtitle2">
                                    {passengerName}
                                    {passenger.age ? ` (${passenger.age} yrs)` : ''}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <PhoneIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {phoneNumber}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={seatNumber} 
                                  color="primary" 
                                  variant="outlined"
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No passenger details available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </tbody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Fare Summary below */}
        <Box mt={4} bgcolor="#f5f5f5" p={2} borderRadius={1}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Payment Summary
          </Typography>
          {selectedSeats?.map((seat, index) => (
            <Box key={index} display="flex" justifyContent="space-between" mb={1}>
              <Typography>Seat {seat.number || seat.seatNumber || `#${index + 1}`}</Typography>
              <Typography>₹{(Number(seat.price) || 0).toFixed(2)}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography variant="subtitle1">Total Paid</Typography>
            <Typography variant="subtitle1">
              ₹{selectedSeats?.reduce((total, seat) => total + (Number(seat.price) || 0), 0).toFixed(2)}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" justifyContent="center" gap={2} mt={4} flexWrap="wrap">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handlePrint} 
            size="large"
            sx={{ minWidth: '180px' }}
          >
            Print Ticket
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleNewBooking} 
            size="large"
            sx={{ minWidth: '180px' }}
          >
            Book Another Ticket
          </Button>
        </Box>
      </Paper>

      <Box textAlign="center" mt={4} mb={2}>
        <Typography variant="body2" color="text.secondary">
          Need help? Contact our 24/7 customer support
        </Typography>
        <Typography variant="body2" color="primary">
          support@busbooking.com | 1800-123-4567
        </Typography>
      </Box>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BookingConfirmation;
