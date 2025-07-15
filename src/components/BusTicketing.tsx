interface Navigator {
  bluetooth?: any;
}
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import { createTicket, createSale, getTickets, getBuses, getLuggage, createLuggage, getTripExpenses, createTripExpense, getTrips, createTrip, getRoutes } from '../services/databaseService';
import type { Ticket as TicketType, Bus, Route } from '../types/database.types.ts';
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
import TicketPreview from './TicketPreview';
import dayjs from 'dayjs';
import { printThermalReceipt } from '../lib/printer-service';

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
  const [buses, setBuses] = useState<Bus[]>([]);
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
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [passengerName, setPassengerName] = useState('');

  // Mock metrics
  const totalTickets = tickets.length;
  const totalRevenue = tickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
  const totalExpenses = 0; // Replace with real expenses if available
  const profit = totalRevenue - totalExpenses;

  // Add a helper to end a trip in the database
  const endTripInDb = async (tripId: string) => {
    await supabase.from('trips').update({ status: 'ended', end_time: new Date().toISOString() }).eq('id', tripId);
  };

  useEffect(() => {
    getTickets().then(setTickets);
    getBuses().then(setBuses);
    getLuggage().then(setLuggageList);
    getTripExpenses().then(setExpensesList);
    getTrips().then(setPastTrips);
    getRoutes().then(setRoutes);
  }, [busRegistration]);

  // On bus/route selection, check for an active trip
  useEffect(() => {
    const checkActiveTrip = async () => {
      if (busRegistration && selectedRoute?.name) {
        const { data: trips, error } = await supabase
          .from('trips')
          .select('*')
          .eq('bus_registration', busRegistration)
          .eq('route', selectedRoute.name)
          .eq('status', 'active')
          .order('start_time', { ascending: false });
        if (trips && trips.length > 0) {
          setTripId(trips[0].id);
          setTripActive(true);
        } else {
          setTripId(null);
          setTripActive(false);
        }
      } else {
        setTripId(null);
        setTripActive(false);
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
    setTickets([]); // Reset tickets for new trip
    setLuggageList([]); // Reset luggage for new trip
    setExpensesList([]); // Reset expenses for new trip
  };
  const handleEndTrip = async () => {
    if (tripId) {
      await endTripInDb(tripId);
    }
    setTripActive(false);
    setShowTripSummary(true);
    // Do NOT setTripId(null) here
  };
  const handleLockToggle = () => setLocked(l => !l);

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
      };
      setTicketData(ticketForPrint);
      setShowTicket(true);
      setTickets(await getTickets().then(t => t.filter(ticket => ticket.trip_id === tripId)));
      setPassengerName(''); // Reset after submit
      setDiscount('0.00');
      // Print to Bluetooth printer if connected
      if (true) { // Always print for now, as printer connection is removed
        try {
          await printThermalReceipt(ticketForPrint);
        } catch (err) {
          alert('Failed to print ticket: ' + (err?.message || err));
        }
      }
    } catch (error) {
      alert('Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center' }}>
            <DirectionsBusIcon sx={{ mr: 1 }} /> Timboon Bus Mobile
        </Typography>
          <Typography variant="body2" color="text.secondary">Conductor & Driver Interface</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip label={tripActive ? 'Trip Active' : 'No Active Trip'} color={tripActive ? 'success' : 'default'} size="small" />
        </Box>
      </Paper>

      {/* Bus Details */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center' }}>
            <DirectionsBusIcon sx={{ mr: 1 }} /> Bus Details
          </Typography>
          <Button variant="outlined" startIcon={locked ? <LockIcon /> : <LockOpenIcon />} onClick={handleLockToggle}>
            {locked ? 'Locked' : 'Unlocked'}
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={buses.map(bus => bus.registration)}
              value={busRegistration}
              onInputChange={(_, newValue) => setBusRegistration(newValue)}
              renderInput={(params) => (
              <TextField
                  {...params}
                label="Bus Registration"
                fullWidth
                required
              disabled={locked}
              size="small"
              placeholder="e.g., ABC-123"
                />
              )}
            />
            </Grid>
            <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={routes.map(route => route.name)}
              value={selectedRoute ? selectedRoute.name : ''}
              onInputChange={(_, newValue) => {
                setSelectedRouteId('');
                setSelectedRoute(newValue ? { id: '', name: newValue, start_point: '', end_point: '', distance: 0, fare: 0 } : null);
              }}
              renderInput={(params) => (
              <TextField
                  {...params}
              label="Route"
                fullWidth
                  required
              disabled={locked}
              size="small"
                  placeholder="Enter or select route"
                />
              )}
            />
            </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Driver Name"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              fullWidth
              disabled={locked}
              size="small"
              placeholder="Driver's full name"
            />
          </Grid>
            <Grid item xs={12} md={6}>
              <TextField
              label="Conductor Name"
              value={conductorName}
              onChange={e => setConductorName(e.target.value)}
                fullWidth
              disabled={locked}
              size="small"
              placeholder="Conductor's full name"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Trip Control */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center' }}>
            <ReceiptIcon sx={{ mr: 1 }} /> Trip Control
          </Typography>
        </Box>
        {!tripActive ? (
          <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} fullWidth sx={{ py: 1.5, fontSize: 18 }} onClick={handleStartTrip}>
            Start Trip
          </Button>
        ) : (
          <>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', background: '#f5faff' }}>
                  <Typography variant="subtitle2" color="text.secondary">Tickets</Typography>
                  <Typography variant="h6" fontWeight={700}>{totalTickets}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', background: '#f5fff5' }}>
                  <Typography variant="subtitle2" color="text.secondary">Revenue</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">${totalRevenue.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', background: '#fff5f5' }}>
                  <Typography variant="subtitle2" color="text.secondary">Expenses</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">${totalExpenses.toFixed(2)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', background: '#f5fff5' }}>
                  <Typography variant="subtitle2" color="text.secondary">Profit</Typography>
                  <Typography variant="h6" fontWeight={700} color={profit >= 0 ? 'success.main' : 'error.main'}>${profit.toFixed(2)}</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Button variant="contained" color="error" startIcon={<StopIcon />} fullWidth sx={{ py: 1.5, fontSize: 18 }} onClick={handleEndTrip}>
              End Trip & Show Summary
            </Button>
          </>
        )}
      </Paper>

      {/* Tabs */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
          {tabLabels.map((label, idx) => <Tab key={label} label={label} />)}
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
                    required
                    size="small"
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
                  <TextField
                    select
                    label="Passenger"
                    value={luggageForm.passenger}
                    onChange={e => setLuggageForm(f => ({ ...f, passenger: e.target.value }))}
                    fullWidth
                    size="small"
                    required
                  >
                    {tickets.map((t, idx) => (
                      <MenuItem key={idx} value={t.passenger_name || t.passengerName || ''}>
                        {t.passenger_name || t.passengerName || `Passenger #${idx + 1}`}
                      </MenuItem>
                    ))}
                  </TextField>
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {luggageList.length === 0 ? (
                      <TableRow><TableCell colSpan={4} align="center">No luggage added</TableCell></TableRow>
                    ) : (
                      luggageList.map((item, idx) => (
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
      </Paper>

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
                  try {
                    await printThermalReceipt(ticketData);
                  } catch (err) {
                    alert('Failed to print ticket: ' + (err?.message || err));
                  }
                }}
              >
                Print Ticket
              </Button>
            </Box>
          </>
        )}
      </Dialog>

      <Dialog open={showTripSummary} onClose={() => {
        setShowTripSummary(false);
        setTripId(null); // Clear tripId only after closing the summary
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
            <Button variant="contained" color="primary" onClick={() => setShowTripSummary(false)}>Close</Button>
          </Box>
        </Paper>
      </Dialog>
    </Container>
  );
};

export default BusTicketing;