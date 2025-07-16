import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const USERS = [
  { username: 'admin1', password: 'pass1' },
  { username: 'admin2', password: 'pass2' },
  { username: 'admin3', password: 'pass3' },
  { username: 'admin4', password: 'pass4' },
  { username: 'admin5', password: 'pass5' },
  { username: 'admin6', password: 'pass6' },
];

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = USERS.find(u => u.username === username && u.password === password);
    if (found) {
      localStorage.setItem('admin-auth', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 4, minWidth: 320, maxWidth: 400 }} elevation={3}>
        <Typography variant="h5" fontWeight={700} mb={2} align="center">Admin Login</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            required
            margin="normal"
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLogin; 