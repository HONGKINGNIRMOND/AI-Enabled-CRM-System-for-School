const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const { getStudentGrades, calculateGPA } = require('../controllers/gradeCalculator');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Generate progress card for a student
router.get('/progress-card/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { academic_year } = req.query;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR;

        // Get student details
        const students = await query(
            `SELECT s.*, c.class_name, sec.section_name, se.roll_number
       FROM students s
       JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
       JOIN classes c ON se.class_id = c.id
       JOIN sections sec ON se.section_id = sec.id
       WHERE s.id = $1`,
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = students[0];

        // Get grades (already parameterized properly in controller)
        const grades = await getStudentGrades(studentId, year);

        // Get attendance summary
        const attendance = await query(
            `SELECT 
        SUM(total_days) as total_days,
        SUM(present_days) as present_days,
        ROUND(AVG(attendance_percentage), 2) as attendance_percentage
       FROM attendance_summary
       WHERE student_id = $1 AND academic_year = $2`,
            [studentId, year]
        );

        // Calculate GPA (already parameterized properly in controller)
        const gpaData = await calculateGPA(studentId, year);

        res.json({
            success: true,
            data: {
                student,
                grades,
                attendance: attendance[0],
                gpa: gpaData.gpa,
                academicYear: year
            }
        });
    } catch (error) {
        console.error('Generate progress card error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate progress card'
        });
    }
});

// Get class performance report
router.get('/class-performance/:classId', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { classId } = req.params;
        const { academic_year } = req.query;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR;

        // Get class details
        const classes = await query(
            'SELECT * FROM classes WHERE id = $1',
            [classId]
        );

        if (classes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Get student count
        const studentCountResult = await query(
            `SELECT COUNT(*) as student_count
       FROM student_enrollments
       WHERE class_id = $1 AND academic_year = $2 AND is_current = TRUE`,
            [classId, year]
        );
        const student_count = parseInt(studentCountResult[0].student_count);

        // Get average attendance
        const avgAttendance = await query(
            `SELECT ROUND(AVG(asm.attendance_percentage), 2) as avg_attendance
       FROM attendance_summary asm
       JOIN student_enrollments se ON asm.student_id = se.student_id
       WHERE se.class_id = $1 AND asm.academic_year = $2`,
            [classId, year]
        );

        // Get subject-wise average marks
        const subjectPerformance = await query(
            `SELECT 
        s.subject_name,
        ROUND(AVG(sg.percentage), 2) as avg_percentage,
        COUNT(sg.id) as student_count
       FROM student_grades sg
       JOIN class_subjects cs ON sg.class_subject_id = cs.id
       JOIN subjects s ON cs.subject_id = s.id
       WHERE cs.class_id = $1 AND sg.academic_year = $2
       GROUP BY s.id, s.subject_name
       ORDER BY s.subject_name`,
            [classId, year]
        );

        // Get grade distribution
        const gradeDistribution = await query(
            `SELECT 
        gr.grade_name,
        COUNT(sg.id) as count
       FROM student_grades sg
       JOIN class_subjects cs ON sg.class_subject_id = cs.id
       JOIN grading_rules gr ON sg.grade_id = gr.id
       WHERE cs.class_id = $1 AND sg.academic_year = $2
       GROUP BY gr.id, gr.grade_name
       ORDER BY gr.min_percentage DESC`,
            [classId, year]
        );

        res.json({
            success: true,
            data: {
                class: classes[0],
                studentCount: student_count,
                avgAttendance: avgAttendance[0]?.avg_attendance || 0,
                subjectPerformance,
                gradeDistribution,
                academicYear: year
            }
        });
    } catch (error) {
        console.error('Class performance report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate class performance report'
        });
    }
});

