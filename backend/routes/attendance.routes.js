const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');

// Configure multer for file uploads
const upload = multer({
    dest: 'backend/uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Mark attendance (single student)
router.post('/', async (req, res) => {
    try {
        const { student_id, class_id, section_id, attendance_date, status, remarks, session = 'Morning' } = req.body;
        const marked_by = 1; // Default user ID

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
router.post('/bulk', async (req, res) => {
    try {
        const { class_id, section_id, attendance_date, attendance_records, session = 'Morning' } = req.body;
        const marked_by = 1; // Default user ID

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

// Get attendance for a student
router.get('/student/:id', async (req, res) => {
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
router.get('/class/:classId/section/:sectionId', async (req, res) => {
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
router.get('/summary', async (req, res) => {
    try {
        const { class_id, section_id, academic_year, month, start_date, end_date } = req.query;

        let sql = `
      SELECT 
        s.id as student_id,
        se.roll_number,
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

        sql += ` GROUP BY s.id, se.roll_number, s.first_name, s.last_name
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

// Bulk upload attendance via Excel/CSV
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Please upload Excel or CSV files only.'
            });
        }

        const attendanceData = [];
        const errors = [];

        // Parse file
        if (fileExt === '.csv') {
            await new Promise((resolve, reject) => {
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (row) => {
                        try {
                            const normalizedRow = {};
                            Object.keys(row).forEach(key => {
                                normalizedRow[key.toLowerCase().trim()] = row[key];
                            });

                            attendanceData.push({
                                roll_number: normalizedRow['roll number'] || normalizedRow['roll_number'] || normalizedRow['roll no'],
                                status: normalizedRow['status'],
                                date: normalizedRow['date'],
                                session: normalizedRow['session'] || 'Morning',
                                remarks: normalizedRow['remarks'] || ''
                            });
                        } catch (err) {
                            errors.push({
                                row: attendanceData.length + 1,
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

            const headerRow = worksheet.getRow(1);
            const colMap = {};
            headerRow.eachCell((cell, colNumber) => {
                const header = cell.value?.toString().toLowerCase().trim();
                colMap[header] = colNumber;
            });

            const getVal = (row, ...names) => {
                for (const name of names) {
                    const col = colMap[name.toLowerCase()];
                    if (col) return row.getCell(col).value?.toString().trim();
                }
                return null;
            };

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;

                try {
                    attendanceData.push({
                        roll_number: getVal(row, 'Roll Number', 'roll no', 'roll_number'),
                        status: getVal(row, 'Status'),
                        date: getVal(row, 'Date'),
                        session: getVal(row, 'Session') || 'Morning',
                        remarks: getVal(row, 'Remarks') || ''
                    });
                } catch (error) {
                    errors.push({
                        row: rowNumber,
                        error: error.message
                    });
                }
            });
        }

        let successCount = 0;
        let failCount = 0;
        const marked_by = 1;

        for (const record of attendanceData) {
            try {
                await transaction(async (conn) => {
                    // Find student by roll number
                    const studentRes = await conn.query(
                        `SELECT s.id, se.class_id, se.section_id 
                         FROM students s 
                         JOIN student_enrollments se ON s.id = se.student_id 
                         WHERE se.roll_number = $1 AND se.is_current = TRUE`,
                        [record.roll_number]
                    );

                    if (studentRes.length === 0) {
                        throw new Error(`Student with roll number ${record.roll_number} not found`);
                    }

                    const student = studentRes[0];

                    await conn.query(
                        `INSERT INTO attendance 
                         (student_id, class_id, section_id, attendance_date, status, marked_by, session, remarks)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                         ON CONFLICT (student_id, attendance_date, session)
                         DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by, remarks = EXCLUDED.remarks`,
                        [student.id, student.class_id, student.section_id, record.date, record.status, marked_by, record.session, record.remarks]
                    );

                });
                successCount++;
            } catch (error) {
                failCount++;
                errors.push({
                    roll_number: record.roll_number,
                    error: error.message
                });
            }
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
        console.error('Bulk upload attendance error:', error);

        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to process bulk upload',
            error: error.message
        });
    }
});

module.exports = router;