const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createClassFeeStructure() {
    try {
        console.log('Creating class_fee_structure table...');

        const sql = fs.readFileSync(
            path.join(__dirname, '../../database/migrations/create_class_fee_structure.sql'),
            'utf8'
        );

        await query(sql);

        console.log('✓ class_fee_structure table created successfully');

        // Verify
        const result = await query('SELECT COUNT(*) as count FROM class_fee_structure');
        console.log(`✓ Inserted ${result[0].count} default fee structures`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createClassFeeStructure();
