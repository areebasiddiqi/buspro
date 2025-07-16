import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BusTicketing from './components/BusTicketing';
import BusManagement from './components/BusManagement';
import Dashboard from './components/Dashboard';
import TripManagement from './components/TripManagement';
import { SupabaseProvider } from './contexts/SupabaseContext';
import LandingPage from './components/LandingPage';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './components/AdminLogin';
import React from 'react';

function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  if (localStorage.getItem('admin-auth') !== 'true') {
    window.location.replace('/admin/login');
    return null;
  }
  return <>{children}</>;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#00bcd4',
    },
    background: {
      default: '#f4f6fb',
      paper: '#fff',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <SupabaseProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/mobile" element={<BusTicketing />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={
              <RequireAdminAuth>
                <AdminLayout />
              </RequireAdminAuth>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </SupabaseProvider>
  );
}

export default App;
