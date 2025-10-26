import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  MenuItem,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { useBusBooking } from '../contexts/BusBookingContext';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';


// Date format constants
const DATE_FORMAT = 'dd/MM/yyyy';

// Create a custom locale that uses DD/MM/YYYY format
const customLocale = {
  ...enGB,
  options: {
    ...enGB.options,
    weekStartsOn: 1, // Start week on Monday
  },
  formatLong: {
    date: () => DATE_FORMAT,
  },
};

const BusSearch = () => {
  const navigate = useNavigate();
  const { 
    searchParams,
    loading,
    searchBuses,
    setError,
    routes: { sources, destinations },
    loading: contextLoading
  } = useBusBooking();
  
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    date: null,
  });

  const [errors] = useState({});
  useEffect(() => {
    if (searchParams) {
      setFormData({
        source: searchParams.source || '',
        destination: searchParams.destination || '',
        date: searchParams.date || null,
      });
    }
  }, [searchParams]);

  const swapLocations = () => {
    setFormData(prev => ({
      ...prev,
      source: prev.destination,
      destination: prev.source,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.source || !formData.destination || !formData.date) {
      setError('Please fill in all fields');
      return;
    }
    
    if (formData.source === formData.destination) {
      setError('Source and destination cannot be the same');
      return;
    }
    
    try {
      // Format date to DD/MM/YYYY for the backend
      const date = new Date(formData.date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      console.log('Formatted date for search:', formattedDate);
      
      // Call the searchBuses function from context
      await searchBuses({
        source: formData.source,
        destination: formData.destination,
        journeyDate: formattedDate
      });
      
      // Navigate to bus listing page
      navigate('/buses');
    } catch (error) {
      console.error('Error searching buses:', error);
      setError(error.message || 'Failed to search for buses. Please try again.');
    }
  };

  // Loading state for the form
  const isLoading = loading || contextLoading;

  return (
    <Container maxWidth="md" sx={{ mt: -10.5, mb: 2 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Search Buses
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 48px 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
              <Box sx={{ gridColumn: { xs: '1', sm: '1' } }}>
                <TextField
                  select
                  label="From"
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  fullWidth
                  required
                  size="small"
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <LocationOnIcon color="action" sx={{ mr: 1 }} />
                    ),
                    endAdornment: isLoading && (
                      <CircularProgress size={20} />
                    ),
                  }}
                >
                  {sources.map((source) => (
                    <MenuItem key={source} value={source}>
                      {source}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                gridColumn: { xs: '1', sm: '2' },
                mt: { xs: -1, sm: 0 },
                mb: { xs: 1, sm: 0 }
              }}>
                <IconButton 
                  onClick={swapLocations}
                  sx={{ 
                    bgcolor: 'grey.100', 
                    p: 1,
                    '&:hover': {
                      bgcolor: 'grey.200',
                    }
                  }}
                  aria-label="swap locations"
                >
                  <SwapHorizIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ gridColumn: { xs: '1', sm: '3' } }}>
                <TextField
                  select
                  label="To"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  fullWidth
                  required
                  size="small"
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <LocationOnIcon color="action" sx={{ mr: 1 }} />
                    ),
                    endAdornment: isLoading && (
                      <CircularProgress size={20} />
                    ),
                  }}
                >
                  {destinations.map((destination) => (
                    <MenuItem key={destination} value={destination}>
                      {destination}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              
              <Box sx={{ 
                gridColumn: { xs: '1', sm: '4' },
                '& .MuiFormControl-root': {
                  width: '100%',
                }
              }}>
                <LocalizationProvider 
                  dateAdapter={AdapterDateFns} 
                  adapterLocale={customLocale}
                >
                  <DatePicker
                    label="Journey Date"
                    value={formData.date}
                    onChange={(date) => setFormData({...formData, date: date})}
                    minDate={new Date()}
                    inputFormat={DATE_FORMAT}
                    mask="__/__/____"
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        required 
                        size="small"
                        error={!!errors.date}
                        helperText={errors.date || ' '}
                        placeholder={DATE_FORMAT.toLowerCase()}
                        onKeyDown={(e) => {
                          if (!/[0-9/]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') {
                            e.preventDefault();
                          }
                        }}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <EventIcon color="action" sx={{ mr: 1, color: 'action.active' }} />
                          ),
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, gridColumn: { xs: '1', sm: '1 / -1' } }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              fullWidth
              sx={{ 
                py: 1.8, 
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Search Buses'}
            </Button>
          </Box>
      </form>
      
      {/* Popular Routes Section */}
      <Box mt={6}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', mb: 3 }}>
          Popular Routes
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          {[
            { from: 'Mumbai', to: 'Pune' },
            { from: 'Delhi', to: 'Jaipur' },
            { from: 'Bangalore', to: 'Chennai' },
            { from: 'Raipur', to: 'Goa' },
            { from: 'Hyderabad', to: 'Vijayawada' },
            { from: 'Indore', to: 'Raipur'},
            { from: 'Pune', to: 'Mumbai' }
          ].map((route, index) => (
            <Button
              key={index}
              variant="outlined"
              onClick={() => {
                setFormData({
                  source: route.from,
                  destination: route.to,
                  date: new Date()
                });
              }}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  borderColor: 'primary.light',
                },
              }}
            >
              {`${route.from} to ${route.to}`}
            </Button>
          ))}
        </Box>
      </Box>
      </Paper>
    </Container>
  );
};

export default BusSearch;
