import React, { useEffect, useState } from 'react';
import { 
  Paper, 
  Typography, 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Button, 
  Box, 
  TextField,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Tabs,
  Tab
} from '@mui/material';
import { getTrips, getTickets, getLuggage, getTripExpenses } from '../services/databaseService';
import { printThermalReceipt } from '../lib/printer-service';
import dayjs from 'dayjs';
import { 
  History, 
  Assignment, 
  Receipt, 
  Print,
  DirectionsBus,
  Person,
  AttachMoney,
  DateRange
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [adminTab, setAdminTab] = useState(0);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [adminSummary, setAdminSummary] = useState<{[tripId: string]: {tickets: any[], luggage: any[], expenses: any[]}}>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [registerRows, setRegisterRows] = useState<any[]>([]);
  const [searchDriverConductor, setSearchDriverConductor] = useState('');
  
  // Date range state
  const [startDate, setStartDate] = useState(dayjs().subtract(2, 'year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Fetch and filter trips by date range
  useEffect(() => {
    const fetchData = async () => {
      try {
        const trips = await getTrips();
        const filteredTrips = trips.filter((trip: any) => {
          const tripDate = (trip.start_time || '').split('T')[0];
          return tripDate >= startDate && tripDate <= endDate;
        });
        setAllTrips(filteredTrips);
        
        // For each trip, fetch tickets, luggage, expenses
        const summary: {[tripId: string]: {tickets: any[], luggage: any[], expenses: any[]}} = {};
        const [tickets, luggage, expenses] = await Promise.all([
          getTickets(),
          getLuggage(),
          getTripExpenses()
        ]);
        
        for (const trip of filteredTrips) {
          const tripTickets = tickets.filter((t: any) => t.trip_id === trip.id && t.date >= startDate && t.date <= endDate);
          const tripLuggage = luggage.filter((l: any) => l.trip_id === trip.id && l.date >= startDate && l.date <= endDate);
          const tripExpenses = expenses.filter((e: any) => e.trip_id === trip.id && e.date >= startDate && e.date <= endDate);
          summary[trip.id] = { tickets: tripTickets, luggage: tripLuggage, expenses: tripExpenses };
        }
        setAdminSummary(summary);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };
    
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (adminTab === 1) { // Assignments tab
      const processAssignments = async () => {
        try {
          const trips = await getTrips();
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
        } catch (error) {
          console.error('Error processing assignments:', error);
        }
      };
      
      processAssignments();
    }
  }, [adminTab, startDate, endDate]);

  // Compute register report when trips/summary or date range changes
  useEffect(() => {
    if (adminTab === 2) { // Register tab
      // For each bus, for each day, aggregate data
      const rows: any[] = [];
      const busDayMap: {[key: string]: any} = {};
      
      allTrips.forEach(trip => {
        const date = (trip.start_time || '').split('T')[0] || '-';
        const bus = trip.bus_registration || '-';
        const key = `${bus}|${date}|${trip.driver || '-'}|${trip.conductor || '-'}`;
        
        if (!busDayMap[key]) {
          busDayMap[key] = {
            bus,
            date,
            driver: trip.driver || '-',
            conductor: trip.conductor || '-',
            tickets: 0,
            revenue: 0,
            expenses: 0,
          };
        }
        
        const summary = adminSummary[trip.id] || { tickets: [], luggage: [], expenses: [] };
        const grossTickets = summary.tickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0);
        const grossLuggage = summary.luggage.reduce((sum, l) => sum + (parseFloat(l.fee) || 0), 0);
        const gross = grossTickets + grossLuggage;
        const totalExpenses = summary.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        
        busDayMap[key].tickets += summary.tickets.length + summary.luggage.length;
        busDayMap[key].revenue += gross;
        busDayMap[key].expenses += totalExpenses;
      });
      
      Object.values(busDayMap).forEach((row: any) => {
        row.net = row.revenue - row.expenses;
        rows.push(row);
      });
      setRegisterRows(rows);
    }
  }, [adminTab, allTrips, adminSummary, startDate, endDate]);

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
    
    summary += `Gross: ${gross.toFixed(2)}\n`;
    summary += `Expenses: ${totalExpenses.toFixed(2)}\n`;
    summary += `Net Profit: ${netProfit.toFixed(2)}\n`;
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

  const StatCard = ({ icon, title, value, color = 'primary', subtitle }: any) => (
    <Card sx={{ 
      height: '100%',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-4px)' },
        boxShadow: theme.shadows[4]
      }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={1}>
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
        <Typography 
          variant="h4" 
          fontWeight={700} 
          sx={{ 
            fontSize: { xs: '1.25rem', sm: '2rem' },
            color: color !== 'primary' ? `${color}.main` : 'text.primary',
            mb: 0.5
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
      </CardContent>
    </Card>
  );

  // Calculate summary stats
  const totalTrips = allTrips.length;
  const totalTickets = Object.values(adminSummary).reduce((sum, s) => sum + s.tickets.length, 0);
  const totalRevenue = Object.values(adminSummary).reduce((sum, s) => {
    const ticketRevenue = s.tickets.reduce((tSum, t) => tSum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0);
    const luggageRevenue = s.luggage.reduce((lSum, l) => lSum + (parseFloat(l.fee) || 0), 0);
    return sum + ticketRevenue + luggageRevenue;
  }, 0);
  const totalExpenses = Object.values(adminSummary).reduce((sum, s) => 
    sum + s.expenses.reduce((eSum, e) => eSum + (parseFloat(e.amount) || 0), 0), 0
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Card sx={{ 
        mb: 3, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <History sx={{ fontSize: { xs: 32, sm: 40 } }} />
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
              >
                Admin Panel
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Comprehensive trip history, assignments, and financial reports
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<DirectionsBus />}
            title="Total Trips"
            value={totalTrips}
            subtitle="In date range"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Person />}
            title="Passengers"
            value={totalTickets.toLocaleString()}
            subtitle="Total transported"
            color="info"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<AttachMoney />}
            title="Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            subtitle="Total earnings"
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Receipt />}
            title="Net Profit"
            value={`$${(totalRevenue - totalExpenses).toFixed(2)}`}
            subtitle="After expenses"
            color={totalRevenue - totalExpenses >= 0 ? "success" : "error"}
          />
        </Grid>
      </Grid>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'stretch', sm: 'center' }} 
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <DateRange color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Date Range Filter
              </Typography>
            </Stack>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={adminTab} 
            onChange={(_, newValue) => setAdminTab(newValue)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{ px: { xs: 1, sm: 2 } }}
          >
            <Tab 
              label={isMobile ? "History" : "Trip History"} 
              icon={<History />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label={isMobile ? "Assign." : "Assignments"} 
              icon={<Assignment />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Register" 
              icon={<Receipt />} 
              iconPosition={isMobile ? "top" : "start"}
            />
          </Tabs>
        </Box>

        {/* Trip History Tab */}
        <TabPanel value={adminTab} index={0}>
          {adminTab === 0 && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Search Driver/Conductor"
                value={searchDriverConductor}
                onChange={e => setSearchDriverConductor(e.target.value)}
                size="small"
                sx={{ maxWidth: 300 }}
                placeholder="Type driver or conductor name..."
              />
            </Box>
          )}
          <TableContainer sx={{ maxHeight: { xs: 400, sm: 600 } }}>
            <Table size={isMobile ? "small" : "medium"} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Bus</TableCell>
                  {!isMobile && <TableCell>Route</TableCell>}
                  {!isTablet && <TableCell>Driver</TableCell>}
                  {!isMobile && <TableCell>Start</TableCell>}
                  {!isMobile && <TableCell>End</TableCell>}
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Tickets</TableCell>
                  <TableCell align="right">Gross</TableCell>
                  {!isMobile && <TableCell align="right">Expenses</TableCell>}
                  <TableCell align="right">Net</TableCell>
                  <TableCell align="center">Print</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(
                  allTrips.filter(trip => {
                    if (!searchDriverConductor.trim()) return true;
                    const q = searchDriverConductor.trim().toLowerCase();
                    return (
                      (trip.driver && trip.driver.toLowerCase().includes(q)) ||
                      (trip.conductor && trip.conductor.toLowerCase().includes(q))
                    );
                  })
                ).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 6 : 11} align="center">No trips found</TableCell>
                  </TableRow>
                ) : (
                  (
                    allTrips.filter(trip => {
                      if (!searchDriverConductor.trim()) return true;
                      const q = searchDriverConductor.trim().toLowerCase();
                      return (
                        (trip.driver && trip.driver.toLowerCase().includes(q)) ||
                        (trip.conductor && trip.conductor.toLowerCase().includes(q))
                      );
                    })
                  ).map((trip, idx) => {
                    const summary = adminSummary[trip.id] || { tickets: [], luggage: [], expenses: [] };
                    const grossTickets = summary.tickets.reduce((sum, t) => sum + (parseFloat(t.price) - (parseFloat(t.discount) || 0)), 0);
                    const grossLuggage = summary.luggage.reduce((sum, l) => sum + (parseFloat(l.fee) || 0), 0);
                    const gross = grossTickets + grossLuggage;
                    const totalExpenses = summary.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
                    const netProfit = gross - totalExpenses;
                    
                    return (
                      <TableRow key={trip.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <DirectionsBus fontSize="small" color="primary" />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {trip.bus_registration || ''}
                              </Typography>
                              {isMobile && (
                                <Typography variant="caption" color="text.secondary">
                                  {trip.route} • {trip.driver}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        {!isMobile && <TableCell>{trip.route || ''}</TableCell>}
                        {!isTablet && <TableCell>{trip.driver || ''}</TableCell>}
                        {!isMobile && <TableCell>{trip.start_time || ''}</TableCell>}
                        {!isMobile && <TableCell>{trip.end_time || '-'}</TableCell>}
                        <TableCell>
                          <Chip 
                            label={trip.status || ''} 
                            size="small"
                            color={trip.status === 'active' ? 'success' : trip.status === 'completed' ? 'info' : 'default'}
                            variant={trip.status === 'active' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={summary.tickets.length} 
                            size="small"
                            color={summary.tickets.length > 0 ? 'info' : 'default'}
                            variant={summary.tickets.length > 0 ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500} color="success.main">
                            ${gross.toFixed(2)}
                          </Typography>
                          {isMobile && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Exp: ${totalExpenses.toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500} color="error.main">
                              ${totalExpenses.toFixed(2)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            color={netProfit >= 0 ? 'success.main' : 'error.main'}
                          >
                            ${netProfit.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<Print />}
                            onClick={() => handleAdminPrintSummary(trip)}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            {isMobile ? '' : 'Print'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Assignments Tab */}
        <TabPanel value={adminTab} index={1}>
          <TableContainer sx={{ maxHeight: { xs: 400, sm: 600 } }}>
            <Table size={isMobile ? "small" : "medium"} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Driver</TableCell>
                  {!isMobile && <TableCell>Conductor</TableCell>}
                  <TableCell>Bus</TableCell>
                  {!isMobile && <TableCell>Route</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 3 : 5} align="center">No assignments found</TableCell>
                  </TableRow>
                ) : (
                  assignments.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Person fontSize="small" />
                          <Box>
                            <Typography variant="body2">{row.driver}</Typography>
                            {isMobile && (
                              <Typography variant="caption" color="text.secondary">
                                C: {row.conductor} • {row.route}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Person fontSize="small" />
                            <Typography variant="body2">{row.conductor}</Typography>
                          </Stack>
                        </TableCell>
                      )}
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DirectionsBus fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight={500}>{row.bus}</Typography>
                        </Stack>
                      </TableCell>
                      {!isMobile && <TableCell>{row.route}</TableCell>}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Register Tab */}
        <TabPanel value={adminTab} index={2}>
          <TableContainer sx={{ maxHeight: { xs: 400, sm: 600 } }}>
            <Table size={isMobile ? "small" : "medium"} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Bus</TableCell>
                  <TableCell>Date</TableCell>
                  {!isMobile && <TableCell>Driver</TableCell>}
                  {!isTablet && <TableCell>Conductor</TableCell>}
                  <TableCell align="center">Tickets</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Net Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registerRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 5 : 7} align="center">No data found</TableCell>
                  </TableRow>
                ) : (
                  registerRows.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DirectionsBus fontSize="small" color="primary" />
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{row.bus}</Typography>
                            {isMobile && (
                              <Typography variant="caption" color="text.secondary">
                                {row.driver} • {row.conductor}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.date}</TableCell>
                      {!isMobile && <TableCell>{row.driver}</TableCell>}
                      {!isTablet && <TableCell>{row.conductor}</TableCell>}
                      <TableCell align="center">
                        <Chip 
                          label={row.tickets} 
                          size="small"
                          color={row.tickets > 0 ? 'info' : 'default'}
                          variant={row.tickets > 0 ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500} color="success.main">
                          ${row.revenue.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={row.net >= 0 ? 'success.main' : 'error.main'}
                        >
                          ${row.net.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminPanel;