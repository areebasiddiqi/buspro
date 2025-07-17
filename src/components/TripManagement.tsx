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
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { 
  DirectionsBus, 
  Person, 
  Route as RouteIcon, 
  AttachMoney, 
  TrendingUp,
  AccessTime
} from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [summaries, setSummaries] = useState<TripSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        const [trips, tickets, expenses] = await Promise.all([
          getTrips(),
          getTickets(),
          getTripExpenses()
        ]);
        
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
      } catch (error) {
        console.error('Error fetching trip summaries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummaries();
  }, []);

  // Calculate totals
  const totals = summaries.reduce((acc, trip) => ({
    tickets: acc.tickets + trip.tickets,
    revenue: acc.revenue + trip.revenue,
    expenses: acc.expenses + trip.expenses,
    profit: acc.profit + trip.profit
  }), { tickets: 0, revenue: 0, expenses: 0, profit: 0 });

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
            <DirectionsBus sx={{ fontSize: { xs: 32, sm: 40 } }} />
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
              >
                Trip Management
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Monitor and analyze trip performance and profitability
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight={400}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} mb={3}>
            <Grid item xs={6} sm={3}>
              <StatCard
                icon={<DirectionsBus />}
                title="Total Trips"
                value={summaries.length}
                subtitle="Active trips"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard
                icon={<Person />}
                title="Passengers"
                value={totals.tickets.toLocaleString()}
                subtitle="Total transported"
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

          {/* Trips Table */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                  Trip Details ({summaries.length})
                </Typography>
              </Box>
              
              {summaries.length === 0 ? (
                <Box 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 1,
                    m: 2
                  }}
                >
                  <DirectionsBus sx={{ fontSize: 64, mb: 2, color: alpha(theme.palette.primary.main, 0.3) }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No trips found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start creating trips to see them here
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: { xs: 400, sm: 600 } }}>
                  <Table size={isMobile ? "small" : "medium"} stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Bus</TableCell>
                        {!isMobile && <TableCell>Route</TableCell>}
                        {!isTablet && <TableCell>Driver</TableCell>}
                        {!isTablet && <TableCell>Conductor</TableCell>}
                        {!isMobile && <TableCell>Start Time</TableCell>}
                        <TableCell>Status</TableCell>
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
                          <TableCell>
                            <Chip 
                              label={trip.status} 
                              size="small"
                              color={trip.status === 'active' ? 'success' : trip.status === 'completed' ? 'info' : 'default'}
                              variant={trip.status === 'active' ? 'filled' : 'outlined'}
                            />
                          </TableCell>
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default TripManagement;