import React, { useRef, useState } from 'react';
import { Paper, Typography, Grid, Box, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import html2canvas from 'html2canvas';

interface TicketPreviewProps {
  ticketData: {
    busRegistration: string;
    pickupPoint: string;
    destination: string;
    price: string;
    paymentMethod: string;
    ticketNumber: string;
    date: string;
    passengerName?: string;
    discount?: string;
  };
}

const TicketPreview: React.FC<TicketPreviewProps> = ({ ticketData }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  // Fix Bluetooth types for now
  const [device, setDevice] = useState<any>(null);
  const [characteristic, setCharacteristic] = useState<any>(null);

  // Calculate total price
  const priceNum = parseFloat(ticketData.price || '0');
  const discountNum = parseFloat(ticketData.discount || '0');
  const total = (priceNum - discountNum).toFixed(2);

  const connectToPrinter = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }], // Common service for thermal printers
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const char = await service?.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb'); // Common characteristic for printing
      setDevice(device);
      setCharacteristic(char);
      alert('Connected to printer!');
    } catch (error: any) {
      console.error('Bluetooth connection failed:', error);
      alert('Failed to connect: ' + (error?.message || error));
    }
  };

  const printTicket = async () => {
    if (!characteristic) {
      alert('Please connect to printer first!');
      return;
    }
    try {
      // ESC/POS commands for printing ticket
      const encoder = new TextEncoder();
      let commands = [];
      // Initialize printer
      commands.push(encoder.encode('\x1B\x40'));
      // Print text
      commands.push(encoder.encode(`Bus Pro Ticket\n`));
      commands.push(encoder.encode(`Ticket #: ${ticketData.ticketNumber}\n`));
      commands.push(encoder.encode(`Passenger: ${ticketData.passengerName || '-'}\n`));
      commands.push(encoder.encode(`Bus Reg: ${ticketData.busRegistration}\n`));
      commands.push(encoder.encode(`Date: ${ticketData.date}\n`));
      commands.push(encoder.encode(`From: ${ticketData.pickupPoint}\n`));
      commands.push(encoder.encode(`To: ${ticketData.destination}\n`));
      commands.push(encoder.encode(`Price: $${ticketData.price}\n`));
      commands.push(encoder.encode(`Discount: ${ticketData.discount ? `-$${ticketData.discount}` : '$0.00'}\n`));
      commands.push(encoder.encode(`Total: $${total}\n`));
      commands.push(encoder.encode(`Payment: ${ticketData.paymentMethod.toUpperCase()}\n`));
      commands.push(encoder.encode(`\nThis ticket is valid for one journey.\n`));
      // Cut paper
      commands.push(encoder.encode('\x1D\x56\x00'));

      for (const cmd of commands) {
        await characteristic.writeValue(cmd);
      }
      alert('Ticket printed!');
    } catch (error: any) {
      console.error('Printing failed:', error);
      alert('Failed to print: ' + (error?.message || error));
    }
  };

  const handleDownload = async () => {
    if (ticketRef.current) {
      const canvas = await html2canvas(ticketRef.current);
      const link = document.createElement('a');
      link.download = `ticket-${ticketData.ticketNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <Box sx={{ maxWidth: 340, margin: 'auto' }}>
      <div ref={ticketRef}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mt: 3, 
            border: '1px dashed #000',
            backgroundColor: '#fff',
            maxWidth: 320,
            margin: 'auto',
            borderRadius: 2
          }}
        >
          <Box textAlign="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              Bus Pro Ticket
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              Ticket #: {ticketData.ticketNumber}
            </Typography>
          </Box>

          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Passenger Name
              </Typography>
              <Typography variant="body1" gutterBottom fontWeight={600}>
                {ticketData.passengerName || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Bus Reg
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
                Discount
              </Typography>
              <Typography variant="body1" gutterBottom color={ticketData.discount && ticketData.discount !== '0.00' ? 'success.main' : 'text.primary'}>
                {ticketData.discount && ticketData.discount !== '0.00' ? `-$${ticketData.discount}` : '$0.00'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Total
              </Typography>
              <Typography variant="body1" gutterBottom fontWeight={700}>
                ${total}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Payment Method
              </Typography>
              <Typography variant="body1" gutterBottom>
                {ticketData.paymentMethod.toUpperCase()}
              </Typography>
            </Grid>
          </Grid>

          <Box mt={2} textAlign="center">
            <Typography variant="caption" display="block">
              This ticket is electronically generated and valid for one journey only.
            </Typography>
          </Box>
        </Paper>
      </div>
      <Box textAlign="center" mt={2}>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload} size="small" sx={{ mr: 1 }}>
          Download
        </Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={device ? printTicket : connectToPrinter} size="small">
          {device ? 'Print' : 'Connect & Print'}
        </Button>
      </Box>
    </Box>
  );
};

export default TicketPreview;