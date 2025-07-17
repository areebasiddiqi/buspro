import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  TextField, 
  MenuItem, 
  Button, 
  Tabs, 
  Tab, 
  Checkbox, 
  FormControlLabel, 
  CircularProgress, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody,
  Stack,
  Chip,
  Avatar,
  IconButton,
  alpha,
  useTheme,
  LinearProgress,
  Tooltip,
  useMediaQuery
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getTickets, getExpenses, getSales, getBuses, getTrips, getLuggage, getTripExpenses } from '../services/databaseService';
import dayjs from 'dayjs';
import { useSupabase } from '../contexts/SupabaseContext';

const Dashboard: React.FC = () => {
  const { subscribeToChanges } = useSupabase();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tab, setTab] = useState(0);
  const [busFilter, setBusFilter] = useState('All Buses');
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [refreshInterval, setRefreshInterval] = useState('30s');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState('');

  // State for all fetched data
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [allLuggage, setAllLuggage] = useState<any[]>([]);
  const [allTripExpenses, setAllTripExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const timeRanges = ['Last 24 Hours', 'Last 7 Days', 'Last 30 Days'];
  const refreshIntervals = ['10s', '30s', '1m', '5m'];

  // Helper to get date threshold
  const getDateThreshold = () => {
    const now = new Date();
    if (timeRange === 'Last 24 Hours') {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeRange === 'Last 7 Days') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'Last 30 Days') {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    return null;
  };

  const applyFilters = () => {
    let tickets = allTickets;
    let sales = allSales;
    let expenses = allExpenses;
    let buses = allBuses;
    let trips = allTrips;
    const dateThreshold = getDateThreshold();
    
    // Time range filter
    if (dateThreshold) {
      tickets = tickets.filter(t => new Date(t.created_at || t.date) >= dateThreshold);
      sales = sales.filter(s => new Date(s.created_at || s.date) >= dateThreshold);
      expenses = expenses.filter(e => new Date(e.created_at || e.date) >= dateThreshold);
      trips = trips.filter(trip => new Date(trip.start_time || trip.created_at) >= dateThreshold);
    }
    
    // Bus filter
    if (busFilter !== 'All Buses') {
      tickets = tickets.filter(t => t.bus_registration === busFilter);
      sales = sales.filter(s => s.bus_id === busFilter || s.bus_registration === busFilter);
      expenses = expenses.filter(e => e.bus_id === busFilter || e.bus_registration === busFilter);
      buses = buses.filter(b => b.registration === busFilter);
      trips = trips.filter(trip => trip.bus_registration === busFilter);
    }
    
    // Active only
    if (activeOnly) {
      const activeTrips = trips.filter(t => t.status === 'active');
      const liveBusRegs = new Set(activeTrips.map(t => t.bus_registration));
      buses = buses.filter(b => liveBusRegs.has(b.registration));
    }
    
    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      buses = buses.filter(b =>
        (b.registration && b.registration.toLowerCase().includes(q)) ||
        (b.model && b.model.toLowerCase().includes(q))
      );
    }
    
    return { tickets, sales, expenses, buses, trips };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tickets, sales, expenses, buses, trips, luggage, tripExpenses] = await Promise.all([
        getTickets().catch(() => []),
        getSales().catch(() => []),
        getExpenses().catch(() => []),
        getBuses().catch(() => []),
        getTrips().catch(() => []),
        getLuggage().catch(() => []),
        getTripExpenses().catch(() => [])
      ]);
      
      setAllTickets(tickets);
      setAllSales(sales);
      setAllExpenses(expenses);
      setAllBuses(buses);
      setAllTrips(trips);
      setAllLuggage(luggage);
      setAllTripExpenses(tripExpenses);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recompute metrics and live buses when filters change or data loads
  const { tickets, sales, expenses, buses, trips } = applyFilters();
  
  // Filter luggage and trip_expenses for filtered trips
  const tripIds = trips.map(t => t.id);
  const luggage = allLuggage.filter(l => l.trip_id && tripIds.includes(l.trip_id));
  const tripExpenses = allTripExpenses.filter(e => e.trip_id && tripIds.includes(e.trip_id));
  
  useEffect(() => {
    fetchDashboardData();
    
    // Subscribe to real-time changes
    const subscriptions = [
      subscribeToChanges('trips', fetchDashboardData),
      subscribeToChanges('buses', fetchDashboardData),
      subscribeToChanges('tickets', fetchDashboardData),
      subscribeToChanges('sales', fetchDashboardData),
      subscribeToChanges('expenses', fetchDashboardData),
      subscribeToChanges('luggage', fetchDashboardData),
      subscribeToChanges('trip_expenses', fetchDashboardData)
    ];
    
    // Auto-refresh timer
    let interval: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      let ms = 30000;
      if (refreshInterval.endsWith('s')) ms = parseInt(refreshInterval) * 1000;
      else if (refreshInterval.endsWith('m')) ms = parseInt(refreshInterval) * 60 * 1000;
      interval = setInterval(fetchDashboardData, ms);
    }
    
    return () => {
      subscriptions.forEach(sub => sub?.unsubscribe?.());
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  // Metrics
  const totalTickets = tickets.length;
  const totalTicketRevenue = tickets.reduce((sum, t) => {
    const price = typeof t.price === 'number' ? t.price : parseFloat(t.price) || 0;
    const discount = typeof t.discount === 'number' ? t.discount : parseFloat(t.discount) || 0;
    return sum + (price - discount);
  }, 0);
  const totalLuggageRevenue = luggage.reduce((sum, l) => sum + (typeof l.fee === 'number' ? l.fee : parseFloat(l.fee) || 0), 0);
  const totalRevenue = totalTicketRevenue + totalLuggageRevenue;
  const totalTripExpenses = allTripExpenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0), 0) + totalTripExpenses;
  const activeTrips = trips.filter(t => t.status === 'active');
  const liveBusRegs = new Set(activeTrips.map(t => t.bus_registration));
  const liveBuses = buses.filter(b => liveBusRegs.has(b.registration));
  const activeBuses = liveBuses.length;
  const totalLuggage = luggage.length;
  const totalPassengers = totalTickets;

  // For each live bus, compute stats
  const busToActiveTripIds: Record<string, string[]> = {};
  activeTrips.forEach(trip => {
    if (!busToActiveTripIds[trip.bus_registration]) busToActiveTripIds[trip.bus_registration] = [];
    busToActiveTripIds[trip.bus_registration].push(trip.id);
  });

  // Export helpers
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(liveBuses, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'live_buses.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!liveBuses.length) return;
    const headers = Object.keys(liveBuses[0]);
    const csvRows = [headers.join(',')];
    for (const row of liveBuses) {
      csvRows.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    }
    const csvStr = csvRows.join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'live_buses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ icon, title, value, subtitle, color = 'primary', loading: cardLoading = false }: any) => (
    <Card sx={{ 
      height: '100%',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-4px)' },
        boxShadow: theme.shadows[4]
      }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }} mb={2}>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette[color].main, 0.1), 
            color: `${color}.main`,
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 }
          }}>
            {icon}
          </Avatar>
          <Typography 
            variant="h6" 
            fontWeight={600}
            sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}
          >
            {title}
          </Typography>
        </Stack>
        
        {cardLoading ? (
          <LinearProgress sx={{ mb: 1 }} color={color} />
        ) : (
          <>
            <Typography 
              variant="h4" 
              fontWeight={700} 
              mb={1}
              sx={{ 
                fontSize: { xs: '1.25rem', sm: '2.125rem' },
                color: color !== 'primary' ? `${color}.main` : 'text.primary'
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {subtitle}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Dashboard Header */}
      <Card sx={{ 
        mb: 3, 
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            spacing={2} 
            mb={1}
          >
            <Avatar sx={{ 
              bgcolor: 'white', 
              color: 'primary.main', 
              width: { xs: 40, sm: 48 }, 
              height: { xs: 40, sm: 48 } 
            }}>
              <DirectionsBusIcon fontSize={isMobile ? 'medium' : 'large'} />
            </Avatar>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                gutterBottom
                sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
              >
                Fleet Dashboard
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Real-time monitoring of bus operations globally
              </Typography>
            </Box>
          </Stack>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1} 
            sx={{ mt: 2, flexWrap: 'wrap' }}
          >
            <Chip 
              icon={<RefreshIcon fontSize="small" />} 
              label={`Auto-refresh: ${refreshInterval}`} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                mb: { xs: 1, sm: 0 }
              }} 
            />
            <Chip 
              icon={<FilterListIcon fontSize="small" />} 
              label={timeRange} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                mb: { xs: 1, sm: 0 }
              }} 
            />
            {busFilter !== 'All Buses' && (
              <Chip 
                icon={<DirectionsBusIcon fontSize="small" />} 
                label={busFilter} 
                size="small" 
                onDelete={() => setBusFilter('All Buses')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(255,255,255,0.7)',
                  }
                }} 
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            justifyContent="space-between" 
            mb={2}
            spacing={2}
          >
            <Typography variant="h6" fontWeight={600}>Dashboard Controls</Typography>
            <Button 
              startIcon={<RefreshIcon />} 
              variant="outlined" 
              size="small"
              onClick={fetchDashboardData}
            >
              Refresh Data
            </Button>
          </Stack>
          
          <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search buses, drivers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: <FilterListIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Bus Filter"
                value={busFilter}
                onChange={e => setBusFilter(e.target.value)}
                size="small"
              >
                {['All Buses', ...allBuses.map(b => b.registration)].map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Time Range"
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                size="small"
              >
                {timeRanges.map((r: string) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Refresh Interval"
                value={refreshInterval}
                onChange={e => setRefreshInterval(e.target.value)}
                size="small"
              >
                {refreshIntervals.map((i: string) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="outlined" 
                  startIcon={<DownloadIcon />} 
                  onClick={handleExportJSON}
                  size="small"
                  fullWidth={isMobile}
                >
                  JSON
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<DownloadIcon />} 
                  onClick={handleExportCSV}
                  size="small"
                  fullWidth={isMobile}
                >
                  CSV
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={autoRefresh} 
                      onChange={e => setAutoRefresh(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Auto Refresh"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={activeOnly} 
                      onChange={e => setActiveOnly(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Active Buses Only"
                />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <StatCard
            icon={<ReceiptIcon />}
            title="Tickets"
            value={totalTickets.toLocaleString()}
            subtitle="Total tickets issued"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <StatCard
            icon={<AttachMoneyIcon />}
            title="Revenue"
            value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Total earnings"
            color="success"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <StatCard
            icon={<TrendingDownIcon />}
            title="Expenses"
            value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Total costs"
            color="error"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <StatCard
            icon={<LocalShippingIcon />}
            title="Luggage"
            value={totalLuggage.toLocaleString()}
            subtitle="Items transported"
            color="secondary"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <StatCard
            icon={<PeopleIcon />}
            title="Passengers"
            value={totalPassengers.toLocaleString()}
            subtitle="People transported"
            color="info"
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <StatCard
            icon={<DirectionsBusIcon />}
            title="Active Buses"
            value={activeBuses.toLocaleString()}
            subtitle="Buses in operation"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Tabs and Data Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Tabs 
            value={tab} 
            onChange={(_, v) => setTab(v)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{ 
              borderBottom: `1px solid ${theme.palette.divider}`,
              px: 2
            }}
          >
            <Tab label="Live Buses" />
            <Tab label="Analytics" />
            <Tab label="System Info" />
          </Tabs>
          
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {tab === 0 && (
              <Box sx={{ minHeight: 300 }}>
                {loading ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height={300}>
                    <CircularProgress />
                  </Box>
                ) : liveBuses.length === 0 ? (
                  <Box 
                    display="flex" 
                    flexDirection="column"
                    alignItems="center" 
                    justifyContent="center" 
                    height={300} 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center'
                    }}
                  >
                    <DirectionsBusIcon sx={{ fontSize: 64, mb: 2, color: alpha(theme.palette.primary.main, 0.3) }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>No active buses found</Typography>
                    <Typography variant="body2" color="text.secondary">
                      There are no buses active in the selected time period. Try changing your filters or time range.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      alignItems={{ xs: 'flex-start', sm: 'center' }} 
                      justifyContent="space-between" 
                      mb={2}
                      spacing={2}
                    >
                      <Typography variant="h6" fontWeight={600}>
                        Live Buses ({liveBuses.length})
                      </Typography>
                      <Chip 
                        label={`Last updated: ${dayjs().format('HH:mm:ss')}`}
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    </Stack>
                    
                    <TableContainer sx={{ 
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                      maxHeight: { xs: 300, sm: 400 },
                      overflowY: 'auto'
                    }}>
                      <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Registration</TableCell>
                            {!isMobile && <TableCell>Model</TableCell>}
                            <TableCell>Status</TableCell>
                            {!isMobile && <TableCell>Last Ticket</TableCell>}
                            <TableCell align="center">Pass.</TableCell>
                            {!isMobile && <TableCell align="center">Luggage</TableCell>}
                            {!isMobile && <TableCell align="right">Expenses</TableCell>}
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {liveBuses.map(bus => {
                            const tripIds = busToActiveTripIds[bus.registration] || [];
                            const passengers = tickets.filter(t => t.bus_registration === bus.registration && tripIds.includes(t.trip_id)).length;
                            const luggageCount = luggage.filter(l => tripIds.includes(l.trip_id)).length;
                            const expensesSum = tripExpenses.filter(e => tripIds.includes(e.trip_id)).reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0), 0);
                            const busTickets = tickets.filter(t => t.bus_registration === bus.registration);
                            const lastTicket = busTickets.reduce((latest, t) => {
                              const tDate = new Date(t.created_at || t.date);
                              return (!latest || tDate > latest) ? tDate : latest;
                            }, null as Date | null);
                            
                            return (
                              <TableRow key={bus.id} hover>
                                <TableCell>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <DirectionsBusIcon fontSize="small" color="primary" />
                                    <Typography variant="body2" fontWeight={500}>
                                      {bus.registration}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                {!isMobile && <TableCell>{bus.model}</TableCell>}
                                <TableCell>
                                  <Chip 
                                    label={bus.status} 
                                    size="small"
                                    color={bus.status === 'active' ? 'success' : 'default'}
                                    variant={bus.status === 'active' ? 'filled' : 'outlined'}
                                  />
                                </TableCell>
                                {!isMobile && (
                                  <TableCell>
                                    {lastTicket ? (
                                      <Tooltip title={dayjs(lastTicket).format('YYYY-MM-DD HH:mm:ss')}>
                                        <Typography variant="body2">
                                          {dayjs(lastTicket).format('HH:mm')}
                                        </Typography>
                                      </Tooltip>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        No tickets
                                      </Typography>
                                    )}
                                  </TableCell>
                                )}
                                <TableCell align="center">
                                  <Chip 
                                    label={passengers} 
                                    size="small"
                                    color={passengers > 0 ? 'info' : 'default'}
                                    variant={passengers > 0 ? 'filled' : 'outlined'}
                                  />
                                </TableCell>
                                {!isMobile && (
                                  <TableCell align="center">
                                    <Chip 
                                      label={luggageCount} 
                                      size="small"
                                      color={luggageCount > 0 ? 'secondary' : 'default'}
                                      variant={luggageCount > 0 ? 'filled' : 'outlined'}
                                    />
                                  </TableCell>
                                )}
                                {!isMobile && (
                                  <TableCell align="right">
                                    <Typography 
                                      variant="body2" 
                                      fontWeight={500}
                                      color={expensesSum > 0 ? 'error.main' : 'text.secondary'}
                                    >
                                      ${expensesSum.toFixed(2)}
                                    </Typography>
                                  </TableCell>
                                )}
                                <TableCell align="center">
                                  <IconButton size="small" color="primary">
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Box>
            )}
            
            {tab === 1 && (
              <Box 
                sx={{ 
                  minHeight: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 64, mb: 2, color: alpha(theme.palette.primary.main, 0.3) }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Analytics Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Advanced analytics and reporting features will be available in the next update.
                </Typography>
              </Box>
            )}
            
            {tab === 2 && (
              <Box 
                sx={{ 
                  minHeight: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <RefreshIcon sx={{ fontSize: 64, mb: 2, color: alpha(theme.palette.primary.main, 0.3) }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  System Information Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System status and health monitoring will be available in the next update.
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card sx={{ 
        p: 2, 
        background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`, 
        color: '#fff', 
        mb: 3,
        border: 'none'
      }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems="center"
          spacing={1}
        >
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Bus Pro Admin Dashboard • Real-time monitoring system
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            Data refreshes automatically • Last update: {dayjs().format('HH:mm:ss')}
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
};

export default Dashboard;