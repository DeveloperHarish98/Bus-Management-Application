import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Collapse,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { 
  DirectionsBus as BusIcon,
  Chair as SeatIcon,
  ArrowForward as ArrowForwardIcon,
  FilterList as FilterListIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  StarHalf as StarHalfIcon,
  ArrowBack as ArrowBackIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Sort as SortIcon,
  Power as PowerIcon,
  Wifi as WifiIcon,
  Tv as TvIcon,
  AcUnit as AcUnitIcon,
  LocalDrink as LocalDrinkIcon,
  Wc as WcIcon
} from '@mui/icons-material';
import { useBusBooking } from '../contexts/BusBookingContext';
import { format } from 'date-fns';

// Filter options
const priceMarks = [
  { value: 0, label: '₹0' },
  { value: 2500, label: '₹2.5k' },
  { value: 5000, label: '₹5k' },
  { value: 7500, label: '₹7.5k' },
  { value: 10000, label: '₹10k+' }
];

const busTypes = [
  { id: 'sleeper', label: 'Sleeper' },
  { id: 'seater', label: 'Seater' },
  { id: 'semi_sleeper', label: 'Semi Sleeper' },
  { id: 'ac', label: 'AC' },
  { id: 'non_ac', label: 'Non-AC' }
];

const amenities = [
  { id: 'ac', label: 'AC', icon: <AcUnitIcon fontSize="small" /> },
  { id: 'sleeper', label: 'Sleeper', icon: <SeatIcon fontSize="small" /> },
  { id: 'charging', label: 'Charging Point', icon: <PowerIcon fontSize="small" /> },
  { id: 'wifi', label: 'WiFi', icon: <WifiIcon fontSize="small" /> },
  { id: 'tv', label: 'TV', icon: <TvIcon fontSize="small" /> },
  { id: 'water', label: 'Water Bottle', icon: <LocalDrinkIcon fontSize="small" /> },
  { id: 'blanket', label: 'Blanket', icon: <WcIcon fontSize="small" /> }
];

