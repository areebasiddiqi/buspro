import React from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import { Outlet, useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import BusManagement from './BusManagement';
import TripManagement from './TripManagement';

const tabRoutes = ['/admin/dashboard', '/admin/management', '/admin/trips'];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tabIndex = tabRoutes.findIndex(route => location.pathname.startsWith(route));

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(tabRoutes[newValue]);
  };

  return (
    <>
      <AppBar position="static" color="primary" elevation={2} sx={{ borderRadius: 0, mb: 3 }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1 }}>
            Bus Pro Admin
          </Typography>
          <Tabs
            value={tabIndex === -1 ? 0 : tabIndex}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ minHeight: 48 }}
          >
            <Tab label="Dashboard" sx={{ fontWeight: 600, minWidth: 120 }} />
            <Tab label="Management" sx={{ fontWeight: 600, minWidth: 120 }} />
            <Tab label="Trip Management" sx={{ fontWeight: 600, minWidth: 160 }} />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 1, sm: 3 } }}>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="management" element={<BusManagement />} />
          <Route path="trips" element={<TripManagement />} />
          <Route path="*" element={<Navigate to="dashboard" />} />
        </Routes>
        <Outlet />
      </Box>
    </>
  );
};

export default AdminLayout; 