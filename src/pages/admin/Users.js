import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Snackbar,
  Alert,
  TableSortLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userService';

const Users = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser , setEditingUser ] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'USER',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('http://localhost:8080/users');
      url.searchParams.append('page', page + 1);
      url.searchParams.append('limit', rowsPerPage);
      if (searchTerm) {
        url.searchParams.append('search', searchTerm);
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      const usersData = Array.isArray(data.data) ? data.data : [];
      setUsers(usersData);
      setTotalRows(typeof data.total === 'number' ? data.total : usersData.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar(error.message || 'Error loading users', { 
        variant: 'error',
        autoHideDuration: 3000,
      });
      setUsers([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, enqueueSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name}?`)) return;

    try {
      const response = await fetch(`http://localhost:8080/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      enqueueSnackbar('User  deleted successfully', { 
        variant: 'success',
        autoHideDuration: 3000,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      enqueueSnackbar(error.message || 'Error deleting user', { 
        variant: 'error',
        autoHideDuration: 5000,
      });
    }
  };

  const handleEdit = (user) => {
    console.log('[EDIT] User data:', user);
    setEditingUser (user);
    setOpenDialog(true);
    const formData = {
      name: user.name,
      email: user.email,
      phone: user.phoneNumber || user.phone,
      role: user.role ? user.role.toUpperCase() : 'USER',
      address: user.address || '',
      dob: user.dob || ''
    };
    setFormData(formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[SUBMIT] Form data:', formData);
    if (!validateForm()) return;

    try {
      // Format phone number before submission
      const formattedPhone = formatPhoneNumber(formData.phone);
      
      const userData = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formattedPhone, // Use the formatted phone number
        role: String(formData.role).toUpperCase(),
        address: formData.address || '',
        password: 'password@123' // Default password for all new users
      };

      console.log('[SUBMIT] User data to save:', userData);
      let response;

      if (editingUser) {
        // Update existing user
        response = await userService.updateUser({
          ...userData,
          id: editingUser.id
        });
      } else {
        // Create new user
        response = await userService.register(userData);
      }
      
      console.log('[SUBMIT] API Response:', response);

      enqueueSnackbar(`User ${editingUser ? 'updated' : 'created'} successfully`, { 
        variant: 'success',
        autoHideDuration: 3000,
      });
      
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      enqueueSnackbar(error.response?.data?.message || error.message || 'Error saving user. Please try again.', { 
        variant: 'error',
        autoHideDuration: 5000,
      });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser (null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'USER',
      isActive: true
    });
    setErrors({});
  };

  const formatPhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = ('' + phone).replace(/\D/g, '');
    // Check if the number starts with 91 (India country code) and has 12 digits
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return cleaned.slice(2);
    }
    // If it's already 10 digits, return as is
    if (cleaned.length === 10) {
      return cleaned;
    }
    // For any other case, return the cleaned string (will be caught by validation)
    return cleaned;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    
    // Phone validation
    const phoneNumber = formatPhoneNumber(formData.phone);
    if (!phoneNumber) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    
    if (!formData.role) newErrors.role = 'Role is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const columns = [
    { 
      id: 'name', 
      label: 'Name', 
      minWidth: 180,
      format: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
          <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
            {value || '--'}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{
              textTransform: 'uppercase',
              color: 'text.secondary',
              letterSpacing: '0.5px',
              mt: 0.5
            }}
          >
            {row.role || '--'}
          </Typography>
        </Box>
      )
    },
    { 
      id: 'email', 
      label: 'Email', 
      minWidth: 200,
      format: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon fontSize="small" color="primary" />
          <Typography variant="body2" color="primary" noWrap>
            {value || '--'}
          </Typography>
        </Box>
      )
    },
    { 
      id: 'phone', 
      label: 'Phone', 
      minWidth: 150,
      format: (value, row) => {
        const phoneNumber = row.phoneNumber || row.phone || row.contactNumber || value;
        
        if (!phoneNumber) return (
          <Typography variant="body2" fontWeight="medium" color="text.secondary">
            --
          </Typography>
        );
        
        const formattedNumber = String(phoneNumber).replace(/^\+?91|\D/g, '');
        const displayNumber = formattedNumber.length === 10 
          ? `+91 ${formattedNumber.slice(0, 5)} ${formattedNumber.slice(5)}`
          : phoneNumber;
        
        return (
          <Typography variant="body2" fontWeight="medium" color="text.primary">
            {displayNumber}
          </Typography>
        );
      }
    }
  ];

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      pt: 1,
      px: 3,
      pb: 3,
      boxSizing: 'border-box',
      overflowX: 'hidden',
      marginTop: '-180px'
    }}>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={2}
      >
        <Typography variant="h4" component="h1" sx={{ m: 0, display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Manage Users
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            sx={{ minWidth: 250, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
            sx={{ borderRadius: 1, mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingUser (null);
              setOpenDialog(true);
            }}
            sx={{ borderRadius: 1 }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <Card sx={{ 
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxShadow: 3
      }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ 
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: '1000px'
            },
            '&::-webkit-scrollbar': {
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px'
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
                  {columns.map((column) => (
                    <TableCell key={column.id} sortDirection={orderBy === column.id ? order : false}>
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => {
                          const isAsc = orderBy === column.id && order === 'asc';
                          setOrder(isAsc ? 'desc' : 'asc');
                          setOrderBy(column.id);
                        }}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        {column.format ? column.format(user[column.id], user) : user[column.id]}
                      </TableCell>
                    ))}
                    <TableCell>
                      <IconButton 
                        onClick={() => handleEdit(user)}
                        sx={{ '&:hover': { color: 'success.main' } }}
                      >
                        <EditIcon color="success" />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(user)}
                        sx={{ '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalRows}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)', px: 2 }}
          />
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingUser  ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              margin="normal"
              name="name"
              label="Full Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            <TextField
              margin="normal"
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
              required
              disabled={!!editingUser }
            />
            <TextField
              margin="normal"
              name="phone"
              label="Phone Number"
              type="tel"
              fullWidth
              variant="outlined"
              value={formData.phone}
              onChange={(e) => {
                // Allow only numbers and limit to 10 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: value });
              }}
              onBlur={(e) => {
                // Format the phone number on blur
                const formatted = formatPhoneNumber(e.target.value);
                if (formatted && formatted.length === 10) {
                  setFormData({ ...formData, phone: formatted });
                }
              }}
              placeholder="Enter 10-digit mobile number"
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]{10}',
                maxLength: 10,
                title: 'Please enter a 10-digit mobile number'
              }}
              error={!!errors.phone}
              helperText={errors.phone || 'Must be a 10-digit number starting with 6-9'}
            />
            <FormControl fullWidth margin="normal" error={!!errors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Role"
                required
              >
                <MenuItem value="USER">USER</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </Select>
              {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {editingUser  ? 'Update' : 'Create'} User
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!errors && Object.keys(errors).length > 0}
        autoHideDuration={6000}
        onClose={() => setErrors({})}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setErrors({})} severity="error" sx={{ width: '100%' }}>
          {errors.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
