const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const multer = require('multer');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sendMarksNotification } = require('../services/notificationService');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }
});

// Enter marks for a student
router.post('/', authenticateToken, authorize('admin', 'teacher'), validate(schemas.marks), async (req, res) => {
    try {
        const { student_id, class_subject_id, exam_type_id, academic_year, marks_obtained, max_marks, is_absent, remarks } = req.validatedData;
        const entered_by = req.user.id;

        await query(
            `INSERT INTO internal_marks 
      (student_id, class_subject_id, exam_type_id, academic_year, marks_obtained, max_marks, is_absent, entered_by, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (student_id, class_subject_id, exam_type_id, academic_year)
      DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, is_absent = EXCLUDED.is_absent, entered_by = EXCLUDED.entered_by, remarks = EXCLUDED.remarks`,
            [student_id, class_subject_id, exam_type_id, academic_year, marks_obtained, max_marks, is_absent, entered_by, remarks]
        );

        // Fetch subject name for notification
        const subjectResult = await query(
            `SELECT s.subject_name 
             FROM class_subjects cs 
             JOIN subjects s ON cs.subject_id = s.id 
             WHERE cs.id = $1`,
            [class_subject_id]
        );

        if (subjectResult.length > 0) {
            const subjectName = subjectResult[0].subject_name;
            // Send notification asynchronously
            sendMarksNotification(student_id, subjectName, marks_obtained, max_marks)
                .catch(err => console.error('Failed to send marks notification:', err));
        }

        res.json({
            success: true,
            message: 'Marks entered successfully'
        });
    } catch (error) {
        console.error('Enter marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enter marks'
        });
    }
});

// Get marks for a student
router.get('/student/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { academic_year } = req.query;

        let sql = `
      SELECT 
        im.*,
        s.subject_name,
        et.exam_name,
        u.full_name as entered_by_name
      FROM internal_marks im
      JOIN class_subjects cs ON im.class_subject_id = cs.id
      JOIN subjects s ON cs.subject_id = s.id
      JOIN exam_types et ON im.exam_type_id = et.id
      LEFT JOIN users u ON im.entered_by = u.id
      WHERE im.student_id = $1
    `;
        const params = [id];
        let paramIndex = 2;

        if (academic_year) {
            sql += ` AND im.academic_year = $${paramIndex++}`;
            params.push(academic_year);
        }

        sql += ' ORDER BY s.subject_name, et.exam_name';

        const marks = await query(sql, params);

        res.json({
            success: true,
            data: { marks }
        });
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marks'
        });
    }
});

// Get marks for a class/subject/exam
router.get('/class/:classId/subject/:subjectId/exam/:examId', authenticateToken, async (req, res) => {
    try {
        const { classId, subjectId, examId } = req.params;
        const { section_id, academic_year } = req.query;

        // Get class_subject_id
        const classSubjects = await query(
            'SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2',
            [classId, subjectId]
        );

        if (classSubjects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subject not assigned to this class'
            });
        }

        const class_subject_id = classSubjects[0].id;

        let sql = `
            SELECT 
                im.*,
                s.id as student_id,
                s.registration_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                se.roll_number
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            LEFT JOIN internal_marks im ON s.id = im.student_id 
                AND im.class_subject_id = $1 
                AND im.exam_type_id = $2
                AND im.academic_year = $3
            WHERE se.class_id = $4
        `;
        const params = [class_subject_id, examId, academic_year || process.env.CURRENT_ACADEMIC_YEAR, classId];

        if (section_id) {
            sql += ' AND se.section_id = $5';
            params.push(section_id);
        }

        sql += ' ORDER BY se.roll_number, s.first_name';

        const marks = await query(sql, params);

        res.json({
            success: true,
            data: {
                class_subject_id,
                marks
            }
        });
    } catch (error) {
        console.error('Get class marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marks'
        });
    }
});

