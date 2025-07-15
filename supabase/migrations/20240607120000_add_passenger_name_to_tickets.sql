-- Migration: Add passenger_name to tickets table
ALTER TABLE tickets ADD COLUMN passenger_name TEXT; 