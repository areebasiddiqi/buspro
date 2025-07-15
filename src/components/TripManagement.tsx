import React, { useEffect, useState } from 'react';
import { getTrips, getTickets, getTripExpenses } from '../services/databaseService';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography, Box, Paper, CircularProgress } from '@mui/material';
import type { Trip } from '../types/database.types.ts';

interface TripSummary {
  id: string;
  bus_registration: string;
  route: string;
  driver: string;
  conductor: string;
  start_time: string;
  status: string;
  tickets: number;
  revenue: number;
  expenses: number;
  profit: number;
}

const TripManagement: React.FC = () => {
  const [summaries, setSummaries] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      setLoading(true);
      const trips = await getTrips();
      const tickets = await getTickets();
      const expenses = await getTripExpenses();
      const summaries: TripSummary[] = trips.map(trip => {
        const tripTickets = tickets.filter(t => t.trip_id === trip.id);
        const tripExpenses = expenses.filter(e => e.trip_id === trip.id);
        const revenue = tripTickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
        const totalExpenses = tripExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        return {
          id: trip.id,
          bus_registration: trip.bus_registration,
          route: trip.route,
          driver: trip.driver,
          conductor: trip.conductor,
          start_time: trip.start_time,
          status: trip.status,
          tickets: tripTickets.length,
          revenue,
          expenses: totalExpenses,
          profit: revenue - totalExpenses,
        };
      });
      setSummaries(summaries);
      setLoading(false);
    };
    fetchSummaries();
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Trip Management</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bus</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Conductor</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tickets</TableCell>
              <TableCell>Revenue</TableCell>
              <TableCell>Expenses</TableCell>
              <TableCell>Profit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : summaries.length === 0 ? (
              <TableRow><TableCell colSpan={10} align="center">No trips found</TableCell></TableRow>
            ) : (
              summaries.map(trip => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.bus_registration}</TableCell>
                  <TableCell>{trip.route}</TableCell>
                  <TableCell>{trip.driver}</TableCell>
                  <TableCell>{trip.conductor}</TableCell>
                  <TableCell>{trip.start_time ? new Date(trip.start_time).toLocaleString() : ''}</TableCell>
                  <TableCell>{trip.status}</TableCell>
                  <TableCell>{trip.tickets}</TableCell>
                  <TableCell>${trip.revenue.toFixed(2)}</TableCell>
                  <TableCell>${trip.expenses.toFixed(2)}</TableCell>
                  <TableCell style={{ color: trip.profit >= 0 ? 'green' : 'red' }}>${trip.profit.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TripManagement; 