interface Navigator {
  bluetooth?: any;
}
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { createTicket, createSale, getTickets, getBuses, getLuggage, createLuggage, getTripExpenses, createTripExpense, getTrips, createTrip, getRoutes } from '../services/databaseService';
import { 
  Container, Paper, Typography, TextField, Button, Grid, MenuItem, Box, Dialog, Tabs, Tab, Switch, Divider, IconButton, Card, CardContent, CardHeader, Chip, TableContainer, Table, TableHead, TableRow, TableBody, TableCell, Autocomplete
} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import PrintIcon from '@mui/icons-material/Print';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TicketPreview, { LuggageTicketPreview } from './TicketPreview';
import dayjs from 'dayjs';
import { printThermalReceipt, connectThermalPrinter, printThermalLuggageReceipt } from '../lib/printer-service';

const tabLabels = ['Passenger', 'Luggage', 'Expenses', 'Manifest'];

const BusTicketing: React.FC = () => {
  const { supabase, subscribeToChanges } = useSupabase();
  const [busRegistration, setBusRegistration] = useState('');
  const [driverName, setDriverName] = useState('');
  const [conductorName, setConductorName] = useState('');
  const [locked, setLocked] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const [tab, setTab] = useState(0);
  const [quickMode, setQuickMode] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [fare, setFare] = useState('0.00');
  const [discount, setDiscount] = useState('0.00');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [luggageList, setLuggageList] = useState<any[]>([]);
  const [luggageForm, setLuggageForm] = useState({ description: '', weight: '', fee: '', passenger: '' });
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [expensesForm, setExpensesForm] = useState({ category: '', amount: '', description: '' });
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [pastTrips, setPastTrips] = useState<any[]>([]);
  const [summaryTickets, setSummaryTickets] = useState<any[]>([]);
  const [summaryLuggage, setSummaryLuggage] = useState<any[]>([]);
  const [summaryExpenses, setSummaryExpenses] = useState<any[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [printerConnected, setPrinterConnected] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [showLuggageTicket, setShowLuggageTicket] = useState(false);
  const [luggageTicketData, setLuggageTicketData] = useState<any>(null);
  const [manifestPassword, setManifestPassword] = useState('');
  const [manifestUnlocked, setManifestUnlocked] = useState(false);
  const [busPhoneNumber, setBusPhoneNumber] = useState('');
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [adminSummary, setAdminSummary] = useState<{[tripId: string]: {tickets: any[], luggage: any[], expenses: any[]}}>({});
  const [dashboardStats, setDashboardStats] = useState<any[]>([]);

  // Mock metrics
  const totalTickets = tickets.length;
  const totalRevenue = tickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  const totalExpenses = 0; // Replace with real expenses if available
  const profit = totalRevenue - totalExpenses;

  // Add a helper to end a trip in the database
  const endTripInDb = async (tripId: string) => {
    await supabase.from('trips').update({ status: 'ended', end_time: new Date().toISOString() }).eq('id', tripId);
  };

  // Helper functions for localStorage
  const saveTripContext = (bus: string, route: string, tripId: string | null) => {
    localStorage.setItem('busRegistration', bus);
    localStorage.setItem('selectedRouteName', route);
    localStorage.setItem('tripId', tripId || '');
  };
  const loadTripContext = () => ({
    bus: localStorage.getItem('busRegistration') || '',
    route: localStorage.getItem('selectedRouteName') || '',
    tripId: localStorage.getItem('tripId') || null,
  });
  const clearTripContext = () => {
    localStorage.removeItem('busRegistration');
    localStorage.removeItem('selectedRouteName');
    localStorage.removeItem('tripId');
  };

  // On mount, restore trip context if available and fetch buses/routes
  useEffect(() => {
    const { bus, route, tripId: storedTripId } = loadTripContext();
    if (bus) setBusRegistration(bus);
    if (route) setSelectedRoute({ id: '', name: route, start_point: '', end_point: '', distance: 0, fare: 0 });
    if (storedTripId) setTripId(storedTripId);
    getBuses().then(setBuses);
    getRoutes().then(setRoutes);
  }, []);

  // On bus/route selection, check for an active trip and fetch trip data
  useEffect(() => {
    const checkActiveTrip = async () => {
      if (busRegistration && selectedRoute?.name) {
        const { data: trips } = await supabase
          .from('trips')
          .select('*')
          .eq('bus_registration', busRegistration)
          .eq('route', selectedRoute.name)
          .eq('status', 'active')
          .order('start_time', { ascending: false });
        if (trips && trips.length > 0) {
          setTripId(trips[0].id);
          setTripActive(true);
          saveTripContext(busRegistration, selectedRoute.name, trips[0].id);
          // Fetch trip data for this trip only
          getTickets().then(t => setTickets(t.filter(ticket => ticket.trip_id === trips[0].id)));
          getLuggage().then(l => setLuggageList(l.filter(item => item.trip_id === trips[0].id)));
          getTripExpenses().then(e => setExpensesList(e.filter(item => item.trip_id === trips[0].id)));
        } else {
          setTripId(null);
          setTripActive(false);
          saveTripContext(busRegistration, selectedRoute.name, null);
          setTickets([]);
          setLuggageList([]);
          setExpensesList([]);
        }
      } else {
        setTripId(null);
        setTripActive(false);
        setTickets([]);
        setLuggageList([]);
        setExpensesList([]);
      }
    };
    checkActiveTrip();
  }, [busRegistration, selectedRoute]);

  useEffect(() => {
    if (selectedRouteId) {
      const route = routes.find(r => r.id === selectedRouteId) || null;
      setSelectedRoute(route);
    } else {
      setSelectedRoute(null);
    }
  }, [selectedRouteId, routes]);

  useEffect(() => {
    if (showTripSummary && tripId) {
      getTickets().then(t => setSummaryTickets(t.filter(ticket => ticket.trip_id === tripId)));
      getLuggage().then(l => setSummaryLuggage(l.filter(item => item.trip_id === tripId)));
      getTripExpenses().then(e => setSummaryExpenses(e.filter(item => item.trip_id === tripId)));
    }
  }, [showTripSummary, tripId]);

  // Fetch all trips and their summaries when admin panel opens
  useEffect(() => {
    if (adminPanelOpen) {
      getTrips().then(async trips => {
        setAllTrips(trips);
        // For each trip, fetch tickets, luggage, expenses
        const summary: {[tripId: string]: {tickets: any[], luggage: any[], expenses: any[]}} = {};
        for (const trip of trips) {
          const tickets = (await getTickets()).filter((t: any) => t.trip_id === trip.id);
          const luggage = (await getLuggage()).filter((l: any) => l.trip_id === trip.id);
          const expenses = (await getTripExpenses()).filter((e: any) => e.trip_id === trip.id);
          summary[trip.id] = { tickets, luggage, expenses };
        }
        setAdminSummary(summary);
      });
    }
  }, [adminPanelOpen]);

  // Fetch dashboard stats for all buses
  useEffect(() => {
    const fetchDashboardStats = async () => {
      const trips = await getTrips();
      const tickets = await getTickets();
      const luggage = await getLuggage();
      const expenses = await getTripExpenses();
      const stats: {[bus: string]: {gross: number, expenses: number, net: number}} = {};
      buses.forEach(bus => {
        const busTrips = trips.filter(t => t.bus_registration === bus.registration);
        const busTickets = tickets.filter(t => busTrips.some(trip => trip.id === t.trip_id));
        const busLuggage = luggage.filter(l => busTrips.some(trip => trip.id === l.trip_id));
        const busExpenses = expenses.filter(e => busTrips.some(trip => trip.id === e.trip_id));
        const grossTickets = busTickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0);
        const grossLuggage = busLuggage.reduce((sum, l) => sum + (parseFloat(l.fee) || 0), 0);
        const gross = grossTickets + grossLuggage;
        const totalExpenses = busExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const net = gross - totalExpenses;
        stats[bus.registration] = { gross, expenses: totalExpenses, net };
      });
      setDashboardStats(Object.entries(stats));
    };
    if (buses.length > 0) fetchDashboardStats();
  }, [buses]);

  const handleStartTrip = async () => {
    if (tripActive) return; // Prevent starting if already active
    const trip = await createTrip({
      bus_registration: busRegistration,
      driver: driverName,
      conductor: conductorName,
      route: selectedRoute?.name || '',
      start_time: new Date().toISOString(),
      status: 'active',
    });
    setTripId(trip.id);
    setTripActive(true);
    saveTripContext(busRegistration, selectedRoute?.name || '', trip.id);
    // Fetch trip data for this trip only
    getTickets().then(t => setTickets(t.filter(ticket => ticket.trip_id === trip.id)));
    getLuggage().then(l => setLuggageList(l.filter(item => item.trip_id === trip.id)));
    getTripExpenses().then(e => setExpensesList(e.filter(item => item.trip_id === trip.id)));
  };
  const handleEndTrip = async () => {
    if (tripId) {
      await endTripInDb(tripId);
    }
    setTripActive(false);
    setShowTripSummary(true);
    clearTripContext();
    // Do NOT setTripId(null) here
  };
  const handleLockToggle = () => setLocked(l => !l);

  // Add a function to connect the printer
  const handleConnectPrinter = async () => {
    try {
      const name = await connectThermalPrinter();
      setPrinterConnected(true);
      setPrinterName(name);
      alert('Printer connected: ' + (name || 'Unknown'));
    } catch (err: any) {
      setPrinterConnected(false);
      setPrinterName(null);
      alert('Failed to connect: ' + ((err && (err as any).message) || err));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      // Create ticket in Supabase
      const newTicket = await createTicket({
        bus_registration: busRegistration,
        pickup_point: origin,
        destination: destination,
        price: parseFloat(fare),
        discount: parseFloat(discount) || 0,
        payment_method: paymentMethod,
        ticket_number: 'BP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        trip_id: tripId || undefined,
        passenger_name: passengerName,
      });
      const now = new Date();
      const ticketForPrint = {
        ticketNumber: newTicket.ticket_number,
        busRegistration,
        pickupPoint: origin, // Ensure this is set for TicketPreview
        destination,
        price: fare,
        discount,
        paymentMethod,
        date: now.toISOString().split('T')[0], // Ensure this is set for TicketPreview
        passengerName,
        driverName,
        conductorName,
        busPhoneNumber,
      };
      setTicketData(ticketForPrint);
      setShowTicket(true);
      setTickets(await getTickets().then(t => t.filter(ticket => ticket.trip_id === tripId)));
      setPassengerName(''); // Reset after submit
      setDiscount('0.00');
      // Print to Bluetooth printer if connected
      if (printerConnected) {
        try {
          await printThermalReceipt(ticketForPrint);
        } catch (err: any) {
          alert('Failed to print ticket: ' + ((err && (err as any).message) || err));
        }
      } else {
        alert('Please connect a Bluetooth printer first.');
      }
    } catch (error) {
      alert('Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };

  // Add a function to print trip summary
  const handlePrintTripSummary = async () => {
    if (!printerConnected) {
      alert('Please connect a Bluetooth printer first.');
      return;
    }
    // Compose summary string
    let summary = '';
    summary += `Trip Summary\n`;
    summary += `-------------------------\n`;
    summary += `Tickets Sold: ${summaryTickets.length}\n`;
    const totalRevenue = summaryTickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0);
    const totalExpenses = summaryExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const profit = totalRevenue - totalExpenses;
    summary += `Revenue: $${totalRevenue.toFixed(2)}\n`;
    summary += `Expenses: $${totalExpenses.toFixed(2)}\n`;
    summary += `Profit: $${profit.toFixed(2)}\n`;
    summary += `-------------------------\n`;
    summary += `Tickets:\n`;
    summaryTickets.forEach((t, idx) => {
      summary += `${idx + 1}. ${t.passenger_name || t.passengerName || '-'} | ${t.pickup_point || t.pickupPoint} -> ${t.destination} | $${t.price} | ${t.payment_method || t.paymentMethod}\n`;
    });
    summary += `-------------------------\n`;
    summary += `Luggage:\n`;
    summaryLuggage.forEach((l, idx) => {
      summary += `${idx + 1}. ${l.description} | ${l.passenger} | $${l.fee}\n`;
    });
    summary += `-------------------------\n`;
    summary += `Expenses:\n`;
    summaryExpenses.forEach((e, idx) => {
      summary += `${idx + 1}. ${e.category}: $${e.amount} | ${e.description}\n`;
    });
    summary += `-------------------------\n`;
    // Estimated tickets on hand (assume starting tickets = 100, subtract sold)
    const startingTickets = 100;
    const ticketsOnHand = startingTickets - summaryTickets.length;
    summary += `Estimated Tickets on Hand: ${ticketsOnHand}\n`;
    summary += `-------------------------\n`;
    try {
      // Print using the printer service (as plain text)
      if ((window.navigator as any).bluetooth) {
        // If using browser Bluetooth printing, send as text
        await printThermalReceipt({
          ticketNumber: 'TRIP-SUMMARY',
          busRegistration: busRegistration || '',
          pickupPoint: 'Trip Summary',
          destination: '',
          price: totalRevenue.toFixed(2),
          discount: '0.00',
          paymentMethod: 'SUMMARY',
          date: new Date().toISOString().split('T')[0],
          passengerName: summary.replace(/\n/g, ' | '),
        });
      } else {
        alert(summary);
      }
    } catch (err) {
      alert('Failed to print trip summary.');
    }
  };

  const handleAdminPrintSummary = async (trip: any) => {
    if (!printerConnected) {
      alert('Please connect a Bluetooth printer first.');
      return;
    }
    const summaryData = adminSummary[trip.id] || { tickets: [], luggage: [], expenses: [] };
    let summary = '';
    summary += `Trip Summary\n`;
    summary += `-------------------------\n`;
    summary += `Bus: ${trip.bus_registration}\n`;
    summary += `Route: ${trip.route}\n`;
    summary += `Driver: ${trip.driver}\n`;
    summary += `Conductor: ${trip.conductor}\n`;
    summary += `Start: ${trip.start_time}\n`;
    summary += `End: ${trip.end_time || '-'}\n`;
    summary += `Status: ${trip.status}\n`;
    summary += `-------------------------\n`;
    summary += `Tickets Sold: ${summaryData.tickets.length}\n`;
    const totalRevenue = summaryData.tickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0);
    const totalExpenses = summaryData.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const profit = totalRevenue - totalExpenses;
    summary += `Revenue: $${totalRevenue.toFixed(2)}\n`;
    summary += `Expenses: $${totalExpenses.toFixed(2)}\n`;
    summary += `Profit: $${profit.toFixed(2)}\n`;
    summary += `-------------------------\n`;
    summary += `Tickets:\n`;
    summaryData.tickets.forEach((t, idx) => {
      summary += `${idx + 1}. ${t.passenger_name || t.passengerName || '-'} | ${t.pickup_point || t.pickupPoint} -> ${t.destination} | $${t.price} | ${t.payment_method || t.paymentMethod}\n`;
    });
    summary += `-------------------------\n`;
    summary += `Luggage:\n`;
    summaryData.luggage.forEach((l, idx) => {
      summary += `${idx + 1}. ${l.description} | ${l.passenger} | $${l.fee}\n`;
    });
    summary += `-------------------------\n`;
    summary += `Expenses:\n`;
    summaryData.expenses.forEach((e, idx) => {
      summary += `${idx + 1}. ${e.category}: $${e.amount} | ${e.description}\n`;
    });
    summary += `-------------------------\n`;
    try {
      await printThermalReceipt({
        ticketNumber: 'TRIP-SUMMARY',
        busRegistration: trip.bus_registration || '',
        pickupPoint: 'Trip Summary',
        destination: '',
        price: totalRevenue.toFixed(2),
        discount: '0.00',
        paymentMethod: 'SUMMARY',
        date: new Date().toISOString().split('T')[0],
        passengerName: summary.replace(/\n/g, ' | '),
      });
    } catch (err) {
      alert('Failed to print trip summary.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: { xs: 2, md: 3 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: 18, md: 22 } }}>
            <DirectionsBusIcon sx={{ mr: 1 }} /> Timboon Bus Mobile
        </Typography>
          <Typography variant="body2" color="text.secondary">Conductor & Driver Interface</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <Chip label={tripActive ? 'Trip Active' : 'No Active Trip'} color={tripActive ? 'success' : 'default'} size="small" />
          <Button variant={printerConnected ? 'contained' : 'outlined'} color={printerConnected ? 'success' : 'primary'} onClick={handleConnectPrinter} sx={{ minWidth: 160 }}>
            {printerConnected ? `Printer: ${printerName || 'Connected'}` : 'Connect Printer'}
          </Button>
        </Box>
      </Paper>

      {/* Bus Details */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: 16, md: 20 } }}>
            <DirectionsBusIcon sx={{ mr: 1 }} /> Bus Details
          </Typography>
          <Button variant="outlined" startIcon={locked ? <LockIcon /> : <LockOpenIcon />} onClick={handleLockToggle} sx={{ mt: { xs: 1, sm: 0 } }}>
            {locked ? 'Locked' : 'Unlocked'}
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={buses.map(bus => bus.registration)}
              value={busRegistration || ''}
              onInputChange={(_, newValue) => setBusRegistration(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Bus Registration" fullWidth required disabled={locked} size="small" placeholder="e.g., ABC-123" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={routes.map(route => route.name)}
              value={selectedRoute && selectedRoute.name ? selectedRoute.name : ''}
              onInputChange={(_, newValue) => {
                setSelectedRouteId('');
                setSelectedRoute(newValue ? { id: '', name: newValue, start_point: '', end_point: '', distance: 0, fare: 0 } : null);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Route" fullWidth required disabled={locked} size="small" placeholder="Enter or select route" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Driver Name" value={driverName} onChange={e => setDriverName(e.target.value)} fullWidth disabled={locked} size="small" placeholder="Driver's full name" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Conductor Name" value={conductorName} onChange={e => setConductorName(e.target.value)} fullWidth disabled={locked} size="small" placeholder="Conductor's full name" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Bus Phone Number" value={busPhoneNumber} onChange={e => setBusPhoneNumber(e.target.value)} fullWidth disabled={locked} size="small" placeholder="e.g., 0712 345 678" />
          </Grid>
        </Grid>
      </Paper>

      {/* Trip Control */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: { xs: 2, md: 3 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: 16, md: 20 } }}>
            <ReceiptIcon sx={{ mr: 1 }} /> Trip Control
          </Typography>
        </Box>
        {!tripActive ? (
          <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} fullWidth sx={{ py: 1.5, fontSize: { xs: 16, md: 18 } }} onClick={handleStartTrip}>
            Start Trip
          </Button>
        ) : (
          <>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', background: '#f5faff' }}>
                  <Typography variant="subtitle2" color="text.secondary">Tickets</Typography>
                  <Typography variant="h6" fontWeight={700}>{totalTickets}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', background: '#f5fff5' }}>
                  <Typography variant="subtitle2" color="text.secondary">Revenue</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">${totalRevenue.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', background: '#fff5f5' }}>
                  <Typography variant="subtitle2" color="text.secondary">Expenses</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">${totalExpenses.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', background: '#f5fff5' }}>
                  <Typography variant="subtitle2" color="text.secondary">Profit</Typography>
                  <Typography variant="h6" fontWeight={700} color={profit >= 0 ? 'success.main' : 'error.main'}>${profit.toFixed(2)}</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Button variant="contained" color="error" startIcon={<StopIcon />} fullWidth sx={{ py: 1.5, fontSize: { xs: 16, md: 18 } }} onClick={handleEndTrip}>
              End Trip & Show Summary
            </Button>
          </>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: { xs: 2, md: 3 } }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
          {tabLabels.map((label, idx) => <Tab key={label} label={label} sx={{ fontSize: { xs: 13, md: 16 } }} />)}
        </Tabs>
        <Divider sx={{ mb: 2 }} />
        {tab === 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Passenger Ticket</Typography>
            <FormControlLabel
              control={<Switch checked={quickMode} onChange={e => setQuickMode(e.target.checked)} />}
              label="Quick Mode"
              sx={{ mb: 2 }}
            />
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Passenger Name"
                    value={passengerName}
                    onChange={e => setPassengerName(e.target.value)}
                    fullWidth
                    required={!quickMode}
                    size="small"
                    disabled={quickMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Origin"
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                    label="Destination"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Fare Amount ($)"
                    type="number"
                    value={fare}
                    onChange={e => setFare(e.target.value)}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Discount ($)"
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                select
                label="Payment Method"
                value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    fullWidth
                required
                    size="small"
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Card">Card</MenuItem>
                    <MenuItem value="EcoCash">EcoCash</MenuItem>
                  </TextField>
            </Grid>
            <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ mt: 2 }} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Passenger Ticket'}
              </Button>
            </Grid>
          </Grid>
        </form>
          </Box>
        )}
        {tab === 1 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Luggage</Typography>
            <form onSubmit={async e => { e.preventDefault();
              await createLuggage({
                description: luggageForm.description,
                weight: parseFloat(luggageForm.weight),
                fee: parseFloat(luggageForm.fee),
                passenger: luggageForm.passenger,
                trip_id: tripId || undefined,
                ticket_id: undefined, // Optionally link to a ticket if available
              });
              setLuggageForm({ description: '', weight: '', fee: '', passenger: '' });
              setLuggageList(await getLuggage().then(l => l.filter(item => item.trip_id === tripId)));
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField label="Description" value={luggageForm.description} onChange={e => setLuggageForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" required />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField label="Weight (kg)" type="number" value={luggageForm.weight} onChange={e => setLuggageForm(f => ({ ...f, weight: e.target.value }))} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField label="Fee ($)" type="number" value={luggageForm.fee} onChange={e => setLuggageForm(f => ({ ...f, fee: e.target.value }))} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    freeSolo
                    options={tickets.map(t => t.passenger_name || t.passengerName || '').filter(Boolean)}
                    value={luggageForm.passenger || ''}
                    onInputChange={(_, newValue) => setLuggageForm(f => ({ ...f, passenger: newValue || '' }))}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Passenger or Parcel Name"
                        fullWidth
                        size="small"
                        required
                        placeholder="Enter passenger or parcel name"
                        value={luggageForm.passenger || ''}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button type="submit" variant="contained" color="primary" fullWidth>Add Luggage</Button>
                </Grid>
              </Grid>
            </form>
            <TableContainer sx={{ mt: 2 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Weight</TableCell>
                      <TableCell>Fee</TableCell>
                      <TableCell>Passenger</TableCell>
                      <TableCell>Print</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {luggageList.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center">No luggage added</TableCell></TableRow>
                    ) : (
                      luggageList.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.weight}</TableCell>
                          <TableCell>{item.fee}</TableCell>
                          <TableCell>{item.passenger}</TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined" onClick={() => {
                              setLuggageTicketData({
                                ...item,
                                busRegistration: busRegistration || '',
                                origin: origin || '',
                                destination: destination || '',
                                departureDate: new Date().toISOString().split('T')[0],
                                driverName: driverName || '',
                                conductorName: conductorName || '',
                                busPhoneNumber: busPhoneNumber || '',
                              });
                              setShowLuggageTicket(true);
                            }}>Print</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </TableContainer>
          </Box>
        )}
        {tab === 2 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Expenses</Typography>
            <form onSubmit={async e => { e.preventDefault();
              await createTripExpense({
                bus_registration: busRegistration,
                date: dayjs().format('YYYY-MM-DD'),
                category: expensesForm.category,
                amount: parseFloat(expensesForm.amount),
                description: expensesForm.description,
                trip_id: tripId || undefined,
              });
              setExpensesForm({ category: '', amount: '', description: '' });
              setExpensesList(await getTripExpenses().then(e => e.filter(item => item.trip_id === tripId)));
            }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField label="Category" value={expensesForm.category} onChange={e => setExpensesForm(f => ({ ...f, category: e.target.value }))} fullWidth size="small" required />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField label="Amount ($)" type="number" value={expensesForm.amount} onChange={e => setExpensesForm(f => ({ ...f, amount: e.target.value }))} fullWidth size="small" required />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField label="Description" value={expensesForm.description} onChange={e => setExpensesForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button type="submit" variant="contained" color="primary" fullWidth>Add Expense</Button>
                </Grid>
              </Grid>
            </form>
            <TableContainer sx={{ mt: 2 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expensesList.length === 0 ? (
                      <TableRow><TableCell colSpan={3} align="center">No expenses added</TableCell></TableRow>
                    ) : (
                      expensesList.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.amount}</TableCell>
                          <TableCell>{item.description}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </TableContainer>
          </Box>
        )}
        {tab === 3 && (
          <Box>
            {!manifestUnlocked ? (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Enter Password to View Manifest</Typography>
                <TextField
                  type="password"
                  label="Password"
                  value={manifestPassword || ''}
                  onChange={e => setManifestPassword(e.target.value || '')}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    if (manifestPassword === 'admin123') { // Change password as needed
                      setManifestUnlocked(true);
                    } else {
                      alert('Incorrect password');
                    }
                  }}
                >
                  Unlock
                </Button>
              </Box>
            ) : (
              // ... existing manifest content ...
              <Box>
                {/* Manifest Table as before */}
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Manifest</Typography>
                <TableContainer>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ticket #</TableCell>
                          <TableCell>Origin</TableCell>
                          <TableCell>Destination</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Discount</TableCell>
                          <TableCell>Payment</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tickets.length === 0 ? (
                          <TableRow><TableCell colSpan={7} align="center">No tickets sold</TableCell></TableRow>
                        ) : (
                          tickets.map((t, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{t.ticket_number || t.ticketNumber}</TableCell>
                              <TableCell>{t.pickup_point || t.pickupPoint}</TableCell>
                              <TableCell>{t.destination}</TableCell>
                              <TableCell>{t.price}</TableCell>
                              <TableCell>{t.discount || '0.00'}</TableCell>
                              <TableCell>{t.payment_method || t.paymentMethod}</TableCell>
                              <TableCell>{t.date}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Add dashboard summary above trip control */}
      {/* Remove dashboard summary (dashboardStats and related useEffect and Paper/Table) */}

      <Dialog open={showTicket} onClose={() => setShowTicket(false)} maxWidth="sm" fullWidth>
        {ticketData && (
          <>
            <TicketPreview ticketData={ticketData} />
            <Box mt={2} textAlign="right">
              <Button
                variant="contained"
                color="primary"
                startIcon={<PrintIcon />}
                onClick={async () => {
                  if (!printerConnected) {
                    alert('Please connect a Bluetooth printer first.');
                    return;
                  }
                  try {
                    await printThermalReceipt(ticketData);
                  } catch (err: any) {
                    alert('Failed to print ticket: ' + ((err && (err as any).message) || err));
                  }
                }}
              >
                Print Ticket
              </Button>
            </Box>
          </>
        )}
      </Dialog>

      <Dialog open={showLuggageTicket} onClose={() => setShowLuggageTicket(false)} maxWidth="sm" fullWidth>
        {luggageTicketData && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>Luggage Ticket Preview</Typography>
            <LuggageTicketPreview luggageData={{
              ticketNumber: 'LUG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              description: luggageTicketData.description || '',
              weight: luggageTicketData.weight || '',
              fee: luggageTicketData.fee || '',
              passenger: luggageTicketData.passenger || '',
              busRegistration: luggageTicketData.busRegistration || '',
              origin: luggageTicketData.origin || '',
              destination: luggageTicketData.destination || '',
              date: luggageTicketData.departureDate || '',
              driverName: luggageTicketData.driverName || '',
              conductorName: luggageTicketData.conductorName || '',
              busPhoneNumber: luggageTicketData.busPhoneNumber || '',
            }} />
            <Box textAlign="right" mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  if (!printerConnected) {
                    alert('Please connect a Bluetooth printer first.');
                    return;
                  }
                  try {
                    await printThermalLuggageReceipt({
                      ticketNumber: 'LUG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                      busRegistration: luggageTicketData.busRegistration || '',
                      origin: luggageTicketData.origin || '',
                      destination: luggageTicketData.destination || '',
                      departureDate: luggageTicketData.departureDate || '',
                      issueDate: new Date().toISOString().split('T')[0],
                      issueTime: new Date().toLocaleTimeString(),
                      driverName: luggageTicketData.driverName || '',
                      conductorName: luggageTicketData.conductorName || '',
                      // Only pass busPhoneNumber if allowed by type
                      ...(typeof luggageTicketData.busPhoneNumber === 'string' ? { busPhoneNumber: luggageTicketData.busPhoneNumber } : {}),
                      luggageDescription: luggageTicketData.description || '',
                      luggageOwnerName: luggageTicketData.passenger || '',
                      price: parseFloat(luggageTicketData.fee || '0'),
                      discount: 0,
                      totalPrice: parseFloat(luggageTicketData.fee || '0'),
                      paymentMethod: 'Cash',
                      issueLocation: 'Onboard',
                      agentName: driverName,
                    });
                  } catch (err) {
                    alert('Failed to print luggage ticket.');
                  }
                }}
              >
                Print Luggage Ticket
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      <Dialog open={showTripSummary} onClose={() => {
        setShowTripSummary(false);
        setTripId(null); // Clear tripId only after closing the summary
        setTickets([]);
        setLuggageList([]);
        setExpensesList([]);
      }} maxWidth="sm" fullWidth>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: 18, md: 24 } }}>Trip Summary</Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', background: '#f5faff' }}>
                <Typography variant="subtitle2" color="text.secondary">Tickets</Typography>
                <Typography variant="h6" fontWeight={700}>{summaryTickets.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', background: '#f5fff5' }}>
                <Typography variant="subtitle2" color="text.secondary">Revenue</Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">${summaryTickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0).toFixed(2)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', background: '#fff5f5' }}>
                <Typography variant="subtitle2" color="text.secondary">Expenses</Typography>
                <Typography variant="h6" fontWeight={700} color="error.main">${summaryExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0).toFixed(2)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', background: '#f5fff5' }}>
                <Typography variant="subtitle2" color="text.secondary">Profit</Typography>
                <Typography variant="h6" fontWeight={700} color={summaryTickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0) - summaryExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) >= 0 ? 'success.main' : 'error.main'}>${(summaryTickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0) - summaryExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)).toFixed(2)}</Typography>
              </Paper>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: 18, md: 24 } }}>Tickets</Typography>
          <TableContainer sx={{ mb: 2 }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ticket #</TableCell>
                    <TableCell>Origin</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Net</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryTickets.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center">No tickets sold</TableCell></TableRow>
                  ) : (
                    summaryTickets.map((t, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{t.ticket_number || t.ticketNumber}</TableCell>
                        <TableCell>{t.pickup_point || t.pickupPoint}</TableCell>
                        <TableCell>{t.destination}</TableCell>
                        <TableCell>{t.price}</TableCell>
                        <TableCell>{t.discount || '0.00'}</TableCell>
                        <TableCell>{(parseFloat(t.price) - (parseFloat(t.discount) || 0)).toFixed(2)}</TableCell>
                        <TableCell>{t.payment_method || t.paymentMethod}</TableCell>
                        <TableCell>{t.date}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </TableContainer>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: 18, md: 24 } }}>Luggage</Typography>
          <TableContainer sx={{ mb: 2 }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Weight</TableCell>
                    <TableCell>Fee</TableCell>
                    <TableCell>Passenger</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryLuggage.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center">No luggage added</TableCell></TableRow>
                  ) : (
                    summaryLuggage.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.weight}</TableCell>
                        <TableCell>{item.fee}</TableCell>
                        <TableCell>{item.passenger}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </TableContainer>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: 18, md: 24 } }}>Expenses</Typography>
          <TableContainer>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={3} align="center">No expenses added</TableCell></TableRow>
                  ) : (
                    summaryExpenses.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.amount}</TableCell>
                        <TableCell>{item.description}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </TableContainer>
          <Box mt={2} textAlign="right">
            <Button variant="contained" color="primary" onClick={handlePrintTripSummary} sx={{ mr: 2 }}>Print Trip Summary</Button>
            <Button variant="contained" color="primary" onClick={() => setShowTripSummary(false)}>Close</Button>
          </Box>
        </Paper>
      </Dialog>

      {/* Remove Admin Panel dialog and all related state/logic */}
    </Container>
  );
};

export default BusTicketing;