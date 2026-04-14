const { query } = require('../config/database');
const { refreshAttendanceSummary } = require('../utils/attendanceUtils');

async function backfill() {
    try {
        console.log('Starting attendance summary backfill...');
        
        // Find all student/month/year combinations that have attendance records
        const combinations = await query(`
            SELECT DISTINCT 
                student_id, 
                attendance_date
            FROM attendance
            ORDER BY attendance_date ASC
        `);

        console.log(`Found ${combinations.length} student-date records to process.`);

        // To avoid redundant updates for the same student/month/year
        const processed = new Set();
        let updatedCount = 0;

        for (const record of combinations) {
            const date = new Date(record.attendance_date);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const key = `${record.student_id}-${year}-${month}`;

            if (!processed.has(key)) {
                await refreshAttendanceSummary(record.student_id, record.attendance_date);
                processed.add(key);
                updatedCount++;
                if (updatedCount % 10 === 0) {
                    console.log(`Updated ${updatedCount} summaries...`);
                }
            }
        }

        console.log(`✓ Backfill completed! Updated ${updatedCount} monthly summaries.`);
        process.exit(0);
    } catch (error) {
        console.error('Backfill failed:', error);
        process.exit(1);
    }
}

backfill();