// Update marks
router.put('/:id', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { id } = req.params;
        const { marks_obtained, is_absent, remarks } = req.body;
        const entered_by = req.user.id;

        await query(
            `UPDATE internal_marks 
       SET marks_obtained = $1, is_absent = $2, entered_by = $3, remarks = $4, updated_at = NOW()
       WHERE id = $5`,
            [marks_obtained, is_absent, entered_by, remarks, id]
        );

        res.json({
            success: true,
            message: 'Marks updated successfully'
        });
    } catch (error) {
        console.error('Update marks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update marks'
        });
    }
});

// Bulk upload marks via Excel/CSV
router.post('/bulk-upload', authenticateToken, authorize('admin', 'teacher'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please select an Excel or CSV file.'
            });
        }

        const { class_subject_id, exam_type_id, academic_year } = req.body;
        const entered_by = req.user.id;

        // Validate file type
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Please upload Excel (.xlsx/.xls) or CSV (.csv) files only.'
            });
        }

        const marksData = [];
        const errors = [];

        // Parse file based on extension
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

                            marksData.push({
                                student_id: normalizedRow['student id'] || normalizedRow['student_id'] || null,
                                roll_number: normalizedRow['roll number'] || normalizedRow['roll_number'] || normalizedRow['roll no'] || null,
                                marks_obtained: normalizedRow['marks'] || normalizedRow['marks_obtained'] || normalizedRow['marks obtained'] || 0,
                                is_absent: normalizedRow['absent'] || normalizedRow['is_absent'] || normalizedRow['status'] === 'Absent' || false
                            });
                        } catch (err) {
                            errors.push({
                                row: marksData.length + 1,
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
                if (rowNumber === 1) return; // Skip header

                try {
                    marksData.push({
                        student_id: getVal(row, 'Student ID', 'student_id'),
                        roll_number: getVal(row, 'Roll Number', 'roll no', 'roll_number'),
                        marks_obtained: getVal(row, 'Marks', 'marks_obtained', 'marks obtained'),
                        is_absent: getVal(row, 'Absent', 'status') === 'Absent' || getVal(row, 'Absent', 'is_absent') === 'true' || false
                    });
                } catch (error) {
                    errors.push({ row: rowNumber, error: error.message });
                }
            });
        }

        let successCount = 0;
        let failCount = 0;

        // Get max marks from class_subjects
        const classSubjects = await query(
            'SELECT max_marks FROM class_subjects WHERE id = $1',
            [class_subject_id]
        );

        if (classSubjects.length === 0) {
            throw new Error('Invalid Class Subject ID');
        }

        const classSubject = classSubjects[0];

        await transaction(async (conn) => {
            for (const mark of marksData) {
                try {
                    let studentId = mark.student_id;

                    // Resolve Student ID if Roll Number is provided or student_id looks like Roll No
                    if (mark.roll_number || (typeof studentId === 'string' && isNaN(parseInt(studentId)))) {
                        const rollNo = mark.roll_number || mark.student_id;
                        const studentRes = await conn.query(
                            'SELECT s.id FROM students s JOIN student_enrollments se ON s.id = se.student_id WHERE se.roll_number = $1 AND se.is_current = TRUE',
                            [rollNo.toString()]
                        );
                        if (studentRes.length > 0) {
                            studentId = studentRes[0].id;
                        } else {
                            throw new Error(`Student with Roll No ${rollNo} not found`);
                        }
                    }

                    await conn.query(
                        `INSERT INTO internal_marks 
              (student_id, class_subject_id, exam_type_id, academic_year, marks_obtained, max_marks, is_absent, entered_by)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (student_id, class_subject_id, exam_type_id, academic_year)
              DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, is_absent = EXCLUDED.is_absent, entered_by = EXCLUDED.entered_by`,
                        [studentId, class_subject_id, exam_type_id, academic_year, mark.marks_obtained,
                            classSubject.max_marks, mark.is_absent === 'true' || mark.is_absent === true || mark.is_absent === 'Yes', entered_by]
                    );
                    successCount++;
                } catch (error) {
                    failCount++;
                    errors.push({
                        roll_number: mark.roll_number || mark.student_id,
                        error: error.message
                    });
                }
            }
        });

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
        console.error('Bulk marks upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Bulk upload failed: ' + error.message
        });
    }
});

module.exports = router;
