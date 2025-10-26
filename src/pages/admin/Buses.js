import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Grid,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  DirectionsBus as BusIcon,
  EventSeat as SeatIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { busService } from '../../services';
import { format, isValid } from 'date-fns';
import { useSnackbar } from 'notistack';

// Bus types and seat types constants
const busTypes = [
  'AC', 'Non-AC', 'AC Seater','AC Sleeper','Non-AC Sleeper', 'Non-AC Seater', 
  'Volvo', 'Luxury', 'Deluxe','Special Bus', 'Express'
];

const seatTypes = [
  { value: 'AC', label: 'AC' },
  { value: 'NON_AC', label: 'Non-AC' },
  { value: 'SLEEPER', label: 'Sleeper' },
  { value: 'SEMI_SLEEPER', label: 'Semi-Sleeper' }
];

const Buses = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBus, setCurrentBus] = useState(null);
  const [seatConfig, setSeatConfig] = useState([]);
  const [totalSeats, setTotalSeats] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    route: '',
    source: '',
    destination: '',
    arrivalTime: '',
    departureTime: '',
    fare: '',
    status: 'Available',
    busNumber: '',
    seatList: []
  });

  // Safe date formatting function
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      // First try to parse as ISO string
      let date = new Date(dateString);
      
      // If that fails, try parsing as a timestamp
      if (isNaN(date.getTime())) {
        const timestamp = Date.parse(dateString);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
        }
      }
      
      // If we have a valid date, format it
      if (isValid(date)) {
        return format(date, 'dd MMM yyyy, hh:mm a');
      }
      
      // If we get here, try to extract a date from the string
      const dateMatch = String(dateString).match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) {
        const parsedDate = new Date(dateMatch[0]);
        if (isValid(parsedDate)) {
          return format(parsedDate, 'dd MMM yyyy') + ' (time unknown)';
        }
      }
      
      // If all else fails, return a truncated version of the original string
      return String(dateString).substring(0, 20) + (String(dateString).length > 20 ? '...' : '');
    } catch (e) {
      console.error('Error formatting date:', e);
      return String(dateString || '-').substring(0, 20) + (String(dateString).length > 20 ? '...' : '');
    }
  };

  const fetchBuses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await busService.getAllBuses();
      console.log('Raw API Response:', response); // Log the full response
      
      // Check if response.data exists and has a data property that's an array
      const responseData = response?.data;
      let busesData = [];
      
      // Log the exact structure to help with debugging
      console.log('Response data type:', typeof responseData);
      console.log('Response data keys:', Object.keys(responseData || {}));
      
      if (Array.isArray(responseData)) {
        // If response.data is already an array (direct array response)
        busesData = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        // If response.data has a data property that's an array
        busesData = responseData.data;
      } else if (responseData && typeof responseData === 'object') {
        // If response.data is an object, convert it to an array
        busesData = [responseData];
      } else {
        console.error('Unexpected response format:', responseData);
      }
      
      console.log('Processed Buses Data:', JSON.stringify(busesData, null, 2));
      
      // Transform the data to match our expected format
      const formattedBuses = busesData.map(bus => {
        // Log all available fields in the bus object
        console.log('All fields in bus object:', Object.keys(bus));
        console.log('Raw bus object:', bus);
        
        // Helper function to get a value from multiple possible field names
        const getField = (obj, ...fields) => {
          for (const field of fields) {
            if (obj[field] !== undefined && obj[field] !== null) {
              console.log(`Found value for ${field}:`, obj[field]);
              return obj[field];
            } else {
              console.log(`Field ${field} not found or is null/undefined`);
            }
          }
          console.log(`None of the fields [${fields.join(', ')}] were found`);
          return undefined;
        };
        
        // Log seat-related fields
        console.log('Seat-related fields:', {
          availableSeats: bus.availableSeats,
          available_seats: bus.available_seats,
          availableSeatsCount: bus.availableSeatsCount,
          seatsAvailable: bus.seatsAvailable,
          totalSeats: bus.totalSeats,
          total_seats: bus.total_seats,
          totalSeatsCount: bus.totalSeatsCount,
          capacity: bus.capacity
        });
        
        const formattedBus = {
          _id: getField(bus, '_id', 'id') || Math.random().toString(36).substr(2, 9),
          busNumber: getField(bus, 'busNumber', 'bus_number', 'busNumber') || 'N/A',
          busType: getField(bus, 'busType', 'type', 'bus_type') || 'N/A',
          source: getField(bus, 'source', 'origin', 'from') || 'N/A',
          destination: getField(bus, 'destination', 'to') || 'N/A',
          departureTime: getField(bus, 'departureTime', 'departure_time', 'departure', 'startTime'),
          arrivalTime: getField(bus, 'arrivalTime', 'arrival_time', 'arrival', 'endTime'),
          availableSeats: Number(
            getField(bus, 'availableSeats', 'available_seats', 'availableSeatsCount', 'seatsAvailable', 'available') || ''
          ),
          totalSeats: Number(
            getField(bus, 'totalSeats', 'total_seats', 'totalSeatsCount', 'capacity', 'seats', 'totalSeats') || ''
          ),
          price: Number(getField(bus, 'price', 'fare', 'ticketPrice', 'cost') || ''),
          isActive: getField(bus, 'isActive', 'is_active', 'active') !== false,
          amenities: Array.isArray(bus.amenities) ? bus.amenities : 
                    (bus.amenities ? [bus.amenities] : [])
        };
        
        console.log('Formatted bus:', formattedBus);
        return formattedBus;
      });
      
      setBuses(formattedBuses);
    } catch (error) {
      console.error('Error fetching buses:', error);
      enqueueSnackbar('Failed to fetch buses: ' + (error.message || 'Unknown error'), { 
        variant: 'error' 
      });
      setBuses([]);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Initialize seat configuration
  const initializeSeatConfig = (count, existingSeats = []) => {
    const seats = [];
    for (let i = 1; i <= count; i++) {
      const existingSeat = existingSeats.find(s => s.seatNumber === i.toString());
      seats.push({
        seatNumber: i.toString(),
        price: existingSeat?.price || '1000',
        type: existingSeat?.type || 'AC'
      });
    }
    return seats;
  };

  const handleSeatConfigChange = (index, field, value) => {
    const updatedSeats = [...seatConfig];
    updatedSeats[index] = {
      ...updatedSeats[index],
      [field]: field === 'price' ? parseFloat(value) || 0 : value
    };
    setSeatConfig(updatedSeats);
  };

  const handleTotalSeatsChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setTotalSeats(count);
    setSeatConfig(initializeSeatConfig(count));
  };

  const handleOpenDialog = async (bus = null) => {
    try {
      setLoading(true);
      
      if (bus && bus._id) {
        // Fetch the latest bus data
        const response = await busService.getBusById(bus._id);
        const busData = response.data; // Get the actual bus data from the response
        
        setCurrentBus(bus._id);
        
        // Set seat configuration
        if (busData.seatList && busData.seatList.length > 0) {
          setTotalSeats(busData.seatList.length);
          setSeatConfig([...busData.seatList]);
        } else {
          const totalSeats = parseInt(busData.seats) || 0;
          setTotalSeats(totalSeats);
          setSeatConfig(initializeSeatConfig(totalSeats));
        }
        
        // Format dates for datetime-local input
        const formatForDateTimeLocal = (dateString) => {
          if (!dateString) return '';
          try {
            const [datePart, timePart] = dateString.split(' ');
            const [day, month, year] = datePart.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
          } catch (e) {
            console.error('Error formatting date:', e);
            return '';
          }
        };
        
        // Normalize bus type - ensure it matches one of our predefined types
        const normalizeBusType = (type) => {
          if (!type) return '';
          
          // First try exact match
          const exactMatch = busTypes.find(t => t === type);
          if (exactMatch) return exactMatch;
          
          // Then try case-insensitive match
          const lowerType = type.toLowerCase().trim();
          const caseInsensitiveMatch = busTypes.find(t => t.toLowerCase() === lowerType);
          if (caseInsensitiveMatch) return caseInsensitiveMatch;
          
          // Try to find a close match (e.g., 'Luxury Bus' matches 'Luxury Bus 2')
          const closeMatch = busTypes.find(t => 
            t.toLowerCase().includes(lowerType) || 
            lowerType.includes(t.toLowerCase())
          );
          
          // If no match found, return the first word or original type
          return closeMatch || type.split(' ')[0] || type;
        };
        
        // Set form data with the fetched bus data
        setFormData({
          id: busData.id,
          name: busData.name || '',
          type: normalizeBusType(busData.type || busData.busType || ''),
          route: busData.route || '',
          source: busData.source || '',
          destination: busData.destination || '',
          arrivalTime: formatForDateTimeLocal(busData.arrivalTime) || '',
          departureTime: formatForDateTimeLocal(busData.departureTime) || '',
          fare: busData.fare || '',
          status: busData.status || 'Available',
          busNumber: busData.busNumber || '',
          seatList: busData.seatList || []
        });
      } else {
        // For new bus
        setCurrentBus(null);
        resetFormData();
        setTotalSeats('');
        setSeatConfig([]);
      }
    } catch (error) {
      console.error('Error loading bus data:', error);
      enqueueSnackbar('Failed to load bus data', { variant: 'error' });
    } finally {
      setLoading(false);
      setOpenDialog(true);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      type: '',
      route: '',
      source: '',
      destination: '',
      arrivalTime: '',
      departureTime: '',
      fare: '',
      status: 'Available',
      busNumber: '',
      seatList: []
    });
    setTotalSeats('');
    setSeatConfig([]);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Format dates to DD/MM/YYYY HH:mm format as expected by the backend
  const formatDateForBackend = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  const handleDeleteBus = async (id) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        await busService.deleteBus(id);
        enqueueSnackbar('Bus deleted successfully', { variant: 'success' });
        fetchBuses();
      } catch (error) {
        console.error('Error deleting bus:', error);
        enqueueSnackbar('Failed to delete bus', { variant: 'error' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.busNumber || !formData.name || !formData.type || 
        !formData.source || !formData.destination || 
        !formData.departureTime || !formData.arrivalTime || 
        !formData.fare) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
      return;
    }
    
    if (totalSeats <= 0) {
      enqueueSnackbar('Please add at least one seat', { variant: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare seat list from seatConfig
      const seatList = seatConfig.map((seat, index) => ({
        id: seat.id || null, // Preserve ID for existing seats
        seatNumber: seat.seatNumber || (index + 1).toString(),
        price: parseFloat(seat.price) || 0,
        type: seat.type
      }));

      // Prepare bus data with only the fields expected by the backend
      const busData = {
        id: formData.id, // Include the ID for updates
        name: formData.name,
        busNumber: formData.busNumber,
        type: formData.type, // Use busType to match backend model
        route: formData.route || '',
        source: formData.source,
        destination: formData.destination,
        arrivalTime: formatDateForBackend(formData.arrivalTime),
        departureTime: formatDateForBackend(formData.departureTime),
        fare: String(parseFloat(formData.fare).toFixed(2)) || '0.00',
        status: formData.status || 'Available',
        seatList: seatList
      };
      
      // Clean up the data before sending - remove any undefined or null values
      const cleanBusData = Object.entries(busData).reduce((acc, [key, value]) => {
        // Skip undefined, null, or empty string values, but keep 0 and false
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      console.log('Sending bus data:', cleanBusData);

      if (currentBus) {
        // For update, we send the entire bus object with the ID
        await busService.updateBus(cleanBusData);
        enqueueSnackbar('Bus updated successfully', { variant: 'success' });
      } else {
        // For create, we exclude the ID
        const { id, ...createData } = cleanBusData;
        await busService.createBus(createData);
        enqueueSnackbar('Bus created successfully', { variant: 'success' });
      }
      
      // Refresh the bus list
      await fetchBuses();
      handleCloseDialog();
      resetFormData();
    } catch (error) {
      console.error('Error saving bus:', error);
      enqueueSnackbar(
        error.response?.data?.message || 
        error.message || 
        'Failed to save bus. Please check the console for more details.', 
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };


  const filteredBuses = buses.filter(bus => 
    bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.busType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedBuses = filteredBuses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Removed unused amenitiesList

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: 'calc(100vh - 64px)',
      p: 0,
      m: 0,
      mt: '-180px',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <Box sx={{ width: '100%', maxWidth: '100%', p: 2, pt: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <BusIcon fontSize="large" sx={{ mr: 1 }} />
          Bus Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchBuses}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Bus
          </Button>
        </Box>
      </Box>

      <Card sx={{ 
        '& .MuiCardContent-root': { p: 0 },
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box mb={2} sx={{ p: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search buses by number, type, source or destination..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                style: { maxWidth: '500px' }
              }}
            />
          </Box>
          <TableContainer sx={{ 
            maxHeight: 'calc(100vh - 250px)',
            width: '100%',
            border: 'none',
            boxShadow: 'none',
            overflowX: 'auto',
            '& .MuiTableCell-root': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              padding: '8px 16px',
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              fontWeight: 'bold',
              backgroundColor: '#f5f5f5',
            },
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
              '&:hover': {
                background: '#555',
              },
            },
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}>Bus Number</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Type</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Source</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Destination</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Departure</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Arrival</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Seats</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Price</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredBuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No buses found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBuses.map((bus) => (
                    <TableRow key={bus._id}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{bus.busNumber}</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 500 }}>{bus.busType || 'N/A'}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>{bus.source}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 'bold' }}>{bus.destination}</TableCell>
                      <TableCell sx={{ color: 'warning.main' }}>
                        {formatDateTime(bus.departureTime)}
                      </TableCell>
                      <TableCell sx={{ color: 'warning.main' }}>
                        {formatDateTime(bus.arrivalTime)}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" sx={{ fontWeight: 'bold', color: 'purple' }}>
                          <SeatIcon sx={{ color: 'purple' }} fontSize="small" style={{ marginRight: 4 }} />
                          {bus.totalSeats || 0}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>₹{(bus.price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(bus)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => handleDeleteBus(bus._id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredBuses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
      </Box>

      {/* Add/Edit Bus Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth scroll="paper">
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {currentBus ? 'Edit Bus' : 'Add New Bus'}
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mt={1}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Bus Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Bus Number"
                    name="busNumber"
                    value={formData.busNumber}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Bus Type</InputLabel>
                    <Select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      label="Bus Type"
                      required
                    >
                      {busTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Route Name"
                    name="route"
                    value={formData.route}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Source"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type="datetime-local"
                    label="Departure Time"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type="datetime-local"
                    label="Arrival Time"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type="number"
                    label="Base Fare (₹)"
                    name="fare"
                    value={formData.fare}
                    onChange={handleInputChange}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="Status"
                    >
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="Not Available">Not Available</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="subtitle1">Seat Configuration</Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type="number"
                    label="Total Seats"
                    name="totalSeats"
                    value={totalSeats}
                    onChange={handleTotalSeatsChange}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>

                {seatConfig.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Configure Seat Types and Prices
                    </Typography>
                    <Box sx={{ maxHeight: '300px', overflowY: 'auto', p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        {seatConfig.map((seat, index) => (
                          <React.Fragment key={index}>
                            <Grid item xs={4} sm={2}>
                              <TextField
                                fullWidth
                                label={`Seat ${seat.seatNumber}`}
                                value={seat.seatNumber}
                                disabled
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={4} sm={5}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Type</InputLabel>
                                <Select
                                  value={seat.type}
                                  onChange={(e) => handleSeatConfigChange(index, 'type', e.target.value)}
                                  label="Type"
                                >
                                  {seatTypes.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                      {type.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={4} sm={5}>
                              <TextField
                                fullWidth
                                type="number"
                                label="Price (₹)"
                                value={seat.price}
                                onChange={(e) => handleSeatConfigChange(index, 'price', e.target.value)}
                                size="small"
                                inputProps={{ min: 0, step: 1 }}
                              />
                            </Grid>
                          </React.Fragment>
                        ))}
                      </Grid>
                    </Box>
                  </Grid>
                )}
              </Grid>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label={formData.isActive ? 'Active' : 'Inactive'}
                style={{ marginTop: 16 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {currentBus ? 'Update' : 'Create'} Bus
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Buses;