// Get attendance summary report
router.get('/attendance-summary', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { class_id, section_id, academic_year, month } = req.query;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR;

        let sql = `
      SELECT 
        se.roll_number,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        c.class_name,
        sec.section_name,
        asm.total_days,
        asm.present_days,
        asm.absent_days,
        asm.late_days,
        asm.attendance_percentage
      FROM attendance_summary asm
      JOIN students s ON asm.student_id = s.id
      JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
      JOIN classes c ON se.class_id = c.id
      JOIN sections sec ON se.section_id = sec.id
      WHERE asm.academic_year = $1
    `;
        const params = [year];
        let paramIndex = 2;

        if (class_id) {
            sql += ` AND se.class_id = $${paramIndex++}`;
            params.push(class_id);
        }

        if (section_id) {
            sql += ` AND se.section_id = $${paramIndex++}`;
            params.push(section_id);
        }

        if (month) {
            sql += ` AND asm.month = $${paramIndex++}`;
            params.push(month);
        }

        sql += ' ORDER BY c.class_name, sec.section_name, student_name';

        const summary = await query(sql, params);

        res.json({
            success: true,
            data: { summary }
        });
    } catch (error) {
        console.error('Attendance summary report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate attendance summary'
        });
    }
});

// Get academic analytics
router.get('/academic-analytics', async (req, res) => {
    try {
        const { academic_year, class_id, section_id } = req.query;
        const year = academic_year || new Date().getFullYear().toString();

        // Build WHERE clause for filtering
        let whereClause = 'WHERE s.is_active = TRUE';
        const params = [];
        let paramIndex = 1;

        if (class_id) {
            whereClause += ` AND se.class_id = $${paramIndex++}`;
            params.push(class_id);
        }

        if (section_id) {
            whereClause += ` AND se.section_id = $${paramIndex++}`;
            params.push(section_id);
        }

        // Total students count
        const totalStudentsResult = await query(
            `SELECT COUNT(DISTINCT s.id) as total_students
       FROM students s
       LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
       ${whereClause}`,
            params
        );
        const total_students = parseInt(totalStudentsResult[0].total_students);

        // Calculate average attendance properly by class/section
        // This calculates the average attendance percentage for each enrolled student
        const avgAttendanceResult = await query(
            `SELECT 
       CASE 
         WHEN COUNT(DISTINCT s.id) > 0 THEN 
           ROUND(AVG(student_attendance.rate), 2)
         ELSE 0 
       END as avg_attendance
       FROM students s
       LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
       LEFT JOIN (
         SELECT 
           student_id,
           CASE 
             WHEN COUNT(id) > 0 THEN 
               (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END)::DECIMAL / COUNT(id)) * 100
             ELSE 0 
           END as rate
         FROM attendance 
         WHERE EXTRACT(YEAR FROM attendance_date) = $${paramIndex}
         GROUP BY student_id
       ) student_attendance ON s.id = student_attendance.student_id
       ${whereClause}`,
            [...params, year]
        );

        // Calculate average performance properly by class/section
        // This calculates the average performance percentage for each student
        const avgPerformanceResult = await query(
            `SELECT 
       CASE 
         WHEN COUNT(DISTINCT s.id) > 0 THEN 
           ROUND(AVG(student_performance.rate), 2)
         ELSE 0 
       END as avg_performance
       FROM students s
       LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
       LEFT JOIN (
         SELECT 
           student_id,
           CASE 
             WHEN COUNT(id) > 0 THEN 
               AVG((marks_obtained::DECIMAL / max_marks) * 100)
             ELSE 0 
           END as rate
         FROM internal_marks 
         WHERE academic_year = $${paramIndex}
         GROUP BY student_id
       ) student_performance ON s.id = student_performance.student_id
       ${whereClause}`,
            [...params, year]
        );

        // Top performers (based on marks)
        const topPerformers = await query(
            `SELECT 
        se.roll_number,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        c.class_name,
        sec.section_name,
        ROUND(AVG((im.marks_obtained::DECIMAL / im.max_marks) * 100), 2) as avg_percentage
       FROM students s
       LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
       LEFT JOIN classes c ON se.class_id = c.id
       LEFT JOIN sections sec ON se.section_id = sec.id
       LEFT JOIN internal_marks im ON s.id = im.student_id AND im.academic_year = $${paramIndex}
       ${whereClause}
       GROUP BY s.id, se.roll_number, student_name, c.class_name, sec.section_name
       HAVING COUNT(im.id) > 0
       ORDER BY avg_percentage DESC
       LIMIT 10`,
            [...params, year]
        );

        // Low attendance students (based on actual attendance records)
        const lowAttendance = await query(
            `SELECT 
        se.roll_number,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        c.class_name,
        sec.section_name,
        CASE 
          WHEN COUNT(a.id) > 0 THEN 
            ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::DECIMAL / COUNT(a.id)) * 100, 2)
          ELSE 0 
        END as avg_attendance
       FROM students s
       LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
       LEFT JOIN classes c ON se.class_id = c.id
       LEFT JOIN sections sec ON se.section_id = sec.id
       LEFT JOIN attendance a ON s.id = a.student_id AND EXTRACT(YEAR FROM a.attendance_date) = $${paramIndex}
       ${whereClause}
       GROUP BY s.id, se.roll_number, student_name, c.class_name, sec.section_name
       HAVING COUNT(a.id) > 0 AND (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::DECIMAL / COUNT(a.id)) * 100 < 75
       ORDER BY avg_attendance ASC
       LIMIT 10`,
            [...params, year]
        );

        res.json({
            success: true,
            data: {
                totalStudents: total_students,
                avgAttendance: parseFloat(avgAttendanceResult[0]?.avg_attendance) || 0,
                avgPerformance: parseFloat(avgPerformanceResult[0]?.avg_performance) || 0,
                topPerformers,
                lowAttendance,
                academicYear: year,
                filters: {
                    class_id: class_id || null,
                    section_id: section_id || null
                }
            }
        });
    } catch (error) {
        console.error('Academic analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate analytics',
            error: error.message
        });
    }
});