const sortOptions = [
  { value: 'departure_asc', label: 'Departure (Earliest First)' },
  { value: 'departure_desc', label: 'Departure (Latest First)' },
  { value: 'arrival_asc', label: 'Arrival (Earliest First)' },
  { value: 'arrival_desc', label: 'Arrival (Latest First)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
  { value: 'duration_asc', label: 'Duration (Shortest First)' },
  { value: 'rating_desc', label: 'Rating (Highest First)' }
];

const BusList = () => {
  const navigate = useNavigate();
  const { 
    searchParams, 
    availableBuses: busesFromContext,
    loading,
    error: contextError,
    selectBus: selectBusContext
  } = useBusBooking();
  
  
  const [error, setError] = useState(contextError || '');
  const availableBuses = useMemo(() => {
    const buses = Array.isArray(busesFromContext) ? busesFromContext : [];
    return buses;
  }, [busesFromContext]);
  
  // Update error state when context error changes
  useEffect(() => {
    if (contextError) {
      setError(contextError);
    } else {
      setError('');
    }
  }, [contextError, setError, availableBuses]);
  
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    busTypes: [],
    amenities: [],
    departureTime: [],
    arrivalTime: [],
    boardingPoints: [],
    droppingPoints: [],
    ratings: []
  });
  
  const [sortBy, setSortBy] = useState('departure_asc');
  const [expandedBus, setExpandedBus] = useState(null);
  
  // Memoize the filtered buses to prevent unnecessary recalculations
  useEffect(() => {
    
    if (availableBuses.length === 0) {
    } else {
    }
  }, [availableBuses, filters, searchParams]);

  // Get sort function based on sort type
  const getSortFunction = (sortType) => {
    switch (sortType) {
      case 'departure_asc':
        return (a, b) => (a.departureTime || '').localeCompare(b.departureTime || '');
      case 'departure_desc':
        return (a, b) => (b.departureTime || '').localeCompare(a.departureTime || '');
      case 'price_asc':
        return (a, b) => (parseFloat(a.fare) || 0) - (parseFloat(b.fare) || 0);
      case 'price_desc':
        return (a, b) => (parseFloat(b.fare) || 0) - (parseFloat(a.fare) || 0);
      case 'rating_desc':
        return (a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      case 'duration_asc':
        return (a, b) => {
          const durationA = parseInt(a.duration) || 0;
          const durationB = parseInt(b.duration) || 0;
          return durationA - durationB;
        };
      default:
        return null;
    }
  };

  // Memoize the filtered and sorted buses to prevent unnecessary recalculations
  const filteredAndSortedBuses = useMemo(() => {
    if (!availableBuses || !availableBuses.length) {
      return [];
    }

    // Apply filters
    let result = availableBuses.filter(bus => {
      // Price filter
      if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange;
        const fare = parseFloat(bus.fare) || 0;
        if (fare < minPrice || fare > maxPrice) return false;
      }
      
      // Bus type filter
      if (filters.busTypes.length > 0) {
        const busType = (bus.type || '').toLowerCase();
        if (!filters.busTypes.some(type => busType.includes(type.toLowerCase()))) {
          return false;
        }
      }
      
      // Amenities filter
      if (filters.amenities.length > 0) {
        const busAmenities = Array.isArray(bus.amenities) 
          ? bus.amenities.map(a => String(a).toLowerCase())
          : [String(bus.amenities || '').toLowerCase()].filter(Boolean);
          
        if (!filters.amenities.every(amenity => 
          busAmenities.some(a => a.includes(amenity.toLowerCase())))) {
          return false;
        }
      }
      
      return true;
    });
    
    // Apply sorting
    if (result.length > 0) {
      const sortFn = getSortFunction(sortBy);
      if (sortFn) {
        result = [...result].sort(sortFn);
      }
    }
    
    return result;
  }, [availableBuses, filters, sortBy]);
  
  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle both DD/MM/YYYY and YYYY-MM-DD formats
      let date;
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split(' ')[0].split('/');
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return dateString; // Return original if invalid date
      
      return format(date, 'EEE, d MMM yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'N/A';
    }
  };
  
  // Format time from date string
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    try {
      // Handle both DD/MM/YYYY HH:mm and YYYY-MM-DD HH:mm formats
      let timePart = dateTimeStr.includes(' ') ? dateTimeStr.split(' ')[1] : dateTimeStr;
      return timePart.substring(0, 5); // Return only HH:mm
    } catch (error) {
      console.error('Error formatting time:', error);
      return dateTimeStr || 'N/A';
    }
  };

  // Format duration in hours and minutes
  const formatDuration = (duration) => {
    if (!duration && duration !== 0) return 'N/A';
    if (typeof duration === 'string') {
      // Handle string format like "5h 30m"
      const [hours, minutes] = duration.split('h').map(part => parseInt(part.replace(/\D/g, '')) || 0);
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`.trim();
    } else if (typeof duration === 'number') {
      // Handle numeric duration in minutes
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`.trim();
    }
    return '';
  };
  
  // Render star rating
  const renderRating = (rating) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = (rating % 1) >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<StarIcon key={i} color="primary" fontSize="small" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarHalfIcon key={i} color="primary" fontSize="small" />);
      } else {
        stars.push(<StarBorderIcon key={i} color="primary" fontSize="small" />);
      }
    }
    
    return (
      <Box display="flex" alignItems="center">
        {stars}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          ({rating.toFixed(1)})
        </Typography>
      </Box>
    );
  };
  
  // Toggle bus details expansion
  const toggleBusDetails = (busId) => {
    setExpandedBus(expandedBus === busId ? null : busId);
  };

  // Handle bus selection
  const handleSelectBus = useCallback(async (bus) => {
    try {
      console.log('Selecting bus:', bus);
      
      // Prepare the bus data with all required fields
      const busData = {
        ...bus,
        id: bus.id || bus.busNumber, // Use busNumber as ID if id is not available
        source: searchParams?.source || bus.source || 'Unknown',
        destination: searchParams?.destination || bus.destination || 'Unknown',
        journeyDate: searchParams?.journeyDate || bus.journeyDate || new Date().toISOString(),
        busName: bus.busName || bus.name || 'Unknown Bus',
        busNumber: bus.busNumber || bus.busNumber || 'N/A',
        fare: bus.fare || 0,
        seats: bus.seats || '40',
        status: bus.status || 'Available',
        type: bus.type || 'AC Sleeper',
        amenities: bus.amenities || ['AC', 'Sleeper', 'Charging Point'],
        departureTime: bus.departureTime || '',
        arrivalTime: bus.arrivalTime || ''
      };
      
      console.log('Setting selected bus in context:', busData);
      
      // Save the selected bus to context
      await selectBusContext(busData);
      
      // Navigate to the seat selection page with bus details
      navigate('/seats', { 
        state: { 
          bus: busData,
          source: busData.source,
          destination: busData.destination,
          journeyDate: busData.journeyDate
        } 
      });
    } catch (error) {
      console.error('Error selecting bus:', error);
      setError(error.message || 'Failed to select bus. Please try again.');
    }
  }, [selectBusContext, navigate, searchParams]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Handle price range change
  const handlePriceChange = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      priceRange: newValue
    }));
  };

  // Loading state
  if (loading && availableBuses.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/')}
        >
          Back to Search
        </Button>
      </Container>
    );
  }

  // No buses found
  if (availableBuses.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <BusIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          No Buses Found
        </Typography>
        <Typography color="text.secondary" paragraph>
          We couldn't find any buses for the selected route and date. Please try different search criteria.
        </Typography>
        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2, maxWidth: '600px', mx: 'auto', p: 2, bgcolor: '#fff5f5', borderRadius: 1 }}>
            Error: {error}
          </Typography>
        )}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Search
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
        {/* Filters Sidebar */}
        <Box width={{ xs: '100%', md: 280 }} flexShrink={0}>
          <Paper elevation={1} sx={{ p: 2, mb: 3, position: 'sticky', top: 16 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                <FilterListIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filters
              </Typography>
              <Button 
                size="small" 
                onClick={() => setFilters({
                  priceRange: [0, 10000],
                  busTypes: [],
                  amenities: [],
                  departureTime: [],
                  arrivalTime: [],
                  boardingPoints: [],
                  droppingPoints: [],
                  ratings: []
                })}
                disabled={!Object.values(filters).some(arr => arr.length > 0) && 
                         (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 10000)}
              >
                Clear All
              </Button>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Price Range Filter */}
            <Box mb={3}>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Price Range
              </Typography>
              <Slider
                value={filters.priceRange}
                onChange={handlePriceChange}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `₹${value}`}
                min={0}
                max={10000}
                step={100}
                marks={priceMarks}
                sx={{ mt: 3 }}
              />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption" color="text.secondary">
                  ₹{filters.priceRange[0].toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ₹{filters.priceRange[1].toLocaleString()}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Bus Types */}
            <Box mb={3}>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Bus Types
              </Typography>
              <FormGroup>
                {busTypes.map((type) => (
                  <FormControlLabel
                    key={type.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={filters.busTypes.includes(type.id)}
                        onChange={(e) => {
                          const newBusTypes = e.target.checked
                            ? [...filters.busTypes, type.id]
                            : filters.busTypes.filter(t => t !== type.id);
                          handleFilterChange('busTypes', newBusTypes);
                        }}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center">
                        {type.label}
                        <Chip 
                          label={filteredAndSortedBuses.filter(b => b.type?.toLowerCase().includes(type.id)).length}
                          size="small" 
                          sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} 
                        />
                      </Box>
                    }
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                  />
                ))}
              </FormGroup>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Amenities */}
            <Box mb={3}>
              <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                Amenities
              </Typography>
              <FormGroup>
                {amenities.map((amenity) => (
                  <FormControlLabel
                    key={amenity.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={filters.amenities.includes(amenity.id)}
                        onChange={(e) => {
                          const newAmenities = e.target.checked
                            ? [...filters.amenities, amenity.id]
                            : filters.amenities.filter(a => a !== amenity.id);
                          handleFilterChange('amenities', newAmenities);
                        }}
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        {amenity.icon}
                        {amenity.label}
                      </Box>
                    }
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                  />
                ))}
              </FormGroup>
            </Box>
          </Paper>
        </Box>
        
        {/* Bus List */}
        <Box flexGrow={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {searchParams?.source || 'N/A'} to {searchParams?.destination || 'N/A'}
              </Typography>
              <Typography variant="body2" color="white">
                {searchParams?.journeyDate ? formatDisplayDate(searchParams.journeyDate) : 'Select date'}
                {filteredAndSortedBuses?.length > 0 && ` • ${filteredAndSortedBuses.length} buses found`}
              </Typography>
              {loading && (
                <Box display="flex" alignItems="center" mt={1}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Loading buses...
                  </Typography>
                </Box>
              )}
            </Box>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 220 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'Sort by'}}
                startAdornment={<SortIcon color="action" sx={{ mr: 1 }} />}
                sx={{ '& .MuiSelect-select': { py: 1 , color: 'white'} }}
              >
                <MenuItem value="" disabled>
                  Sort by
                </MenuItem>
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {!loading && filteredAndSortedBuses?.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No buses match your filters
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Try adjusting your filters to see more results
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => setFilters({
                  priceRange: [0, 10000],
                  busTypes: [],
                  amenities: [],
                  departureTime: [],
                  arrivalTime: [],
                  boardingPoints: [],
                  droppingPoints: [],
                  ratings: []
                })}
              >
                Clear All Filters
              </Button>
            </Paper>
          ) : (
            filteredAndSortedBuses?.map((bus) => (
              <Card 
                key={`bus-${bus.id}-${bus.busNumber || ''}`} 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ p: 3, pb: '16px !important' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box display="flex" alignItems="center" mb={1.5}>
                        <BusIcon color="primary" sx={{ fontSize: 28, mr: 1.5 }} />
                        <Box>
                          <Typography variant="h6" component="div" fontWeight="bold">
                            {bus.name || bus.busName || 'Deluxe Bus'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {bus.busNumber || 'NA'}
                            {bus.type && ` • ${bus.type}`}
                            {bus.seats && ` • ${bus.seats} Seats`}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" flexWrap="wrap" gap={2} mt={2}>
                        {bus.amenities?.map((amenity, index) => {
                          const amenityInfo = amenities.find(a => a.label.toLowerCase() === amenity.toLowerCase());
                          return amenityInfo ? (
                            <Box key={index} display="flex" alignItems="center" color="text.secondary">
                              {amenityInfo.icon}
                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                {amenityInfo.label}
                              </Typography>
                            </Box>
                          ) : null;
                        })}
                      </Box>
                      
                      <Box mt={2}>
                        <Button 
                          size="small" 
                          endIcon={expandedBus === bus.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          onClick={() => toggleBusDetails(bus.id)}
                          sx={{ textTransform: 'none' }}
                        >
                          {expandedBus === bus.id ? 'Less' : 'More'} details
                        </Button>
                      </Box>
                      
                      <Collapse in={expandedBus === bus.id} timeout="auto" unmountOnExit>
                        <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Boarding Points
                              </Typography>
                              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                {bus.boardingPoints?.slice(0, 2).map((point, idx) => (
                                  <li key={idx}>
                                    <Typography variant="body2">
                                      {point.time} - {point.name}
                                    </Typography>
                                  </li>
                                ))}
                                {bus.boardingPoints?.length > 2 && (
                                  <li>
                                    <Typography variant="body2" color="primary">
                                      +{bus.boardingPoints.length - 2} more
                                    </Typography>
                                  </li>
                                )}
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Dropping Points
                              </Typography>
                              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                {bus.droppingPoints?.slice(0, 2).map((point, idx) => (
                                  <li key={idx}>
                                    <Typography variant="body2">
                                      {point.time} - {point.name}
                                    </Typography>
                                  </li>
                                ))}
                                {bus.droppingPoints?.length > 2 && (
                                  <li>
                                    <Typography variant="body2" color="primary">
                                      +{bus.droppingPoints.length - 2} more
                                    </Typography>
                                  </li>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box>
                          <Typography variant="h5" color="primary" fontWeight="bold">
                            ₹{parseFloat(bus.fare || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            per seat
                          </Typography>
                        </Box>
                        
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight="medium">
                            {bus.seats || 'N/A'} Seats
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color={bus.status === 'SOLD_OUT' || (bus.seats && parseInt(bus.seats) <= 0) ? 'error' : 'success.main'}
                          >
                            {bus.status === 'SOLD_OUT' || (bus.seats && parseInt(bus.seats) <= 0) ? 'Sold Out' : 'Available'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {bus.departureTime ? formatTime(bus.departureTime) : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {searchParams?.source || bus.route || 'Source'}
                          </Typography>
                        </Box>
                        
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(bus.duration)}
                          </Typography>
                          <Box 
                            sx={{ 
                              height: 1, 
                              width: 40, 
                              borderTop: '1px dashed', 
                              borderColor: 'divider',
                              my: 0.5
                            }} 
                          />
                          <Typography variant="caption" color="text.secondary">
                            {bus.stops || 'Non-stop'}
                          </Typography>
                        </Box>
                        
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight="medium">
                            {bus.arrivalTime ? formatTime(bus.arrivalTime) : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {searchParams?.destination || bus.route || 'Destination'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleSelectBus(bus)}
                        disabled={bus.status === 'SOLD_OUT' || (bus.seats && parseInt(bus.seats) <= 0)}
                        sx={{ mt: 1 }}
                      >
                        {bus.status === 'SOLD_OUT' || (bus.seats && parseInt(bus.seats) <= 0) ? 'Sold Out' : 'View Seats'}
                      </Button>
                      
                      {renderRating(bus.rating)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default BusList;