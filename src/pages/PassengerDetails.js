import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon,
  Badge as BadgeIcon,
  Wc as GenderIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useBusBooking } from '../contexts/BusBookingContext';

const steps = ['Select Seats', 'Passenger Details', 'Payment', 'Confirmation'];

const PassengerDetails = () => {
  const navigate = useNavigate();
  const { 
    selectedBus, 
    selectedSeats, 
    updatePassengerDetails, 
    loading
  } = useBusBooking();
  
  const [passengers, setPassengers] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Initialize passenger forms based on selected seats
  useEffect(() => {
    if (selectedSeats.length > 0) {
      setPassengers(
        selectedSeats.map((seat) => ({
          seatNumber: seat.seatNumber,
          name: '',
          age: '',
          gender: '',
          phone: ''
        }))
      );
    } else {
      navigate('/buses');
    }
  }, [selectedSeats, navigate]);

  const handleInputChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
    setPassengers(updatedPassengers);
    
    // Clear error for this field
    if (formErrors[`${index}-${field}`]) {
      const newErrors = { ...formErrors };
      delete newErrors[`${index}-${field}`];
      setFormErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    passengers.forEach((passenger, index) => {
      if (!passenger.name?.trim()) {
        errors[`${index}-name`] = 'Name is required';
        isValid = false;
      }
      if (!passenger.age || passenger.age < 1 || passenger.age > 120) {
        errors[`${index}-age`] = 'Please enter a valid age';
        isValid = false;
      }
      if (!passenger.gender) {
        errors[`${index}-gender`] = 'Gender is required';
        isValid = false;
      }
      if (index === 0 && !passenger.phone?.trim()) {
        errors[`${index}-phone`] = 'Phone number is required';
        isValid = false;
      } else if (passenger.phone && !/^[6-9]\d{9}$/.test(passenger.phone)) {
        errors[`${index}-phone`] = 'Invalid phone number format';
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Transform passenger data to match the expected format
      const formattedPassengers = passengers.map((passenger, index) => ({
        passengerName: passenger.name,
        name: passenger.name, // Keep both for backward compatibility
        age: passenger.age,
        gender: passenger.gender,
        phoneNumber: passenger.phone,
        phone: passenger.phone, // Keep both for backward compatibility
        seatNumber: passenger.seatNumber || selectedSeats[index]?.seatNumber
      }));
      
      updatePassengerDetails(formattedPassengers);
      navigate('/booking-summary');
    }
  };

  const handleBack = () => {
    navigate('/seats');
  };

  if (!selectedBus || selectedSeats.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          No seats selected
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/buses')}
          sx={{ mt: 2 }}
        >
          Back to Buses
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={4}>
        <Stepper activeStep={1} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Typography variant="h5" gutterBottom>
          Passenger Details
        </Typography>
        <Typography variant="body1" color="textSecondary" mb={3}>
          Please enter details for all passengers
        </Typography>
      </Box>

      
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">{selectedBus.busName}</Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedBus.source} to {selectedBus.destination} • {new Date(selectedBus.departureTime).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <form onSubmit={handleSubmit}>
          {passengers.map((passenger, index) => (
            <Card key={index} variant="outlined" sx={{ mb: 3 }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                }
                title={`Passenger ${index + 1}`}
                subheader={`Seat: ${passenger.seatNumber}`}
              />
              <CardContent>
                <Grid container spacing={3} sx={{ mt: 0 }}>
                  {/* Full Name */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={passenger.name}
                      onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                      error={!!formErrors[`${index}-name`]}
                      helperText={formErrors[`${index}-name`]}
                      required
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        startAdornment: <BadgeIcon color="action" sx={{ mr: 1, opacity: 0.7 }} />,
                      }}
                    />
                  </Grid>

                  {/* Age */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      value={passenger.age}
                      onChange={(e) => handleInputChange(index, 'age', e.target.value)}
                      error={!!formErrors[`${index}-age`]}
                      helperText={formErrors[`${index}-age`]}
                      required
                      margin="normal"
                      variant="outlined"
                      inputProps={{ min: 1, max: 120 }}
                    />
                  </Grid>

                  {/* Gender */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal" error={!!formErrors[`${index}-gender`]}>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={passenger.gender}
                        onChange={(e) => handleInputChange(index, 'gender', e.target.value)}
                        startAdornment={<GenderIcon color="action" sx={{ mr: 1, opacity: 0.7 }} />}
                        required
                        variant="outlined"
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                      {formErrors[`${index}-gender`] && (
                        <FormHelperText>{formErrors[`${index}-gender`]}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Phone Number */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      type="number"
                      value={passenger.phoneNumber}
                      onChange={(e) => handleInputChange(index, 'phoneNumber', e.target.value)}
                      error={!!formErrors[`${index}-phoneNumber`]}
                      helperText={formErrors[`${index}-phoneNumber`] || " "}
                      margin="normal"
                      variant="outlined"
                      placeholder="optional"
                      InputProps={{
                        startAdornment: <PhoneIcon color="action" sx={{ mr: 1, opacity: 0.7 }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
          
          <Box mt={4} display="flex" justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              disabled={loading}
            >
              Back to Seat Selection
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              endIcon={<CreditCardIcon />}
              size="large"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default PassengerDetails;