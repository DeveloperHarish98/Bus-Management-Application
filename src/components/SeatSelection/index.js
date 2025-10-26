import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Divider,
  Chip,
  styled,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  DirectionsBus as DirectionsBusIcon,
} from '@mui/icons-material';
import { useBusBooking } from '../../contexts/BusBookingContext';
import { format } from 'date-fns';
import { busService } from '../../services/busService';
import './SeatSelection.css';

// SVG Components
const DriverSvg = () => (
  <svg width="45" height="55" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="driver-icon">
    <path d="M12.305 24h-.61c-.035-.004-.07-.01-.105-.012a11.783 11.783 0 0 1-2.117-.261 12.027 12.027 0 0 1-6.958-4.394A11.933 11.933 0 0 1 .027 12.78L0 12.411v-.822c.005-.042.013-.084.014-.127a11.845 11.845 0 0 1 1.102-4.508 12.007 12.007 0 0 1 2.847-3.852A11.935 11.935 0 0 1 11.728.003c.947-.022 1.883.07 2.81.27 1.22.265 2.369.71 3.447 1.335a11.991 11.991 0 0 1 3.579 3.164 11.876 11.876 0 0 1 2.073 4.317c.178.712.292 1.434.334 2.168.008.146.02.292.029.439v.609c-.004.03-.011.06-.012.089a11.81 11.81 0 0 1-1.05 4.521 12.02 12.02 0 0 1-1.92 2.979 12.046 12.046 0 0 1-6.395 3.812c-.616.139-1.24.23-1.872.265-.149.008-.297.02-.446.03zm8.799-13.416c-.527-3.976-4.078-7.808-9.1-7.811-5.02-.003-8.583 3.823-9.11 7.809h.09c.64-.035 1.278-.092 1.912-.195.815-.131 1.614-.326 2.378-.639.625-.255 1.239-.54 1.855-.816.82-.368 1.673-.593 2.575-.62a7.123 7.123 0 0 1 1.947.187c.585.146 1.136.382 1.68.634.57.264 1.14.526 1.733.736 1.2.424 2.442.62 3.706.7.11.006.222.01.334.015zm-10.95 10.471v-.094c0-1.437 0-2.873-.002-4.31 0-.141-.011-.284-.035-.423a2.787 2.787 0 0 0-.775-1.495c-.564-.582-1.244-.896-2.067-.892-1.414.007-2.827.002-4.24.002h-.09a9.153 9.153 0 0 0 3.125 5.256 9.15 9.15 0 0 0 4.083 1.956zm3.689.001c1.738-.36 3.25-1.137 4.528-2.355 1.4-1.334 2.287-2.956 2.685-4.855l-.077-.003h-4.362c-.237 0-.47.038-.695.112-.667.22-1.188.635-1.588 1.206a2.673 2.673 0 0 0-.494 1.59c.008 1.4.003 2.801.003 4.202v.103zM12.05 14.22c1.215-.035 2.204-1.083 2.165-2.275-.039-1.223-1.095-2.215-2.29-2.166-1.211.05-2.2 1.108-2.15 2.302.051 1.191 1.108 2.186 2.275 2.139z" fill="#858585"/>
  </svg>
);

const ExitSvg = ({ direction = 'right' }) => (
  <svg
    width="45"
    height="55"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="exit-icon"
    style={{
      transform: `scale(1) ${direction === 'right' ? '' : 
                 direction === 'left' ? 'rotate(180deg)' :
                 direction === 'up' ? 'rotate(-90deg)' :
                 direction === 'down' ? 'rotate(90deg)' : ''}`
    }}
  >
    <path
      d="M9,11.5v2A2.5,2.5,0,0,1,6.5,16h-4A2.5,2.5,0,0,1,0,13.5V2.5A2.5,2.5,0,0,1,2.5,0h4A2.5,2.5,0,0,1,9,2.5v2a.5.5,0,0,1-.5.5.5.5,0,0,1-.5-.5v-2A1.5,1.5,0,0,0,6.5,1h-4A1.5,1.5,0,0,0,1,2.5v11A1.5,1.5,0,0,0,2.5,15h4A1.5,1.5,0,0,0,8,13.5v-2a.5.5,0,0,1,.5-.5A.5.5,0,0,1,9,11.5Zm6.962-3.809a.505.505,0,0,0,0-.382.518.518,0,0,0-.109-.163l-4-4a.5.5,0,0,0-.708,0,.5.5,0,0,0,0,.708L14.293,7H4.5a.5.5,0,0,0-.5.5.5.5,0,0,0,.5.5h9.793l-3.147,3.146a.5.5,0,0,0,0,.708A.5.5,0,0,0,11.5,12a.5.5,0,0,0,.354-.146l4-4A.518.518,0,0,0,15.962,7.691Z"
      fill="#858585"
    />
  </svg>
);

