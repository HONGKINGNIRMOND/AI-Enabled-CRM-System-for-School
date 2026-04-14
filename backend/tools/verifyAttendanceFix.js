const { query } = require('../config/database');

async function verify() {
    try {
        console.log('Verifying attendance summary data...');
        
        const summaryCount = await query('SELECT COUNT(*) as count FROM attendance_summary');
        console.log(`- Attendance summary records: ${summaryCount[0].count}`);

        const sampleSummary = await query('SELECT * FROM attendance_summary LIMIT 1');
        if (sampleSummary.length > 0) {
            console.log('- Sample summary record:', JSON.stringify(sampleSummary[0], null, 2));
        } else {
            console.log('! No summary records found.');
        }

        console.log('\nTesting analytics query logic...');
        // Simulate a call to student-analytics
        const year = '2026-2027'; // Based on migration
        const analytics = await query(`
            WITH student_attendance AS (
                SELECT 
                    student_id,
                    ROUND((SUM(present_days)::DECIMAL / NULLIF(SUM(total_days), 0)) * 100, 2) as avg_attendance
                FROM attendance_summary
                WHERE academic_year = $1
                GROUP BY student_id
            )
            SELECT COUNT(*) as count
            FROM student_attendance
            WHERE avg_attendance >= 0
        `, [year]);

        console.log(`- Students found in analytics: ${analytics[0].count}`);

        if (parseInt(analytics[0].count) > 0) {
            console.log('✅ SUCCESS: Attendance summaries are populated and accessible by the analytics query.');
        } else {
            console.log('❌ FAILURE: Analytics query returned no students for academic year 2026-2027.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
