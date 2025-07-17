import React, { useEffect, useState } from 'react';
import { getTrips, getTickets, getTripExpenses } from '../services/databaseService';
import { 
  TableContainer, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress, 
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { useSupabase } from '../contexts/SupabaseContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  DirectionsBus, 
  TrendingUp, 
  Assessment, 
  Person,
  AttachMoney,
  AccessTime
} from '@mui/icons-material';

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

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ActiveReports: React.FC = () => {
  const { subscribeToChanges } = useSupabase();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [summaries, setSummaries] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const [trips, tickets, expenses] = await Promise.all([
        getTrips(),
        getTickets(),
        getTripExpenses()
      ]);
      
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
    } catch (error) {
      console.error('Error fetching active trip summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
    const subscriptions = [
      subscribeToChanges('trips', fetchSummaries),
      subscribeToChanges('tickets', fetchSummaries),
      subscribeToChanges('trip_expenses', fetchSummaries)
    ];
    return () => {
      subscriptions.forEach(sub => sub?.unsubscribe?.());
    };
  }, []);

  // Pie chart data for ticket distribution
  const pieData = summaries.map((s, i) => ({
    name: `${s.bus_registration}`,
    fullName: `${s.bus_registration} (${s.route})`,
    value: s.tickets,
    color: COLORS[i % COLORS.length],
  }));

  // Calculate totals
  const totals = summaries.reduce((acc, trip) => ({
    trips: acc.trips + 1,
    tickets: acc.tickets + trip.tickets,
    revenue: acc.revenue + trip.revenue,
    expenses: acc.expenses + trip.expenses,
    profit: acc.profit + trip.profit
  }), { trips: 0, tickets: 0, revenue: 0, expenses: 0, profit: 0 });

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
            <Assessment sx={{ fontSize: { xs: 32, sm: 40 } }} />
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
              >
                Active Trip Analytics
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Real-time insights and performance metrics for active trips
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={400}>
          <CircularProgress size={40} />
        </Box>
      ) : summaries.length === 0 ? (
        <Card sx={{ 
          p: 4, 
          textAlign: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2
        }}>
          <DirectionsBus sx={{ fontSize: 64, mb: 2, color: alpha(theme.palette.primary.main, 0.3) }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No active trips found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start some trips to see analytics and reports here
          </Typography>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
            <Grid item xs={6} sm={3}>
              <StatCard
                icon={<DirectionsBus />}
                title="Active Trips"
                value={totals.trips}
                subtitle="Currently running"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard
                icon={<Person />}
                title="Passengers"
                value={totals.tickets.toLocaleString()}
                subtitle="Total on board"
                color="info"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard
                icon={<AttachMoney />}
                title="Revenue"
                value={`$${totals.revenue.toFixed(2)}`}
                subtitle="Total earnings"
                color="success"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard
                icon={<TrendingUp />}
                title="Profit"
                value={`$${totals.profit.toFixed(2)}`}
                subtitle="Net profit"
                color={totals.profit >= 0 ? "success" : "error"}
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
            <Grid item xs={12} lg={8}>
              <Card sx={{ height: { xs: 300, sm: 400 } }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Revenue, Expenses & Profit per Trip
                  </Typography>
                  <Box sx={{ height: { xs: 220, sm: 320 }, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={summaries} 
                        margin={{ 
                          top: 20, 
                          right: isMobile ? 10 : 30, 
                          left: isMobile ? 10 : 20, 
                          bottom: 5 
                        }}
                      >
                        <XAxis 
                          dataKey="bus_registration" 
                          tick={{ fontSize: isMobile ? 10 : 12 }}
                          angle={isMobile ? -45 : 0}
                          textAnchor={isMobile ? 'end' : 'middle'}
                          height={isMobile ? 60 : 30}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            `$${parseFloat(value).toFixed(2)}`, 
                            name.charAt(0).toUpperCase() + name.slice(1)
                          ]}
                          labelFormatter={(label) => `Bus: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill={theme.palette.success.main} name="Revenue" />
                        <Bar dataKey="expenses" fill={theme.palette.error.main} name="Expenses" />
                        <Bar dataKey="profit" fill={theme.palette.info.main} name="Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card sx={{ height: { xs: 300, sm: 400 } }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Passenger Distribution
                  </Typography>
                  <Box sx={{ height: { xs: 220, sm: 320 }, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? 60 : 80}
                          label={({ name, value }) => isMobile ? `${value}` : `${name}: ${value}`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any, name: string, props: any) => [
                            `${value} passengers`, 
                            props.payload.fullName
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Table */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                  Active Trip Details ({summaries.length})
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: { xs: 400, sm: 600 } }}>
                <Table size={isMobile ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bus</TableCell>
                      {!isMobile && <TableCell>Route</TableCell>}
                      {!isTablet && <TableCell>Driver</TableCell>}
                      {!isTablet && <TableCell>Conductor</TableCell>}
                      {!isMobile && <TableCell>Start Time</TableCell>}
                      <TableCell align="center">Tickets</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      {!isMobile && <TableCell align="right">Expenses</TableCell>}
                      <TableCell align="right">Profit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summaries.map(trip => (
                      <TableRow key={trip.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <DirectionsBus fontSize="small" color="primary" />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {trip.bus_registration}
                              </Typography>
                              {isMobile && (
                                <Typography variant="caption" color="text.secondary">
                                  {trip.route}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        {!isMobile && <TableCell>{trip.route}</TableCell>}
                        {!isTablet && (
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Person fontSize="small" />
                              <Typography variant="body2">{trip.driver}</Typography>
                            </Stack>
                          </TableCell>
                        )}
                        {!isTablet && (
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Person fontSize="small" />
                              <Typography variant="body2">{trip.conductor}</Typography>
                            </Stack>
                          </TableCell>
                        )}
                        {!isMobile && (
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <AccessTime fontSize="small" />
                              <Typography variant="body2">
                                {trip.start_time ? new Date(trip.start_time).toLocaleString() : '-'}
                              </Typography>
                            </Stack>
                          </TableCell>
                        )}
                        <TableCell align="center">
                          <Chip 
                            label={trip.tickets} 
                            size="small"
                            color={trip.tickets > 0 ? 'info' : 'default'}
                            variant={trip.tickets > 0 ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={500}
                            color="success.main"
                          >
                            ${trip.revenue.toFixed(2)}
                          </Typography>
                        </TableCell>
                        {!isMobile && (
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight={500}
                              color="error.main"
                            >
                              ${trip.expenses.toFixed(2)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                            color={trip.profit >= 0 ? 'success.main' : 'error.main'}
                          >
                            ${trip.profit.toFixed(2)}
                          </Typography>
                          {isMobile && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Exp: ${trip.expenses.toFixed(2)}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default ActiveReports;