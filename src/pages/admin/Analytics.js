import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Grid, 
  Paper, 
  Card, 
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp as TrendingUpIcon, 
  People as PeopleIcon, 
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

// Sample data - in a real app, this would come from an API
const generateData = (range) => {
  const today = new Date();
  const data = [];
  let days;
  
  switch(range) {
    case 'week':
      days = 7;
      break;
    case 'month':
      days = 30;
      break;
    case 'year':
      days = 12; // months
      break;
    default:
      days = 7;
  }

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    if (range === 'year') {
      date.setMonth(today.getMonth() - (days - 1 - i));
      data.push({
        name: date.toLocaleString('default', { month: 'short' }),
        bookings: Math.floor(Math.random() * 500) + 100,
        revenue: Math.floor(Math.random() * 10000) + 5000,
        users: Math.floor(Math.random() * 200) + 50,
      });
    } else {
      date.setDate(today.getDate() - (days - 1 - i));
      data.push({
        name: date.toLocaleString('default', { weekday: 'short' }),
        bookings: Math.floor(Math.random() * 100) + 20,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        users: Math.floor(Math.random() * 50) + 10,
      });
    }
  }
  return data;
};

const pieData = [
  { name: 'Completed', value: 75 },
  { name: 'Cancelled', value: 15 },
  { name: 'Pending', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const radarData = [
  { subject: 'Mon', A: 120, B: 110, fullMark: 150 },
  { subject: 'Tue', A: 98, B: 130, fullMark: 150 },
  { subject: 'Wed', A: 86, B: 130, fullMark: 150 },
  { subject: 'Thu', A: 99, B: 100, fullMark: 150 },
  { subject: 'Fri', A: 85, B: 90, fullMark: 150 },
  { subject: 'Sat', A: 65, B: 85, fullMark: 150 },
  { subject: 'Sun', A: 40, B: 60, fullMark: 150 },
];

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <Card sx={{ 
    height: '100%',
    background: 'linear-gradient(145deg, #f5f7fa, #e4e8f0)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderRadius: 2,
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }
  }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
            {value}
          </Typography>
          <Box display="flex" alignItems="center">
            <TrendingUpIcon 
              sx={{ 
                color: change >= 0 ? '#10B981' : '#EF4444',
                mr: 0.5,
                fontSize: '1rem'
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                color: change >= 0 ? '#10B981' : '#EF4444',
                fontWeight: 600
              }}
            >
              {change}% from last {change >= 0 ? 'period' : 'period'}
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            color: `${color}.main`,
            borderRadius: '12px',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Icon fontSize="medium" />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Analytics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [timeRange, setTimeRange] = useState('week');
  const [data, setData] = useState(generateData('week'));
  
  useEffect(() => {
    setData(generateData(timeRange));
  }, [timeRange]);

  const handleTimeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Calculate summary stats
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalUsers = data.reduce((sum, item) => sum + item.users, 0);
  const avgDailyUsers = Math.round(totalUsers / data.length);

  return (
    <Box sx={{ p: isMobile ? '24px 12px 12px' : '40px 24px 24px', backgroundColor: '#f8fafc', marginTop: '-180px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Track and analyze your business performance
          </Typography>
        </Box>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 180, backgroundColor: 'white' }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={handleTimeChange}
            label="Time Range"
          >
            <MenuItem value="week">Last 7 Days</MenuItem>
            <MenuItem value="month">Last 30 Days</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Bookings" 
            value={totalBookings.toLocaleString()} 
            icon={ReceiptIcon} 
            color="primary"
            change={12.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Revenue" 
            value={`$${totalRevenue.toLocaleString()}`} 
            icon={MoneyIcon} 
            color="success"
            change={8.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Users" 
            value={totalUsers.toLocaleString()} 
            icon={PeopleIcon} 
            color="info"
            change={5.7}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Avg. Daily Users" 
            value={avgDailyUsers.toLocaleString()} 
            icon={TimelineIcon} 
            color="warning"
            change={3.2}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2, backgroundColor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Booking Trends</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="bookings" 
                  name="Bookings" 
                  stroke="#6366F1" 
                  fillOpacity={1} 
                  fill="url(#colorBookings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2, backgroundColor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Booking Status</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2, backgroundColor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Revenue Overview</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2, backgroundColor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Weekly Performance</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar name="This Week" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Last Week" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
