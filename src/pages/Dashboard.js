import React, { useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Button, 
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Tooltip,

} from '@mui/material';
import { 
  DirectionsBus as BusIcon, 
  ConfirmationNumber as TicketIcon, 
  Help as HelpIcon,
  Logout as LogoutIcon,
  Route as RouteIcon,
  LocationCity as LocationCityIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { motion } from 'framer-motion';
import BusScheduleBoard from './BusScheduleBoard';



const DashboardCard = ({ title, icon, description, path, color, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(path);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ height: '100%' }}
    >
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          background: `linear-gradient(145deg, ${color[0]}, ${color[1]})`,
          color: 'white',
          transition: 'transform 0.3s ease',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
          }
        }}
      >
        <CardContent sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between' 
        }}>
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar 
                sx={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  marginRight: 2,
                  width: 56,
                  height: 56
                }}
              >
                {icon}
              </Avatar>
              <Typography variant="h6" component="div">
                {title}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              color="inherit" 
              sx={{ 
                minHeight: 50,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {description}
            </Typography>
          </Box>
          <CardActions sx={{ padding: '16px' }}>
            <Button 
              variant="outlined" 
              color="inherit" 
              fullWidth
              onClick={handleClick}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                minHeight: '48px',
                textTransform: 'none',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              Go to {title}
            </Button>
          </CardActions>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const dashboardCards = [
    {
      title: 'Book a Bus',
      icon: <BusIcon />,
      description: 'Search and book buses for your journey',
      path: '/search',
      color: ['#1A73E8', '#4285F4']
    },
    {
      title: 'My Bookings',
      icon: <TicketIcon />,
      description: 'View and manage your bookings',
      path: '/my-bookings',
      color: ['#34A853', '#4CAF50']
    },
    {
      title: 'Bus Routes',
      icon: <RouteIcon />,
      description: 'Explore available bus routes',
      path: '/bus-routes',
      color: ['#FF6B6B', '#FF8A5B']
    },
    {
      title: 'My Profile',
      icon: <LocationCityIcon />,
      description: 'View and update your profile',
      path: '/profile',
      color: ['#4ECDC4', '#45B7D1']
    },
    {
      title: 'Help & Support',
      icon: <HelpIcon />,
      description: 'Get help and support',
      path: '/help',
      color: ['#9C27B0', '#BA68C8']
    },
    {
      title: 'Logout',
      icon: <LogoutIcon />,
      description: 'Securely logout from the application',
      path: '/login',
      color: ['#FF6B6B', '#4ECDC4'],
      onClick: handleLogout
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ 
      padding: '0 20px',
      marginTop: -10,
      paddingTop: '20px'
    }}>
      <Box 
        sx={{ 
          position: 'relative',
          textAlign: 'center', 
          mb: 4,
          background: 'linear-gradient(135deg, rgb(65, 11, 123) 0%, rgb(89, 130, 201) 100%)',
          color: 'white',
          py: 4,
          borderRadius: 2,
          marginTop: 0
        }}
      >
        {/* Logout Button */}
        <Tooltip title="Logout">
          <IconButton
            onClick={handleLogout}
            sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16, 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>

        <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
          Welcome to Safe Bus Booking
        </Typography>
        {user && (
          <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Welcome, {user.name || user.email.split('@')[0]}
          </Typography>
        )}
        <Typography variant="subtitle1">
          Book your journey with ease and comfort
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <DashboardCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <ErrorBoundary fallback={<Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, textAlign: 'center' }}>
          <Typography color="textSecondary">Bus schedule is currently unavailable</Typography>
        </Box>}>
          <BusScheduleBoard />
        </ErrorBoundary>
      </Box>
    </Container>
  );
};

export default Dashboard;