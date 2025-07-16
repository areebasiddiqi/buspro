import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { initDb } from './src/services/localDbService';
import { syncTickets } from './src/services/syncservice';
import BusTicketingScreen from './src/components/BusTicketingScreen';

export default function App() {
  useEffect(() => {
    initDb();
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncTickets();
      }
    });
    return () => unsubscribe();
  }, []);

  return <BusTicketingScreen />;
}