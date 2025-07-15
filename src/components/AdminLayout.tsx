import React from 'react';
import { AppBar, Toolbar, Typography, Box, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Divider, useTheme, useMediaQuery, Avatar } from '@mui/material';
import { Outlet, useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import BusManagement from './BusManagement';
import TripManagement from './TripManagement';
import ActiveReports from './ActiveReports';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 220;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, route: '/admin/dashboard' },
  { label: 'Management', icon: <DirectionsBusIcon />, route: '/admin/management' },
  { label: 'Trip Management', icon: <TimelineIcon />, route: '/admin/trips' },
  { label: 'Active Reports', icon: <AssessmentIcon />, route: '/admin/reports' },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>B</Avatar>
        <Typography variant="h6" fontWeight={700} letterSpacing={1} color="primary.main">Bus Pro Admin</Typography>
      </Box>
      <Divider sx={{ mb: 1 }} />
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.label}
            selected={location.pathname.startsWith(item.route)}
            onClick={() => {
              navigate(item.route);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{ borderRadius: 2, mb: 0.5, mx: 1, bgcolor: location.pathname.startsWith(item.route) ? 'action.selected' : undefined }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 16 }} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">v1.0.0</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="admin navigation">
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="sticky" color="inherit" elevation={1} sx={{ ml: { sm: `${drawerWidth}px` }, zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar sx={{ minHeight: 56, px: { xs: 1, sm: 3 } }}>
            {isMobile && (
              <IconButton color="primary" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexGrow: 1, fontSize: { xs: 18, sm: 22 } }}>Admin Portal</Typography>
            {/* User/Profile section */}
            <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, ml: 2 }}>A</Avatar>
          </Toolbar>
        </AppBar>
        <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 1, sm: 3 } }}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="management" element={<BusManagement />} />
            <Route path="trips" element={<TripManagement />} />
            <Route path="reports" element={<ActiveReports />} />
            <Route path="*" element={<Navigate to="dashboard" />} />
          </Routes>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout; 