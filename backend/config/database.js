const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'school_crm',
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully (PostgreSQL)');
    client.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

// Execute query helper using PostgreSQL pool
async function query(text, params) {
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create a query wrapper for the client that returns rows directly
    // to match the expected interface in controllers
    const clientQueryWrapper = async (text, params) => {
      const res = await client.query(text, params);
      return res.rows; // mock [rows, fields] not needed for pg usually, just return rows
    };

    // We also need to expose the raw client execute for compatibility if needed, 
    // but better to standardise on query() returning rows.
    // Let's modify the callback signature to pass a "connection-like" object

    const mockConnection = {
      execute: async (text, params) => {
        const res = await client.query(text, params);
        // Return structure similar to mysql2: [rows, fields]
        // But simpler: just return rows object with insertId if possible
        // PG doesn't return insertId by default, need RETURNING id
        return [res.rows, res.fields];
      },
      query: clientQueryWrapper
    };

    const result = await callback(mockConnection);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};