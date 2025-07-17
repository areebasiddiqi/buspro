import React, { useState, useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';
import {
  getSchedules,
  createSchedule,
  getRoutes,
  createRoute,
  getExpenses,
  createExpense,
  getSales,
  getBuses,
  createBus,
  deleteRoute,
  deleteBus
} from '../services/databaseService';
import type { Schedule as ScheduleType, Route as RouteType, Expense as ExpenseType, Sale as SaleType, Bus } from '../types/database.types.ts';
import {
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, DirectionsBus, Route as RouteIcon, AttachMoney, Assessment } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

type Schedule = ScheduleType;

interface LocalRoute {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  distance: string;
  fare: string;
}

type Expense = ExpenseType;

interface Sale {
  date: string;
  busId: string;
  route: string;
  amount: string;
  paymentMethod: string;
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

const BusManagement: React.FC = () => {
  const { subscribeToChanges } = useSupabase();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<LocalRoute[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState({
    schedules: false,
    routes: false,
    expenses: false,
    sales: false
  });
  const [buses, setBuses] = useState<Bus[]>([]);
  const [busForm, setBusForm] = useState<Omit<Bus, 'id' | 'created_at'>>({
    registration: '',
    model: '',
    capacity: undefined,
    status: 'active',
    notes: '',
  });
  const [busLoading, setBusLoading] = useState(false);

  // Form states
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    bus_id: '',
    route: '',
    departure_time: '',
    arrival_time: '',
    frequency: 'daily',
  });

  const [newRoute, setNewRoute] = useState<LocalRoute>({
    id: '',
    name: '',
    startPoint: '',
    endPoint: '',
    distance: '',
    fare: ''
  });

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: '',
    bus_id: '',
  });

  // Add state for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'route' | 'bus' | null; id: string | null }>({ open: false, type: null, id: null });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        // Load schedules
        setLoading(prev => ({ ...prev, schedules: true }));
        const schedulesData = await getSchedules();
        setSchedules(schedulesData);
        setLoading(prev => ({ ...prev, schedules: false }));

        // Load routes
        setLoading(prev => ({ ...prev, routes: true }));
        const routesData = await getRoutes();
        setRoutes(routesData.map(item => ({
          id: item.id,
          name: item.name,
          startPoint: item.start_point,
          endPoint: item.end_point,
          distance: item.distance.toString(),
          fare: item.fare.toString()
        })));
        setLoading(prev => ({ ...prev, routes: false }));

        // Load expenses
        setLoading(prev => ({ ...prev, expenses: true }));
        const expensesData = await getExpenses();
        setExpenses(expensesData.map(item => ({
          date: item.date,
          category: item.category,
          amount: item.amount.toString(),
          description: item.description,
          bus_id: item.bus_id
        })));
        setLoading(prev => ({ ...prev, expenses: false }));

        // Load sales
        setLoading(prev => ({ ...prev, sales: true }));
        const salesData = await getSales();
        setSales(salesData.map(item => ({
          date: item.date,
          bus_id: item.bus_id,
          route: item.route,
          amount: item.amount.toString(),
          payment_method: item.payment_method
        })));
        setLoading(prev => ({ ...prev, sales: false }));

        // Load buses
        setBusLoading(true);
        const busesData = await getBuses();
        setBuses(busesData);
        setBusLoading(false);

      } catch (error) {
        console.error('Error loading data:', error);
        setLoading({
          schedules: false,
          routes: false,
          expenses: false,
          sales: false
        });
      }
    };

    loadData();

    // Set up real-time subscriptions
    const subscriptions = [
      subscribeToChanges('schedules', (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as ScheduleType;
          setSchedules(prev => [newItem, ...prev]);
        }
      }),
      subscribeToChanges('routes', (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as RouteType;
          setRoutes(prev => [{
            id: newItem.id,
            name: newItem.name,
            startPoint: newItem.start_point,
            endPoint: newItem.end_point,
            distance: newItem.distance.toString(),
            fare: newItem.fare.toString()
          }, ...prev]);
        }
      }),
      subscribeToChanges('expenses', (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as ExpenseType;
          setExpenses(prev => [{
            date: newItem.date,
            category: newItem.category,
            amount: newItem.amount.toString(),
            description: newItem.description,
            bus_id: newItem.bus_id
          }, ...prev]);
        }
      }),
      subscribeToChanges('sales', (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as SaleType;
          setSales(prev => [{
            date: newItem.date,
            bus_id: newItem.bus_id,
            route: newItem.route,
            amount: newItem.amount.toString(),
            payment_method: newItem.payment_method
          }, ...prev]);
        }
      }),
      subscribeToChanges('buses', (payload) => {
        if (payload.eventType === 'INSERT') {
          const newItem = payload.new as Bus;
          setBuses(prev => [newItem, ...prev]);
        }
      })
    ];

    return () => {
      subscriptions.forEach(sub => sub?.unsubscribe?.());
    };
  }, [subscribeToChanges]);

  const handleAddSchedule = async () => {
    try {
      await createSchedule({
        bus_id: newSchedule.bus_id as string,
        route: newSchedule.route as string,
        departure_time: newSchedule.departure_time as string,
        arrival_time: newSchedule.arrival_time as string,
        frequency: newSchedule.frequency as string
      });

      // Reset form
      setNewSchedule({
        bus_id: '',
        route: '',
        departure_time: '',
        arrival_time: '',
        frequency: 'daily'
      });
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert('Failed to add schedule. Please try again.');
    }
  };

  const handleAddRoute = async () => {
    try {
      await createRoute({
        name: newRoute.name,
        start_point: newRoute.startPoint,
        end_point: newRoute.endPoint,
        distance: parseFloat(newRoute.distance),
        fare: parseFloat(newRoute.fare)
      });

      // Reset form
      setNewRoute({
        id: '',
        name: '',
        startPoint: '',
        endPoint: '',
        distance: '',
        fare: ''
      });
    } catch (error) {
      console.error('Error adding route:', error);
      alert('Failed to add route. Please try again.');
    }
  };

  const handleAddExpense = async () => {
    try {
      await createExpense({
        date: newExpense.date as string,
        category: newExpense.category as string,
        amount: parseFloat(newExpense.amount as string),
        description: newExpense.description as string,
        bus_id: newExpense.bus_id as string
      });

      // Reset form
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        description: '',
        bus_id: ''
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  const handleBusFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusForm(prev => ({ ...prev, [name]: name === 'capacity' ? (value ? parseInt(value) : undefined) : value }));
  };

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusLoading(true);
    try {
      await createBus(busForm);
      setBusForm({ registration: '', model: '', capacity: undefined, status: 'active', notes: '' });
      setBuses(await getBuses());
    } catch (err) {
      alert('Failed to add bus: ' + (err as Error).message);
    } finally {
      setBusLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteRoute = async (routeId: string) => {
    setConfirmDialog({ open: true, type: 'route', id: routeId });
  };
  const handleDeleteBus = async (busId: string) => {
    setConfirmDialog({ open: true, type: 'bus', id: busId });
  };
  const handleConfirmDelete = async () => {
    if (confirmDialog.type === 'route' && confirmDialog.id) {
      await deleteRoute(confirmDialog.id);
      setRoutes(await getRoutes().then(routesData => routesData.map(item => ({
        id: item.id,
        name: item.name,
        startPoint: item.start_point,
        endPoint: item.end_point,
        distance: item.distance.toString(),
        fare: item.fare.toString()
      }))));
    } else if (confirmDialog.type === 'bus' && confirmDialog.id) {
      await deleteBus(confirmDialog.id);
      setBuses(await getBuses());
    }
    setConfirmDialog({ open: false, type: null, id: null });
  };
  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, type: null, id: null });
  };

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
                Fleet Management System
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Manage schedules, routes, expenses, and fleet operations
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{ px: { xs: 1, sm: 2 } }}
          >
            <Tab 
              label={isMobile ? "Schedule" : "Schedules"} 
              icon={<RouteIcon />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Routes" 
              icon={<RouteIcon />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Expenses" 
              icon={<AttachMoney />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label={isMobile ? "Sales" : "Sales Report"} 
              icon={<Assessment />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Buses" 
              icon={<DirectionsBus />} 
              iconPosition={isMobile ? "top" : "start"}
            />
          </Tabs>
        </Box>

        {/* Schedules Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} lg={4}>
              <Card elevation={2}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Add New Schedule
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Bus ID"
                      value={newSchedule.bus_id}
                      onChange={(e) => setNewSchedule({ ...newSchedule, bus_id: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="Route"
                      value={newSchedule.route}
                      onChange={(e) => setNewSchedule({ ...newSchedule, route: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="Departure Time"
                      type="time"
                      value={newSchedule.departure_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, departure_time: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="Arrival Time"
                      type="time"
                      value={newSchedule.arrival_time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, arrival_time: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      select
                      label="Frequency"
                      value={newSchedule.frequency}
                      onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </TextField>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddSchedule}
                      size={isMobile ? "medium" : "large"}
                    >
                      Add Schedule
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <TableContainer sx={{ maxHeight: { xs: 300, sm: 400 } }}>
                    <Table size={isMobile ? "small" : "medium"} stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Bus ID</TableCell>
                          <TableCell>Route</TableCell>
                          {!isMobile && <TableCell>Departure</TableCell>}
                          {!isMobile && <TableCell>Arrival</TableCell>}
                          <TableCell>Frequency</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loading.schedules ? (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 3 : 5} align="center">Loading schedules...</TableCell>
                          </TableRow>
                        ) : schedules.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 3 : 5} align="center">No schedules found</TableCell>
                          </TableRow>
                        ) : (
                          schedules.map((schedule, index) => (
                            <TableRow key={index}>
                              <TableCell>{schedule.bus_id}</TableCell>
                              <TableCell>{schedule.route}</TableCell>
                              {!isMobile && <TableCell>{schedule.departure_time}</TableCell>}
                              {!isMobile && <TableCell>{schedule.arrival_time}</TableCell>}
                              <TableCell>
                                <Chip 
                                  label={schedule.frequency} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Routes Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} lg={4}>
              <Card elevation={2}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Add New Route
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Route Name"
                      value={newRoute.name}
                      onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="Start Point"
                      value={newRoute.startPoint}
                      onChange={(e) => setNewRoute({ ...newRoute, startPoint: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="End Point"
                      value={newRoute.endPoint}
                      onChange={(e) => setNewRoute({ ...newRoute, endPoint: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="Distance (km)"
                      type="number"
                      value={newRoute.distance}
                      onChange={(e) => setNewRoute({ ...newRoute, distance: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="Fare ($)"
                      type="number"
                      value={newRoute.fare}
                      onChange={(e) => setNewRoute({ ...newRoute, fare: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddRoute}
                      size={isMobile ? "medium" : "large"}
                    >
                      Add Route
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <TableContainer sx={{ maxHeight: { xs: 300, sm: 400 } }}>
                    <Table size={isMobile ? "small" : "medium"} stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          {!isMobile && <TableCell>Start Point</TableCell>}
                          {!isMobile && <TableCell>End Point</TableCell>}
                          <TableCell>Distance</TableCell>
                          <TableCell>Fare</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loading.routes ? (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 4 : 6} align="center">Loading routes...</TableCell>
                          </TableRow>
                        ) : routes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 4 : 6} align="center">No routes found</TableCell>
                          </TableRow>
                        ) : (
                          routes.map((route, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {route.name}
                                </Typography>
                                {isMobile && (
                                  <Typography variant="caption" color="text.secondary">
                                    {route.startPoint} → {route.endPoint}
                                  </Typography>
                                )}
                              </TableCell>
                              {!isMobile && <TableCell>{route.startPoint}</TableCell>}
                              {!isMobile && <TableCell>{route.endPoint}</TableCell>}
                              <TableCell>{route.distance} km</TableCell>
                              <TableCell>
                                <Chip 
                                  label={`$${route.fare}`} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleDeleteRoute(route.id)} 
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Expenses Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} lg={4}>
              <Card elevation={2}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Add New Expense
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      select
                      label="Category"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    >
                      <MenuItem value="fuel">Fuel</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="salary">Salary</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <TextField
                      fullWidth
                      label="Bus ID"
                      value={newExpense.bus_id}
                      onChange={(e) => setNewExpense({ ...newExpense, bus_id: e.target.value })}
                      size={isMobile ? "small" : "medium"}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAddExpense}
                      size={isMobile ? "medium" : "large"}
                    >
                      Add Expense
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <TableContainer sx={{ maxHeight: { xs: 300, sm: 400 } }}>
                    <Table size={isMobile ? "small" : "medium"} stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Amount</TableCell>
                          {!isMobile && <TableCell>Description</TableCell>}
                          {!isMobile && <TableCell>Bus ID</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loading.expenses ? (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 3 : 5} align="center">Loading expenses...</TableCell>
                          </TableRow>
                        ) : expenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={isMobile ? 3 : 5} align="center">No expenses found</TableCell>
                          </TableRow>
                        ) : (
                          expenses.map((expense, index) => (
                            <TableRow key={index}>
                              <TableCell>{expense.date}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={expense.category} 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500} color="error.main">
                                  ${expense.amount}
                                </Typography>
                                {isMobile && (
                                  <Typography variant="caption" color="text.secondary">
                                    {expense.description} • {expense.bus_id}
                                  </Typography>
                                )}
                              </TableCell>
                              {!isMobile && <TableCell>{expense.description}</TableCell>}
                              {!isMobile && <TableCell>{expense.bus_id}</TableCell>}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Sales Report Tab */}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600}>
                  Sales Report
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: { xs: 400, sm: 500 } }}>
                <Table size={isMobile ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Bus ID</TableCell>
                      {!isMobile && <TableCell>Route</TableCell>}
                      <TableCell>Amount</TableCell>
                      {!isMobile && <TableCell>Payment Method</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading.sales ? (
                      <TableRow>
                        <TableCell colSpan={isMobile ? 3 : 5} align="center">Loading sales data...</TableCell>
                      </TableRow>
                    ) : sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isMobile ? 3 : 5} align="center">No sales data found</TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale, index) => (
                        <TableRow key={index}>
                          <TableCell>{sale.date}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {sale.bus_id}
                            </Typography>
                            {isMobile && (
                              <Typography variant="caption" color="text.secondary">
                                {sale.route} • {sale.payment_method}
                              </Typography>
                            )}
                          </TableCell>
                          {!isMobile && <TableCell>{sale.route}</TableCell>}
                          <TableCell>
                            <Chip 
                              label={`$${sale.amount}`} 
                              size="small" 
                              color="success" 
                              variant="filled"
                            />
                          </TableCell>
                          {!isMobile && <TableCell>{sale.payment_method}</TableCell>}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Buses Tab */}
        <TabPanel value={tabValue} index={4}>
          <Stack spacing={3}>
            <Card elevation={2}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Add New Bus</Typography>
                <form onSubmit={handleAddBus}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField 
                        label="Registration" 
                        name="registration" 
                        value={busForm.registration} 
                        onChange={handleBusFormChange} 
                        required 
                        fullWidth 
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField 
                        label="Model" 
                        name="model" 
                        value={busForm.model} 
                        onChange={handleBusFormChange} 
                        fullWidth 
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField 
                        label="Capacity" 
                        name="capacity" 
                        type="number" 
                        value={busForm.capacity ?? ''} 
                        onChange={handleBusFormChange} 
                        fullWidth 
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField 
                        label="Status" 
                        name="status" 
                        value={busForm.status} 
                        onChange={handleBusFormChange} 
                        fullWidth 
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField 
                        label="Notes" 
                        name="notes" 
                        value={busForm.notes} 
                        onChange={handleBusFormChange} 
                        fullWidth 
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        disabled={busLoading}
                        size={isMobile ? "medium" : "large"}
                      >
                        {busLoading ? 'Adding...' : 'Add Bus'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={600}>
                    Buses List ({buses.length})
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: { xs: 400, sm: 500 } }}>
                  <Table size={isMobile ? "small" : "medium"} stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Registration</TableCell>
                        {!isMobile && <TableCell>Model</TableCell>}
                        <TableCell>Capacity</TableCell>
                        <TableCell>Status</TableCell>
                        {!isMobile && <TableCell>Notes</TableCell>}
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {buses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isMobile ? 4 : 6} align="center">No buses found</TableCell>
                        </TableRow>
                      ) : (
                        buses.map(bus => (
                          <TableRow key={bus.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {bus.registration}
                              </Typography>
                              {isMobile && (
                                <Typography variant="caption" color="text.secondary">
                                  {bus.model} • {bus.notes}
                                </Typography>
                              )}
                            </TableCell>
                            {!isMobile && <TableCell>{bus.model}</TableCell>}
                            <TableCell>
                              <Chip 
                                label={bus.capacity} 
                                size="small" 
                                color="info" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={bus.status} 
                                size="small" 
                                color={bus.status === 'active' ? 'success' : 'default'}
                                variant={bus.status === 'active' ? 'filled' : 'outlined'}
                              />
                            </TableCell>
                            {!isMobile && <TableCell>{bus.notes}</TableCell>}
                            <TableCell align="center">
                              <IconButton 
                                color="error" 
                                onClick={() => handleDeleteBus(bus.id)} 
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Stack>
        </TabPanel>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this {confirmDialog.type}? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusManagement;