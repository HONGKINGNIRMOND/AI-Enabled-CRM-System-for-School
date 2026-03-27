const { Pool } = require('pg');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL connection pool configuration for raw queries
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'school_crm',
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 100,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Sequelize initialization
const sequelize = new Sequelize(
  process.env.DB_NAME || 'school_crm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true // Use snake_case for automatically added fields
    }
  }
);

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully (PostgreSQL Pool)');
    client.release();
    
    await sequelize.authenticate();
    console.log('✓ Sequelize connected successfully');
    
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
    const clientQueryWrapper = async (text, params) => {
      const res = await client.query(text, params);
      return res.rows;
    };

    const mockConnection = {
      execute: async (text, params) => {
        const res = await client.query(text, params);
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
  sequelize,
  query,
  transaction,
  testConnection
};