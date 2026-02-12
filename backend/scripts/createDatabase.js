const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
    // Connect to postgres default database first
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root',
        database: 'postgres' // Connect to default postgres database
    });

    try {
        await client.connect();
        console.log('✓ Connected to PostgreSQL server');

        // Check if database exists
        const checkDb = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [process.env.DB_NAME || 'school_crm']
        );

        if (checkDb.rows.length > 0) {
            console.log(`✓ Database "${process.env.DB_NAME}" already exists`);
        } else {
            // Create database
            await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'school_crm'}`);
            console.log(`✓ Database "${process.env.DB_NAME}" created successfully`);
        }

        await client.end();
        console.log('\n✅ Database setup complete!');
        console.log('\nNext step: Run "npm run setup" to create tables and users');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createDatabase();
