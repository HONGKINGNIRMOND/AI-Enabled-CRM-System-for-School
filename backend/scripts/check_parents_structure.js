const { query } = require('../config/database');

async function checkParentsStructure() {
    try {
        console.log('Checking parents table structure...');

        const result = await query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'parents'
            ORDER BY ordinal_position;
        `);

        console.log('\nParents table columns:');
        result.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error checking parents structure:', error);
        process.exit(1);
    }
}

checkParentsStructure();
