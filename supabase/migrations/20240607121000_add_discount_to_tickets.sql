-- Migration: Add discount to tickets table
ALTER TABLE tickets ADD COLUMN discount DECIMAL DEFAULT 0; 