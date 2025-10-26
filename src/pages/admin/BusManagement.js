import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  // CardHeader,
  // Divider,
  Grid,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // DialogContentText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

// Mock data and services
const mockBuses = [
  {
    id: '1',
    busNumber: 'KA01AB1234',
    busType: 'AC Sleeper',
    capacity: 40,
    amenities: ['AC', 'Charging Point', 'Water Bottle', 'Blanket'],
    lastMaintenance: '2023-05-15',
    status: 'active',
  },
  // Add more mock data as needed
];

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentBus, setCurrentBus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [formData, setFormData] = useState({
    busNumber: '',
    busType: '',
    capacity: '',
    amenities: [],
    lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  // Available options
  const busTypes = ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'Volvo AC', 'Volvo Non-AC'];
  const statusOptions = ['active', 'maintenance', 'inactive'];
  const amenityOptions = ['AC', 'Charging Point', 'Water Bottle', 'Blanket', 'WiFi', 'TV', 'Toilet'];

  // Load buses
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        // In a real app, you would fetch this from your API
        // const response = await busService.getAllBuses();
        // setBuses(response.data);
        
        // Using mock data for now
        setBuses(mockBuses);
      } catch (error) {
        console.error('Error fetching buses:', error);
        enqueueSnackbar('Failed to load buses', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, [enqueueSnackbar]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle amenities change
  const handleAmenitiesChange = (event) => {
    const {
      target: { value },
    } = event;
    
    setFormData(prev => ({
      ...prev,
      amenities: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.busNumber.trim()) {
      newErrors.busNumber = 'Bus number is required';
    }
    
    if (!formData.busType) {
      newErrors.busType = 'Bus type is required';
    }
    
    if (!formData.capacity || isNaN(formData.capacity) || formData.capacity <= 0) {
      newErrors.capacity = 'Please enter a valid capacity';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (isEditing) {
        // Update existing bus
        // In a real app, you would make an API call here
        // await busService.updateBus(currentBus.id, formData);
        
        setBuses(prev => 
          prev.map(bus => bus.id === currentBus.id ? { ...bus, ...formData } : bus)
        );
        
        enqueueSnackbar('Bus updated successfully', { variant: 'success' });
      } else {
        // Add new bus
        // In a real app, you would make an API call here
        // const response = await busService.addBus(formData);
        
        const newBus = {
          id: String(buses.length + 1),
          ...formData,
          capacity: Number(formData.capacity)
        };
        
        setBuses(prev => [...prev, newBus]);
        enqueueSnackbar('Bus added successfully', { variant: 'success' });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving bus:', error);
      enqueueSnackbar('Failed to save bus', { variant: 'error' });
    }
  };

  // Handle edit bus
  const handleEdit = (bus) => {
    setCurrentBus(bus);
    setIsEditing(true);
    setFormData({
      busNumber: bus.busNumber,
      busType: bus.busType,
      capacity: bus.capacity,
      amenities: [...bus.amenities],
      lastMaintenance: bus.lastMaintenance,
      status: bus.status,
    });
    setOpenDialog(true);
  };

  // Handle delete bus
  const handleDelete = async (busId) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        // In a real app, you would make an API call here
        // await busService.deleteBus(busId);
        
        setBuses(prev => prev.filter(bus => bus.id !== busId));
        enqueueSnackbar('Bus deleted successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error deleting bus:', error);
        enqueueSnackbar('Failed to delete bus', { variant: 'error' });
      }
    }
  };

  // Handle dialog open/close
  const handleOpenDialog = () => {
    setCurrentBus(null);
    setIsEditing(false);
    setFormData({
      busNumber: '',
      busType: '',
      capacity: '',
      amenities: [],
      lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
      status: 'active',
    });
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Bus Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add New Bus
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bus Number</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Amenities</TableCell>
                  <TableCell>Last Maintenance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {buses.length > 0 ? (
                  buses.map((bus) => (
                    <TableRow key={bus.id}>
                      <TableCell>{bus.busNumber}</TableCell>
                      <TableCell>{bus.busType}</TableCell>
                      <TableCell>{bus.capacity}</TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {bus.amenities.map((amenity, index) => (
                            <Chip key={index} label={amenity} size="small" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(bus.lastMaintenance), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={bus.status}
                          color={
                            bus.status === 'active' ? 'success' : 
                            bus.status === 'maintenance' ? 'warning' : 'error'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(bus)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(bus.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No buses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Bus Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{isEditing ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bus Number"
                  name="busNumber"
                  value={formData.busNumber}
                  onChange={handleChange}
                  error={!!errors.busNumber}
                  helperText={errors.busNumber}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.busType} required>
                  <InputLabel>Bus Type</InputLabel>
                  <Select
                    name="busType"
                    value={formData.busType}
                    onChange={handleChange}
                    label="Bus Type"
                  >
                    {busTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.busType && (
                    <FormHelperText>{errors.busType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  error={!!errors.capacity}
                  helperText={errors.capacity}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Amenities</InputLabel>
                  <Select
                    multiple
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleAmenitiesChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {amenityOptions.map((amenity) => (
                      <MenuItem key={amenity} value={amenity}>
                        {amenity}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Maintenance Date"
                  name="lastMaintenance"
                  type="date"
                  value={formData.lastMaintenance}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {isEditing ? 'Update' : 'Add'} Bus
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default BusManagement;
