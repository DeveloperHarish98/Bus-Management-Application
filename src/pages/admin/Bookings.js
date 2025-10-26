import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Box, Button, Card, CardContent, CircularProgress, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Paper, IconButton, InputAdornment, MenuItem,
  FormControl, InputLabel, Select, Chip, Tooltip, Avatar, Divider, Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  DirectionsBus as BusIcon
} from '@mui/icons-material';
import { ticketService } from '../../services';
import { useSnackbar } from 'notistack';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const formatDate = (dateInput) => {
    if (!dateInput) return '-';
    try {
      let date;
      
      // Handle different date input types
      if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
        date = dateInput.toDate();
      } else if (typeof dateInput === 'string') {
        // Handle ISO string (e.g., '2025-07-17T00:00:00.000Z')
        if (dateInput.includes('T') && dateInput.endsWith('Z')) {
          date = new Date(dateInput);
        } 
        // Handle date string without time (e.g., '2025-07-17')
        else if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          date = new Date(`${dateInput}T00:00:00`);
        }
        // Handle timestamp string
        else if (/^\d+$/.test(dateInput)) {
          date = new Date(parseInt(dateInput));
        } else {
          date = new Date(dateInput);
        }
      } else if (typeof dateInput === 'number') {
        // Handle timestamp
        date = new Date(dateInput);
      } else if (dateInput instanceof Date) {
        date = dateInput;
      }

      // If we have a valid date, format it
      if (date && !isNaN(date.getTime())) {
        // Check if the time is exactly midnight (00:00:00)
        const isMidnight = date.getHours() === 0 && 
                          date.getMinutes() === 0 && 
                          date.getSeconds() === 0 &&
                          date.getMilliseconds() === 0;
        
        // If it's midnight, only show the date
        if (isMidnight) {
          return format(date, 'dd MMM yyyy');
        }
        // Otherwise show both date and time
        return format(date, 'dd MMM yyyy, hh:mm a');
      }
      
      // Fallback for invalid dates
      console.warn('Invalid date input:', dateInput);
      return String(dateInput || '-');
      
    } catch (error) {
      console.error('Error in formatDate:', error, 'Input was:', dateInput);
      return String(dateInput || '-');
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status.toUpperCase());
      if (filters.dateFrom) queryParams.append('dateFrom', new Date(filters.dateFrom).toISOString());
      if (filters.dateTo) queryParams.append('dateTo', new Date(filters.dateTo).toISOString());

      const response = await ticketService.getAllBookings(queryParams.toString());
      setBookings(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      enqueueSnackbar('Failed to fetch bookings', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, enqueueSnackbar]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedBooking(null);
  };

  const handlePrintTicket = (booking) => {
    enqueueSnackbar(`Printing ticket ${booking.ticketNumber || booking.bookingNumber}`, { variant: 'info' });
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      // Check all possible ID fields
      const idToDelete = ticketToDelete.bookingId || ticketToDelete.id || ticketToDelete._id || ticketToDelete.ticketId;
      console.log('Deleting booking with data:', { ticketToDelete, idToDelete });
      
      if (!idToDelete) {
        console.error('No valid ID found in booking object:', ticketToDelete);
        throw new Error('No valid ID found for deletion. Available fields: ' + Object.keys(ticketToDelete).join(', '));
      }
      await ticketService.deleteTicket(idToDelete);
      enqueueSnackbar('Booking deleted successfully', { variant: 'success' });
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      enqueueSnackbar(
        error.response?.data?.message || 
        error.message || 
        'Failed to delete booking. Please try again.', 
        { variant: 'error' }
      );
    } finally {
      setTicketToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await ticketService.updateBookingStatus(bookingId, { status: newStatus });
      enqueueSnackbar(`Booking ${newStatus} successfully`, { variant: 'success' });
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      enqueueSnackbar('Failed to update booking status', { variant: 'error' });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (booking.bookingNumber && booking.bookingNumber.toLowerCase().includes(searchLower)) ||
      (booking.user?.name && booking.user.name.toLowerCase().includes(searchLower)) ||
      (booking.bus?.busNumber && booking.bus.busNumber.toLowerCase().includes(searchLower)) ||
      (booking.user?.email && booking.user.email.toLowerCase().includes(searchLower)) ||
      (booking.passengerName && booking.passengerName.toLowerCase().includes(searchLower)) ||
      (booking.passengerPhone && booking.passengerPhone.includes(searchTerm))
    );
  });

  const paginatedBookings = filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusChip = (status) => {
    if (!status) return null;
    
    const statusText = String(status).toLowerCase().trim();
    let chipColor = 'default';
    let chipVariant = 'outlined';
    let displayText = statusText;

    // Handle different status formats (case insensitive)
    if (statusText.includes('payment done') || statusText === 'completed' || 
        statusText === 'Payment Done' || statusText === 'Payment Done') {
      chipColor = 'success';
      chipVariant = 'filled';
      displayText = 'Payment Done';
    } else if (statusText.includes('pending') || statusText.includes('payment pending')) {
      chipColor = 'warning';
      chipVariant = 'filled';
      displayText = 'Payment Pending';
    }

    return (
      <Chip
        label={displayText}
        color={chipColor}
        variant={chipVariant}
        size="small"
        sx={{
          fontWeight: 500,
          textTransform: 'capitalize',
          minWidth: '100px',
          '& .MuiChip-label': {
            px: 1.5
          }
        }}
      />
    );
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', padding: '0 16px 16px', boxSizing: 'border-box', marginTop: '-180px' }}>
      <Card sx={{ width: '100%', boxShadow: 'none', borderRadius: 0 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} px={2} pt={1}>
            <Typography variant="h4" component="h1" sx={{ m: 0, fontWeight: 600 }}>
              <ReceiptIcon fontSize="large" style={{ verticalAlign: 'middle', marginRight: 10 }} />
              Booking Management
            </Typography>
            <Box>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchBookings} sx={{ mr: 1 }}>
                Refresh
              </Button>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => alert('Export to CSV functionality will be implemented here')}>
                Export
              </Button>
            </Box>
          </Box>

          <Box display="flex" gap={2} mb={3} flexWrap="wrap" sx={{ px: 2, pb: 2 }}>
            <TextField
              variant="outlined"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                style: { minWidth: '300px' }
              }}
            />
            <FormControl variant="outlined" size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
                style={{ minWidth: '150px' }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="From Date"
              type="date"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
            <TextField
              label="To Date"
              type="date"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
            <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setFilters({ status: 'all', dateFrom: '', dateTo: '' })}>
              Clear Filters
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ border: 'none', boxShadow: 'none', width: '100%', overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticket #</TableCell>
                  <TableCell>Passenger</TableCell>
                  <TableCell>Bus Details</TableCell>
                  <TableCell>Journey</TableCell>
                  <TableCell>Seat</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBookings.map((booking) => (
                    <TableRow key={booking.ticketId} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{booking.ticketNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {booking.passengerName?.charAt(0) || 'P'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{booking.passengerName || 'N/A'}</Typography>
                            <Typography variant="caption" color="textSecondary">{booking.passengerPhoneNumber || ''}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <BusIcon color="action" fontSize="small" />
                            <Typography variant="body2">{booking.busNumber}</Typography>
                          </Box>
                          <Typography variant="caption" color="textSecondary">{booking.source} → {booking.destination}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(booking.journeyDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{booking.seatNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{booking.type ? booking.type.replace('_', ' ') : 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">₹{booking.price.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(booking.status ? booking.status.replace(/_/g, ' ').toLowerCase() : 'unknown')}
                      </TableCell>
                      <TableCell sx={{ width: '200px' }}>
                        <Box display="flex" gap={0.5} sx={{ flexWrap: 'nowrap' }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary" onClick={() => handleViewDetails(booking)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Ticket">
                            <IconButton size="small" color="secondary" onClick={() => handlePrintTicket(booking)}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Ticket">
                            <IconButton 
                              onClick={(e) => {
                                e.stopPropagation();
                                setTicketToDelete(booking);
                                setIsDeleteDialogOpen(true);
                              }}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
            count={filteredBookings.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete {ticketToDelete?.ticketNumber ? 'Ticket' : 'Booking'}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete {ticketToDelete?.ticketNumber ? `ticket ${ticketToDelete.ticketNumber}` : 'this booking'}?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            This action cannot be undone and will permanently remove the {ticketToDelete?.ticketNumber ? 'ticket' : 'booking'} record.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setTicketToDelete(null);
              setIsDeleteDialogOpen(false);
            }}
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteTicket} 
            color="error"
            variant="contained"
            autoFocus
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        {selectedBooking && (
          <>
            <DialogTitle>
              Booking Details: {selectedBooking.bookingNumber}
              <IconButton
                aria-label="close"
                onClick={handleCloseDetails}
                sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>Journey Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">From</Typography>
                    <Typography>{selectedBooking.source || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">To</Typography>
                    <Typography>{selectedBooking.destination || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Travel Date</Typography>
                    <Typography>{formatDate(selectedBooking.journeyDate) || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Bus Number</Typography>
                    <Typography>{selectedBooking.busNumber || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>Passenger Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Name</Typography>
                    <Typography>{selectedBooking.passengerName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
                    <Typography>{selectedBooking.passengerPhoneNumber || 'N/A'}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>Booking Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Ticket Number</Typography>
                    <Typography>{selectedBooking.ticketNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Seat Number</Typography>
                    <Typography>{selectedBooking.seatNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Price</Typography>
                    <Typography>₹{selectedBooking.price?.toFixed(2) || '0.00'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                    {getStatusChip(selectedBooking.status)}
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Seats assigned</Typography>
                    <Typography>{selectedBooking.seatNumber ? '1' : selectedBooking.seats && selectedBooking.seats.length > 0 ? selectedBooking.seats.length : 'No seats assigned'}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="subtitle2" color="textSecondary">Total Amount</Typography>
                    <Typography variant="h6">₹{(selectedBooking.totalAmount || selectedBooking.price)?.toFixed(2) || '0.00'}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Box>
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleUpdateStatus(selectedBooking._id, 'confirmed')}
                      sx={{ mr: 1 }}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleUpdateStatus(selectedBooking._id, 'cancelled')}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleUpdateStatus(selectedBooking._id, 'completed')}
                  >
                    Mark as Completed
                  </Button>
                )}
              </Box>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  sx={{ mr: 1 }}
                >
                  Print Ticket
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCloseDetails}
                >
                  Close
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Bookings;