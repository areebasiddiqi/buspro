export type Ticket = {
  id: string;
  created_at: string;
  bus_registration: string;
  pickup_point: string;
  destination: string;
  price: number;
  payment_method: string;
  ticket_number: string;
  date: string;
  trip_id?: string;
};

export type Schedule = {
  id: string;
  created_at: string;
  bus_id: string;
  route: string;
  departure_time: string;
  arrival_time: string;
  frequency: string;
};

export type Route = {
  id: string;
  created_at: string;
  name: string;
  start_point: string;
  end_point: string;
  distance: number;
  fare: number;
};

export type Expense = {
  id: string;
  created_at: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  bus_id: string;
};

export type Sale = {
  id: string;
  created_at: string;
  date: string;
  bus_id: string;
  route: string;
  amount: number;
  payment_method: string;
  ticket_id: string;
};

export type Bus = {
  id: string;
  created_at: string;
  registration: string;
  model?: string;
  capacity?: number;
  status?: string;
  notes?: string;
};

export type Luggage = {
  id: string;
  created_at: string;
  ticket_id: string;
  description?: string;
  weight?: number;
  fee?: number;
  passenger?: string;
  trip_id?: string;
};

export type TripExpense = {
  id: string;
  created_at: string;
  bus_registration?: string;
  date?: string;
  category?: string;
  amount?: number;
  description?: string;
  trip_id?: string;
};

export type Trip = {
  id: string;
  created_at: string;
  bus_registration: string;
  driver?: string;
  conductor?: string;
  route?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
};