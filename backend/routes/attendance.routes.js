const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }
});

// Mark attendance (single student)
router.post('/', authenticateToken, authorize('admin', 'teacher'), validate(schemas.attendance), async (req, res) => {
    try {
        const { student_id, class_id, section_id, attendance_date, status, remarks, session = 'Morning' } = req.validatedData;
        const marked_by = req.user.id;

        // PostgreSQL UPSERT syntax (ON CONFLICT)
        await query(
            `INSERT INTO attendance 
      (student_id, class_id, section_id, attendance_date, status, marked_by, remarks, session)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (student_id, attendance_date, session) 
      DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, remarks = EXCLUDED.remarks`,
            [student_id, class_id, section_id, attendance_date, status, marked_by, remarks, session]
        );

        res.json({
            success: true,
            message: 'Attendance marked successfully'
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark attendance'
        });
    }
});

// Bulk mark attendance for a class
router.post('/bulk', authenticateToken, authorize('admin', 'teacher'), validate(schemas.bulkAttendance), async (req, res) => {
    try {
        const { class_id, section_id, attendance_date, attendance_records, session = 'Morning' } = req.validatedData;
        const marked_by = req.user.id;

        await transaction(async (conn) => {
            for (const record of attendance_records) {
                await conn.query(
                    `INSERT INTO attendance 
          (student_id, class_id, section_id, attendance_date, status, marked_by, session)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (student_id, attendance_date, session)
          DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by`,
                    [record.student_id, class_id, section_id, attendance_date, record.status, marked_by, session]
                );
            }
        });

        res.json({
            success: true,
            message: `Attendance marked for ${attendance_records.length} students`
        });
    } catch (error) {
        console.error('Bulk attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark bulk attendance'
        });
    }
});

// Bulk upload attendance via Excel/CSV
router.post('/bulk-upload', authenticateToken, authorize('admin', 'teacher'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please select an Excel or CSV file.'
            });
        }

        // Validate file type
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Please upload Excel (.xlsx/.xls) or CSV (.csv) files only.'
            });
        }

        const attendanceRecords = [];
        const errors = [];
        let successCount = 0;
        let failCount = 0;
        const marked_by = req.user.id;

        // Parse file based on extension
        if (fileExt === '.csv') {
            await new Promise((resolve, reject) => {
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (row) => {
                        try {
                            attendanceRecords.push({
                                registration_number: row['Registration Number'] || row['registration_number'],
                                status: row['Status'] || row['status'] || 'Present',
                                attendance_date: row['Date'] || row['date'] || new Date().toISOString().split('T')[0],
                                session: row['Session'] || row['session'] || 'Morning',
                                remarks: row['Remarks'] || row['remarks'] || ''
                            });
                        } catch (err) {
                            errors.push({
                                row: attendanceRecords.length + 1,
                                error: err.message
                            });
                        }
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const worksheet = workbook.getWorksheet(1);

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header

                try {
                    attendanceRecords.push({
                        registration_number: row.getCell(1).value,
                        status: row.getCell(2).value || 'Present',
                        attendance_date: row.getCell(3).value || new Date().toISOString().split('T')[0],
                        session: row.getCell(4).value || 'Morning',
                        remarks: row.getCell(5).value || ''
                    });
                } catch (error) {
                    errors.push({ row: rowNumber, error: error.message });
                }
            });
        }

        // Process records
        if (attendanceRecords.length > 0) {
            await transaction(async (conn) => {
                for (const record of attendanceRecords) {
                    try {
                        if (!record.registration_number) {
                            throw new Error('Registration number is required');
                        }

                        // Find student and their current enrollment
                        const studentRes = await conn.query(
                            `SELECT s.id, se.class_id, se.section_id 
                             FROM students s
                             JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
                             WHERE s.registration_number = $1`,
                            [record.registration_number.toString()]
                        );

                        if (studentRes.length === 0) {
                            throw new Error(`Student with Reg No ${record.registration_number} not found or not active`);
                        }

                        const { id: student_id, class_id, section_id } = studentRes[0];

                        // Normalize date
                        let dateObj = new Date(record.attendance_date);
                        if (isNaN(dateObj.getTime())) {
                            dateObj = new Date(); // Fallback to today
                        }
                        const formattedDate = dateObj.toISOString().split('T')[0];

                        // Upsert attendance
                        await conn.query(
                            `INSERT INTO attendance 
                            (student_id, class_id, section_id, attendance_date, status, marked_by, session, remarks)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT (student_id, attendance_date, session)
                            DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, remarks = EXCLUDED.remarks`,
                            [
                                student_id,
                                class_id,
                                section_id,
                                formattedDate,
                                record.status,
                                marked_by,
                                record.session,
                                record.remarks
                            ]
                        );

                        successCount++;
                    } catch (error) {
                        failCount++;
                        errors.push({
                            registration_number: record.registration_number,
                            error: error.message
                        });
                    }
                }
            });
        }

        // Clean up uploaded file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            message: `Bulk upload completed: ${successCount} succeeded, ${failCount} failed`,
            data: {
                successCount,
                failCount,
                errors: errors.slice(0, 50)
            }
        });

    } catch (error) {
        console.error('Bulk attendance upload error:', error);
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk upload'
        });
    }
});

