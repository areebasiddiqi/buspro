# Bus Pro - Bus Ticketing and Management System

## Overview

Bus Pro is a comprehensive bus ticketing and management system built with React, TypeScript, Material-UI, and Supabase. It provides real-time functionality for ticket booking, bus schedule management, route management, expense tracking, and sales reporting.

## Features

- **Ticketing System**
  - Book tickets with bus registration, route selection, and payment method
  - Generate and print tickets
  - Google Maps integration for route visualization

- **Management System**
  - Schedule Management: Create and view bus schedules
  - Route Management: Define routes with pricing
  - Expense Tracking: Record and categorize expenses
  - Sales Reporting: View sales data and analytics

- **Real-time Updates**
  - All data changes are synchronized in real-time across all connected clients
  - Instant notifications for new tickets, schedules, routes, and expenses

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Supabase Setup

#### Option 1: Manual Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)

2. Create the following tables in your Supabase database:

   **tickets**
   ```sql
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
   ```

   **schedules**
   ```sql
   CREATE TABLE schedules (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     bus_id TEXT NOT NULL,
     route TEXT NOT NULL,
     departure_time TEXT NOT NULL,
     arrival_time TEXT NOT NULL,
     frequency TEXT NOT NULL
   );
   ```

   **routes**
   ```sql
   CREATE TABLE routes (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     name TEXT NOT NULL,
     start_point TEXT NOT NULL,
     end_point TEXT NOT NULL,
     distance DECIMAL NOT NULL,
     fare DECIMAL NOT NULL
   );
   ```

   **expenses**
   ```sql
   CREATE TABLE expenses (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     date TEXT NOT NULL,
     category TEXT NOT NULL,
     amount DECIMAL NOT NULL,
     description TEXT,
     bus_id TEXT NOT NULL
   );
   ```

   **sales**
   ```sql
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
   ```

3. Enable Row Level Security (RLS) for all tables and create appropriate policies

4. Get your Supabase URL and anon key from the API settings

5. Update the `src/lib/supabase.ts` file with your Supabase URL and anon key:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

#### Option 2: Automated Setup with Supabase CLI

This project includes scripts to automate the Supabase setup process using the Supabase CLI:

1. For Windows users:
   ```
   npm run supabase:setup:win
   ```
   or directly run the script:
   ```
   .\scripts\run-migrations.ps1
   ```

2. For macOS/Linux users:
   ```
   npm run supabase:setup:unix
   ```
   or directly run the script:
   ```
   ./scripts/run-migrations.sh
   ```

These scripts will:
- Install the Supabase CLI if not already installed
- Initialize a local Supabase development environment
- Start the local Supabase services
- Apply the database migrations from the `supabase/migrations` directory
- Update your `src/lib/supabase.ts` file with the local development URL and key

3. After running the script, you can access the Supabase Studio at the URL provided in the terminal output (typically http://localhost:54323)

4. To seed the database with sample data, run:
   ```
   npm run supabase:db:reset
   ```
   or directly:
   ```
   supabase db reset
   ```
   This will apply the migrations and run the seed script in `supabase/seed.sql`

### Running the Application

```
npm run dev
```

The application will be available at http://localhost:3000

## Technologies Used

- React with TypeScript
- Material-UI for UI components
- Supabase for real-time database
- Google Maps API for map integration

## Future Enhancements

- User authentication and role-based access control
- Mobile app version with React Native
- Advanced reporting and analytics
- Integration with payment gateways
- Offline support with data synchronization
#   b u s p r o  
 #   b u s p r o  
 