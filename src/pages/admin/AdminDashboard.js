import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  CircularProgress,
  Divider
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { 
  People as PeopleIcon, 
  DirectionsBus as BusIcon, 
  Receipt as ReceiptIcon, 
  Route as RouteIcon,
  List as ListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const QuickActionCard = ({ title, count, icon, color = 'primary', to, actionText = 'View All' }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            color: `${color}.dark`,
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {count === undefined ? <CircularProgress size={24} /> : count}
          </Typography>
        </Box>
      </Box>
    </CardContent>
    <Divider />
    <CardActions>
      <Button 
        size="small" 
        color={color} 
        component={Link} 
        to={to}
        startIcon={<ListIcon />}
      >
        {actionText}
      </Button>
    </CardActions>
  </Card>
);

const ActionCard = ({ 
  title, 
  description, 
  icon, 
  color = 'primary', 
  to, 
  buttonText = 'Manage', 
  disabled = false,
  fullHeight = false
}) => (
  <Card 
    sx={{ 
      height: fullHeight ? '100%' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      opacity: disabled ? 0.7 : 1,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': !disabled ? {
        transform: 'translateY(-4px)',
        boxShadow: 3,
      } : {},
    }}
  >
    <CardContent sx={{ flexGrow: 1, p: 2 }}>
      <Box display="flex" alignItems="center" mb={1.5}>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            color: `${color}.dark`,
            borderRadius: '8px',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5,
            flexShrink: 0
          }}
        >
          {React.cloneElement(icon, { fontSize: 'small' })}
        </Box>
        <Typography 
          variant="subtitle2"
          sx={{ 
            fontWeight: 600,
            fontSize: '0.9rem',
            color: disabled ? 'text.disabled' : 'text.primary'
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography 
        variant="caption"
        color={disabled ? 'text.disabled' : 'text.secondary'} 
        sx={{ 
          display: 'block',
          mb: 1,
          lineHeight: 1.3,
          fontSize: '0.75rem'
        }}
      >
        {description}
      </Typography>
    </CardContent>
    <Divider />
    <CardActions sx={{ p: 0 }}>
      <Button 
        fullWidth
        size="small"
        color={color}
        component={disabled ? 'button' : Link}
        to={to}
        disabled={disabled}
        sx={{
          px: 1.5,
          py: 1,
          fontSize: '0.75rem',
          justifyContent: 'flex-start',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          minWidth: 'auto',
          '&:hover': !disabled ? {
            backgroundColor: `${color}.light`,
            color: `${color}.dark`,
          } : {}
        }}
      >
        {buttonText}
      </Button>
    </CardActions>
  </Card>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalUsers: 0,
    totalTickets: 0
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Fetch counts from APIs with error handling for each request
      const [busesRes, usersRes, ticketsRes] = await Promise.all([
        fetch('http://localhost:8080/buses').catch(err => {
          console.error('Error fetching buses:', err);
          return { ok: false, json: () => ({ data: [] }) };
        }),
        fetch('http://localhost:8080/users').catch(err => {
          console.error('Error fetching users:', err);
          return { ok: false, json: () => ({ data: [] }) };
        }),
        fetch('http://localhost:8080/tickets').catch(err => {
          console.error('Error fetching tickets:', err);
          return { ok: false, json: () => ({ data: [] }) };
        })
      ]);

      // Parse responses with error handling
      let busesData = { data: [] };
      let usersData = { data: [] };
      let ticketsData = { data: [] };

      try {
        busesData = await busesRes.json();
        console.log('Buses data:', busesData);
      } catch (e) {
        console.error('Error parsing buses data:', e);
      }

      try {
        usersData = await usersRes.json();
        console.log('Users data:', usersData);
      } catch (e) {
        console.error('Error parsing users data:', e);
      }

      try {
        ticketsData = await ticketsRes.json();
        console.log('Tickets data:', ticketsData);
      } catch (e) {
        console.error('Error parsing tickets data:', e);
      }

      setStats({
        totalBuses: busesData.data?.length || 0,
        totalUsers: usersData.data?.length || 0,
        totalTickets: ticketsData.data?.length || 0
      });
      
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setLoading(false);
      console.log('Finished loading dashboard data');
    }
  };

  // Redirect if not admin and fetch data if admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        mt: -20, 
        mb: 4,
        px: 2,
        width: '100%',
        '&.MuiContainer-root': {
          maxWidth: '100%',
          paddingLeft: 2,
          paddingRight: 2,
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Quick Stats */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 3,
        mb: 3,
        width: '100%',
        '& > *': {
          width: '100%',
          '& .MuiCardContent-root': {
            padding: '16px 24px',
            '& .MuiBox-root': {
              justifyContent: 'space-between'
            }
          },
          '& .MuiCardActions-root': {
            padding: '8px 16px 16px'
          }
        }
      }}>
        <QuickActionCard
          title="Total Buses"
          count={loading ? undefined : stats.totalBuses}
          icon={<BusIcon />}
          color="primary"
          to="/admin/buses"
        />
        <QuickActionCard
          title="Total Users"
          count={loading ? undefined : stats.totalUsers}
          icon={<PeopleIcon />}
          color="secondary"
          to="/admin/users"
        />
        <QuickActionCard
          title="Total Tickets"
          count={loading ? undefined : stats.totalTickets}
          icon={<ReceiptIcon />}
          color="success"
          to="/admin/tickets"
        />
      </Box>

      {/* Management Sections */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Management Panels
      </Typography>
      
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 3,
        width: '100%',
        '& > *': {
          width: '100%',
          '& .MuiCardContent-root': {
            padding: '16px',
            '& .MuiBox-root': {
              justifyContent: 'space-between'
            }
          },
          '& .MuiCardActions-root': {
            padding: '8px 12px 12px'
          }
        }
      }}>
        <ActionCard
          title="Manage Buses"
          description="View, add, edit, or delete buses in the system."
          icon={<BusIcon />}
          color="primary"
          to="/admin/buses"
          buttonText="Manage Buses"
        />

        <ActionCard
          title="Manage Users"
          description="View and manage user accounts and permissions."
          icon={<PeopleIcon />}
          color="secondary"
          to="/admin/users"
          buttonText="Manage Users"
        />

        <ActionCard
          title="Manage Tickets"
          description="View and manage all booking tickets."
          icon={<ReceiptIcon />}
          color="success"
          to="/admin/tickets"
          buttonText="Manage Tickets"
        />

        <ActionCard
          title="Manage Routes"
          description="Coming soon: Manage bus routes and schedules."
          icon={<RouteIcon />}
          color="info"
          to="#"
          buttonText="Coming Soon"
          disabled
        />
      </Box>
    </Container>
  );
};

export default AdminDashboard;