// Seat types & statuses for clarity
const SEAT_TYPES = {
  WINDOW: 'WINDOW',
  STANDARD: 'STANDARD',
  SLEEPER: 'SLEEPER',
  SEMI_SLEEPER: 'SEMI_SLEEPER',
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
  SEATER: 'SEATER',
  AC: 'AC',
  NON_AC: 'NON AC',
};
const SEAT_STATUS = {
  BOOKED: 'BOOKED',
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  SELECTED: 'SELECTED',
  PAYMENT_DONE: 'PAYMENT_DONE',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
};

// Styled Tooltip with custom background
const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(14),
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    padding: '12px',
    '& .MuiTooltip-arrow': {
      color: 'rgba(255, 255, 255, 0.95)',
      '&:before': {
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }
    }
  },
}));

// Styled seat button with hover and state visuals
const SeatButton = styled(IconButton)(({ theme, status, selected }) => {
  const normalizedStatus = String(status || '').toUpperCase();
  const isAvailable = normalizedStatus === SEAT_STATUS.AVAILABLE || normalizedStatus === 'AVAILABLE';
  const isSelected = selected === true;
  const isSelectable = isAvailable || isSelected;
  
  return {
    width: 65,
    height: 65,
    padding: 0,
    margin: 4,
    position: 'relative',
    border: 'none',
    backgroundColor: 'transparent',
    filter: isSelected ? 'drop-shadow(0 0 10px rgba(255, 152, 0, 0.8))' : 'none',
    '&:hover': {
      backgroundColor: 'transparent',
      transform: isSelectable ? 'scale(1.1)' : 'none',
      cursor: isSelectable ? 'pointer' : 'not-allowed',
    },
    '&.Mui-disabled': {
      backgroundColor: 'transparent',
      '&:hover': {
        cursor: 'not-allowed',
      },
    },
    pointerEvents: isSelectable ? 'auto' : 'none',
    transition: 'all 0.2s ease',
  };
});

