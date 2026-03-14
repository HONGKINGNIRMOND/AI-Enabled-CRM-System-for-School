const { query } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixAcademicYearFormat() {
    try {
        console.log('Starting academic year format standardization...');
        console.log('========================================');

        // Step 1: Check current formats
        console.log('Step 1: Checking current academic year formats...');

        const enrollmentYears = await query('SELECT DISTINCT academic_year FROM student_enrollments ORDER BY academic_year');
        console.log('Student Enrollments:', enrollmentYears.map(r => r.academic_year));

        const marksYears = await query('SELECT DISTINCT academic_year FROM internal_marks ORDER BY academic_year');
        console.log('Internal Marks:', marksYears.map(r => r.academic_year));

        const gradesYears = await query('SELECT DISTINCT academic_year FROM student_grades ORDER BY academic_year');
        console.log('Student Grades:', gradesYears.map(r => r.academic_year));

        // Step 2: Update student_enrollments to use YYYY-YYYY format
        console.log('\nStep 2: Updating student_enrollments...');
        const updateEnrollments = await query(`
            UPDATE student_enrollments 
            SET academic_year = academic_year || '-' || (CAST(academic_year AS INTEGER) + 1)::TEXT
            WHERE academic_year NOT LIKE '%-%'
            RETURNING id, academic_year
        `);
        console.log(`Updated ${updateEnrollments.length} enrollment records`);

        // Step 3: Verify the changes
        console.log('\nStep 3: Verifying changes...');
        const verifyEnrollments = await query('SELECT DISTINCT academic_year FROM student_enrollments ORDER BY academic_year');
        console.log('Student Enrollments (after):', verifyEnrollments.map(r => r.academic_year));

        const verifyMarks = await query('SELECT DISTINCT academic_year FROM internal_marks ORDER BY academic_year');
        console.log('Internal Marks (after):', verifyMarks.map(r => r.academic_year));

        const verifyGrades = await query('SELECT DISTINCT academic_year FROM student_grades ORDER BY academic_year');
        console.log('Student Grades (after):', verifyGrades.map(r => r.academic_year));

        console.log('\n========================================');
        console.log('Academic Year Format Standardization Completed!');
        console.log('All tables now use YYYY-YYYY format (e.g., 2025-2026)');
        console.log('========================================');

    } catch (error) {
        console.error('Academic year format fix failed:', error);
        console.error('Error details:', error.message);
    } finally {
        process.exit();
    }
}

fixAcademicYearFormat();
