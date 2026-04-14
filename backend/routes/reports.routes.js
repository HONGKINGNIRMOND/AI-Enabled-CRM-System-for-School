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
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';
        const yearStart = parseInt(year.split('-')[0]);
        const yearEnd = yearStart + 1;

        // Build WHERE clause for filtering
        let whereClause = 'WHERE s.is_active = TRUE';
        const params = [];
        let paramIndex = 1;

        if (class_id) {
            whereClause += ` AND se.class_id = $${paramIndex}`;
            params.push(class_id);
            paramIndex++;
        }

        if (section_id) {
            whereClause += ` AND se.section_id = $${paramIndex}`;
            params.push(section_id);
            paramIndex++;
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

        // Calculate average attendance
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
         WHERE EXTRACT(YEAR FROM attendance_date) IN ($${paramIndex}, $${paramIndex + 1})
         GROUP BY student_id
       ) student_attendance ON s.id = student_attendance.student_id
       ${whereClause}`,
            [...params, yearStart, yearEnd]
        );

        // For performance-related queries, academic year will be the next parameter
        const academicYearParamIndex = params.length + 1;

        // Calculate average performance
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
         WHERE academic_year = $${academicYearParamIndex}
         GROUP BY student_id
       ) student_performance ON s.id = student_performance.student_id
       ${whereClause}`,
            [...params, year]
        );

        // Top performers
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
       LEFT JOIN internal_marks im ON s.id = im.student_id AND im.academic_year = $${academicYearParamIndex}
       ${whereClause}
       GROUP BY s.id, se.roll_number, student_name, c.class_name, sec.section_name
       HAVING COUNT(im.id) > 0
       ORDER BY avg_percentage DESC
       LIMIT 10`,
            [...params, year]
        );

        // Low attendance students
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
       LEFT JOIN attendance a ON s.id = a.student_id AND EXTRACT(YEAR FROM a.attendance_date) IN ($${paramIndex}, $${paramIndex + 1})
       ${whereClause}
       GROUP BY s.id, se.roll_number, student_name, c.class_name, sec.section_name
       HAVING COUNT(a.id) > 0 AND (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::DECIMAL / COUNT(a.id)) * 100 < 75
       ORDER BY avg_attendance ASC
       LIMIT 10`,
            [...params, yearStart, yearEnd]
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


// Get filtered student analytics
router.get('/student-analytics', authenticateToken, authorize('admin', 'teacher', 'hod'), async (req, res) => {
    try {
        const {
            academic_year,
            class_id,
            section_id,
            min_attendance,
            max_attendance,
            min_performance,
            max_performance,
            subject_ids,
            min_subject_performance,
            max_subject_performance
        } = req.query;

        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';
        
        // Parse subject_ids if it's a string or array
        let subjectIdsArray = [];
        let filterBySubject = false;
        if (req.query.hasOwnProperty('subject_ids')) {
            filterBySubject = true;
            if (subject_ids && subject_ids !== '') {
                subjectIdsArray = Array.isArray(subject_ids) ? subject_ids : subject_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            }
        }

        let sql = `
            WITH student_attendance AS (
                SELECT 
                    student_id,
                    ROUND((SUM(present_days)::DECIMAL / NULLIF(SUM(total_days), 0)) * 100, 2) as avg_attendance
                FROM attendance_summary
                WHERE academic_year = $1
                GROUP BY student_id
            ),
            student_overall_performance AS (
                SELECT 
                    student_id,
                    ROUND(AVG(percentage), 2) as overall_percentage
                FROM student_grades
                WHERE academic_year = $1
                GROUP BY student_id
            ),
            student_subject_performance AS (
                SELECT 
                    sg.student_id,
                    JSONB_OBJECT_AGG(s.subject_name, sg.percentage) as subject_performances
                FROM student_grades sg
                JOIN class_subjects cs ON sg.class_subject_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE sg.academic_year = $1
                ${filterBySubject ? `AND s.id = ANY($2::int[])` : ''}
                GROUP BY sg.student_id
            )
            SELECT 
                s.id,
                se.roll_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                c.class_name,
                sec.section_name,
                COALESCE(sa.avg_attendance, 0) as attendance_percentage,
                COALESCE(sop.overall_percentage, 0) as overall_performance,
                COALESCE(ssp.subject_performances, '{}'::jsonb) as subject_performances
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            JOIN classes c ON se.class_id = c.id
            JOIN sections sec ON se.section_id = sec.id
            LEFT JOIN student_attendance sa ON s.id = sa.student_id
            LEFT JOIN student_overall_performance sop ON s.id = sop.student_id
            LEFT JOIN student_subject_performance ssp ON s.id = ssp.student_id
            WHERE se.academic_year = $1
        `;

        const params = [year];
        if (filterBySubject) params.push(subjectIdsArray);

        let paramIndex = params.length + 1;

        if (class_id) {
            sql += ` AND se.class_id = $${paramIndex++}`;
            params.push(class_id);
        }
        if (section_id) {
            sql += ` AND se.section_id = $${paramIndex++}`;
            params.push(section_id);
        }
        if (min_attendance) {
            sql += ` AND COALESCE(sa.avg_attendance, 0) >= $${paramIndex++}`;
            params.push(min_attendance);
        }
        if (max_attendance) {
            sql += ` AND COALESCE(sa.avg_attendance, 0) <= $${paramIndex++}`;
            params.push(max_attendance);
        }
        if (min_performance) {
            sql += ` AND COALESCE(sop.overall_percentage, 0) >= $${paramIndex++}`;
            params.push(min_performance);
        }
        if (max_performance) {
            sql += ` AND COALESCE(sop.overall_percentage, 0) <= $${paramIndex++}`;
            params.push(max_performance);
        }
        
        // Subject specific filtering (ANY match)
        if (filterBySubject && (min_subject_performance || max_subject_performance)) {
            sql += ` AND EXISTS (
                SELECT 1 
                FROM jsonb_each_text(ssp.subject_performances) as x(subject, score)
                WHERE 1=1
                ${min_subject_performance ? `AND x.score::float >= $${paramIndex++}` : ''}
                ${max_subject_performance ? `AND x.score::float <= $${paramIndex++}` : ''}
            )`;
            if (min_subject_performance) params.push(min_subject_performance);
            if (max_subject_performance) params.push(max_subject_performance);
        }

        sql += ' ORDER BY c.class_name, sec.section_name, se.roll_number';

        const data = await query(sql, params);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Student analytics report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate student analytics'
        });
    }
});

