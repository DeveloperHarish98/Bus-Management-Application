import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, CircularProgress, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Paper, IconButton, Tooltip, Chip,
  TableSortLabel, TextField, InputAdornment, Avatar, Divider, Grid, CardHeader
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Visibility as ViewIcon, 
  Search as SearchIcon,
  Person as PersonIcon,
  ConfirmationNumber as TicketIcon,
  DirectionsBus as BusIcon,
  EventSeat as SeatIcon,
  Paid as PaidIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useSnackbar } from 'notistack';
import { ticketService } from '../../services';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('bookingDate');
  const { enqueueSnackbar } = useSnackbar();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ticketService.getAllBookings();
      const ticketsData = Array.isArray(response) ? response : (response?.data || []);
      setTickets(ticketsData);
      setFilteredTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      enqueueSnackbar('Failed to fetch tickets: ' + (error.message || 'Unknown error'), { 
        variant: 'error',
        autoHideDuration: 5000
      });
      setTickets([]);
      setFilteredTickets([]);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const filtered = tickets.filter(ticket => 
      (ticket.passengerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.pnrNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.busNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredTickets(filtered);
    setPage(0);
  }, [searchTerm, tickets]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel this ticket? This action cannot be undone.')) {
      try {
        setDeleting(true);
        // Note: You'll need to implement cancel in ticketService if needed
        await ticketService.updateBookingStatus(id, { status: 'CANCELLED' });
        enqueueSnackbar('Ticket cancelled successfully', { 
          variant: 'success',
          autoHideDuration: 3000
        });
        fetchTickets();
      } catch (error) {
        console.error('Error cancelling ticket:', error);
        enqueueSnackbar(error.response?.data?.message || 'Failed to cancel ticket', { 
          variant: 'error',
          autoHideDuration: 5000
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTicket(null);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (orderBy === 'bookingDate' || orderBy === 'travelDate') {
      return order === 'asc' 
        ? new Date(a[orderBy]) - new Date(b[orderBy])
        : new Date(b[orderBy]) - new Date(a[orderBy]);
    }
    if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedTickets = sortedTickets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('confirm')) return 'success';
    if (statusLower.includes('cancel')) return 'error';
    if (statusLower.includes('pend')) return 'warning';
    if (statusLower.includes('complete')) return 'info';
    return 'default';
  };

  // Safe date formatting with validation
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date && !isNaN(date) ? format(date, 'PPpp') : 'Invalid Date';
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredTickets.length) : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TicketIcon fontSize="large" />
          Ticket Management
        </Typography>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search tickets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Card sx={{ width: '100%', overflow: 'auto' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', width: '100%' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'pnrNumber'}
                          direction={orderBy === 'pnrNumber' ? order : 'asc'}
                          onClick={() => handleRequestSort('pnrNumber')}
                        >
                          PNR Number
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Passenger</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Bus Details</TableCell>
                      <TableCell>Seats</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'travelDate'}
                          direction={orderBy === 'travelDate' ? order : 'desc'}
                          onClick={() => handleRequestSort('travelDate')}
                        >
                          Travel Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Fare</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'bookingDate'}
                          direction={orderBy === 'bookingDate' ? order : 'desc'}
                          onClick={() => handleRequestSort('bookingDate')}
                        >
                          Booking Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedTickets.map((ticket) => (
                      <TableRow key={ticket.id} hover>
                        <TableCell>{ticket.pnrNumber}</TableCell>
                        <TableCell>{ticket.passengerName}</TableCell>
                        <TableCell>{ticket.contactNumber}</TableCell>
                        <TableCell>{ticket.busNumber}</TableCell>
                        <TableCell>{ticket.seatNumber}</TableCell>
                        <TableCell>{formatDate(ticket.travelDate)}</TableCell>
                        <TableCell>₹{ticket.fare}</TableCell>
                        <TableCell>{formatDate(ticket.bookingDate)}</TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.status}
                            color={getStatusColor(ticket.status)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewTicket(ticket)}
                                color="primary"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Ticket">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(ticket.id)}
                                color="error"
                                disabled={deleting}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRows > 0 && (
                      <TableRow style={{ height: 53 * emptyRows }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={tickets.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedTicket && (
          <>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Ticket ID</Typography>
                <Typography variant="body1">{selectedTicket.id}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Passenger</Typography>
                <Typography variant="body1">{selectedTicket.passengerName || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Bus Number</Typography>
                <Typography variant="body1">{selectedTicket.busNumber || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Seat Number</Typography>
                <Typography variant="body1">{selectedTicket.seatNumber || 'N/A'}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                {getStatusChip(selectedTicket.status)}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Booking Date</Typography>
                <Typography variant="body1">
                  {selectedTicket.bookingDate ? format(new Date(selectedTicket.bookingDate), 'PPpp') : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Journey Date</Typography>
                <Typography variant="body1">
                  {selectedTicket.journeyDate ? format(new Date(selectedTicket.journeyDate), 'PP') : 'N/A'}
                </Typography>
              </Box>
              {selectedTicket.source && selectedTicket.destination && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">Route</Typography>
                  <Typography variant="body1">
                    {selectedTicket.source} → {selectedTicket.destination}
                  </Typography>
                </Box>
              )}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Fare</Typography>
                <Typography variant="body1">
                  ₹{selectedTicket.fare ? parseFloat(selectedTicket.fare).toFixed(2) : '0.00'}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Tickets;