import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type SupabaseContextType = {
  supabase: typeof supabase;
  subscribeToChanges: (table: string, callback: (payload: any) => void) => RealtimeChannel;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

type SupabaseProviderProps = {
  children: ReactNode;
};

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const subscribeToChanges = (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  };

  const value = {
    supabase,
    subscribeToChanges,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};