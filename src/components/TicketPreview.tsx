import React from 'react';
import { Paper, Typography, Grid, Box } from '@mui/material';

interface TicketPreviewProps {
  ticketData: {
    busRegistration: string;
    pickupPoint: string;
    destination: string;
    price: string;
    paymentMethod: string;
    ticketNumber: string;
    date: string;
  };
}

const TicketPreview: React.FC<TicketPreviewProps> = ({ ticketData }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mt: 3, 
        border: '1px dashed #000',
        backgroundColor: '#fff',
        maxWidth: 600,
        margin: 'auto'
      }}
    >
      <Box textAlign="center" mb={3}>
        <Typography variant="h5" gutterBottom>
          Bus Pro Ticket
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Ticket #: {ticketData.ticketNumber}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Bus Registration
          </Typography>
          <Typography variant="body1" gutterBottom>
            {ticketData.busRegistration}
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Date
          </Typography>
          <Typography variant="body1" gutterBottom>
            {ticketData.date}
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            From
          </Typography>
          <Typography variant="body1" gutterBottom>
            {ticketData.pickupPoint}
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            To
          </Typography>
          <Typography variant="body1" gutterBottom>
            {ticketData.destination}
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Price
          </Typography>
          <Typography variant="body1" gutterBottom>
            ${ticketData.price}
          </Typography>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="body2" color="textSecondary">
            Payment Method
          </Typography>
          <Typography variant="body1" gutterBottom>
            {ticketData.paymentMethod.toUpperCase()}
          </Typography>
        </Grid>
      </Grid>

      <Box mt={3} textAlign="center">
        <Typography variant="caption" display="block">
          This ticket is electronically generated and valid for one journey only.
        </Typography>
      </Box>
    </Paper>
  );
};

export default TicketPreview;