// Memoized Seat SVG component with simplified styling
const SeatSvg = memo(({ number, status = SEAT_STATUS.AVAILABLE, selected = false, seatType = SEAT_TYPES.STANDARD, price = 0 }) => {
  // Determine colors based on seat status and selection
  const colors = React.useMemo(() => {
    // If seat has pending payment, show as yellow
    if (status === SEAT_STATUS.PAYMENT_PENDING || status === 'PAYMENT_PENDING') {
      return {
        main: '#FFD700',    // Gold color for pending payment
        text: '#000',
        bottom: '#FFC107',
        stroke: '#FFA000',
        status: 'Payment Pending',
        opacity: 0.7
      };
    }
    // If seat is explicitly selected, show as selected (orange)
    if (selected === true) { 
      return { 
        main: '#ff9800',    // Orange for selected
        text: '#fff', 
        bottom: '#f57c00',
        stroke: '#e65100',
        status: 'Selected'
      }; 
    }
    
    // Otherwise, determine color based on status
    const normalizedStatus = String(status || '').toUpperCase();
    
    switch (normalizedStatus) {
      case SEAT_STATUS.BOOKED:
      case 'BOOKED':
      case SEAT_STATUS.PAYMENT_DONE:
      case 'PAYMENT_DONE':
        return { 
          main: '#9e9e9e',  // Gray for booked
          text: '#fff', 
          bottom: '#757575',
          stroke: '#616161',
          status: 'Booked'
        }; 
      case SEAT_STATUS.LOCKED:
      case 'MAINTENANCE':
        return { 
          main: '#9e9e9e',  // Gray for locked/maintenance
          text: '#fff', 
          bottom: '#757575',
          stroke: '#616161',
          status: 'Maintenance'
        };
      default:
        return { 
          main: '#4caf50',  // Green for available
          text: '#fff', 
          bottom: '#388e3c',
          stroke: '#1b5e20',
          status: 'Available'
        };
    }
  }, [status, selected]); // Recalculate when status or selected changes

  return (
    <span aria-label={`Seat ${number} - ${status}`} role="img">
      <div
        style={{
          width: 60,
          height: 52,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 6,
          position: 'relative',
        }}
      >

        {/* Seat SVG */}
        <svg
          width="60"
          height="52"
          viewBox="0 0 40 32"
          className="seat-svg"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            display: 'block', 
            transition: 'all 0.2s ease-in-out',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <rect
            x="8.75"
            y="2.75"
            width="22.5"
            height="26.5"
            rx="2.25"
            fill={colors.main}
            stroke={colors.stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Seat cushion */}
          <rect
            x="10.25"
            y="11.75"
            width="14.5"
            height="5.5"
            rx="2.25"
            transform="rotate(90 10.25 11.75)"
            fill={colors.main}
            stroke={colors.stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect
            x="35.25"
            y="11.75"
            width="14.5"
            height="5.5"
            rx="2.25"
            transform="rotate(90 35.25 11.75)"
            fill={colors.main}
            stroke={colors.stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect
            x="8.75"
            y="22.75"
            width="22.5"
            height="6.5"
            rx="2.25"
            fill={colors.bottom}
            stroke={colors.stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <text
            x="20"
            y="18"
            fill={colors.text}
            fontSize="10"
            textAnchor="middle"
            fontWeight={selected ? 'bold' : 'normal'}
          >
            {number}
          </text>
        </svg>
      </div>
    </span>
  );
});

// Main Seat Selection Component
const SeatSelection = () => {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { selectedBus, selectSeats, updatePassengerDetails } = useBusBooking();

  // Initialize states
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState(selectedBus?.selectedSeats || []);
  const [passengers, setPassengers] = useState(
    selectedBus?.passengers?.length ? selectedBus.passengers : [{ name: '', age: '', gender: 'MALE' }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [step, setStep] = useState(selectedBus?.step || 1); // 1 Seat selection, 2 Passenger details, 3 Confirmation

  // Extract info from locationState or context
  const bus = locationState?.bus || selectedBus;
  const journeyDate = locationState?.journeyDate || bus?.journeyDate;
  const source = locationState?.source || bus?.source;
  const destination = locationState?.destination || bus?.destination;

  // Mock seat data generator for demo/testing
  const generateMockSeats = (count) => {
    const seatTypes = Object.values(SEAT_TYPES);
    const seatStatuses = [SEAT_STATUS.AVAILABLE, SEAT_STATUS.BOOKED, SEAT_STATUS.LOCKED, SEAT_STATUS.AVAILABLE, SEAT_STATUS.PAYMENT_DONE];
    return Array.from({ length: count }, (_, i) => ({
      id: `seat-${i + 1}`,
      number: String(i + 1).padStart(2, '0'),
      type: seatTypes[Math.floor(Math.random() * seatTypes.length)],
      status: seatStatuses[Math.floor(Math.random() * seatStatuses.length)],
      price: 500 + Math.floor(Math.random() * 1000),
      row: Math.floor(i / 4) + 1,
      column: (i % 4) + 1,
    }));
  };

  // Fetch real seat details from the API
  const fetchSeatDetails = useCallback(async () => {
    if (!bus?.busNumber) {
      setError('No bus selected');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call the busService to get real seat data
      const { seats } = await busService.getSeatDetails(bus.busNumber);
      
      if (!seats || !Array.isArray(seats)) {
        throw new Error('Invalid seat data received from server');
      }
      
      // Transform the API response to match our frontend format
      const formattedSeats = seats.map((seat, index) => {
        const price = seat.seatPrice || seat.price || seat.fare || seat.seatFare || seat.amount || 0;
        const seatNumber = seat.seatNumber || seat.seatId || seat.id || `temp-${index}`;
        const seatId = `seat-${seatNumber}-${index}`; // Add index to ensure uniqueness
        
        // Map backend status to frontend status
        let status = (seat.status || SEAT_STATUS.AVAILABLE).toUpperCase();
        if (status === 'PAYMENT_PENDING') {
          status = SEAT_STATUS.PAYMENT_PENDING;
        }
        
        const seatType = seat.seatType || seat.type || SEAT_TYPES.STANDARD;
        
        return {
          id: seatId,
          number: String(seatNumber).padStart(2, '0'),
          type: seatType.toUpperCase(),
          seatType: seatType.toUpperCase(),
          status: status,
          price: Number(price),
          seatPrice: Number(price),
          row: seat.row || Math.ceil(parseInt(seatNumber) / 4) || 1,
          column: (parseInt(seatNumber) - 1) % 4 + 1 || 1,
          seatClass: (seat.seatClass || seat.class || 'standard').toLowerCase(),
          isWindowSeat: Boolean(seat.isWindowSeat || seat.windowSeat || false),
          isEmergencyExit: Boolean(seat.isEmergencyExit || seat.emergencyExit || false),
          ...seat
        };
      });
      
      setSeats(formattedSeats);
      
    } catch (e) {
      console.error('Error fetching seat details:', e);
      setError('Failed to load seat details. Please try again.');
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Falling back to mock data');
        setSeats(generateMockSeats(40));
      }
    } finally {
      setLoading(false);
    }
  }, [bus?.busNumber]);

  // Handle seat click - toggle select/deselect if available
  const handleSeatClick = (seat) => {
    console.log('Seat clicked:', seat);
    
    // Prevent interaction with placeholder or invalid seats
    const normalizedStatus = String(seat.status || '').toUpperCase();
    if (seat.isPlaceholder || [SEAT_STATUS.BOOKED, SEAT_STATUS.LOCKED, 'BOOKED', 'LOCKED', 'OCCUPIED', 'MAINTENANCE', 'PAYMENT_PENDING'].includes(normalizedStatus)) {
      console.log('Seat not selectable:', seat.id, 'Status:', normalizedStatus);
      return;
    }

    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    let updatedSelectedSeats;
    if (isSelected) {
      updatedSelectedSeats = selectedSeats.filter((s) => s.id !== seat.id);
      console.log('Deselected seat:', seat.id);
    } else {
      updatedSelectedSeats = [...selectedSeats, { ...seat, status: SEAT_STATUS.SELECTED }];
      console.log('Selected seat:', seat.id);
    }
    setSelectedSeats(updatedSelectedSeats);
    selectSeats(updatedSelectedSeats);
  };

  // Handle passenger input changes
  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = passengers.map((p, i) => (i === index ? { ...p, [field]: value } : p));
    setPassengers(updatedPassengers);
    updatePassengerDetails(updatedPassengers);
  };

  // Add a new passenger form
  const addPassenger = () => {
    if (passengers.length < selectedSeats.length) {
      const newPassengers = [...passengers, { name: '', age: '', gender: 'MALE', phone: '' }];
      setPassengers(newPassengers);
      updatePassengerDetails(newPassengers);
    }
  };

  // Remove a passenger form and deselect seat accordingly
  const removePassenger = (index) => {
    if (passengers.length <= 1) return;
    const newPassengers = passengers.filter((_, i) => i !== index);
    let newSelectedSeats = [...selectedSeats];
    if (index < selectedSeats.length) newSelectedSeats.splice(index, 1);

    setPassengers(newPassengers);
    setSelectedSeats(newSelectedSeats);
    updatePassengerDetails(newPassengers);
    selectSeats(newSelectedSeats, step);
  };

  // Confirm seat selection and proceed to passenger details
  const handleConfirmSeats = async () => {
    if (selectedSeats.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one seat', severity: 'warning' });
      return;
    }

    if (passengers.length < selectedSeats.length) {
      const more = Array(selectedSeats.length - passengers.length).fill({ name: '', age: '', gender: 'MALE' });
      setPassengers((prev) => [...prev, ...more]);
    }

    await updatePassengerDetails(passengers);
    setStep(2);
    selectSeats(selectedSeats, 2);
  };

  // Navigate to confirmation page with booking details
  const handleConfirmBooking = async () => {
    const allValid = passengers.every((p) => p.name.trim() && p.age && p.gender);
    if (!allValid) {
      setSnackbar({ open: true, message: 'Please fill all passenger details', severity: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Prepare booking data for confirmation page
      const bookingData = {
        busNumber: bus.busNumber || bus.id,
        bus: bus, // Include full bus object
        journeyDate,
        source,
        destination,
        passengers: selectedSeats.map((seat, i) => ({
          seatNumber: seat.number,
          passengerName: passengers[i].name,
          age: Number(passengers[i].age),
          gender: passengers[i].gender,
          phoneNumber: passengers[i].phoneNumber || ''
        })),
        selectedSeats: [...selectedSeats],
        totalFare: selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0),
      };
      
      // Update passenger details in context
      await updatePassengerDetails(bookingData.passengers);
      
      console.log('Navigating to booking summary with data:', bookingData);
      
      // Navigate to booking summary page with the booking data
      navigate('/booking-summary', { 
        state: { 
          ...bookingData,
          bookingTime: new Date().toISOString(),
          status: 'PAYMENT_PENDING' // Mark as pending until confirmed
        },
        replace: true
      });
      
      // Update local state
      setStep(3);
      setError('');
    } catch (err) {
      console.error('Error navigating to confirmation:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to proceed to confirmation. Please try again.';
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error',
        autoHideDuration: 10000
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Back button behavior for steps
  const handleBack = async () => {
    if (step === 1) {
      navigate(-1);
    } else {
      const prevStep = step - 1;
      setStep(prevStep);
      await selectSeats(selectedSeats, prevStep);
      if (prevStep === 1) await updatePassengerDetails(passengers);
    }
  };

  // Close snackbar
  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // Load data on mount and bus change
  useEffect(() => {
    if (!bus) {
      setError('No bus selected');
      setLoading(false);
      return;
    }
    // Set seats/passengers/step from context if available
    if (selectedBus?.selectedSeats?.length > 0) {
      setSelectedSeats(selectedBus.selectedSeats);
      if (selectedBus.passengers?.length > 0) setPassengers(selectedBus.passengers);
      else setPassengers(Array(selectedBus.selectedSeats.length).fill({ name: '', age: '', gender: 'MALE', phone: '' }));
      setStep(selectedBus.step || 2);
    }
    fetchSeatDetails();

    return () => {
      setLoading(false);
    };
  }, [bus, selectedBus, fetchSeatDetails]);

  // Adjust passenger form count to match selected seats
  useEffect(() => {
    const diff = selectedSeats.length - passengers.length;
    if (diff > 0) {
      setPassengers((prev) => [...prev, ...Array(diff).fill({ name: '', age: '', gender: 'MALE', phone: '' })]);
    } else if (diff < 0) {
      setPassengers((prev) => prev.slice(0, selectedSeats.length));
    }
  }, [selectedSeats.length, passengers.length]);

  // Render individual seats inside buttons + tooltips
  const renderSeat = (seat) => {
    // Handle placeholder seats (appear as normal seats but are not selectable)
    if (seat.isPlaceholder) {
      return (
        <Box 
          key={seat.id}
          sx={{
            width: 60,
            height: 52,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            paddingTop: '10.5px',
            cursor: 'default',
            '&:hover': {
              cursor: 'default',
            },
          }}
        >
          <SeatSvg 
            number={seat.number}
            status="AVAILABLE"
            seatType={SEAT_TYPES.STANDARD}
            price={0}
          />
        </Box>
      );
    }

    const normalizedStatus = String(seat.status || '').toUpperCase();
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    const isBooked = [SEAT_STATUS.BOOKED, 'BOOKED', 'OCCUPIED', 'PAYMENT_DONE'].includes(normalizedStatus);
    const isLocked = [SEAT_STATUS.LOCKED, 'LOCKED', 'MAINTENANCE'].includes(normalizedStatus);
    const isPendingPayment = [SEAT_STATUS.PAYMENT_PENDING, 'PAYMENT_PENDING'].includes(normalizedStatus);
    const isUnavailable = normalizedStatus === 'UNAVAILABLE';
    const seatType = (seat.type || SEAT_TYPES.STANDARD).toLowerCase().replace('_', ' ');
    const seatPrice = seat.price || 0;
    const status = isUnavailable ? 'UNAVAILABLE' : 
                   isBooked ? SEAT_STATUS.BOOKED || SEAT_STATUS.PAYMENT_DONE : 
                   isPendingPayment ? SEAT_STATUS.PAYMENT_PENDING :
                   isLocked ? SEAT_STATUS.LOCKED : 
                   SEAT_STATUS.AVAILABLE;

    const seatButton = (
      <SeatButton
        key={seat.id}
        onClick={() => handleSeatClick(seat)}
        disabled={isBooked || isLocked || isUnavailable || isPendingPayment}
        status={status}
        selected={isSelected}
        aria-label={`Seat ${seat.number} - ${status}`}
      >
        <SeatSvg 
          number={seat.number} 
          status={status} 
          selected={isSelected} 
          seatType={seatType}
          price={seatPrice}
        />
      </SeatButton>
    );

    // Tooltip with seat metadata
    const tooltipTitle = (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Seat {seat.number}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Type:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {seatType.charAt(0).toUpperCase() + seatType.slice(1)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Price:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              ₹{seatPrice}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Status:</Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'medium',
                color: status === SEAT_STATUS.AVAILABLE ? '#4caf50' : 
                      status === SEAT_STATUS.SELECTED ? '#ff9800' :
                      status === SEAT_STATUS.BOOKED ? '#9e9e9e' || '#FFA000' :
                      status === SEAT_STATUS.PAYMENT_PENDING ? '#FFA000' : 'inherit'
              }}
            >
              {status === SEAT_STATUS.AVAILABLE ? 'Available' :
               status === SEAT_STATUS.SELECTED ? 'Selected' :
               status === SEAT_STATUS.BOOKED ? 'Booked' || 'Payment Done' :
               status === SEAT_STATUS.PAYMENT_PENDING ? 'Payment Pending' :
               status === SEAT_STATUS.LOCKED ? 'Maintenance' : status}
            </Typography>
          </Box>
        </Box>
      </Box>
    );

    return (
      <CustomTooltip key={seat.id} title={tooltipTitle} placement="top" arrow>
        <span>{seatButton}</span>
      </CustomTooltip>
    );
  };

  // Removed unused createPlaceholderSeat function

  // Render seat layout grouped by rows
  const renderSeatLayout = () => {
    if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
    if (!seats || seats.length === 0) return <Alert severity="info">No seat information available for this bus.</Alert>;

    // Group seats by row and sort by column
    const seatRows = {};
    seats.forEach(seat => {
      if (!seatRows[seat.row]) {
        seatRows[seat.row] = [];
      }
      seatRows[seat.row].push(seat);
    });

    // Sort seats in each row by column and add placeholders for missing seats
    Object.entries(seatRows).forEach(([rowNum, rowSeats]) => {
      rowSeats.sort((a, b) => (a.column || 0) - (b.column || 0));
      const isLastRow = Number(rowNum) === Math.max(...Object.keys(seatRows).map(Number));
      
      // Clear the array but keep the reference
      seatRows[rowNum] = [];
      
      if (isLastRow) {
        // Last row: 1-1-1-1-1 layout with 6px between each seat
        for (let i = 1; i <= 5; i++) {
          const seat = rowSeats.find(s => s.column === i);
          if (seat) {
            seatRows[rowNum].push(seat);
          } else {
            seatRows[rowNum].push({
              id: `placeholder-${rowNum}-${i}`,
              number: '00',
              isPlaceholder: true,
              status: 'UNAVAILABLE',
              row: parseInt(rowNum),
              column: i
            });
          }
        }
      } else {
        // Regular rows: 2-2 layout with 12px between groups
        for (let i = 1; i <= 4; i++) {
          const seat = rowSeats.find(s => s.column === i);
          if (seat) {
            seatRows[rowNum].push(seat);
          } else {
            seatRows[rowNum].push({
              id: `placeholder-${rowNum}-${i}`,
              number: '00',
              isPlaceholder: true,
              status: 'UNAVAILABLE',
              row: parseInt(rowNum),
              column: i
            });
          }
        }
      }
    });

    // Get all row numbers and sort them
    const rowNumbers = Object.keys(seatRows).map(Number).sort((a, b) => a - b);

    return (
      <Box className="bus-layout" sx={{ 
        maxWidth: 800, 
        margin: '0 auto', 
        p: 2,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Seats container */}
        <Box className="seats-container" sx={{ 
          backgroundColor: '#f8f9fa', 
          p: 3, 
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          position: 'relative',
          pt: 16, // Increased padding at the top for indicators
          mt: 4    // Added margin to create more space between indicators and seats
        }}>
          {/* Exit and Driver indicators on top of seats */}
          <Box sx={{
            position: 'absolute',
            top: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            px: 4,
            zIndex: 1
          }}>
            {/* Exit on the left */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              px: 2,
              py: 1
            }}>
              <ExitSvg direction="left" />
              <Typography variant="caption" sx={{ mt: 0.5, color: '#555', fontWeight: 'medium' }}>Exit</Typography>
            </Box>

            {/* Driver in the middle */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              px: 2,
              py: 1
            }}>
              <DriverSvg />
              <Typography variant="caption" sx={{ mt: 0.5, color: '#555', fontWeight: 'medium' }}>Driver</Typography>
            </Box>
          </Box>
          {rowNumbers.map((rowNum) => {
            const rowSeats = seatRows[rowNum] || [];
            const isLastRow = Number(rowNum) === Math.max(...rowNumbers);
            
            // For all rows, first 2 seats are left, next are right (or middle for last row)
            const leftSeats = rowSeats.slice(0, 2);
            const rightSeats = isLastRow ? rowSeats.slice(3, 5) : rowSeats.slice(2, 4);
            const middleSeat = isLastRow ? rowSeats[2] : null;

            return (
              <Box 
                key={`row-${rowNum}`} 
                className="seat-row" 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'flex-start',  // Changed from 'center' to 'flex-start'
                  mb: 2,  // 16px vertical gap
                  p: 1,
                  backgroundColor: 'white',
                  borderRadius: 1,
                  height: '60px',  // Fixed height for consistency
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.01)'
                  }
                }}
              >
                {/* Left Seats (2 seats) */}
                <Box display="flex" gap={0.75} sx={{  // 6px gap (0.75 * 8px)
                  width: 'auto',
                  justifyContent: 'flex-end',
                  marginRight: isLastRow ? '6px' : '12px',  // 6px or 12px gap
                  alignItems: 'flex-start',
                  height: '100%'
                }}>
                  {leftSeats.map(renderSeat)}
                </Box>
                
                {/* Middle Seat (only for last row) */}
                {isLastRow && middleSeat?.id && (
                  <Box 
                    key={`middle-${middleSeat.id}`}
                    sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      width: '60px',
                      margin: '0 6px'
                    }}
                  >
                    {renderSeat(middleSeat)}
                  </Box>
                )}
                
                {/* Right Seats (2 seats) */}
                <Box display="flex" gap={0.75} sx={{  // 6px gap (0.75 * 8px)
                  width: 'auto',
                  justifyContent: 'flex-start',
                  marginLeft: isLastRow ? '6px' : '12px',  // 6px or 12px gap
                  alignItems: 'flex-start',
                  height: '100%'
                }}>
                  {rightSeats.map(renderSeat)}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Simplified seat status legend */}
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Box 
            className="seat-legend" 
            sx={{ 
              p: 2, 
              borderRadius: 1,
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              maxWidth: 400,
              width: '100%',
              display: 'flex',
              flexDirection: 'corlumn',
              alignItems: 'center'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Seat Status
            </Typography>
            
            <Box display="flex" justifyContent="center" flexWrap="wrap" gap={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  width={20} 
                  height={20} 
                  bgcolor="#4caf50" 
                  borderRadius="4px" 
                  border="1px solid #388e3c"
                />
                <Typography variant="body2">Available</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  width={20} 
                  height={20} 
                  bgcolor="#ff9800" 
                  borderRadius="4px"
                  border="1px solid #f57c00"
                  sx={{
                    boxShadow: '0 0 10px rgba(255, 152, 0, 0.8)',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(255, 152, 0, 0.7)' },
                      '70%': { boxShadow: '0 0 0 10px rgba(255, 152, 0, 0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(255, 152, 0, 0)' },
                    },
                  }}
                />
                <Typography variant="body2">Selected</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  width={20} 
                  height={20} 
                  bgcolor="#9e9e9e" 
                  borderRadius="4px" 
                  border="1px solid #757575"
                />
                <Typography variant="body2">Booked</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Box 
                  width={20} 
                  height={20} 
                  bgcolor="#FFD700" 
                  borderRadius="4px" 
                  border="1px solid #FFC107"
                  sx={{ opacity: 0.7 }}
                />
                <Typography variant="body2">Payment Pending</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  // Render passenger details forms for each selected seat
  const renderPassengerDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Passenger Details</Typography>
      {selectedSeats.map((seat, index) => (
        <Paper key={seat.id} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">Passenger {index + 1} - Seat {seat.number}</Typography>
            <Chip label={`₹${seat.price}`} color="primary" size="small" sx={{ fontWeight: 'bold' }} />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={passengers[index]?.name || ''}
                onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                inputProps={{ min: 1, max: 120 }}
                value={passengers[index]?.age || ''}
                onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={passengers[index]?.gender || 'MALE'}
                  onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                  label="Gender"
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Phone Number"
                type="number"
                value={passengers[index]?.phoneNumber || ''}
                onChange={(e) => handlePassengerChange(index, 'phoneNumber', e.target.value)}
                margin="normal"
                placeholder="optional"
              />
            </Grid>
          </Grid>

          {index > 0 && (
            <Box textAlign="right" mt={1}>
              <Button size="small" color="error" onClick={() => removePassenger(index)}>
                Remove Passenger
              </Button>
            </Box>
          )}
        </Paper>
      ))}

      {passengers.length < 5 && selectedSeats.length > passengers.length && (
        <Box textAlign="center" mt={2}>
          <Button variant="outlined" onClick={addPassenger}>
            + Add Another Passenger
          </Button>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBackIcon />}>
          Back
        </Button>
        <Button variant="contained" color="primary" onClick={handleConfirmBooking} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Confirm Booking'}
        </Button>
      </Box>
    </Box>
  );

  // Render booking confirmation page
  const renderConfirmation = () => {
    const totalFare = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);

    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" gutterBottom>Booking Confirmed!</Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>Your booking was successful.</Typography>

        <Paper elevation={0} sx={{ p: 3, mt: 4, mb: 4, bgcolor: 'grey.50' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>Journey Details</Typography>
              <Box textAlign="left" pl={2}>
                <Typography><strong>Bus:</strong> {bus?.busName || bus?.busNumber}</Typography>
                <Typography><strong>From:</strong> {source}</Typography>
                <Typography><strong>To:</strong> {destination}</Typography>
                <Typography><strong>Date:</strong> {format(new Date(journeyDate), 'EEE, d MMM yyyy')}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>Fare Details</Typography>
              <Box textAlign="left" pl={2}>
                {selectedSeats.map((seat) => (
                  <Box key={seat.id} display="flex" justifyContent="space-between" mb={1}>
                    <Typography>Seat {seat.number}</Typography>
                    <Typography>₹{seat.price}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" fontWeight="bold">
                  <Typography>Total:</Typography>
                  <Typography>₹{totalFare}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box mt={4} textAlign="left">
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>Passenger Details</Typography>
            <Grid container spacing={2}>
              {selectedSeats.map((seat, index) => (
                <Grid item xs={12} sm={6} key={seat.id}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography fontWeight="bold">Seat {seat.number}</Typography>
                    <Typography>{passengers[index]?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {passengers[index]?.age} years • {passengers[index]?.gender}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
        <Box mt={4}>
          <Button variant="contained" color="primary" onClick={() => navigate('/my-bookings')} sx={{ mr: 2 }}>
            View My Bookings
          </Button>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Box>
      </Paper>
    );
  };

  // Main return: renders step-wise content
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div className="seat-layout-container">
        <div className="seat-layout-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography variant="h5" className="seat-layout-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsBusIcon /> {bus?.busNumber || '--'}{bus?.busNumber && bus?.busType ? ` - ${bus.busType}` : ''}
          </Typography>

          <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outlined" color="primary" startIcon={<ArrowBackIcon />} onClick={handleBack}>
              {step === 1 ? 'Back to Buses' : 'Back'}
            </Button>
            {step === 1 && (
              <Button variant="contained" color="primary" endIcon={<CheckCircleIcon />} onClick={handleConfirmSeats} disabled={selectedSeats.length === 0 || loading}>
                Confirm Seats ({selectedSeats.length})
              </Button>
            )}
          </div>
        </div>

        <Paper elevation={0} sx={{ p: 1, mb: 3, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 1 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={4}>
              <Typography variant="subtitle1" fontWeight="bold">{source || '--'}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {journeyDate ? format(new Date(journeyDate), 'EEE, d MMM yyyy') : '--'}
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              {/* <Typography variant="caption" color="text.secondary" display="block">
                {bus?.travelTime || '--h --m'}
              </Typography> */}
              <Typography variant="caption" color="text.primary" fontWeight="medium" display="block">
                {bus?.busName || 'Bus Name'}
              </Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" fontWeight="bold">{destination || '--'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {bus?.arrivalTime || '--:--'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', mb: 3 }}>
          {step === 1 && renderSeatLayout()}
          {step === 2 && renderPassengerDetails()}
          {step === 3 && renderConfirmation()}
        </Paper>

        {step === 1 && (
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBackIcon />}>Back</Button>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                {selectedSeats.length} Seat{selectedSeats.length !== 1 ? 's' : ''} Selected • ₹
                {selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0)}
              </Typography>
              <Button variant="contained" color="primary" onClick={handleConfirmSeats} disabled={selectedSeats.length === 0}>
                Continue to Passenger Details
              </Button>
            </Box>
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </Container>
  );
};

export default SeatSelection;
