import React, { useEffect, useState } from 'react';
import { getTrips, getTickets, getTripExpenses } from '../services/databaseService';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography, Box, Paper, CircularProgress, Grid } from '@mui/material';
import { useSupabase } from '../contexts/SupabaseContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TripSummary {
  id: string;
  bus_registration: string;
  route: string;
  driver: string;
  conductor: string;
  start_time: string;
  tickets: number;
  revenue: number;
  expenses: number;
  profit: number;
}

const COLORS = ['#1976d2', '#00bcd4', '#ff9800', '#4caf50', '#e91e63', '#9c27b0'];

const ActiveReports: React.FC = () => {
  const { subscribeToChanges } = useSupabase();
  const [summaries, setSummaries] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummaries = async () => {
    setLoading(true);
    const trips = await getTrips();
    const tickets = await getTickets();
    const expenses = await getTripExpenses();
    const activeTrips = trips.filter((t: any) => t.status === 'active');
    const summaries: TripSummary[] = activeTrips.map(trip => {
      const tripTickets = tickets.filter((t: any) => t.trip_id === trip.id);
      const tripExpenses = expenses.filter((e: any) => e.trip_id === trip.id);
      const revenue = tripTickets.reduce((sum: number, t: any) => sum + (parseFloat(t.price) || 0), 0);
      const totalExpenses = tripExpenses.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
      return {
        id: trip.id,
        bus_registration: trip.bus_registration,
        route: trip.route,
        driver: trip.driver,
        conductor: trip.conductor,
        start_time: trip.start_time,
        tickets: tripTickets.length,
        revenue,
        expenses: totalExpenses,
        profit: revenue - totalExpenses,
      };
    });
    setSummaries(summaries);
    setLoading(false);
  };

  useEffect(() => {
    fetchSummaries();
    const tripsSub = subscribeToChanges('trips', fetchSummaries);
    const ticketsSub = subscribeToChanges('tickets', fetchSummaries);
    const expensesSub = subscribeToChanges('trip_expenses', fetchSummaries);
    return () => {
      tripsSub.unsubscribe();
      ticketsSub.unsubscribe();
      expensesSub.unsubscribe();
    };
  }, []);

  // Pie chart data for ticket distribution
  const pieData = summaries.map((s, i) => ({
    name: `${s.bus_registration} (${s.route})`,
    value: s.tickets,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: 18, md: 24 } }}>Active Trip Analytics</Typography>
      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={200}><CircularProgress /></Box>
      ) : summaries.length === 0 ? (
        <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center', mb: { xs: 1, sm: 2 } }}>No active trips found</Paper>
      ) : (
        <>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: { xs: 1, sm: 2, md: 3 }, height: { xs: 220, md: 340 }, mb: { xs: 1, sm: 2 } }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontSize: { xs: 14, md: 18 } }}>Revenue, Expenses & Profit per Trip</Typography>
                <ResponsiveContainer width="100%" height={180} minWidth={0} minHeight={0}>
                  <BarChart data={summaries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="bus_registration" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#1976d2" name="Revenue" />
                    <Bar dataKey="expenses" fill="#e91e63" name="Expenses" />
                    <Bar dataKey="profit" fill="#4caf50" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: { xs: 1, sm: 2, md: 3 }, height: { xs: 220, md: 340 }, mb: { xs: 1, sm: 2 } }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontSize: { xs: 14, md: 18 } }}>Ticket Distribution</Typography>
                <ResponsiveContainer width="100%" height={140} minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
          <TableContainer sx={{ mb: { xs: 1, sm: 2 } }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Bus</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Conductor</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>Tickets</TableCell>
                    <TableCell>Revenue</TableCell>
                    <TableCell>Expenses</TableCell>
                    <TableCell>Profit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaries.map(trip => (
                    <TableRow key={trip.id}>
                      <TableCell>{trip.bus_registration}</TableCell>
                      <TableCell>{trip.route}</TableCell>
                      <TableCell>{trip.driver}</TableCell>
                      <TableCell>{trip.conductor}</TableCell>
                      <TableCell>{trip.start_time ? new Date(trip.start_time).toLocaleString() : ''}</TableCell>
                      <TableCell>{trip.tickets}</TableCell>
                      <TableCell>${trip.revenue.toFixed(2)}</TableCell>
                      <TableCell>${trip.expenses.toFixed(2)}</TableCell>
                      <TableCell style={{ color: trip.profit >= 0 ? 'green' : 'red' }}>${trip.profit.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default ActiveReports; 