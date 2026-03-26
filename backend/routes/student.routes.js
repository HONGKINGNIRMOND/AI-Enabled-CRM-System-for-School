const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { generateRollNumberForAcademicYear } = require('../utils/rollNumberGenerator');
const moment = require('moment');

// Helper to handle multiple date formats (DD-MM-YYYY, YYYY-MM-DD, etc.)
const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];
    
    const s = dateStr.toString().trim();
    if (!s) return null;

    // Try DD-MM-YYYY or DD/MM/YYYY
    const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s);
    if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
    }

    // Try YYYY-MM-DD
    const yyyymmdd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(s);
    if (yyyymmdd) {
        return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`;
    }

    // Fallback to standard JS Date
    const d = new Date(s);
    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : null;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'students-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
        }
    }
});

// Get all students with filters
router.get('/', async (req, res) => {
    try {
        const { class_id, section_id, academic_year, search, state, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
      SELECT 
        s.id, s.registration_number, s.first_name, s.last_name,
        s.date_of_birth, s.gender, s.phone, s.email, s.is_active,
        s.blood_group, s.address, s.city, s.state, s.pincode,
        c.class_name, sec.section_name, se.roll_number, se.academic_year
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE 1=1
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

        if (academic_year) {
            sql += ` AND se.academic_year = $${paramIndex++}`;
            params.push(academic_year);
        }
        
        if (state) {
            sql += ` AND s.state = $${paramIndex++}`;
            params.push(state);
        }

        if (search) {
            sql += ` AND (s.first_name ILIKE $${paramIndex} OR s.last_name ILIKE $${paramIndex} OR se.roll_number ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        sql += ` ORDER BY s.first_name, s.last_name LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), parseInt(offset));

        const students = await query(sql, params);

        // Get total count
        let countSql = `
            SELECT COUNT(*) as total 
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            WHERE 1=1
        `;
        const countParams = [];
        let countParamIndex = 1;

        if (class_id) {
            countSql += ` AND se.class_id = $${countParamIndex++}`;
            countParams.push(class_id);
        }
        if (section_id) {
            countSql += ` AND se.section_id = $${countParamIndex++}`;
            countParams.push(section_id);
        }
        if (academic_year) {
            countSql += ` AND se.academic_year = $${countParamIndex++}`;
            countParams.push(academic_year);
        }

        if (state) {
            countSql += ` AND s.state = $${countParamIndex++}`;
            countParams.push(state);
        }
        if (search) {
            countSql += ` AND (s.first_name ILIKE $${countParamIndex} OR s.last_name ILIKE $${countParamIndex} OR se.roll_number ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
            countParamIndex++;
        }

        const countResult = await query(countSql, countParams);
        const total = parseInt(countResult[0]?.total || 0);

        res.json({
            success: true,
            data: {
                students,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students'
        });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const students = await query(
            `SELECT 
        s.*, 
        c.class_name, sec.section_name, se.roll_number, se.academic_year,
        se.class_id, se.section_id
      FROM students s
      LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
      LEFT JOIN classes c ON se.class_id = c.id
      LEFT JOIN sections sec ON se.section_id = sec.id
      WHERE s.id = $1`,
            [id]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            data: {
                student: students[0]
            }
        });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student details'
        });
    }
});

