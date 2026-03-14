const { query } = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateAcademicYear() {
    try {
        console.log('Starting academic year update to 2026-2027...');
        console.log('========================================');

        const newAcademicYear = '2026-2027';

        // Step 1: Update student_enrollments
        console.log('Step 1: Updating student_enrollments...');
        const enrollments = await query(`
            UPDATE student_enrollments 
            SET academic_year = $1
            RETURNING id
        `, [newAcademicYear]);
        console.log(`Updated ${enrollments.length} enrollment records to ${newAcademicYear}`);

        // Step 2: Update internal_marks
        console.log('Step 2: Updating internal_marks...');
        const marks = await query(`
            UPDATE internal_marks 
            SET academic_year = $1
            RETURNING id
        `, [newAcademicYear]);
        console.log(`Updated ${marks.length} marks records to ${newAcademicYear}`);

        // Step 3: Update student_grades
        console.log('Step 3: Updating student_grades...');
        const grades = await query(`
            UPDATE student_grades 
            SET academic_year = $1
            RETURNING id
        `, [newAcademicYear]);
        console.log(`Updated ${grades.length} grade records to ${newAcademicYear}`);

        // Step 4: Update fees (if exists)
        console.log('Step 4: Updating fees...');
        try {
            const fees = await query(`
                UPDATE fees 
                SET academic_year = $1
                WHERE academic_year IS NOT NULL
                RETURNING id
            `, [newAcademicYear]);
            console.log(`Updated ${fees.length} fee records to ${newAcademicYear}`);
        } catch (e) {
            console.log('Fees table might not have academic_year column, skipping...');
        }

        // Step 5: Update attendance_summary (if exists)
        console.log('Step 5: Updating attendance_summary...');
        try {
            const attendance = await query(`
                UPDATE attendance_summary 
                SET academic_year = $1
                RETURNING id
            `, [newAcademicYear]);
            console.log(`Updated ${attendance.length} attendance summary records to ${newAcademicYear}`);
        } catch (e) {
            console.log('Attendance_summary table might not exist, skipping...');
        }

        // Step 6: Verify the changes
        console.log('\nStep 6: Verifying changes...');
        const verifyEnrollments = await query('SELECT DISTINCT academic_year FROM student_enrollments');
        console.log('Student Enrollments:', verifyEnrollments.map(r => r.academic_year));

        const verifyMarks = await query('SELECT DISTINCT academic_year FROM internal_marks');
        console.log('Internal Marks:', verifyMarks.map(r => r.academic_year));

        const verifyGrades = await query('SELECT DISTINCT academic_year FROM student_grades');
        console.log('Student Grades:', verifyGrades.map(r => r.academic_year));

        console.log('\n========================================');
        console.log(`Academic Year Update Completed!`);
        console.log(`All records now use: ${newAcademicYear}`);
        console.log('========================================');

    } catch (error) {
        console.error('Academic year update failed:', error);
        console.error('Error details:', error.message);
    } finally {
        process.exit();
    }
}

updateAcademicYear();
