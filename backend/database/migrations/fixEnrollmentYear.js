const { query } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixEnrollmentYear() {
    try {
        console.log('Fixing enrollment year to match marks/grades...');

        const result = await query(`
            UPDATE student_enrollments 
            SET academic_year = '2025-2026' 
            WHERE academic_year = '2026-2027'
            RETURNING id
        `);

        console.log(`Updated ${result.length} enrollment records to 2025-2026`);

        // Verify
        const verify = await query('SELECT DISTINCT academic_year FROM student_enrollments');
        console.log('Current enrollment years:', verify.map(r => r.academic_year));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixEnrollmentYear();
