import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, ScrollView, FlatList, StyleSheet, Alert, Modal, Share, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../services/supabaseService';

const TABS = ['Passenger', 'Luggage', 'Expenses', 'Manifest'];

interface Ticket {
  id: number;
  ticket_number: string;
  passenger_name: string;
  origin: string;
  destination: string;
  price: number;
  discount: number;
  payment_method: string;
  date: string;
  trip_id: string | null;
  bus_registration: string;
  driver: string;
  conductor: string;
  route: string;
  synced: boolean;
}

const initialTrip = {
  busRegistration: '',
  driverName: '',
  conductorName: '',
  route: '',
  locked: false,
  tripActive: false,
};

export default function BusTicketingScreen() {
  // Trip and bus details
  const [trip, setTrip] = useState<typeof initialTrip>(initialTrip);

  // Ticket form
  const [passengerName, setPassengerName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [fare, setFare] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState(0);
  const [isConnected, setIsConnected] = useState(true);

  // Ticket preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewTicket, setPreviewTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isConnected) {
      syncTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const fetchTickets = async () => {
    try {
      const stored = await AsyncStorage.getItem('tickets');
      setTickets(stored ? JSON.parse(stored) : []);
    } catch {
      setTickets([]);
    }
  };

  const saveTickets = async (newTickets: Ticket[]) => {
    await AsyncStorage.setItem('tickets', JSON.stringify(newTickets));
    setTickets(newTickets);
  };

  // Sync unsynced tickets to Supabase
  const syncTickets = async () => {
    const unsynced = tickets.filter(t => !t.synced);
    if (unsynced.length === 0) return;
    let updated = false;
    for (const ticket of unsynced) {
      // Map to Supabase schema
      const supaTicket = {
        bus_registration: ticket.bus_registration,
        pickup_point: ticket.origin,
        destination: ticket.destination,
        price: ticket.price,
        payment_method: ticket.payment_method,
        ticket_number: ticket.ticket_number,
        date: ticket.date,
      };
      const { error } = await supabase.from('tickets').insert([supaTicket]);
      if (!error) {
        ticket.synced = true;
        updated = true;
      }
    }
    if (updated) {
      await saveTickets([...tickets]);
    }
  };

  const handleStartTrip = () => {
    if (!trip.busRegistration || !trip.driverName || !trip.conductorName || !trip.route) {
      Alert.alert('Missing fields', 'Please fill all trip details.');
      return;
    }
    setTrip({ ...trip, tripActive: true });
    Alert.alert('Trip Started', 'Trip is now active.');
  };

  const handleEndTrip = () => {
    setTrip({ ...trip, tripActive: false });
    Alert.alert('Trip Ended', 'Trip has ended.');
  };

  const handleAddTicket = async () => {
    if (!passengerName || !origin || !destination || !fare) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }
    if (!trip.tripActive) {
      Alert.alert('No Active Trip', 'Start a trip before adding tickets.');
      return;
    }
    const ticket: Ticket = {
      id: Date.now(),
      ticket_number: 'BP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      passenger_name: passengerName,
      origin,
      destination,
      price: parseFloat(fare),
      discount: parseFloat(discount) || 0,
      payment_method: paymentMethod,
      date: new Date().toISOString().split('T')[0],
      trip_id: trip.tripActive ? 'active-trip' : null,
      bus_registration: trip.busRegistration,
      driver: trip.driverName,
      conductor: trip.conductorName,
      route: trip.route,
      synced: false,
    };
    if (isConnected) {
      // Try to save to Supabase
      const supaTicket = {
        bus_registration: ticket.bus_registration,
        pickup_point: ticket.origin,
        destination: ticket.destination,
        price: ticket.price,
        payment_method: ticket.payment_method,
        ticket_number: ticket.ticket_number,
        date: ticket.date,
      };
      const { error } = await supabase.from('tickets').insert([supaTicket]);
      if (!error) {
        ticket.synced = true;
      }
    }
    const newTickets = [ticket, ...tickets];
    await saveTickets(newTickets);
    setPassengerName('');
    setOrigin('');
    setDestination('');
    setFare('');
    setDiscount('');
    setPaymentMethod('Cash');
    setPreviewTicket(ticket);
    setShowPreview(true);
  };

  const handleShareTicket = async (ticket: Ticket) => {
    const ticketText = `Ticket #: ${ticket.ticket_number}\nPassenger: ${ticket.passenger_name}\nFrom: ${ticket.origin}\nTo: ${ticket.destination}\nFare: $${ticket.price}\nDiscount: $${ticket.discount}\nPayment: ${ticket.payment_method}\nDate: ${ticket.date}\nBus: ${ticket.bus_registration}\nDriver: ${ticket.driver}\nConductor: ${ticket.conductor}\nRoute: ${ticket.route}`;
    try {
      await Share.share({ message: ticketText });
    } catch {
      Alert.alert('Error', 'Could not share ticket');
    }
  };

  // Summary
  const totalTickets = tickets.length;
  const totalRevenue = tickets.reduce((sum, t) => sum + (parseFloat(t.price as any) - (parseFloat(t.discount as any) || 0)), 0);

  // Tab content renderers
  const renderPassengerTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>Passenger Ticket</Text>
      <TextInput style={styles.input} placeholder="Passenger Name" value={passengerName} onChangeText={setPassengerName} />
      <TextInput style={styles.input} placeholder="Origin" value={origin} onChangeText={setOrigin} />
      <TextInput style={styles.input} placeholder="Destination" value={destination} onChangeText={setDestination} />
      <TextInput style={styles.input} placeholder="Fare" value={fare} onChangeText={setFare} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Discount" value={discount} onChangeText={setDiscount} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Payment Method" value={paymentMethod} onChangeText={setPaymentMethod} />
      <Button title="Add Ticket" onPress={handleAddTicket} />
      <Text style={styles.listHeader}>Tickets (Local)</Text>
      <FlatList
        data={tickets}
        keyExtractor={(item: Ticket) => item.id?.toString() || item.ticket_number}
        renderItem={({ item }: { item: Ticket }) => (
          <TouchableOpacity onPress={() => { setPreviewTicket(item); setShowPreview(true); }}>
            <View style={styles.ticketItem}>
              <Text style={styles.ticketText}>#{item.ticket_number} - {item.passenger_name}</Text>
              <Text style={styles.ticketText}>{item.origin} → {item.destination} | ${item.price} | {item.payment_method}</Text>
              <Text style={styles.ticketText}>Date: {item.date} | Discount: ${item.discount}</Text>
              <Text style={styles.ticketText}>Bus: {item.bus_registration} | Driver: {item.driver} | Conductor: {item.conductor} | Route: {item.route}</Text>
              <Text style={styles.ticketText}>Synced: {item.synced ? 'Yes' : 'No'}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No tickets yet.</Text>}
        style={{ marginTop: 8 }}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f6fa' }}>
      <ScrollView>
        {/* Header */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Timboon Bus Mobile</Text>
          <Text style={styles.headerSubtitle}>Conductor & Driver Interface</Text>
        </View>
        {/* Bus Details */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Bus Details</Text>
          <TextInput style={styles.input} placeholder="Bus Registration" value={trip.busRegistration} onChangeText={v => setTrip({ ...trip, busRegistration: v })} editable={!trip.locked} />
          <TextInput style={styles.input} placeholder="Route" value={trip.route} onChangeText={v => setTrip({ ...trip, route: v })} editable={!trip.locked} />
          <TextInput style={styles.input} placeholder="Driver Name" value={trip.driverName} onChangeText={v => setTrip({ ...trip, driverName: v })} editable={!trip.locked} />
          <TextInput style={styles.input} placeholder="Conductor Name" value={trip.conductorName} onChangeText={v => setTrip({ ...trip, conductorName: v })} editable={!trip.locked} />
          <Button title={trip.locked ? 'Unlock' : 'Lock'} onPress={() => setTrip({ ...trip, locked: !trip.locked })} />
        </View>
        {/* Trip Control */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Trip Control</Text>
          {!trip.tripActive ? (
            <Button title="Start Trip" onPress={handleStartTrip} color="#1976d2" />
          ) : (
            <>
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}><Text style={styles.metricLabel}>Tickets</Text><Text style={styles.metricValue}>{totalTickets}</Text></View>
                <View style={styles.metricCard}><Text style={styles.metricLabel}>Revenue</Text><Text style={[styles.metricValue, { color: 'green' }]}>${totalRevenue.toFixed(2)}</Text></View>
                <View style={styles.metricCard}><Text style={styles.metricLabel}>Expenses</Text><Text style={[styles.metricValue, { color: 'red' }]}>$0.00</Text></View>
                <View style={styles.metricCard}><Text style={styles.metricLabel}>Profit</Text><Text style={[styles.metricValue, { color: 'green' }]}>${totalRevenue.toFixed(2)}</Text></View>
              </View>
              <Button title="End Trip" onPress={handleEndTrip} color="red" />
            </>
          )}
        </View>
        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((label, idx) => (
            <TouchableOpacity
              key={label}
              style={[styles.tabButton, tab === idx && styles.tabButtonActive]}
              onPress={() => setTab(idx)}
            >
              <Text style={[styles.tabText, tab === idx && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Tab Content */}
        {tab === 0 && renderPassengerTab()}
        {tab === 1 && <View style={styles.section}><Text style={styles.sectionHeader}>Luggage</Text><Text>Coming soon...</Text></View>}
        {tab === 2 && <View style={styles.section}><Text style={styles.sectionHeader}>Expenses</Text><Text>Coming soon...</Text></View>}
        {tab === 3 && <View style={styles.section}><Text style={styles.sectionHeader}>Manifest</Text><Text>Coming soon...</Text></View>}
      </ScrollView>
      {/* Ticket Preview Modal */}
      <Modal visible={showPreview} transparent animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {previewTicket && (
              <>
                <Text style={styles.modalHeader}>Ticket Preview</Text>
                <Text>Ticket #: {previewTicket.ticket_number}</Text>
                <Text>Passenger: {previewTicket.passenger_name}</Text>
                <Text>From: {previewTicket.origin}</Text>
                <Text>To: {previewTicket.destination}</Text>
                <Text>Fare: ${previewTicket.price}</Text>
                <Text>Discount: ${previewTicket.discount}</Text>
                <Text>Payment: {previewTicket.payment_method}</Text>
                <Text>Date: {previewTicket.date}</Text>
                <Text>Bus: {previewTicket.bus_registration}</Text>
                <Text>Driver: {previewTicket.driver}</Text>
                <Text>Conductor: {previewTicket.conductor}</Text>
                <Text>Route: {previewTicket.route}</Text>
                <Button title="Share Ticket" onPress={() => handleShareTicket(previewTicket)} />
                <Button title="Close" onPress={() => setShowPreview(false)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBar: { backgroundColor: '#fff', padding: 16, alignItems: 'flex-start', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, color: '#888' },
  section: { margin: 12, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metricCard: { flex: 1, marginHorizontal: 2, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center', padding: 8 },
  metricLabel: { fontSize: 12, color: '#888' },
  metricValue: { fontSize: 18, fontWeight: 'bold' },
  tabsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  tabButton: { flex: 1, padding: 12, backgroundColor: '#eee', alignItems: 'center', borderRadius: 8, marginHorizontal: 2 },
  tabButtonActive: { backgroundColor: '#1976d2' },
  tabText: { color: '#1976d2', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  listHeader: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  ticketItem: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 5, marginBottom: 10 },
  ticketText: { fontSize: 15 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: 300 },
  modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
});