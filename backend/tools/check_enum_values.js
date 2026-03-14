const { query } = require('../config/database');

async function checkEnumValues() {
    try {
        console.log('Checking enum values for parent_relationship...');

        const result = await query(`
            SELECT e.enumlabel
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            WHERE t.typname = 'parent_relationship'
            ORDER BY e.enumsortorder;
        `);

        console.log('\nValid parent_relationship values:');
        result.forEach(row => {
            console.log(`- ${row.enumlabel}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error checking enum values:', error);
        process.exit(1);
    }
}

checkEnumValues();
