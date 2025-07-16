import { getUnsyncedTickets, markTicketSynced } from './localDbService';
import { supabase } from './supabaseService';

export const syncTickets = () => {
  getUnsyncedTickets(async (unsynced) => {
    for (const ticket of unsynced) {
      const { error } = await supabase.from('tickets').insert([ticket]);
      if (!error) {
        markTicketSynced(ticket.id);
      }
    }
  });
};