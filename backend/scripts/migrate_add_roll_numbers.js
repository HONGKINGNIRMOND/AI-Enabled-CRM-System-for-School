const { query } = require('../config/database');
const { generateRollNumberForAcademicYear } = require('../utils/rollNumberGenerator');

async function migrateAddRollNumbers() {
    try {
        console.log('Starting roll number migration...\n');

        // Get all student enrollments without roll numbers
        const enrollments = await query(`
            SELECT id, student_id, academic_year, class_id, section_id
            FROM student_enrollments
            WHERE roll_number IS NULL OR roll_number = ''
            ORDER BY academic_year, id
        `);

        console.log(`Found ${enrollments.length} enrollments without roll numbers\n`);

        if (enrollments.length === 0) {
            console.log('No enrollments need roll numbers. Migration complete!');
            process.exit(0);
        }

        let updated = 0;
        let failed = 0;

        for (const enrollment of enrollments) {
            try {
                // Generate roll number for this academic year
                const rollNumber = await generateRollNumberForAcademicYear(enrollment.academic_year);

                // Update the enrollment with the new roll number
                await query(
                    `UPDATE student_enrollments 
                     SET roll_number = $1 
                     WHERE id = $2`,
                    [rollNumber, enrollment.id]
                );

                console.log(`✓ Updated enrollment ${enrollment.id} (Student ${enrollment.student_id}, Year ${enrollment.academic_year}): ${rollNumber}`);
                updated++;
            } catch (error) {
                console.error(`✗ Failed to update enrollment ${enrollment.id}:`, error.message);
                failed++;
            }
        }

        console.log(`\n=== Migration Summary ===`);
        console.log(`Total enrollments: ${enrollments.length}`);
        console.log(`Successfully updated: ${updated}`);
        console.log(`Failed: ${failed}`);
        console.log(`\n✓ Roll number migration completed!`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
}

migrateAddRollNumbers();