// Export Student Analytics as PDF
router.get('/student-analytics/export', authenticateToken, authorize('admin', 'teacher', 'hod'), async (req, res) => {
    try {
        const {
            academic_year,
            class_id,
            section_id,
            min_attendance,
            max_attendance,
            min_performance,
            max_performance,
            subject_ids,
            min_subject_performance,
            max_subject_performance,
            class_name,
            section_name,
            student_ids // Array of IDs for targeted export
        } = req.query;

        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';

        // Parse IDs
        const studentIdsArray = typeof student_ids === 'string' ? student_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : (Array.isArray(student_ids) ? student_ids : []);
        let subjectIdsArray = [];
        let filterBySubject = false;
        if (req.query.hasOwnProperty('subject_ids')) {
            filterBySubject = true;
            if (subject_ids && subject_ids !== '') {
                subjectIdsArray = Array.isArray(subject_ids) ? subject_ids : subject_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            }
        }

        let sql = `
            WITH student_attendance AS (
                SELECT 
                    student_id,
                    ROUND((SUM(present_days)::DECIMAL / NULLIF(SUM(total_days), 0)) * 100, 2) as avg_attendance
                FROM attendance_summary
                WHERE academic_year = $1
                GROUP BY student_id
            ),
            student_overall_performance AS (
                SELECT 
                    student_id,
                    ROUND(AVG(percentage), 2) as overall_percentage
                FROM student_grades
                WHERE academic_year = $1
                GROUP BY student_id
            ),
            student_subject_performance AS (
                SELECT 
                    sg.student_id,
                    JSONB_OBJECT_AGG(s.subject_name, sg.percentage) as subject_performances
                FROM student_grades sg
                JOIN class_subjects cs ON sg.class_subject_id = cs.id
                JOIN subjects s ON cs.subject_id = s.id
                WHERE sg.academic_year = $1
                ${filterBySubject ? `AND s.id = ANY($2::int[])` : ''}
                GROUP BY sg.student_id
            )
            SELECT 
                s.id,
                se.roll_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                c.class_name,
                sec.section_name,
                COALESCE(sa.avg_attendance, 0) as attendance_percentage,
                COALESCE(sop.overall_percentage, 0) as overall_performance,
                COALESCE(ssp.subject_performances, '{}'::jsonb) as subject_performances
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            JOIN classes c ON se.class_id = c.id
            JOIN sections sec ON se.section_id = sec.id
            LEFT JOIN student_attendance sa ON s.id = sa.student_id
            LEFT JOIN student_overall_performance sop ON s.id = sop.student_id
            LEFT JOIN student_subject_performance ssp ON s.id = ssp.student_id
            WHERE se.academic_year = $1
        `;

        const params = [year];
        if (filterBySubject) params.push(subjectIdsArray);

        let paramIndex = params.length + 1;
        if (studentIdsArray && studentIdsArray.length > 0) {
            sql += ` AND s.id = ANY($${paramIndex++}::int[])`;
            params.push(studentIdsArray);
        } else {
            if (class_id) { sql += ` AND se.class_id = $${paramIndex++}`; params.push(class_id); }
            if (section_id) { sql += ` AND se.section_id = $${paramIndex++}`; params.push(section_id); }
            if (min_attendance) { sql += ` AND COALESCE(sa.avg_attendance, 0) >= $${paramIndex++}`; params.push(min_attendance); }
            if (max_attendance) { sql += ` AND COALESCE(sa.avg_attendance, 0) <= $${paramIndex++}`; params.push(max_attendance); }
            if (min_performance) { sql += ` AND COALESCE(sop.overall_percentage, 0) >= $${paramIndex++}`; params.push(min_performance); }
            if (max_performance) { sql += ` AND COALESCE(sop.overall_performance, 0) <= $${paramIndex++}`; params.push(max_performance); }
            
            if (subjectIdsArray.length > 0 && (min_subject_performance || max_subject_performance)) {
                sql += ` AND EXISTS (
                    SELECT 1 
                    FROM jsonb_each_text(ssp.subject_performances) as x(subject, score)
                    WHERE 1=1
                    ${min_subject_performance ? `AND x.score::float >= $${paramIndex++}` : ''}
                    ${max_subject_performance ? `AND x.score::float <= $${paramIndex++}` : ''}
                )`;
                if (min_subject_performance) params.push(min_subject_performance);
                if (max_subject_performance) params.push(max_subject_performance);
            }
        }

        sql += ' ORDER BY c.class_name, sec.section_name, se.roll_number';
        const data = await query(sql, params);

        // Calculate dynamic orientation based on visible columns
        const showAttendance = req.query.show_attendance === 'true';
        const showPerformance = req.query.show_performance === 'true';
        const showSubject = req.query.show_subject === 'true';
        
        let subjectCount = 0;
        if (showSubject) {
            if (filterBySubject) {
                subjectCount = subjectIdsArray.length;
            } else if (data.length > 0 && data[0].subject_performances) {
                subjectCount = Object.keys(data[0].subject_performances).length;
            }
        }
        
        const totalBaseCols = 2 + (showAttendance ? 1 : 0) + (showPerformance ? 1 : 0);
        const orientation = (subjectCount > 2 || (subjectCount > 0 && totalBaseCols > 3)) ? 'landscape' : 'portrait';
        const docSize = 'A4';

        const doc = new PDFDocument({ margin: 30, size: docSize, layout: orientation });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=student_analytics_${year}.pdf`);
        doc.pipe(res);
        
        // Header
        const pageWidth = orientation === 'landscape' ? 841 : 595;
        doc.fontSize(20).text('Student Analytics Report', { align: 'center' });
        doc.fontSize(10).text(`Academic Year: ${year}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Class: ${class_name || 'All'}`, 40);
        doc.text(`Section: ${section_name || 'All'}`, orientation === 'landscape' ? 200 : 150);
        doc.font('Helvetica').moveDown();

        // Define base columns dynamically
        const baseCols = [
            { id: 'roll', label: 'Roll No', width: 40, value: (s) => s.roll_number || '-' },
            { id: 'name', label: 'Student Name', width: orientation === 'landscape' ? 130 : 90, value: (s) => s.student_name, truncate: true }
        ];

        if (showAttendance) {
            baseCols.push({ id: 'attd', label: 'Attd%', width: 40, value: (s) => `${s.attendance_percentage}%` });
        }
        if (showPerformance) {
            baseCols.push({ id: 'ovr', label: 'Ovr%', width: 40, value: (s) => `${s.overall_performance}%` });
        }

        // Get unique subjects for defining columns
        let selectedSubjectNames = [];
        if (showSubject) {
            if (filterBySubject && subjectIdsArray.length > 0) {
                // Fetch names for selected subject IDs to ensure all columns are present
                const subjectsInfo = await query('SELECT subject_name FROM subjects WHERE id = ANY($1::int[]) ORDER BY id', [subjectIdsArray]);
                selectedSubjectNames = subjectsInfo.map(s => s.subject_name);
            } else if (!filterBySubject) {
                // If not filtered by IDs but analysis is ON, get all subjects present in the first student's data
                if (data.length > 0 && data[0].subject_performances) {
                    selectedSubjectNames = Object.keys(data[0].subject_performances).sort();
                }
            }
        }

        // Analysis Avg Column (average of selected subjects)
        const analysisAvgCol = showSubject ? [{ label: 'Subject Analysis', width: 75 }] : [];
        
        const subjectCols = selectedSubjectNames.map(name => ({
            label: name,
            width: orientation === 'landscape' ? 70 : 55,
            name // Helper to get value
        }));

        const allCols = [...baseCols, ...analysisAvgCol, ...subjectCols];
        const rowHeight = 25;
        const startX = 40;
        let startY = doc.y + 10;
        const totalTableWidth = allCols.reduce((acc, col) => acc + col.width, 0);

        // Table Header Helper
        const drawHeader = (y) => {
            doc.rect(startX, y, totalTableWidth, rowHeight).fill('#f3f4f6').stroke('#e5e7eb');
            doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9);
            let headerX = startX + 5;
            allCols.forEach(col => {
                doc.text(col.label, headerX, y + 7, { width: col.width - 5, truncate: true });
                headerX += col.width;
            });
        };

        drawHeader(startY);
        startY += rowHeight;

        // Data Rows
        doc.font('Helvetica').fillColor('#000000').fontSize(9);
        data.forEach((student, index) => {
            if (startY > (orientation === 'landscape' ? 520 : 750)) {
                doc.addPage({ layout: orientation });
                startY = 40;
                drawHeader(startY);
                startY += rowHeight;
            }

            const rowBg = index % 2 === 0 ? '#ffffff' : '#fafafa';
            doc.rect(startX, startY, totalTableWidth, rowHeight).fill(rowBg).stroke('#f9fafb');
            
            doc.fillColor('#000000').font('Helvetica');
            let dataX = startX + 5;
            
            // Render base dynamic columns
            baseCols.forEach(col => {
                doc.text(col.value(student), dataX, startY + 7, col.truncate ? { width: col.width - 5, truncate: true } : {});
                dataX += col.width;
            });
            
            // Analysis Avg calculation
            if (showSubject) {
                if (selectedSubjectNames.length > 0) {
                    const totalScore = selectedSubjectNames.reduce((acc, name) => acc + (parseFloat(student.subject_performances[name]) || 0), 0);
                    const analysisAvg = (totalScore / selectedSubjectNames.length).toFixed(1);
                    doc.font('Helvetica-Bold').text(`${analysisAvg}%`, dataX, startY + 7); 
                } else {
                    doc.fontSize(7).font('Helvetica-Oblique').text('No Subjects', dataX, startY + 8);
                }
                doc.font('Helvetica').fontSize(9);
                dataX += analysisAvgCol[0].width;
            }

            // Subject data
            subjectCols.forEach(col => {
                const score = student.subject_performances ? student.subject_performances[col.name] : '-';
                doc.text(`${score}%`, dataX, startY + 7);
                dataX += col.width;
            });
            
            startY += rowHeight;
        });

        // Subject Wise Summary in PDF
        if (selectedSubjectNames.length > 0) {
            // Check for page break for summary
            if (startY > (orientation === 'landscape' ? 450 : 650)) {
                doc.addPage({ layout: orientation });
                startY = 40;
            } else {
                startY += 30;
            }

            doc.fontSize(14).font('Helvetica-Bold').text('Subject-Wise Average Performance', startX);
            startY = doc.y + 10;

            const summaryColWidth = 120;
            let summaryX = startX;

            selectedSubjectNames.forEach(name => {
                const avg = (data.reduce((acc, s) => acc + (parseFloat(s.subject_performances[name]) || 0), 0) / data.length).toFixed(1);
                
                // Card style for summary
                doc.rect(summaryX, startY, summaryColWidth - 10, 50).fill('#f9fafb').stroke('#e5e7eb');
                doc.fillColor('#374151').fontSize(8).font('Helvetica').text(name, summaryX + 5, startY + 10, { width: summaryColWidth - 20, truncate: true });
                doc.fillColor(parseFloat(avg) < 40 ? '#dc2626' : '#7c3aed').fontSize(14).font('Helvetica-Bold').text(`${avg}%`, summaryX + 5, startY + 25);

                summaryX += summaryColWidth;
                if (summaryX + summaryColWidth > pageWidth - 30) {
                    summaryX = startX;
                    startY += 60;
                }
            });
        }

        doc.end();
    } catch (error) {
        console.error('PDF Export error:', error);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

module.exports = router;

