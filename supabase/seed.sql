-- Seed data for Bus Pro application

-- Sample Routes
INSERT INTO routes (name, start_point, end_point, distance, fare)
VALUES
  ('Harare-Bulawayo Express', 'Harare', 'Bulawayo', 439.0, 25.0),
  ('Harare-Mutare Local', 'Harare', 'Mutare', 263.0, 15.0),
  ('Bulawayo-Victoria Falls', 'Bulawayo', 'Victoria Falls', 439.0, 30.0),
  ('Harare-Masvingo Direct', 'Harare', 'Masvingo', 292.0, 18.0),
  ('Gweru-Kwekwe Shuttle', 'Gweru', 'Kwekwe', 67.0, 5.0);

-- Sample Schedules
INSERT INTO schedules (bus_id, route, departure_time, arrival_time, frequency)
VALUES
  ('ZW1234', 'Harare-Bulawayo Express', '06:00', '12:30', 'Daily'),
  ('ZW5678', 'Harare-Mutare Local', '07:30', '11:45', 'Weekdays'),
  ('ZW9012', 'Bulawayo-Victoria Falls', '08:00', '15:00', 'Mon,Wed,Fri'),
  ('ZW3456', 'Harare-Masvingo Direct', '09:15', '13:30', 'Daily'),
  ('ZW7890', 'Gweru-Kwekwe Shuttle', '10:00', '11:15', 'Hourly');

-- Sample Expenses
INSERT INTO expenses (date, category, amount, description, bus_id)
VALUES
  ('2023-01-15', 'Fuel', 120.50, 'Diesel refill', 'ZW1234'),
  ('2023-01-16', 'Maintenance', 75.00, 'Oil change', 'ZW5678'),
  ('2023-01-17', 'Salary', 500.00, 'Driver payment', 'ZW9012'),
  ('2023-01-18', 'Fuel', 135.75, 'Diesel refill', 'ZW3456'),
  ('2023-01-19', 'Other', 25.00, 'Cleaning supplies', 'ZW7890');

-- Sample Tickets and Sales
-- Note: We need to insert tickets first, then sales with the ticket IDs

-- First ticket and sale
WITH ticket1 AS (
  INSERT INTO tickets (bus_registration, pickup_point, destination, price, payment_method, ticket_number, date)
  VALUES ('ZW1234', 'Harare', 'Bulawayo', 25.0, 'Cash', 'TKT-001-2023', '2023-01-20')
  RETURNING id
)
INSERT INTO sales (date, bus_id, route, amount, payment_method, ticket_id)
SELECT '2023-01-20', 'ZW1234', 'Harare-Bulawayo Express', 25.0, 'Cash', id FROM ticket1;

-- Second ticket and sale
WITH ticket2 AS (
  INSERT INTO tickets (bus_registration, pickup_point, destination, price, payment_method, ticket_number, date)
  VALUES ('ZW5678', 'Harare', 'Mutare', 15.0, 'Mobile Money', 'TKT-002-2023', '2023-01-21')
  RETURNING id
)
INSERT INTO sales (date, bus_id, route, amount, payment_method, ticket_id)
SELECT '2023-01-21', 'ZW5678', 'Harare-Mutare Local', 15.0, 'Mobile Money', id FROM ticket2;

-- Third ticket and sale
WITH ticket3 AS (
  INSERT INTO tickets (bus_registration, pickup_point, destination, price, payment_method, ticket_number, date)
  VALUES ('ZW9012', 'Bulawayo', 'Victoria Falls', 30.0, 'Card', 'TKT-003-2023', '2023-01-22')
  RETURNING id
)
INSERT INTO sales (date, bus_id, route, amount, payment_method, ticket_id)
SELECT '2023-01-22', 'ZW9012', 'Bulawayo-Victoria Falls', 30.0, 'Card', id FROM ticket3;

-- Fourth ticket and sale
WITH ticket4 AS (
  INSERT INTO tickets (bus_registration, pickup_point, destination, price, payment_method, ticket_number, date)
  VALUES ('ZW3456', 'Harare', 'Masvingo', 18.0, 'Cash', 'TKT-004-2023', '2023-01-23')
  RETURNING id
)
INSERT INTO sales (date, bus_id, route, amount, payment_method, ticket_id)
SELECT '2023-01-23', 'ZW3456', 'Harare-Masvingo Direct', 18.0, 'Cash', id FROM ticket4;

-- Fifth ticket and sale
WITH ticket5 AS (
  INSERT INTO tickets (bus_registration, pickup_point, destination, price, payment_method, ticket_number, date)
  VALUES ('ZW7890', 'Gweru', 'Kwekwe', 5.0, 'Mobile Money', 'TKT-005-2023', '2023-01-24')
  RETURNING id
)
INSERT INTO sales (date, bus_id, route, amount, payment_method, ticket_id)
SELECT '2023-01-24', 'ZW7890', 'Gweru-Kwekwe Shuttle', 5.0, 'Mobile Money', id FROM ticket5;