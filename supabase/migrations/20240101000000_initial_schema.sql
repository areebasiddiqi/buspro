-- Create tables for Bus Pro application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tickets table
CREATE TABLE tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bus_registration TEXT NOT NULL,
  pickup_point TEXT NOT NULL,
  destination TEXT NOT NULL,
  price DECIMAL NOT NULL,
  payment_method TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  date TEXT NOT NULL
);

-- Buses table
CREATE TABLE buses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registration TEXT NOT NULL UNIQUE,
  model TEXT,
  capacity INTEGER,
  status TEXT DEFAULT 'active',
  notes TEXT
);

-- Schedules table
CREATE TABLE schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bus_id TEXT NOT NULL,
  route TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  frequency TEXT NOT NULL
);

-- Routes table
CREATE TABLE routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  start_point TEXT NOT NULL,
  end_point TEXT NOT NULL,
  distance DECIMAL NOT NULL,
  fare DECIMAL NOT NULL
);

-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  description TEXT,
  bus_id TEXT NOT NULL
);

-- Sales table
CREATE TABLE sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date TEXT NOT NULL,
  bus_id TEXT NOT NULL,
  route TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  payment_method TEXT NOT NULL,
  ticket_id UUID REFERENCES tickets(id)
);

-- Luggage table
CREATE TABLE luggage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ticket_id UUID REFERENCES tickets(id),
  description TEXT,
  weight DECIMAL,
  fee DECIMAL,
  passenger TEXT
);

-- Trip Expenses table
CREATE TABLE trip_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bus_registration TEXT,
  date TEXT,
  category TEXT,
  amount DECIMAL,
  description TEXT
);

-- Trips table
CREATE TABLE trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bus_registration TEXT NOT NULL,
  driver TEXT,
  conductor TEXT,
  route TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active'
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for development purposes)
-- In production, you would want to restrict access based on user authentication

-- Tickets policies
CREATE POLICY "Allow anonymous select on tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on tickets" ON tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on tickets" ON tickets FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on tickets" ON tickets FOR DELETE USING (true);

-- Schedules policies
CREATE POLICY "Allow anonymous select on schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on schedules" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on schedules" ON schedules FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on schedules" ON schedules FOR DELETE USING (true);

-- Routes policies
CREATE POLICY "Allow anonymous select on routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on routes" ON routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on routes" ON routes FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on routes" ON routes FOR DELETE USING (true);

-- Expenses policies
CREATE POLICY "Allow anonymous select on expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on expenses" ON expenses FOR DELETE USING (true);

-- Sales policies
CREATE POLICY "Allow anonymous select on sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on sales" ON sales FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on sales" ON sales FOR DELETE USING (true);

-- Add trip_id to tickets
ALTER TABLE tickets ADD COLUMN trip_id UUID REFERENCES trips(id);
-- Add trip_id to luggage
ALTER TABLE luggage ADD COLUMN trip_id UUID REFERENCES trips(id);
-- Add trip_id to trip_expenses
ALTER TABLE trip_expenses ADD COLUMN trip_id UUID REFERENCES trips(id);