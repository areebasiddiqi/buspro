import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Divider, 
  useTheme, 
  useMediaQuery, 
  Avatar, 
  Button,
  Chip,
  Stack,
  alpha,
  Badge
} from '@mui/material';
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
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanel from '../pages/AdminPanel';

const drawerWidth = 280;
const mobileDrawerWidth = 260;

const navItems = [
  { 
    label: 'Dashboard', 
    icon: <DashboardIcon />, 
    route: '/admin/dashboard',
    badge: null,
    description: 'Overview & Analytics'
  },
  { 
    label: 'Fleet Management', 
    icon: <DirectionsBusIcon />, 
    route: '/admin/management',
    badge: null,
    description: 'Buses & Routes'
  },
  { 
    label: 'Trip Management', 
    icon: <TimelineIcon />, 
    route: '/admin/trips',
    badge: 'Live',
    description: 'Active Trips'
  },
  { 
    label: 'Reports & Analytics', 
    icon: <AssessmentIcon />, 
    route: '/admin/reports',
    badge: null,
    description: 'Performance Data'
  },
  { 
    label: 'System Settings', 
    icon: <SettingsIcon />, 
    route: '/admin/panel',
    badge: null,
    description: 'Configuration'
  },
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

  // Add logout handler
  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    navigate('/admin/login');
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: 'background.paper',
      borderRight: `1px solid ${theme.palette.divider}`
    }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ 
            bgcolor: 'primary.main', 
            width: 40, 
            height: 40,
            boxShadow: theme.shadows[2]
          }}>
            <DirectionsBusIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} color="primary.main">
              Timboon Bus Service
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin Dashboard
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 2, py: 2 }}>
        {navItems.map((item) => {
          const isSelected = location.pathname.startsWith(item.route);
          return (
            <ListItemButton
              key={item.label}
              selected={isSelected}
              onClick={() => {
                navigate(item.route);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ 
                borderRadius: 2, 
                mb: 1,
                py: 1.5,
                px: 2,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge ? (
                  <Badge 
                    badgeContent={item.badge} 
                    color="secondary" 
                    variant="dot"
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -3,
                        top: 3,
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{ 
                  fontWeight: isSelected ? 600 : 500, 
                  fontSize: '0.875rem'
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* Footer */}
      <Box sx={{ p: 3, pt: 2 }}>
        <Stack spacing={2}>
          <Chip 
            label="v2.0.0" 
            size="small" 
            variant="outlined" 
            color="primary"
            sx={{ alignSelf: 'flex-start' }}
          />
          <Typography variant="caption" color="text.secondary">
            © 2025 Timboon Bus Service Platform
          </Typography>
        </Stack>
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
          sx={{ 
            display: { xs: 'block', sm: 'none' }, 
            '& .MuiDrawer-paper': { 
              width: mobileDrawerWidth,
              boxSizing: 'border-box'
            } 
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{ 
            display: { xs: 'none', sm: 'block' }, 
            '& .MuiDrawer-paper': { 
              width: drawerWidth, 
              boxSizing: 'border-box' 
            } 
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar 
          position="sticky" 
          color="inherit" 
          elevation={0} 
          sx={{ 
            ml: { sm: `${drawerWidth}px` }, 
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(8px)'
          }}
        >
          <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 4 } }}>
            {isMobile && (
              <IconButton 
                color="primary" 
                edge="start" 
                onClick={handleDrawerToggle} 
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h5" 
                fontWeight={600} 
                color="text.primary"
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {navItems.find(item => location.pathname.startsWith(item.route))?.label || 'Dashboard'}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                {navItems.find(item => location.pathname.startsWith(item.route))?.description || 'Welcome to Bus Pro Admin'}
              </Typography>
            </Box>

            {/* Action buttons */}
            <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1 }}>
              <IconButton 
                color="default"
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <Badge badgeContent={3} color="error" variant="dot">
                  <NotificationsIcon fontSize={isMobile ? 'small' : 'medium'} />
                </Badge>
              </IconButton>
              
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: { xs: 32, sm: 40 }, 
                height: { xs: 32, sm: 40 },
                ml: { xs: 0.5, sm: 1 },
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: theme.shadows[2]
                }
              }}>
                A
              </Avatar>
              
              <Button 
                variant="outlined"
                startIcon={!isMobile ? <LogoutIcon /> : undefined}
                onClick={handleLogout}
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  ml: { xs: 0.5, sm: 2 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  px: { xs: 1, sm: 2 },
                  borderColor: alpha(theme.palette.error.main, 0.3),
                  color: 'error.main',
                  '&:hover': {
                    borderColor: 'error.main',
                    bgcolor: alpha(theme.palette.error.main, 0.05)
                  }
                }}
              >
                {isMobile ? <LogoutIcon fontSize="small" /> : 'Logout'}
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 1, sm: 3 } }}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="management" element={<BusManagement />} />
            <Route path="trips" element={<TripManagement />} />
            <Route path="reports" element={<ActiveReports />} />
            <Route path="panel" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="dashboard" />} />
          </Routes>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout; 