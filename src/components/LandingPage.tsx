import React from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Stack,
  Chip,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CloudIcon from '@mui/icons-material/Cloud';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <AnalyticsIcon />,
      title: 'Real-time Analytics',
      description: 'Monitor your fleet performance with live data and comprehensive reporting'
    },
    {
      icon: <SecurityIcon />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee'
    },
    {
      icon: <SpeedIcon />,
      title: 'Lightning Fast',
      description: 'Optimized for speed with instant ticket generation and processing'
    },
    {
      icon: <CloudIcon />,
      title: 'Cloud-Based',
      description: 'Access your data anywhere, anytime with automatic backups'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(circle at 25% 25%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%), 
                         radial-gradient(circle at 75% 75%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
        zIndex: 0
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems="center" 
            justifyContent="center" 
            spacing={{ xs: 2, sm: 2 }} 
            mb={3}
          >
            <Avatar sx={{ 
              bgcolor: 'primary.main', 
              width: { xs: 56, sm: 64 }, 
              height: { xs: 56, sm: 64 },
              boxShadow: theme.shadows[3]
            }}>
              <DirectionsBusIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
            </Avatar>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="h1" sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}>
                Timboon Bus Services
              </Typography>
              <Chip 
                label="v2.0" 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Stack>
          
          <Typography 
            variant="h4" 
            color="text.primary" 
            gutterBottom 
            sx={{ 
              fontWeight: 500, 
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              px: { xs: 1, sm: 0 }
            }}
          >
            Next-Generation Bus Management Platform
          </Typography>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              maxWidth: { xs: '100%', sm: 600 }, 
              mx: 'auto', 
              mb: 4,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              px: { xs: 1, sm: 0 }
            }}
          >
            Streamline your bus operations with our comprehensive ticketing, fleet management, 
            and analytics platform designed for modern transportation companies.
          </Typography>

          {/* Action Buttons */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 2, sm: 3 }} 
            justifyContent="center"
            sx={{ mb: { xs: 4, md: 6 }, px: { xs: 1, sm: 0 } }}
          >
            <Button 
              variant="contained" 
              size="large"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => navigate('/admin')}
              fullWidth={{ xs: true, sm: false }}
              sx={{ 
                py: { xs: 1.2, sm: 1.5 }, 
                px: { xs: 3, sm: 4 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                boxShadow: theme.shadows[3],
                '&:hover': {
                  boxShadow: theme.shadows[4],
                  transform: { xs: 'none', sm: 'translateY(-2px)' },
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              Admin Dashboard
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              startIcon={<PhoneAndroidIcon />}
              onClick={() => navigate('/mobile')}
              fullWidth={{ xs: true, sm: false }}
              sx={{ 
                py: { xs: 1.2, sm: 1.5 }, 
                px: { xs: 3, sm: 4 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: { xs: 'none', sm: 'translateY(-2px)' },
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              Mobile Ticketing
            </Button>
          </Stack>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 6, md: 8 } }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: { xs: 'none', sm: 'translateY(-8px)' },
                  boxShadow: theme.shadows[4]
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    mx: 'auto',
                    mb: 2
                  }}>
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Stats Section */}
        <Card sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          mb: 8
        }}>
          <CardContent sx={{ py: 6 }}>
            <Grid container spacing={4} textAlign="center">
              <Grid item xs={12} md={4}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  500+
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Active Buses
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  50K+
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Daily Passengers
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  99.9%
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Uptime
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={2}>
            <SupportAgentIcon color="primary" />
            <Typography variant="body1" color="text.secondary">
              Need help? Contact our support team 24/7
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            © 2025 Timboon Bus Services. Built with modern web technologies for reliable transportation management.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage; 