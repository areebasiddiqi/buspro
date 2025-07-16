import React, { useEffect, useState } from 'react';
import { Paper, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Box, TextField } from '@mui/material';
import { getTrips, getTickets, getLuggage, getTripExpenses } from '../services/databaseService';
import { printThermalReceipt } from '../lib/printer-service';
import dayjs from 'dayjs';

const AdminPanel: React.FC = () => {
  const [adminTab, setAdminTab] = useState<'trips' | 'assignments'>('trips');
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [adminSummary, setAdminSummary] = useState<{[tripId: string]: {tickets: any[], luggage: any[], expenses: any[]}}>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [printerConnected, setPrinterConnected] = useState(false);
  // Date range state
  const [startDate, setStartDate] = useState(dayjs().subtract(2, 'year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Fetch and filter trips by date range
  useEffect(() => {
    getTrips().then(async trips => {
      const filteredTrips = trips.filter((trip: any) => {
        const tripDate = (trip.start_time || '').split('T')[0];
        return tripDate >= startDate && tripDate <= endDate;
      });
      setAllTrips(filteredTrips);
      // For each trip, fetch tickets, luggage, expenses
      const summary: {[tripId: string]: {tickets: any[], luggage: any[], expenses: any[]}} = {};
      for (const trip of filteredTrips) {
        const tickets = (await getTickets()).filter((t: any) => t.trip_id === trip.id && t.date >= startDate && t.date <= endDate);
        const luggage = (await getLuggage()).filter((l: any) => l.trip_id === trip.id && l.date >= startDate && l.date <= endDate);
        const expenses = (await getTripExpenses()).filter((e: any) => e.trip_id === trip.id && e.date >= startDate && e.date <= endDate);
        summary[trip.id] = { tickets, luggage, expenses };
      }
      setAdminSummary(summary);
    });
  }, [startDate, endDate]);

  useEffect(() => {
    if (adminTab === 'assignments') {
      getTrips().then(trips => {
        // Group by date, then by driver/conductor
        const byDate: {[date: string]: any[]} = {};
        trips.forEach(trip => {
          const date = (trip.start_time || '').split('T')[0] || '-';
          if (date < startDate || date > endDate) return;
          if (!byDate[date]) byDate[date] = [];
          byDate[date].push(trip);
        });
        // Flatten to array: [{date, driver, conductor, bus, route}]
        const rows: any[] = [];
        Object.entries(byDate).forEach(([date, trips]) => {
          (trips as any[]).forEach(trip => {
            rows.push({
              date,
              driver: trip.driver || '-',
              conductor: trip.conductor || '-',
              bus: trip.bus_registration || '-',
              route: trip.route || '-',
            });
          });
        });
        setAssignments(rows);
      });
    }
  }, [adminTab, startDate, endDate]);

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
    const grossTickets = summaryData.tickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0);
    const grossLuggage = summaryData.luggage.reduce((sum, l) => sum + (parseFloat(l.fee) || 0), 0);
    const gross = grossTickets + grossLuggage;
    const totalExpenses = summaryData.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfit = gross - totalExpenses;
    summary += `Gross: $${gross.toFixed(2)}\n`;
    summary += `Expenses: $${totalExpenses.toFixed(2)}\n`;
    summary += `Net Profit: $${netProfit.toFixed(2)}\n`;
    summary += `-------------------------\n`;
    summary += `Tickets:\n`;
    summaryData.tickets.forEach((t, idx) => {
      summary += `${idx + 1}. ${t.passenger_name || '-'} | ${t.pickup_point || ''} -> ${t.destination || ''} | $${t.price} | ${t.payment_method || ''}\n`;
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
        price: gross.toFixed(2),
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
    <Paper sx={{ p: 4, maxWidth: 1400, mx: 'auto', mt: 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ flex: 1 }}>Admin Panel</Typography>
        <Button variant={adminTab === 'trips' ? 'contained' : 'outlined'} sx={{ mr: 1 }} onClick={() => setAdminTab('trips')}>Trip History</Button>
        <Button variant={adminTab === 'assignments' ? 'contained' : 'outlined'} onClick={() => setAdminTab('assignments')}>Driver/Conductor Assignments</Button>
      </Box>
      {/* Date Range Filter */}
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
      </Box>
      {adminTab === 'trips' && (
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bus</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tickets</TableCell>
                <TableCell>Gross</TableCell>
                <TableCell>Expenses</TableCell>
                <TableCell>Net Profit</TableCell>
                <TableCell>Print</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allTrips.length === 0 ? (
                <TableRow><TableCell colSpan={11} align="center">No trips found</TableCell></TableRow>
              ) : (
                allTrips.map((trip, idx) => {
                  const summary = adminSummary[trip.id] || { tickets: [], luggage: [], expenses: [] };
                  const grossTickets = summary.tickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0);
                  const grossLuggage = summary.luggage.reduce((sum, l) => sum + (parseFloat(l.fee) || 0), 0);
                  const gross = grossTickets + grossLuggage;
                  const totalExpenses = summary.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                  const netProfit = gross - totalExpenses;
                  return (
                    <TableRow key={trip.id}>
                      <TableCell>{trip.bus_registration || ''}</TableCell>
                      <TableCell>{trip.route || ''}</TableCell>
                      <TableCell>{trip.driver || ''}</TableCell>
                      <TableCell>{trip.start_time || ''}</TableCell>
                      <TableCell>{trip.end_time || '-'}</TableCell>
                      <TableCell>{trip.status || ''}</TableCell>
                      <TableCell>{summary.tickets.length}</TableCell>
                      <TableCell>${gross.toFixed(2)}</TableCell>
                      <TableCell>${totalExpenses.toFixed(2)}</TableCell>
                      <TableCell>${netProfit.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" onClick={() => handleAdminPrintSummary(trip)}>Print</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {adminTab === 'assignments' && (
        <TableContainer sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Conductor</TableCell>
                <TableCell>Bus</TableCell>
                <TableCell>Route</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No assignments found</TableCell></TableRow>
              ) : (
                assignments.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.driver}</TableCell>
                    <TableCell>{row.conductor}</TableCell>
                    <TableCell>{row.bus}</TableCell>
                    <TableCell>{row.route}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default AdminPanel; 