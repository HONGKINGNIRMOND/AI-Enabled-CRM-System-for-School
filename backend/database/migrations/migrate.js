const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
    let client;

    try {
        console.log('🔄 Starting database migration (PostgreSQL)...\n');

        // Connect to PostgreSQL
        client = new Client({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'your_password_here',
            database: process.env.DB_NAME || 'school_crm'
        });

        await client.connect();
        console.log('✓ Connected to PostgreSQL server');

        // Read schema file
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('✓ Schema file loaded');

        // Execute schema
        // Note: pg client can execute multiple statements if they are standard SQL
        // simple query execution works for multiple statements in a single string
        await client.query(schema);

        console.log('✓ Database schema created successfully');
        console.log('\n✅ Migration completed!');
        console.log('\nNext steps:');
        console.log('1. Run: node scripts/createUsers.js (to create demo users)');
        console.log('2. Start the server: npm run dev');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.end();
        }
    }
}

runMigration();