// Export Class Performance Report (Excel)
router.get('/class-performance/:classId/export', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { classId } = req.params;
        const { academic_year } = req.query;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR;

        const subjects = await query(
            `SELECT s.subject_name, ROUND(AVG(sg.percentage), 2) as avg_percentage
             FROM student_grades sg
             JOIN class_subjects cs ON sg.class_subject_id = cs.id
             JOIN subjects s ON cs.subject_id = s.id
             WHERE cs.class_id = $1 AND sg.academic_year = $2
             GROUP BY s.subject_name`,
            [classId, year]
        );

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Class Performance');

        sheet.columns = [
            { header: 'Subject', key: 'subject', width: 30 },
            { header: 'Average Percentage', key: 'percentage', width: 20 }
        ];

        subjects.forEach(row => {
            sheet.addRow({ subject: row.subject_name, percentage: row.avg_percentage });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=class_performance_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

// Export Attendance Summary (Excel)
router.get('/attendance-summary/export', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { class_id, section_id, academic_year, month } = req.query;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR;

        let sql = `
            SELECT 
                se.roll_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                c.class_name,
                sec.section_name,
                asm.attendance_percentage
            FROM attendance_summary asm
            JOIN students s ON asm.student_id = s.id
            JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            JOIN classes c ON se.class_id = c.id
            JOIN sections sec ON se.section_id = sec.id
            WHERE asm.academic_year = $1
        `;
        const params = [year];
        let paramIndex = 2;

        if (class_id) { sql += ` AND se.class_id = $${paramIndex++}`; params.push(class_id); }
        if (section_id) { sql += ` AND se.section_id = $${paramIndex++}`; params.push(section_id); }
        if (month) { sql += ` AND asm.month = $${paramIndex++}`; params.push(month); }

        const data = await query(sql, params);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Attendance Summary');

        sheet.columns = [
            { header: 'Reg No', key: 'reg_no', width: 15 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Class', key: 'class', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Attendance %', key: 'percentage', width: 15 }
        ];

        data.forEach(row => {
            sheet.addRow({
                roll_no: row.roll_number,
                name: row.student_name,
                class: row.class_name,
                section: row.section_name,
                percentage: row.attendance_percentage
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_summary_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

module.exports = router;
