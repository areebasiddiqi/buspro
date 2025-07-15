import React from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ p: 6, borderRadius: 4, textAlign: 'center', maxWidth: 400 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>Bus Pro</Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>Modern Bus Management & Ticketing</Typography>
        <Stack spacing={3} mt={4}>
          <Button variant="contained" color="primary" size="large" onClick={() => navigate('/admin')}>
            Admin Portal
          </Button>
          <Button variant="outlined" color="primary" size="large" onClick={() => navigate('/mobile')}>
            Mobile Ticketing
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LandingPage; 