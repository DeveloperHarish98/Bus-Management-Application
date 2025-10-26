import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, 
  ListItemText, Typography, Divider, CssBaseline, 
  useTheme, useMediaQuery, IconButton, Tooltip
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsBus as BusIcon,
  Book as BookIcon,
  BarChart as AnalyticsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;
const collapsedWidth = 60; // Reduced from 64 to make it more compact

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginLeft: 0,
  width: '100%',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  [theme.breakpoints.up('sm')]: {
    marginLeft: open ? `${drawerWidth}px` : `${collapsedWidth}px`,
    width: open 
      ? `calc(100% - ${drawerWidth}px)` 
      : `calc(100% - ${collapsedWidth}px)`,
    maxWidth: 'none',
  },
  [theme.breakpoints.up('lg')]: {
    padding: theme.spacing(3, 6),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));



const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Buses', icon: <BusIcon />, path: '/admin/buses' },
  { text: 'Bookings', icon: <BookIcon />, path: '/admin/bookings' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/admin/analytics' },
  { text: 'User Dashboard', icon: <HomeIcon />, path: '/dashboard' },
];

const AdminLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = React.useState(true);
  const location = useLocation();
  const { logout } = useAuth();

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
  };

  React.useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            position: 'fixed',
            top: '70px',
            height: 'calc(100vh - 64px)',
            zIndex: 1099,
            backgroundColor: theme.palette.background.default,
            borderRight: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            overflowX: 'hidden',
            transition: theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            width: open ? drawerWidth : collapsedWidth,
            '&:hover': {
              backgroundColor: theme.palette.background.default,
            },
          },
          '& .MuiListItemButton-root': {
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.25),
              },
            },
          },
        }}
      >
        <DrawerHeader sx={{ px: open ? 2 : 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%',
            justifyContent: open ? 'space-between' : 'center',
          }}>
            {open ? (
              <>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                  Bus Management
                </Typography>
                <Tooltip title="Collapse">
                  <IconButton 
                    onClick={toggleDrawer}
                    size="small"
                    sx={{ p: 0.5 }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Expand">
                <IconButton 
                  color="inherit"
                  aria-label="expand drawer"
                  onClick={toggleDrawer}
                  size="small"
                  sx={{ p: 0.5 }}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </DrawerHeader>
        <Divider />
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <List>
            {menuItems.map((item) => (
              <Tooltip title={!open ? item.text : ''} key={item.text} placement="right">
                <ListItem 
                  disablePadding
                  sx={{ 
                    display: 'block',
                    px: open ? 2 : 0.5,
                    py: 0.5
                  }}
                >
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={location.pathname === item.path}
                    onClick={isMobile ? toggleDrawer : undefined}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: open ? 2.5 : 0.5,
                      borderRadius: 1,
                      mx: 0.5,
                    }}
                  >
                    <ListItemIcon 
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                        color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                      }}
                    >
                      {React.cloneElement(item.icon, {
                        fontSize: open ? 'medium' : 'small',
                      })}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        opacity: open ? 1 : 0,
                        whiteSpace: 'nowrap',
                        '& span': {
                          fontSize: '0.875rem',
                          fontWeight: location.pathname === item.path ? 600 : 400,
                        }
                      }} 
                      primaryTypographyProps={{
                        noWrap: true,
                        variant: 'body2',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            ))}
          </List>
        </Box>
        <Divider />
        <List>
          <Tooltip title={!open ? 'Logout' : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton 
                onClick={handleLogout}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon 
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout" 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    whiteSpace: 'nowrap',
                  }} 
                />
              </ListItemButton>
            </ListItem>
          </Tooltip>
        </List>
      </Drawer>
      <Main open={open}>
        <Box sx={{ p: 3, mt: 8 }}>
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
};

export default AdminLayout;