const { query } = require('../config/database');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function checkFeeTables() {
    try {
        const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%fee%'
        `);
        console.log('Fee-related tables:');
        console.table(tables);

        if (tables.length > 0) {
            for (const table of tables) {
                console.log(`\nColumns in ${table.table_name}:`);
                const columns = await query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = $1
                `, [table.table_name]);
                console.table(columns);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkFeeTables();
