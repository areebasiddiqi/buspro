import { supabase } from '../lib/supabase';
import type { Ticket as TicketType, Schedule as ScheduleType, Route as RouteType, Expense as ExpenseType, Sale as SaleType, Bus, Luggage, TripExpense, Trip } from '../types/database.types.ts';

// Tickets
export const getTickets = async (): Promise<TicketType[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTicket = async (ticket: Omit<TicketType, 'id' | 'created_at'>): Promise<TicketType> => {
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticket)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Schedules
export const getSchedules = async (): Promise<ScheduleType[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createSchedule = async (schedule: Omit<ScheduleType, 'id' | 'created_at'>): Promise<ScheduleType> => {
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Routes
export const getRoutes = async (): Promise<RouteType[]> => {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createRoute = async (route: Omit<RouteType, 'id' | 'created_at'>): Promise<RouteType> => {
  const { data, error } = await supabase
    .from('routes')
    .insert(route)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Expenses
export const getExpenses = async (): Promise<ExpenseType[]> => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createExpense = async (expense: Omit<ExpenseType, 'id' | 'created_at'>): Promise<ExpenseType> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Sales
export const getSales = async (): Promise<SaleType[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createSale = async (sale: Omit<SaleType, 'id' | 'created_at'>): Promise<SaleType> => {
  const { data, error } = await supabase
    .from('sales')
    .insert(sale)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Buses
export const getBuses = async () => {
  const { data, error } = await supabase
    .from('buses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createBus = async (bus) => {
  const { data, error } = await supabase
    .from('buses')
    .insert(bus)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Luggage
export const getLuggage = async (): Promise<Luggage[]> => {
  const { data, error } = await supabase
    .from('luggage')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createLuggage = async (luggage: Omit<Luggage, 'id' | 'created_at'>): Promise<Luggage> => {
  const { data, error } = await supabase
    .from('luggage')
    .insert(luggage)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Trip Expenses
export const getTripExpenses = async (): Promise<TripExpense[]> => {
  const { data, error } = await supabase
    .from('trip_expenses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createTripExpense = async (expense: Omit<TripExpense, 'id' | 'created_at'>): Promise<TripExpense> => {
  const { data, error } = await supabase
    .from('trip_expenses')
    .insert(expense)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Trips
export const getTrips = async (): Promise<Trip[]> => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createTrip = async (trip: Omit<Trip, 'id' | 'created_at'>): Promise<Trip> => {
  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single();
  if (error) throw error;
  return data;
};