import React, { useRef, useState } from 'react';
import { Paper, Typography, Grid, Box, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import html2canvas from 'html2canvas';

// Add this at the top of the file, before any imports
// TypeScript declaration for bluetooth on Navigator
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare global {
  interface Navigator {
    bluetooth?: any;
  }
}

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
    driverName?: string;
    conductorName?: string;
    busPhoneNumber?: string;
  };
}

const TicketPreview: React.FC<TicketPreviewProps> = ({ ticketData }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  // Fallback types for BluetoothDevice and BluetoothRemoteGATTCharacteristic
  // @ts-ignore
  // eslint-disable-next-line
  type BluetoothDevice = any;
  // @ts-ignore
  // eslint-disable-next-line
  type BluetoothRemoteGATTCharacteristic = any;

  const connectToPrinter = async () => {
    try {
      console.log('Requesting Bluetooth device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }], // Common service for thermal printers
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      console.log('Connecting to GATT server...');
      const server = await device.gatt?.connect();
      console.log('Getting primary service...');
      const service = await server?.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      console.log('Getting characteristic...');
      const char = await service?.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb'); // Common characteristic for printing
      setDevice(device);
      setCharacteristic(char);
      alert('Connected to printer!');
      console.log('Successfully connected to printer:', device.name);
    } catch (error: any) {
      console.error('Bluetooth connection failed:', error);
      alert('Failed to connect: ' + error.message);
    }
  };

  const printTicket = async () => {
    if (!characteristic) {
      alert('Please connect to printer first!');
      return;
    }
    try {
      console.log('Attempting to print ticket...');
      const encoder = new TextEncoder();
      let commands = [];

      // Test string to ensure basic printing works
      commands.push(encoder.encode('Hello, Printer!\n\n\n'));
      // Cut paper command (GS V 0)
      commands.push(encoder.encode('\x1D\x56\x00'));

      for (const cmd of commands) {
        console.log('Writing command:', cmd);
        await characteristic.writeValue(cmd);
      }
      alert('Test print command sent!');
      console.log('Test print command sent successfully.');
    } catch (error: any) {
      console.error('Printing failed:', error);
      alert('Failed to print: ' + error.message);
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
              Timboon Bus Service Ticket
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
            {/* Total Price row */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Total Price
              </Typography>
              <Typography variant="body1" gutterBottom fontWeight={700} color="primary.main">
                ${(
                  parseFloat(ticketData.price || '0') - (parseFloat(ticketData.discount || '0') || 0)
                ).toFixed(2)}
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

          {/* Footer with driver, conductor, phone */}
          {(ticketData.driverName || ticketData.conductorName || ticketData.busPhoneNumber) && (
            <Box mt={2} textAlign="center" sx={{ borderTop: '1px dashed #bbb', pt: 1 }}>
              {ticketData.driverName && (
                <Typography variant="body2" color="textSecondary">
                  Driver: <span style={{ color: '#222' }}>{ticketData.driverName}</span>
                </Typography>
              )}
              {ticketData.conductorName && (
                <Typography variant="body2" color="textSecondary">
                  Conductor: <span style={{ color: '#222' }}>{ticketData.conductorName}</span>
                </Typography>
              )}
              {ticketData.busPhoneNumber && (
                <Typography variant="body2" color="textSecondary">
                  Phone: <span style={{ color: '#222' }}>{ticketData.busPhoneNumber}</span>
                </Typography>
              )}
            </Box>
          )}

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
          {device ? 'Print Test' : 'Connect & Print'}
        </Button>
      </Box>
    </Box>
  );
};

// Luggage Ticket Preview
interface LuggageTicketPreviewProps {
  luggageData: {
    ticketNumber: string;
    description: string;
    weight: string | number;
    fee: string | number;
    passenger: string;
    busRegistration: string;
    origin: string;
    destination: string;
    date: string;
    driverName?: string;
    conductorName?: string;
    busPhoneNumber?: string;
  };
}

export const LuggageTicketPreview: React.FC<LuggageTicketPreviewProps> = ({ luggageData }) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (ticketRef.current) {
      const canvas = await html2canvas(ticketRef.current);
      const link = document.createElement('a');
      link.download = `luggage-ticket-${luggageData.ticketNumber}.png`;
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
              Bus Pro Luggage Ticket
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              Ticket #: {luggageData.ticketNumber}
            </Typography>
          </Box>

          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Luggage Description
              </Typography>
              <Typography variant="body1" gutterBottom fontWeight={600}>
                {luggageData.description}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Weight
              </Typography>
              <Typography variant="body1" gutterBottom>
                {luggageData.weight} kg
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Fee
              </Typography>
              <Typography variant="body1" gutterBottom>
                ${luggageData.fee}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Passenger
              </Typography>
              <Typography variant="body1" gutterBottom>
                {luggageData.passenger}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Bus Reg
              </Typography>
              <Typography variant="body1" gutterBottom>
                {luggageData.busRegistration}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Date
              </Typography>
              <Typography variant="body1" gutterBottom>
                {luggageData.date}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                From
              </Typography>
              <Typography variant="body1" gutterBottom>
                {luggageData.origin}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                To
              </Typography>
              <Typography variant="body1" gutterBottom>
                {luggageData.destination}
              </Typography>
            </Grid>
            {luggageData.driverName && (
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Driver
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {luggageData.driverName}
                </Typography>
              </Grid>
            )}
            {luggageData.conductorName && (
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Conductor
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {luggageData.conductorName}
                </Typography>
              </Grid>
            )}
            {luggageData.busPhoneNumber && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Bus Phone
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {luggageData.busPhoneNumber}
                </Typography>
              </Grid>
            )}
          </Grid>

          <Box mt={2} textAlign="center">
            <Typography variant="caption" display="block">
              Please keep this ticket for luggage claim.
            </Typography>
            {luggageData.busPhoneNumber && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Bus Phone: {luggageData.busPhoneNumber}
              </Typography>
            )}
          </Box>
        </Paper>
      </div>
      <Box textAlign="center" mt={2}>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload} size="small">
          Download
        </Button>
      </Box>
    </Box>
  );
};

export default TicketPreview;