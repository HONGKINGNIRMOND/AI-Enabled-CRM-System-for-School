const { query } = require('../config/database');

/**
 * Recalculates and updates the attendance summary for a specific student, month, and academic year.
 * @param {number} studentId 
 * @param {string} date - Date string (YYYY-MM-DD)
 */
async function refreshAttendanceSummary(studentId, date) {
    try {
        const attendanceDate = new Date(date);
        const month = attendanceDate.getMonth() + 1;
        const yearNum = attendanceDate.getFullYear();

        // 1. Find the academic year for this student on this date
        // We look for current enrollment as a proxy, or ideally matching the date range
        const enrollment = await query(
            `SELECT academic_year 
             FROM student_enrollments 
             WHERE student_id = $1 AND is_current = TRUE 
             LIMIT 1`,
            [studentId]
        );

        if (enrollment.length === 0) {
            console.error(`No enrollment found for student ${studentId} to update attendance summary.`);
            return;
        }

        const academicYear = enrollment[0].academic_year;

        // 2. Calculate statistics for that month
        const stats = await query(
            `SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN LOWER(status::text) = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN LOWER(status::text) = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN LOWER(status::text) = 'late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN LOWER(status::text) = 'excused' THEN 1 ELSE 0 END) as excused_days
             FROM attendance
             WHERE student_id = $1 
             AND EXTRACT(YEAR FROM attendance_date) = $2
             AND EXTRACT(MONTH FROM attendance_date) = $3`,
            [studentId, yearNum, month]
        );

        const row = stats[0];
        const total = parseInt(row.total_days) || 0;
        const present = parseInt(row.present_days) || 0;
        const absent = parseInt(row.absent_days) || 0;
        const late = parseInt(row.late_days) || 0;
        const excused = parseInt(row.excused_days) || 0;
        
        const percentage = total > 0 ? (present / total) * 100 : 0;

        // 3. Upsert into attendance_summary
        await query(
            `INSERT INTO attendance_summary 
                (student_id, academic_year, month, total_days, present_days, absent_days, late_days, excused_days, attendance_percentage)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (student_id, academic_year, month)
             DO UPDATE SET 
                total_days = EXCLUDED.total_days,
                present_days = EXCLUDED.present_days,
                absent_days = EXCLUDED.absent_days,
                late_days = EXCLUDED.late_days,
                excused_days = EXCLUDED.excused_days,
                attendance_percentage = EXCLUDED.attendance_percentage,
                updated_at = NOW()`,
            [studentId, academicYear, month, total, present, absent, late, excused, percentage.toFixed(2)]
        );

        // console.log(`✓ Attendance summary updated for student ${studentId}, month ${month}, year ${academicYear}`);
    } catch (error) {
        console.error('Error refreshing attendance summary:', error);
    }
}

module.exports = {
    refreshAttendanceSummary
};
