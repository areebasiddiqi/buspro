import * as SQLite from 'expo-sqlite';

// Open the database synchronously
const db = SQLite.openDatabaseSync('bus_ticketing.db');

// Initialize the database
export const initDb = () => {
  db.withTransactionSync(() => {
    // Use execSync for non-parameterized queries like CREATE TABLE
    db.execSync(
      `CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number TEXT,
        passenger_name TEXT,
        origin TEXT,
        destination TEXT,
        price REAL,
        discount REAL,
        payment_method TEXT,
        date TEXT,
        trip_id TEXT,
        synced INTEGER DEFAULT 0
      );`
    );
  });
};

// Add a ticket
export const addTicket = (ticket) => {
  db.withTransactionSync(() => {
    // Use runSync for parameterized INSERT queries
    db.runSync(
      `INSERT INTO tickets (ticket_number, passenger_name, origin, destination, price, discount, payment_method, date, trip_id, synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
      [
        ticket.ticket_number,
        ticket.passenger_name,
        ticket.origin,
        ticket.destination,
        ticket.price,
        ticket.discount,
        ticket.payment_method,
        ticket.date,
        ticket.trip_id,
      ]
    );
  });
};

// Get unsynced tickets
export const getUnsyncedTickets = (callback) => {
  db.withTransactionSync(() => {
    // Use getAllSync for SELECT queries
    const results = db.getAllSync(`SELECT * FROM tickets WHERE synced = 0;`);
    callback(results);
  });
};

// Mark a ticket as synced
export const markTicketSynced = (id) => {
  db.withTransactionSync(() => {
    // Use runSync for parameterized UPDATE queries
    db.runSync(`UPDATE tickets SET synced = 1 WHERE id = ?;`, [id]);
  });
};