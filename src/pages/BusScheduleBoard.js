import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button
} from '@mui/material';
import BusIcon from '@mui/icons-material/DirectionsBus';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { busService } from '../services/busService';
import { format } from 'date-fns';
import EventSeatIcon from '@mui/icons-material/EventSeat';

const BusScheduleBoard = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const refreshIntervalRef = useRef(null);
  const navigate = useNavigate();
  
  const handleBookNow = (bus) => {
    navigate('/search', { 
      state: { 
        busNumber: bus.busNumber,
        busName: bus.name,
        source: bus.source || bus.from || 'N/A',
        destination: bus.destination || bus.to || 'N/A',
        date: bus._rawDeparture || new Date().toISOString(),
        seats: bus.availableSeats || 1
      }
    });
  };
  
  const parseAndFormatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      let date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const parts = dateString.split(/[\s/:]+/);
        if (parts.length >= 5) {
          date = new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4]);
        } else {
          const mysqlPattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/;
          const match = dateString.match(mysqlPattern);
          if (match) {
            date = new Date(match[1], match[2] - 1, match[3], match[4], match[5]);
          } else {
            const timestamp = Date.parse(dateString);
            if (!isNaN(timestamp)) {
              date = new Date(timestamp);
            }
          }
        }
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Could not parse date:', dateString);
        return dateString;
      }
      
      const formattedDate = format(date, 'MMM d, yyyy h:mm a');
      return formattedDate;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return dateString;
    }
  };

  const fetchBusesWithSeatDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await busService.getAllBuses();
      const buses = response.data?.data || [];
      const busNumbers = buses.map(bus => bus.busNumber).filter(Boolean);
      
      try {
        const seatDetailsPromises = await busService.getMultipleSeatDetails(busNumbers);
        const seatDetails = await Promise.all(seatDetailsPromises);
        const seatInfoMap = seatDetails.reduce((acc, seatInfo) => {
          if (seatInfo && seatInfo.busNumber) {
            const resolvedSeatInfo = seatInfo.data?.data || seatInfo.data || seatInfo;
            acc[seatInfo.busNumber] = resolvedSeatInfo;
          }
          return acc;
        }, {});
        
        const processedBuses = buses.map(bus => {
          const busNumber = bus.busNumber;
          const seatInfo = seatInfoMap[busNumber] || {};
          
          let totalSeats = parseInt(bus.seats) || 0;
          let availableSeats = 0;
          
          if (seatInfo) {
            totalSeats = seatInfo.totalSeats || seatInfo.seats?.length || totalSeats;
            
            if (Array.isArray(seatInfo.seats)) {
              availableSeats = seatInfo.seats.filter(seat => 
                seat && seat.status && seat.status.toUpperCase() === 'AVAILABLE'
              ).length;
            } else if (typeof seatInfo.availableSeats === 'number') {
              availableSeats = seatInfo.availableSeats;
            } else if (typeof seatInfo.bookedSeats === 'number') {
              availableSeats = Math.max(0, totalSeats - seatInfo.bookedSeats);
            }
          }
          
          availableSeats = Math.max(0, Math.min(availableSeats, totalSeats));
          
          let routeDisplay;
          let source, destination;
          
          if (bus.route) {
            routeDisplay = bus.route;
            const routeParts = bus.route.split('→').map(part => part.trim());
            if (routeParts.length === 2) {
              source = routeParts[0];
              destination = routeParts[1];
            }
          } 
          
          if (!source || !destination) {
            source = bus.source || bus.from || bus.origin || 'N/A';
            destination = bus.destination || bus.to || 'N/A';
            if (!routeDisplay) {
              routeDisplay = (source && destination && source !== 'N/A' && destination !== 'N/A' && source !== destination)
                ? `${source} → ${destination}`
                : source || destination;
            }
          }

          return {
            id: bus.id || busNumber || `bus-${Math.random().toString(36).substr(2, 9)}`,
            busNumber: busNumber || 'N/A',
            name: bus.name || bus.busName || 'Unnamed Bus',
            route: routeDisplay,
            departureTime: parseAndFormatDate(bus.departureTime || bus.departure_time || bus.departure),
            arrivalTime: parseAndFormatDate(bus.arrivalTime || bus.arrival_time || bus.arrival),
            status: bus.status || (availableSeats > 0 ? 'Available' : 'Full'),
            availableSeats: availableSeats,
            totalSeats: totalSeats,
            fare: bus.fare ? `₹${parseFloat(bus.fare).toFixed(2)}` : 'N/A',
            _rawDeparture: bus.departureTime || bus.departure_time || bus.departure,
            _rawArrival: bus.arrivalTime || bus.arrival_time || bus.arrival,
            _debug: JSON.stringify({
              busNumber,
              source,
              destination,
              route: bus.route,
              seats: bus.seats,
              seatInfo,
              calculated: {
                totalSeats,
                availableSeats,
                bookedSeats: totalSeats - availableSeats
              }
            })
          };
        });
        
        setBuses(processedBuses);
        setLastUpdated(new Date());
        setError(null);
      } catch (seatError) {
        console.error('Error fetching seat details:', seatError);
        const processedBuses = await Promise.all(buses.map(async (bus) => {
          const busNumber = bus.busNumber;
          try {
            const seatInfo = await busService.getSeatDetails(busNumber);
            let routeDisplay;
            let source, destination;
            
            if (bus.route) {
              routeDisplay = bus.route;
              const routeParts = bus.route.split('→').map(part => part.trim());
              if (routeParts.length === 2) {
                source = routeParts[0];
                destination = routeParts[1];
              }
            } 
            
            if (!source || !destination) {
              source = bus.source || bus.from || bus.origin || 'N/A';
              destination = bus.destination || bus.to || 'N/A';
              if (!routeDisplay) {
                routeDisplay = (source && destination && source !== 'N/A' && destination !== 'N/A' && source !== destination)
                  ? `${source} → ${destination}`
                  : source || destination;
              }
            }
            
            return {
              id: bus.id || busNumber || `bus-${Math.random().toString(36).substr(2, 9)}`,
              busNumber: busNumber || 'N/A',
              name: bus.name || bus.busName,
              route: routeDisplay,
              departureTime: parseAndFormatDate(bus.departureTime || bus.departure_time || bus.departure),
              arrivalTime: parseAndFormatDate(bus.arrivalTime || bus.arrival_time || bus.arrival),
              status: bus.status || (seatInfo.availableSeats > 0 ? 'Available' : 'Full'),
              availableSeats: seatInfo.availableSeats || 0,
              totalSeats: seatInfo.totalSeats || parseInt(bus.seats) || 0,
              fare: bus.fare ? `₹${parseFloat(bus.fare).toFixed(2)}` : 'N/A',
              _rawDeparture: bus.departureTime || bus.departure_time || bus.departure,
              _rawArrival: bus.arrivalTime || bus.arrival_time || bus.arrival
            };
          } catch (error) {
            console.error(`Error processing bus ${busNumber}:`, error);
            const source = bus.route || 'N/A';
            const destination = bus.destination || 'N/A';
            const routeDisplay = source === destination || !destination ? source : `${source} → ${destination}`;
            
            return {
              id: bus.id || busNumber || `bus-${Math.random().toString(36).substr(2, 9)}`,
              busNumber: busNumber || 'N/A',
              name: bus.name || bus.busName || 'Unnamed Bus',
              route: routeDisplay,
              departureTime: parseAndFormatDate(bus.departureTime || bus.departure_time || bus.departure),
              arrivalTime: parseAndFormatDate(bus.arrivalTime || bus.arrival_time || bus.arrival),
              status: bus.status || 'Unknown',
              availableSeats: 0,
              totalSeats: parseInt(bus.seats) || 0,
              fare: bus.fare ? `₹${parseFloat(bus.fare).toFixed(2)}` : 'N/A',
              _rawDeparture: bus.departureTime || bus.departure_time || bus.departure,
              _rawArrival: bus.arrivalTime || bus.arrival_time || bus.arrival,
              _error: error.message || 'Failed to load seat details'
            };
          }
        }));
        
        setBuses(processedBuses);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching bus data:', err);
      setError('Failed to load bus schedules. Please try again.');
      setBuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    const fetchData = async () => {
      if (!isMounted) return;
      try {
        await fetchBusesWithSeatDetails();
      } catch (error) {
        console.error('Error in fetchData:', error);
      }
    };
    
    fetchData();
    refreshIntervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    
    return () => {
      isMounted = false;
      clearInterval(clockInterval);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchBusesWithSeatDetails]);

  if (loading && buses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error" gutterBottom>Error loading bus schedules</Typography>
        <Typography variant="body2" color="textSecondary" paragraph>{error}</Typography>
        <Button variant="contained" color="primary" onClick={fetchBusesWithSeatDetails}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!loading && buses.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" gutterBottom>No Buses Available</Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          There are currently no buses scheduled. Please check back later.
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={fetchBusesWithSeatDetails}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" color={"white"} mb={3}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ color: '#1A73E8' }}>
          <BusIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#1A73E8' }} />
          Bus Schedule Board
        </Typography>
        <Box display="flex" alignItems="center">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Current Time: {currentTime.toLocaleTimeString()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Last updated: {lastUpdated.toLocaleString()}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={fetchBusesWithSeatDetails}
            disabled={loading}
            startIcon={<RefreshIcon />}
            size="small"
            sx={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid white',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          boxShadow: 3,
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ 
              background: 'linear-gradient(90deg, #1A73E8,rgb(95, 127, 177))',
              '& .MuiTableCell-root': {
                color: 'white',
                fontWeight: '600',
                padding: '16px',
                textAlign: 'left',
              }
            }}>
              <TableCell>Bus Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Departure</TableCell>
              <TableCell>Arrival</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Seats</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {buses.map((bus, index) => (
              <TableRow 
                key={bus.id}
                hover
                sx={{ 
                  background: index % 2 === 0 
                    ? 'rgba(182, 200, 212, 0.9)' 
                    : 'rgba(182, 200, 212, 0.9)',
                  '&:hover': {
                    background: 'rgba(182, 200, 212, 0.9)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <TableCell sx={{ fontWeight: 'bold', color: '#1A73E8' }}>{bus.busNumber}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{bus.name}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#6f42c1' }}>{bus.route}</TableCell>
                <TableCell sx={{ color: 'orange', whiteSpace: 'nowrap' }}>{bus.departureTime}</TableCell>
                <TableCell sx={{ color: 'orange', whiteSpace: 'nowrap' }}>{bus.arrivalTime}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {`${bus.availableSeats} / ${bus.totalSeats}`}
                </TableCell>
                <TableCell>
                  <Box 
                    component="span" 
                    sx={{
                      color: bus.status === 'Available' ? '#34A853' : '#FF6B6B',
                      fontWeight: 'medium',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: bus.status === 'Available' ? '#34A853' : '#FF6B6B',
                      backgroundColor: bus.status === 'Available' ? 'rgba(52,168,83,0.1)' : 'rgba(255,107,107,0.1)',
                    }}
                  >
                    {bus.status}
                  </Box>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<EventSeatIcon />}
                    onClick={() => handleBookNow(bus)}
                    disabled={bus.status !== 'Available'}
                    sx={{
                      background: bus.status === 'Available' ? '#1A73E8' : '#ccc',
                      color: 'white',
                      borderRadius: '20px',
                      textTransform: 'none',
                      padding: '4px 16px',
                      fontSize: '0.8rem',
                      '&:hover': {
                        background: bus.status === 'Available' ? '#1557B0' : '#ccc',
                      },
                      '&.Mui-disabled': {
                        background: '#f5f5f5',
                        color: '#999',
                      }
                    }}
                  >
                    {bus.status === 'Available' ? 'Book Now' : 'Full'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box mt={2} textAlign="right">
        <Typography variant="caption" color="rgba(0, 0, 0, 0.7)">
          Auto-refreshes every 5 minutes
        </Typography>
      </Box>
    </Box>
  );
};

export default BusScheduleBoard;
