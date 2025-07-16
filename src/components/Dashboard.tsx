import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, TextField, MenuItem, Button, Tabs, Tab, Checkbox, FormControlLabel, Divider, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import { getTickets, getExpenses, getSales, getBuses, getTrips, getLuggage, getTripExpenses } from '../services/databaseService';
import dayjs from 'dayjs';
import type { } from '../types/database.types.ts';
import { useSupabase } from '../contexts/SupabaseContext';


const Dashboard: React.FC = () => {
  const { subscribeToChanges } = useSupabase();
  const [tab, setTab] = useState(0);
  const [busFilter, setBusFilter] = useState('All Buses');
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [refreshInterval, setRefreshInterval] = useState('30s');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState('');

  // Add state for all fetched data
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);
  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [allLuggage, setAllLuggage] = useState<any[]>([]);
  const [allTripExpenses, setAllTripExpenses] = useState<any[]>([]);
  // Restore loading state
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
      trips = trips.filter(trip => new Date(trip.start_time) >= dateThreshold);
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

  const fetchDashboardData = () => {
    setLoading(true);
    Promise.all([
      getTickets(),
      getSales(),
      getExpenses(),
      getBuses(),
      getTrips(),
      getLuggage(),
      getTripExpenses()
    ]).then(([tickets, sales, expenses, buses, trips, luggage, tripExpenses]) => {
      setAllTickets(tickets);
      setAllSales(sales);
      setAllExpenses(expenses);
      setAllBuses(buses);
      setAllTrips(trips);
      setAllLuggage(luggage);
      setAllTripExpenses(tripExpenses);
      setLoading(false);
    });
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
    const tripsSub = subscribeToChanges('trips', fetchDashboardData);
    const busesSub = subscribeToChanges('buses', fetchDashboardData);
    const ticketsSub = subscribeToChanges('tickets', fetchDashboardData);
    const salesSub = subscribeToChanges('sales', fetchDashboardData);
    const expensesSub = subscribeToChanges('expenses', fetchDashboardData);
    const luggageSub = subscribeToChanges('luggage', fetchDashboardData);
    const tripExpensesSub = subscribeToChanges('trip_expenses', fetchDashboardData);
    // Auto-refresh timer
    let interval: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      let ms = 30000;
      if (refreshInterval.endsWith('s')) ms = parseInt(refreshInterval) * 1000;
      else if (refreshInterval.endsWith('m')) ms = parseInt(refreshInterval) * 60 * 1000;
      interval = setInterval(fetchDashboardData, ms);
    }
    return () => {
      tripsSub.unsubscribe();
      busesSub.unsubscribe();
      ticketsSub.unsubscribe();
      salesSub.unsubscribe();
      expensesSub.unsubscribe();
      luggageSub.unsubscribe();
      tripExpensesSub.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);
  // Recompute on filter change
  useEffect(() => {
    // No need to refetch, just recompute
    // (applyFilters is called on every render)
  }, [busFilter, timeRange, activeOnly, search]);

  // Metrics
  const totalTickets = tickets.length;
  const totalTicketRevenue = tickets.reduce((sum, t) => {
    const price = typeof t.price === 'number' ? t.price : parseFloat(t.price);
    const discount = typeof t.discount === 'number' ? t.discount : parseFloat(t.discount) || 0;
    return sum + (price - discount);
  }, 0);
  const totalLuggageRevenue = luggage.reduce((sum, l) => sum + (typeof l.fee === 'number' ? l.fee : parseFloat(l.fee) || 0), 0);
  const totalRevenue = totalTicketRevenue + totalLuggageRevenue;
  const totalTripExpenses = allTripExpenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount)), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount)), 0) + totalTripExpenses;
  const activeTrips = trips.filter(t => t.status === 'active');
  const liveBusRegs = new Set(activeTrips.map(t => t.bus_registration));
  const liveBuses = buses.filter(b => liveBusRegs.has(b.registration));
  const activeBuses = liveBuses.length;

  // Add luggage and passengers metrics
  const totalLuggage = tickets.reduce((sum, t) => sum + (t.luggage_count || 0), 0); // If luggage_count is not available, use luggageList.length if you fetch luggage
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

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          <TrendingUpIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} /> Live Bus Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Real-time monitoring of bus operations globally
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>Dashboard Controls</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search buses, drivers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Manual Refresh"
              value={refreshInterval}
              onChange={e => setRefreshInterval(e.target.value)}
              size="small"
              InputProps={{ endAdornment: <RefreshIcon fontSize="small" /> }}
            >
              {refreshIntervals.map((i: string) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ mr: 1 }} onClick={handleExportJSON}>Export JSON</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}>Export CSV</Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={<Checkbox checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />}
              label="Auto Refresh (Fallback)"
            />
            <FormControlLabel
              control={<Checkbox checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />}
              label="Active Only"
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReceiptIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Tickets</Typography>
              <Typography variant="h6" fontWeight={700}>{loading ? <CircularProgress size={20} /> : totalTickets}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUpIcon color="success" fontSize="large" />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Revenue</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">{loading ? <CircularProgress size={20} /> : `$${totalRevenue?.toFixed(2)}`}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingDownIcon color="error" fontSize="large" />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Expenses</Typography>
              <Typography variant="h6" fontWeight={700} color="error.main">{loading ? <CircularProgress size={20} /> : `$${totalExpenses?.toFixed(2)}`}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <WorkIcon color="secondary" fontSize="large" />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Luggage</Typography>
              <Typography variant="h6" fontWeight={700}>{loading ? <CircularProgress size={20} /> : totalLuggage}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon color="info" fontSize="large" />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Passengers</Typography>
              <Typography variant="h6" fontWeight={700}>{loading ? <CircularProgress size={20} /> : totalPassengers}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={2}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <DirectionsBusIcon color="secondary" fontSize="large" />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Active Buses</Typography>
              <Typography variant="h6" fontWeight={700}>{activeBuses}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Live Buses" />
          <Tab label="Analytics" />
          <Tab label="System Info" />
        </Tabs>
        <Divider sx={{ mb: 2 }} />
        {tab === 0 && (
          <Box sx={{ minHeight: 180 }}>
            {loading ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={180}>
                <CircularProgress />
              </Box>
            ) : liveBuses.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={180} color="text.secondary">
                <DirectionsBusIcon sx={{ fontSize: 48, mb: 1 }} />
                <Box ml={2}>No live buses in the last 24 hours</Box>
              </Box>
            ) : (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Live Buses (last 24h)</Typography>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Registration</TableCell>
                        <TableCell>Model</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Ticket Time</TableCell>
                        <TableCell>Passengers</TableCell>
                        <TableCell>Luggage</TableCell>
                        <TableCell>Expenses</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {liveBuses.map(bus => {
                        const tripIds = busToActiveTripIds[bus.registration] || [];
                        const passengers = tickets.filter(t => t.bus_registration === bus.registration && tripIds.includes(t.trip_id)).length;
                        const luggageCount = luggage.filter(l => tripIds.includes(l.trip_id)).length;
                        const expensesSum = tripExpenses.filter(e => tripIds.includes(e.trip_id)).reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount)), 0);
                        // Find last ticket time for this bus
                        const busTickets = tickets.filter(t => t.bus_registration === bus.registration);
                        const lastTicket = busTickets.reduce((latest, t) => {
                          const tDate = new Date(t.created_at || t.date);
                          return (!latest || tDate > latest) ? tDate : latest;
                        }, null as Date | null);
                        return (
                          <TableRow key={bus.id}>
                            <TableCell>{bus.registration}</TableCell>
                            <TableCell>{bus.model}</TableCell>
                            <TableCell>{bus.status}</TableCell>
                            <TableCell>{lastTicket ? dayjs(lastTicket).format('YYYY-MM-DD HH:mm') : ''}</TableCell>
                            <TableCell>{passengers}</TableCell>
                            <TableCell>{luggageCount}</TableCell>
                            <TableCell>${expensesSum.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Box>
        )}
        {tab === 1 && (
          <Box sx={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            Analytics coming soon...
          </Box>
        )}
        {tab === 2 && (
          <Box sx={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            System info and status coming soon...
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2, background: '#111827', color: '#fff', mt: 4, borderRadius: 2 }} elevation={0}>
        <Typography variant="body2" align="center">
          Bus Ticketing Admin Dashboard - Real-time monitoring system<br />
          Receiving data from mobile apps globally • Auto-refresh every 30 seconds
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard; 