// Get attendance for a student
router.get('/student/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date } = req.query;

        let sql = `
      SELECT a.*, c.class_name, sec.section_name
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      JOIN sections sec ON a.section_id = sec.id
      WHERE a.student_id = $1
    `;
        const params = [id];
        let paramIndex = 2;

        if (start_date && end_date) {
            sql += ` AND a.attendance_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
            params.push(start_date, end_date);
        }

        sql += ' ORDER BY a.attendance_date DESC';

        const attendance = await query(sql, params);

        // Get summary
        let summarySql = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) as excused_days,
        ROUND((SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as attendance_percentage
      FROM attendance
      WHERE student_id = $1
    `;
        const summaryParams = [id];
        let summaryParamIndex = 2;

        if (start_date && end_date) {
            summarySql += ` AND attendance_date BETWEEN $${summaryParamIndex++} AND $${summaryParamIndex++}`;
            summaryParams.push(start_date, end_date);
        }

        const summary = await query(summarySql, summaryParams);

        res.json({
            success: true,
            data: {
                attendance,
                summary: summary[0]
            }
        });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance'
        });
    }
});

// Get attendance for a class/section on a specific date
router.get('/class/:classId/section/:sectionId', authenticateToken, async (req, res) => {
    try {
        const { classId, sectionId } = req.params;
        const { date, session = 'Morning' } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date parameter is required'
            });
        }

        const attendance = await query(
            `SELECT 
        a.*, 
        s.id as id,
        s.registration_number, 
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        se.roll_number
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
      LEFT JOIN attendance a ON s.id = a.student_id AND a.attendance_date = $1 AND a.session = $4
      WHERE se.class_id = $2 AND se.section_id = $3
      ORDER BY se.roll_number, s.first_name`,
            [date, classId, sectionId, session]
        );

        res.json({
            success: true,
            data: { attendance }
        });
    } catch (error) {
        console.error('Get class attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch class attendance'
        });
    }
});

// Get attendance summary
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        const { class_id, section_id, academic_year, month, start_date, end_date } = req.query;

        let sql = `
      SELECT 
        s.id as student_id,
        s.registration_number,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        COUNT(a.id) as total_days,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN a.status = 'Excused' THEN 1 ELSE 0 END) as excused_days,
        ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(a.id), 0)) * 100, 2) as attendance_percentage
      FROM students s
      JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
      LEFT JOIN attendance a ON s.id = a.student_id
      WHERE s.is_active = TRUE
    `;
        const params = [];
        let paramIndex = 1;

        if (class_id) {
            sql += ` AND se.class_id = $${paramIndex++}`;
            params.push(class_id);
        }

        if (section_id) {
            sql += ` AND se.section_id = $${paramIndex++}`;
            params.push(section_id);
        }

        if (start_date && end_date) {
            sql += ` AND a.attendance_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
            params.push(start_date, end_date);
        } else if (academic_year) {
            sql += ` AND EXTRACT(YEAR FROM a.attendance_date) = $${paramIndex++}`;
            params.push(academic_year);
        }

        if (month) {
            sql += ` AND EXTRACT(MONTH FROM a.attendance_date) = $${paramIndex++}`;
            params.push(month);
        }

        sql += ` GROUP BY s.id, s.registration_number, s.first_name, s.last_name
                ORDER BY student_name`;

        const summary = await query(sql, params);

        res.json({
            success: true,
            data: { summary }
        });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance summary'
        });
    }
});

module.exports = router;