import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  alpha,
  Badge,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  Chip,
} from '@mui/material';
import { 
  Link, 
  useNavigate, 
  useLocation
} from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';


const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New Booking',
      message: 'Your booking #BK12345 has been confirmed',
      time: '2 hours ago',
      read: false,
      type: 'booking'
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Payment of ₹1200 received for booking #BK12345',
      time: '5 hours ago',
      read: true,
      type: 'payment'
    },
    {
      id: 3,
      title: 'System Update',
      message: 'Scheduled maintenance on July 15, 2025',
      time: '1 day ago',
      read: true,
      type: 'system'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login', { replace: true });
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
    // Mark all notifications as read when opened
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname.startsWith('/admin');
    }
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const hideNavigation = ['/login', '/register'].includes(location.pathname) || isAdminRoute;
  const isAdmin = user?.role === 'ADMIN';

  // Navigation items
  const navItems = [
    { name: 'Home', path: '/dashboard' },
    { name: 'Book Tickets', path: '/search' },
    { name: 'Bus Routes', path: '/bus-routes' },
    { name: 'My Bookings', path: '/my-bookings' },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin/dashboard' });
  }

  // Mobile menu
  const renderMobileMenu = (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        flexDirection: 'column',
        position: 'absolute',
        top: 70,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 10px 30px -10px rgba(2, 12, 27, 0.7)',
        padding: '16px',
        zIndex: 1100,
        transform: mobileOpen ? 'translateY(0)' : 'translateY(-150%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      {navItems.map((item) => (
        <Button
          key={item.path}
          component={Link}
          to={item.path}
          fullWidth
          sx={{
            py: 1.5,
            color: isActive(item.path) ? theme.palette.primary.main : 'text.primary',
            fontWeight: isActive(item.path) ? 600 : 400,
            justifyContent: 'flex-start',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
          onClick={() => setMobileOpen(false)}
        >
          {item.name}
        </Button>
      ))}
      <Divider sx={{ my: 1 }} />
      {isAuthenticated ? (
        <Button
          fullWidth
          onClick={handleLogout}
          sx={{
            py: 1.5,
            color: 'error.main',
            justifyContent: 'flex-start',
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          Logout
        </Button>
      ) : (
        <Button
          component={Link}
          to="/login"
          fullWidth
          variant="contained"
          sx={{
            py: 1.5,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            '&:hover': {
              background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
            },
          }}
          onClick={() => setMobileOpen(false)}
        >
          Login / Register
        </Button>
      )}
    </Box>
  );

  return (
    <AppBar 
      position="fixed"
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'none',
        boxShadow: 'none',
        color: '#ffffff', // Black text for better visibility on light backgrounds
        transition: 'all 0.3s ease-in-out',
        borderBottom: 'none',
      }}
      elevation={0}
    >
      <Container maxWidth="xl">
        <Toolbar 
          disableGutters 
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 70,
          }}
        >
          {/* Logo / Brand */}
          <Box 
            component={Link} 
            to="/" 
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              '&:hover': {
                '& .cursive-text': {
                  background: 'linear-gradient(90deg, #6366F1, #EC4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                component="img"
                src="/images/logo2.png"
                alt="Busotrip Logo"
                sx={{ 
                  width: 99, 
                  height: 99,
                  objectFit: 'contain'
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1, mt: 0.5 }}>
                {/* Title hidden as per user request
                <Typography
                  variant="h5"
                  component="span"
                  className="cursive-text"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    height: 0,
                    overflow: 'hidden',
                    visibility: 'hidden'
                  }}
                >
                  Busotrip
                </Typography>
                */}
                {/* <Typography
                  variant="caption"
                  component="span"
                  className="cursive-text"
                  sx={{
                    fontSize: '0.6rem',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    display: 'block',
                    lineHeight: 1.2,
                    mt: -0.5
                  }}
                >
                  Book your comfort
                </Typography> */}
              </Box>
            </Box>
          </Box>

          {/* Spacer to push navigation to the right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Navigation - Moved to right */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, mr: 2 }}>
            {!hideNavigation && navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  color: isActive(item.path) ? 'primary.main' : 'text.primary',
                  fontWeight: isActive(item.path) ? 600 : 400,
                  textTransform: 'none',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* Right Side Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            {isAuthenticated ? (
              <>
                <IconButton 
                  size="large"
                  color="inherit"
                  onClick={handleNotificationClick}
                  aria-controls={notificationOpen ? 'notification-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={notificationOpen ? 'true' : undefined}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon sx={{ color: '#6366F1' }} />
                  </Badge>
                </IconButton>

                {/* Notification Menu */}
                <Menu
                  anchorEl={notificationAnchorEl}
                  id="notification-menu"
                  open={notificationOpen}
                  onClose={handleNotificationClose}
                  onClick={handleNotificationClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      width: 360,
                      maxWidth: '100%',
                      mt: 1.5,
                      '& .MuiList-root': {
                        p: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Paper sx={{ width: '100%' }}>
                    <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Notifications
                      </Typography>
                      <Chip 
                        label={`${unreadCount} unread`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <ListItem 
                            key={notification.id}
                            disablePadding
                            secondaryAction={
                              <Typography variant="caption" color="text.secondary">
                                {notification.time}
                              </Typography>
                            }
                            sx={{
                              borderBottom: `1px solid ${theme.palette.divider}`,
                              bgcolor: !notification.read ? alpha(theme.palette.primary.light, 0.1) : 'transparent',
                            }}
                          >
                            <ListItemButton>
                              <ListItemAvatar>
                                <Avatar
                                  sx={{
                                    bgcolor: notification.type === 'booking' ? 'success.light' : 
                                            notification.type === 'payment' ? 'info.light' : 'grey.300',
                                    color: 'white',
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {notification.type === 'booking' ? 'B' : 
                                   notification.type === 'payment' ? 'P' : 'S'}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle2" fontWeight={!notification.read ? 600 : 400}>
                                    {notification.title}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {notification.message}
                                  </Typography>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText 
                            primary="No new notifications" 
                            primaryTypographyProps={{
                              textAlign: 'center',
                              color: 'text.secondary',
                              py: 2
                            }}
                          />
                        </ListItem>
                      )}
                    </List>
                    {notifications.length > 0 && (
                      <Box sx={{ p: 1, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Button size="small" color="primary">
                          View All Notifications
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Menu>
                
                <IconButton
                  onClick={handleProfileMenuOpen}
                  size="small"
                  sx={{ ml: 1 }}
                  aria-controls={open ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                >
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36,
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  id="account-menu"
                  open={open}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
                    <Avatar /> Profile
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  sx={{
                    mr: 1,
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                    },
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}

            {/* Mobile menu button */}
            <IconButton
              color="inherit"
              aria-label="open menu"
              edge="end"
              onClick={handleMobileMenuToggle}
              sx={{ 
                display: { xs: 'flex', md: 'none' },
                ml: 1,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Menu */}
      {isMobile && renderMobileMenu}
    </AppBar>
  );
};

export default Navbar;
