// Ticket
export interface Ticket {
  id: string | number;
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
  synced?: boolean;
}

// Schedule
export interface Schedule {
  id: string;
  bus_id: string;
  route: string;
  departure_time: string;
  arrival_time: string;
  frequency: string;
  created_at?: string;
}

// Route
export interface Route {
  id: string;
  name: string;
  start_point: string;
  end_point: string;
  distance: number;
  fare: number;
  created_at?: string;
}

// Expense
export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  bus_id: string;
  created_at?: string;
}

// Sale
export interface Sale {
  id: string;
  date: string;
  bus_id: string;
  route: string;
  amount: number;
  payment_method: string;
  created_at?: string;
}

// Bus
export interface Bus {
  id: string;
  registration: string;
  model: string;
  capacity?: number;
  status: string;
  notes?: string;
  created_at?: string;
}

// Luggage
export interface Luggage {
  id: string;
  trip_id: string;
  description: string;
  weight: number;
  fee: number;
  passenger: string;
  created_at?: string;
}

// TripExpense
export interface TripExpense {
  id: string;
  trip_id: string;
  category: string;
  amount: number;
  description: string;
  created_at?: string;
}

// Trip
export interface Trip {
  id: string;
  bus_registration: string;
  driver: string;
  conductor: string;
  route: string;
  start_time: string;
  end_time?: string;
  status: string;
  created_at?: string;
} 