// Create new student
router.post('/', async (req, res) => {
    try {
        const studentData = req.body;

        // Auto-generate Registration Number (YYNNN)
        const admissionYear = studentData.admission_date ? new Date(studentData.admission_date).getFullYear() : new Date().getFullYear();
        const yearPrefix = admissionYear.toString().slice(-2);

        const latestStudentRes = await query(
            `SELECT registration_number FROM students 
             WHERE registration_number LIKE $1 
             ORDER BY registration_number DESC LIMIT 1`,
            [`${yearPrefix}%`]
        );

        let nextSequence = 1;
        if (latestStudentRes && latestStudentRes.length > 0) {
            const lastRegNo = latestStudentRes[0].registration_number;
            const sequencePart = parseInt(lastRegNo.slice(-3));
            if (!isNaN(sequencePart)) {
                nextSequence = sequencePart + 1;
            }
        }

        const sequenceString = nextSequence.toString().padStart(3, '0');
        const newRegistrationNumber = `${yearPrefix}${sequenceString}`;
        studentData.registration_number = newRegistrationNumber;

        await transaction(async (conn) => {
            const result = await conn.query(
                `INSERT INTO students 
        (registration_number, first_name, last_name, date_of_birth, gender, 
         blood_group, address, city, state, pincode, phone, email, admission_date,
         father_name, father_phone, father_whatsapp, father_email, father_occupation,
         mother_name, mother_phone, mother_whatsapp, mother_email, mother_occupation)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING id`,
                [
                    studentData.registration_number,
                    studentData.first_name,
                    studentData.last_name,
                    studentData.date_of_birth,
                    studentData.gender,
                    studentData.blood_group || null,
                    studentData.address || null,
                    studentData.city || null,
                    studentData.state || null,
                    studentData.pincode || null,
                    studentData.phone || null,
                    studentData.email || null,
                    studentData.admission_date,
                    studentData.father_name || null,
                    studentData.father_phone || null,
                    studentData.father_whatsapp || null,
                    studentData.father_email || null,
                    studentData.father_occupation || null,
                    studentData.mother_name || null,
                    studentData.mother_phone || null,
                    studentData.mother_whatsapp || null,
                    studentData.mother_email || null,
                    studentData.mother_occupation || null
                ]
            );

            const studentId = result[0].id;

            if (studentData.class_id && studentData.section_id) {
                const academicYear = studentData.academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';

                // Generate automatic roll number
                const rollNumber = await generateRollNumberForAcademicYear(academicYear);

                await conn.query(
                    `INSERT INTO student_enrollments 
                    (student_id, class_id, section_id, academic_year, enrollment_date, is_current, roll_number)
                    VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
                    [studentId, studentData.class_id, studentData.section_id, academicYear, studentData.admission_date, rollNumber]
                );
            }

            res.status(201).json({
                success: true,
                message: 'Student created successfully',
                data: { studentId }
            });
        });
    } catch (error) {
        console.error('Create student error:', error);

        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Registration number already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create student'
        });
    }
});

// Update student
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = [
            'first_name', 'last_name', 'date_of_birth', 'gender', 'blood_group',
            'address', 'city', 'state', 'pincode', 'phone', 'email', 'is_active',
            'father_name', 'father_phone', 'father_whatsapp', 'father_email', 'father_occupation',
            'mother_name', 'mother_phone', 'mother_whatsapp', 'mother_email', 'mother_occupation'
        ];

        await transaction(async (conn) => {
            const updateFields = [];
            const values = [];
            let paramIndex = 1;

            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = $${paramIndex++}`);
                    values.push(updates[key]);
                }
            });

            if (updateFields.length > 0) {
                values.push(id);
                await conn.query(
                    `UPDATE students SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
                    values
                );
            }

            if (updates.class_id || updates.section_id) {
                const enrollmentRes = await conn.query(
                    `SELECT id FROM student_enrollments WHERE student_id = $1 AND is_current = TRUE`,
                    [id]
                );

                if (enrollmentRes.length > 0) {
                    const enrollmentId = enrollmentRes[0].id;
                    const enrollmentUpdates = [];
                    const enrollmentValues = [];
                    let eParamIndex = 1;

                    if (updates.class_id) {
                        enrollmentUpdates.push(`class_id = $${eParamIndex++}`);
                        enrollmentValues.push(updates.class_id);
                    }
                    if (updates.section_id) {
                        enrollmentUpdates.push(`section_id = $${eParamIndex++}`);
                        enrollmentValues.push(updates.section_id);
                    }

                    if (enrollmentUpdates.length > 0) {
                        enrollmentValues.push(enrollmentId);
                        await conn.query(
                            `UPDATE student_enrollments SET ${enrollmentUpdates.join(', ')} WHERE id = $${eParamIndex}`,
                            enrollmentValues
                        );
                    }
                } else if (updates.class_id && updates.section_id) {
                    const academicYear = updates.academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';

                    // Generate automatic roll number
                    const rollNumber = await generateRollNumberForAcademicYear(academicYear);

                    await conn.query(
                        `INSERT INTO student_enrollments 
                        (student_id, class_id, section_id, academic_year, enrollment_date, is_current, roll_number)
                        VALUES ($1, $2, $3, $4, NOW(), TRUE, $5)`,
                        [id, updates.class_id, updates.section_id, academicYear, rollNumber]
                    );
                }
            }
        });

        res.json({
            success: true,
            message: 'Student updated successfully'
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student'
        });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM students WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete student'
        });
    }
});

// Bulk upload students via Excel/CSV
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const students = [];
        const errors = [];
        let successCount = 0;
        let failCount = 0;
        const academicYear = req.body.academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        // Get next sequence number
        const admissionYearNum = new Date().getFullYear();
        const yearPrefix = admissionYearNum.toString().slice(-2);

        const latestStudentRes = await query(
            `SELECT registration_number FROM students 
             WHERE registration_number LIKE $1 
             ORDER BY registration_number DESC LIMIT 1`,
            [`${yearPrefix}%`]
        );

        let nextSequence = 1;
        if (latestStudentRes && latestStudentRes.length > 0) {
            const lastRegNo = latestStudentRes[0].registration_number;
            const sequencePart = parseInt(lastRegNo.slice(-3));
            if (!isNaN(sequencePart)) {
                nextSequence = sequencePart + 1;
            }
        }

        // Parse CSV file
        if (fileExt === '.csv') {
            const results = [];
            await new Promise((resolve, reject) => {
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });

            for (const row of results) {
                try {
                    const normalizedRow = {};
                    Object.keys(row).forEach(key => {
                        normalizedRow[key.toLowerCase().trim()] = row[key];
                    });

                    let regNo = normalizedRow['registration number'] || normalizedRow['reg no'];
                    if (!regNo) {
                        regNo = `${yearPrefix}${nextSequence.toString().padStart(3, '0')}`;
                        nextSequence++;
                    }

                    students.push({
                        registration_number: regNo,
                        first_name: normalizedRow['first name'] || normalizedRow['firstname'],
                        last_name: normalizedRow['last name'] || normalizedRow['lastname'],
                        date_of_birth: parseDateString(normalizedRow['date of birth'] || normalizedRow['dob']),
                        gender: normalizedRow['gender'] || 'Male',
                        blood_group: normalizedRow['blood group'] || null,
                        phone: normalizedRow['phone'] || null,
                        email: normalizedRow['email'] || null,
                        admission_date: parseDateString(normalizedRow['admission date']) || new Date().toISOString().split('T')[0],
                        class_name: normalizedRow['class'] || null,
                        section_name: normalizedRow['section'] || null,
                        academic_year: normalizedRow['academic year'] || academicYear,
                        address: normalizedRow['address'] || null,
                        city: normalizedRow['city'] || null,
                        state: normalizedRow['state'] || null,
                        pincode: normalizedRow['pincode'] || null,
                        father_name: normalizedRow['father name'] || normalizedRow['father_name'] || null,
                        father_phone: normalizedRow['father phone'] || normalizedRow['father_phone'] || null,
                        father_whatsapp: normalizedRow['father whatsapp'] || normalizedRow['father_whatsapp'] || null,
                        father_email: normalizedRow['father email'] || normalizedRow['father_email'] || null,
                        father_occupation: normalizedRow['father occupation'] || normalizedRow['father_occupation'] || null,
                        mother_name: normalizedRow['mother name'] || normalizedRow['mother_name'] || null,
                        mother_phone: normalizedRow['mother phone'] || normalizedRow['mother_phone'] || null,
                        mother_whatsapp: normalizedRow['mother whatsapp'] || normalizedRow['mother_whatsapp'] || null,
                        mother_email: normalizedRow['mother email'] || normalizedRow['mother_email'] || null,
                        mother_occupation: normalizedRow['mother occupation'] || normalizedRow['mother_occupation'] || null
                    });
                } catch (err) {
                    errors.push({ row: results.indexOf(row) + 2, error: err.message });
                }
            }
        } else {
            // Parse Excel file
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
                    let regNo = getVal(row, 'Registration Number', 'Reg No');
                    if (!regNo) {
                        regNo = `${yearPrefix}${nextSequence.toString().padStart(3, '0')}`;
                        nextSequence++;
                    }

                    students.push({
                        registration_number: regNo,
                        first_name: getVal(row, 'First Name', 'FirstName') || '',
                        last_name: getVal(row, 'Last Name', 'LastName') || '',
                        date_of_birth: parseDateString(getVal(row, 'Date of Birth', 'DOB')),
                        gender: getVal(row, 'Gender') || 'Male',
                        blood_group: getVal(row, 'Blood Group') || null,
                        phone: getVal(row, 'Phone') || null,
                        email: getVal(row, 'Email') || null,
                        admission_date: parseDateString(getVal(row, 'Admission Date')) || new Date().toISOString().split('T')[0],
                        class_name: getVal(row, 'Class') || null,
                        section_name: getVal(row, 'Section') || null,
                        academic_year: getVal(row, 'Academic Year') || academicYear,
                        address: getVal(row, 'Address') || null,
                        city: getVal(row, 'City') || null,
                        state: getVal(row, 'State') || null,
                        pincode: getVal(row, 'Pincode') || null,
                        father_name: getVal(row, 'Father Name') || null,
                        father_phone: getVal(row, 'Father Phone') || null,
                        father_whatsapp: getVal(row, 'Father WhatsApp') || null,
                        father_email: getVal(row, 'Father Email') || null,
                        father_occupation: getVal(row, 'Father Occupation') || null,
                        mother_name: getVal(row, 'Mother Name') || null,
                        mother_phone: getVal(row, 'Mother Phone') || null,
                        mother_whatsapp: getVal(row, 'Mother WhatsApp') || null,
                        mother_email: getVal(row, 'Mother Email') || null,
                        mother_occupation: getVal(row, 'Mother Occupation') || null
                    });
                } catch (error) {
                    errors.push({ row: rowNumber, error: error.message });
                }
            });
        }

        // Validate and insert students
        const validStudents = students.filter(s => s.first_name && s.last_name);
        failCount = students.length - validStudents.length;

        if (validStudents.length > 0) {
            // Initialize roll number counters per academic year
            const rollNumberCounters = {};

            for (const student of validStudents) {
                try {
                    await transaction(async (conn) => {
                        const studentResult = await conn.query(
                            `INSERT INTO students 
              (registration_number, first_name, last_name, date_of_birth, gender, 
               blood_group, phone, email, admission_date, address, city, state, pincode,
               father_name, father_phone, father_whatsapp, father_email, father_occupation,
               mother_name, mother_phone, mother_whatsapp, mother_email, mother_occupation)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
              ON CONFLICT (registration_number) 
              DO UPDATE SET 
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                father_name = EXCLUDED.father_name,
                father_phone = EXCLUDED.father_phone,
                father_whatsapp = EXCLUDED.father_whatsapp,
                father_email = EXCLUDED.father_email,
                father_occupation = EXCLUDED.father_occupation,
                mother_name = EXCLUDED.mother_name,
                mother_phone = EXCLUDED.mother_phone,
                mother_whatsapp = EXCLUDED.mother_whatsapp,
                mother_email = EXCLUDED.mother_email,
                mother_occupation = EXCLUDED.mother_occupation
              RETURNING id`,
                            [
                                student.registration_number,
                                student.first_name,
                                student.last_name,
                                student.date_of_birth,
                                student.gender,
                                student.blood_group,
                                student.phone,
                                student.email,
                                student.admission_date,
                                student.address,
                                student.city,
                                student.state,
                                student.pincode,
                                student.father_name,
                                student.father_phone,
                                student.father_whatsapp,
                                student.father_email,
                                student.father_occupation,
                                student.mother_name,
                                student.mother_phone,
                                student.mother_whatsapp,
                                student.mother_email,
                                student.mother_occupation
                            ]
                        );

                        const studentId = studentResult[0].id;

                        if (student.class_name && student.section_name) {
                            const classResult = await conn.query(
                                'SELECT id FROM classes WHERE class_name = $1 ORDER BY academic_year DESC LIMIT 1',
                                [student.class_name.trim()]
                            );

                            if (classResult.length > 0) {
                                const classId = classResult[0].id;

                                let sectionResult = await conn.query(
                                    'SELECT id FROM sections WHERE class_id = $1 AND section_name = $2',
                                    [classId, student.section_name.trim()]
                                );

                                let sectionId;
                                if (sectionResult.length > 0) {
                                    sectionId = sectionResult[0].id;
                                } else {
                                    const newSection = await conn.query(
                                        `INSERT INTO sections (class_id, section_name, max_students)
                                         VALUES ($1, $2, 40) RETURNING id`,
                                        [classId, student.section_name.trim()]
                                    );
                                    sectionId = newSection[0].id;
                                }

                                await conn.query(
                                    'UPDATE student_enrollments SET is_current = FALSE WHERE student_id = $1',
                                    [studentId]
                                );

                                // Check if student already has an enrollment for this academic year
                                const existingEnrollment = await conn.query(
                                    'SELECT roll_number FROM student_enrollments WHERE student_id = $1 AND academic_year = $2',
                                    [studentId, student.academic_year]
                                );

                                let rollNumber;
                                if (existingEnrollment.length > 0) {
                                    // Use existing roll number
                                    rollNumber = existingEnrollment[0].roll_number;
                                } else {
                                    // Initialize counter for this academic year if not done yet
                                    if (!rollNumberCounters[student.academic_year]) {
                                        const year = parseInt(student.academic_year.split('-')[0]);
                                        const yearPrefix = year.toString().slice(-2);

                                        const result = await conn.query(
                                            `SELECT roll_number 
                                             FROM student_enrollments 
                                             WHERE roll_number LIKE $1 
                                             ORDER BY roll_number DESC 
                                             LIMIT 1`,
                                            [`${yearPrefix}%`]
                                        );

                                        let nextSequence = 1;
                                        if (result && result.length > 0) {
                                            const lastRollNumber = result[0].roll_number;
                                            const sequencePart = parseInt(lastRollNumber.slice(-3));
                                            if (!isNaN(sequencePart)) {
                                                nextSequence = sequencePart + 1;
                                            }
                                        }

                                        rollNumberCounters[student.academic_year] = {
                                            yearPrefix,
                                            nextSequence
                                        };
                                    }

                                    // Generate roll number from counter
                                    const counter = rollNumberCounters[student.academic_year];
                                    const sequenceString = counter.nextSequence.toString().padStart(3, '0');
                                    rollNumber = `${counter.yearPrefix}${sequenceString}`;
                                    counter.nextSequence++;
                                }

                                await conn.query(
                                    `INSERT INTO student_enrollments 
                                     (student_id, class_id, section_id, academic_year, enrollment_date, is_current, roll_number)
                                     VALUES ($1, $2, $3, $4, $5, TRUE, $6)
                                     ON CONFLICT (student_id, academic_year)
                                     DO UPDATE SET 
                                       class_id = EXCLUDED.class_id,
                                       section_id = EXCLUDED.section_id,
                                       is_current = TRUE`,
                                    [studentId, classId, sectionId, student.academic_year, student.admission_date, rollNumber]
                                );
                            }
                        }

                    });

                    successCount++;
                } catch (error) {
                    failCount++;
                    errors.push({
                        registration_number: student.registration_number,
                        error: error.message
                    });
                }
            }
        }

        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({
            success: true,
            message: `Bulk upload completed: ${successCount} succeeded, ${failCount} failed`,
            data: {
                successCount,
                failCount,
                totalCount: students.length,
                errors: errors.slice(0, 50)
            }
        });
    } catch (error) {
        console.error('Bulk upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Bulk upload failed: ' + error.message
        });
    }
});

// Bulk delete students
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid IDs' });
        }

        await query('DELETE FROM students WHERE id = ANY($1)', [ids]);

        res.json({
            success: true,
            message: `Successfully deleted ${ids.length} students`
        });
    } catch (error) {
        console.error('Bulk delete students error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete students' });
    }
});

module.exports = router;
