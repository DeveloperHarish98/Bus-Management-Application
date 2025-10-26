import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  List, 
  ListItem, 
  Divider, 
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DirectionsBus, ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';

const BusRoutes = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusRoutes = async () => {
      try {
        console.log('Fetching bus routes...');
        const status = 'AVAILABLE'; // Using 'AVAILABLE' since that's the status in your response
        const url = `http://localhost:8080/buses/findByStatus?status=${encodeURIComponent(status)}`;
        
        console.log('Request URL:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('API Error Response:', errorData);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }
        
        const responseData = await response.json();
        console.log('API Response Data:', responseData);
        
        // Extract the data array from the response
        const buses = responseData.data || [];
        
        if (!Array.isArray(buses)) {
          console.error('Expected data to be an array but got:', typeof buses, buses);
          throw new Error('Invalid response format: expected array of buses');
        }
        
        // Transform the API response to match the expected format
        const formattedRoutes = buses.map(bus => ({
          id: bus.id,
          name: bus.name || 'N/A',
          from: bus.source || 'N/A',
          to: bus.destination || 'N/A',
          departure: bus.departureTime || 'N/A',
          type: bus.type || 'Standard',
          price: bus.fare ? `₹${parseFloat(bus.fare).toFixed(2)}` : 'N/A',
          seats: bus.seats || 'N/A',
          busNumber: bus.busNumber || 'N/A',
          arrivalTime: bus.arrivalTime || 'N/A',
          status: bus.status || 'N/A',
          route: bus.route || 'N/A'
        }));
        
        setRoutes(formattedRoutes);
      } catch (err) {
        console.error('Error in fetchBusRoutes:', err);
        setError(`Error loading bus routes: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBusRoutes();
  }, []);

  const getRouteColor = (type) => {
    switch(type.toLowerCase()) {
      case 'express':
        return theme.palette.primary.main;
      case 'luxury':
        return theme.palette.secondary.main;
      default:
        return theme.palette.success.main;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">Loading bus routes...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (routes.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography>No bus routes available.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 0, pb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 4 },
            mt: -10,
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.1) 100%)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              mb: 2
            }}
          >
            Popular Bus Routes
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'white',
              maxWidth: '600px',
              mb: 2
            }}
          >
            Explore our most popular bus routes and book your next trip with ease. All routes are operated by our trusted partners with comfortable seating and amenities.
          </Typography>

          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/search')}
            sx={{ mt: 1 }}
            startIcon={<DirectionsBus />}
          >
            Book a Bus Now
          </Button>
        </Paper>

        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box 
            sx={{ 
              p: { xs: 2, sm: 3 },
              bgcolor: 'background.paper',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Available Routes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {routes.length} routes found
              </Typography>
            </Box>
          </Box>

          <List disablePadding>
            {routes.map((route, index) => (
              <motion.div
                key={route.id}
                whileHover={{ scale: 1.005 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <ListItem 
                  button 
                  onClick={() => navigate('/search')}
                  sx={{ 
                    p: { xs: 2, sm: 3 },
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'flex-start',
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      '& .route-arrow': {
                        transform: 'translateX(5px)',
                        opacity: 1
                      }
                    } 
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: { xs: 2, sm: 0 },
                    flex: 1,
                    minWidth: 0
                  }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%',
                      bgcolor: getRouteColor(route.type) + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0
                    }}>
                      <DirectionsBus sx={{ color: getRouteColor(route.type) }} />
                    </Box>
                    <Box sx={{ minWidth: 0, mr: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {route.from} to {route.to}
                        </Typography>
                        <Box 
                          sx={{ 
                            ml: 1,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: getRouteColor(route.type) + '20',
                            color: getRouteColor(route.type),
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {route.type}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box component="span" sx={{ mr: 0.5 }}>⏱️</Box> {route.duration}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box component="span" sx={{ mr: 0.5 }}>📍</Box> {route.distance}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box component="span" sx={{ mr: 0.5 }}>🕒</Box> {route.departure}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: { xs: 2, sm: 0 },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.primary.main,
                        mr: 2
                      }}
                    >
                      {route.price}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      size={isMobile ? 'small' : 'medium'}
                      endIcon={<ArrowForward className="route-arrow" sx={{ transition: 'all 0.3s ease', opacity: 0.7 }} />}
                      sx={{ 
                        ml: 'auto',
                        whiteSpace: 'nowrap',
                        width: { xs: '100%', sm: 'auto' }
                      }}
                    >
                      {isMobile ? 'Book' : 'Book Now'}
                    </Button>
                  </Box>
                </ListItem>
                {index < routes.length - 1 && <Divider sx={{ my: 0 }} />}
              </motion.div>
            ))}
          </List>
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="White" sx={{ mb: 2 }}>
            Can't find your route? Use our search to find more options.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => navigate('/search')}
            startIcon={<DirectionsBus />}
          >
            Search All Routes
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
};

export default BusRoutes;
