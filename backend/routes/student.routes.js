const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }
});

// Get all students with filters
router.get('/', async (req, res) => {
    try {
        const { class_id, section_id, academic_year, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
      SELECT 
        s.id, s.registration_number, s.first_name, s.last_name,
        s.date_of_birth, s.gender, s.phone, s.email, s.is_active,
        c.class_name, sec.section_name, se.roll_number, se.academic_year,
        NULL as assigned_teacher_name
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

        if (search) {
            sql += ` AND (s.first_name ILIKE $${paramIndex} OR s.last_name ILIKE $${paramIndex} OR s.registration_number ILIKE $${paramIndex})`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern);
            paramIndex++;
        }

        sql += ` ORDER BY s.first_name, s.last_name LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), parseInt(offset));

        const students = await query(sql, params);

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM students s WHERE 1=1';
        const countParams = [];
        let countParamIndex = 1;

        // Applying same filters to count
        // Note: This is simplified; in a real app, I'd abstract the filter building.
        // Re-building logic for count query:
        if (search) {
            countSql += ` AND (s.first_name ILIKE $${countParamIndex} OR s.last_name ILIKE $${countParamIndex} OR s.registration_number ILIKE $${countParamIndex})`;
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern);
            countParamIndex++;
        }
        // Note: joins would be needed for class filters in count query too, but omitting for brevity in this specific fix unless needed.
        // Ideally we join tables in count query if filtering by class.

        // Correcting count query to include joins if filtering by class/section
        if (class_id || section_id || academic_year) {
            countSql = `
            SELECT COUNT(*) as total 
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            WHERE 1=1
        `;
            // Reset params for count query with joins
            // Reuse logic? Let's just do it cleanly.
            countParams.length = 0;
            countParamIndex = 1;

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
            if (search) {
                countSql += ` AND (s.first_name ILIKE $${countParamIndex} OR s.last_name ILIKE $${countParamIndex} OR s.registration_number ILIKE $${countParamIndex})`;
                countParams.push(`%${search}%`);
                countParamIndex++;
            }
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
        se.class_id, se.section_id,
        NULL as assigned_teacher_name, NULL as assigned_teacher_email
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
        const yearPrefix = admissionYear.toString().slice(-2); // Get last 2 digits of year

        // Find latest registration number for this year
        // We look for numbers starting with the year prefix
        const latestStudentRes = await query(
            `SELECT registration_number FROM students 
             WHERE registration_number LIKE $1 
             ORDER BY registration_number DESC LIMIT 1`,
            [`${yearPrefix}%`]
        );

        let nextSequence = 1;
        if (latestStudentRes && latestStudentRes.length > 0) {
            const lastRegNo = latestStudentRes[0].registration_number;
            // Assuming format YYNNN, parse the NNN part
            // Be careful if there are non-numeric characters or different formats from legacy data
            // We'll try to extract the last 3 digits
            const sequencePart = parseInt(lastRegNo.slice(-3));
            if (!isNaN(sequencePart)) {
                nextSequence = sequencePart + 1;
            }
        }

        // Pad with zeros to 3 digits
        const sequenceString = nextSequence.toString().padStart(3, '0');
        const newRegistrationNumber = `${yearPrefix}${sequenceString}`;

        studentData.registration_number = newRegistrationNumber;

        await transaction(async (conn) => {
            // Insert student
            const result = await conn.query(
                `INSERT INTO students 
        (registration_number, first_name, last_name, date_of_birth, gender, 
         blood_group, address, city, state, pincode, phone, email, admission_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
                    studentData.admission_date
                ]
            );

            const studentId = result[0].id;

            // If class and section are provided, create enrollment
            if (studentData.class_id && studentData.section_id) {
                const academicYear = studentData.academic_year || new Date().getFullYear().toString();

                await conn.query(
                    `INSERT INTO student_enrollments 
                    (student_id, class_id, section_id, academic_year, enrollment_date, is_current)
                    VALUES ($1, $2, $3, $4, $5, TRUE)`,
                    [
                        studentId,
                        studentData.class_id,
                        studentData.section_id,
                        academicYear,
                        studentData.admission_date
                    ]
                );
            }

            res.status(201).json({
                success: true,
                message: 'Student created successfully',
                data: {
                    studentId: studentId
                }
            });
        });
    } catch (error) {
        console.error('Create student error:', error);

        // PG duplicate key error code is 23505
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
            'address', 'city', 'state', 'pincode', 'phone', 'email', 'is_active'
        ];

        await transaction(async (conn) => {
            // 1. Update students table
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

            // 2. Update enrollment if class/section provided
            if (updates.class_id || updates.section_id) {
                // Check if current enrollment exists
                const enrollmentRes = await conn.query(
                    `SELECT id FROM student_enrollments WHERE student_id = $1 AND is_current = TRUE`,
                    [id]
                );

                if (enrollmentRes.length > 0) {
                    // Update existing current enrollment
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
                } else {
                    // Create new enrollment if none exists (rare but possible)
                    if (updates.class_id && updates.section_id) {
                        const academicYear = updates.academic_year || new Date().getFullYear().toString();
                        await conn.query(
                            `INSERT INTO student_enrollments 
                            (student_id, class_id, section_id, academic_year, enrollment_date, is_current)
                            VALUES ($1, $2, $3, $4, NOW(), TRUE)`,
                            [id, updates.class_id, updates.section_id, academicYear]
                        );
                    }
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

        const students = [];
        const errors = [];
        let successCount = 0;
        let failCount = 0;
        const academicYear = req.body.academic_year || new Date().getFullYear().toString();

        // Parse file based on extension
        if (fileExt === '.csv') {
            // Handle CSV
            const fs = require('fs');
            const csv = require('csv-parser');

            await new Promise((resolve, reject) => {
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (row) => {
                        try {
                            // Normalize keys to lowercase for case-insensitive matching
                            const normalizedRow = {};
                            Object.keys(row).forEach(key => {
                                normalizedRow[key.toLowerCase().trim()] = row[key];
                            });

                            students.push({
                                registration_number: normalizedRow['registration number'] || normalizedRow['reg no'] || null,
                                first_name: normalizedRow['first name'] || normalizedRow['firstname'],
                                last_name: normalizedRow['last name'] || normalizedRow['lastname'],
                                date_of_birth: normalizedRow['date of birth'] || normalizedRow['dob'] || null,
                                gender: normalizedRow['gender'] || 'Male',
                                blood_group: normalizedRow['blood group'] || normalizedRow['bloodgroup'] || null,
                                phone: normalizedRow['phone'] || normalizedRow['mobile'] || null,
                                email: normalizedRow['email'] || null,
                                admission_date: normalizedRow['admission date'] || normalizedRow['admission'] || new Date().toISOString().split('T')[0],
                                class_name: normalizedRow['class'] || normalizedRow['classname'] || null,
                                section_name: normalizedRow['section'] || normalizedRow['sectionname'] || null,
                                academic_year: normalizedRow['academic year'] || normalizedRow['academicyear'] || null,
                                address: normalizedRow['resident address'] || normalizedRow['address'] || null,
                                city: normalizedRow['city'] || null,
                                state: normalizedRow['state'] || null,
                                pincode: normalizedRow['pincode'] || normalizedRow['zip'] || null,
                                // Parent Info
                                parent_name: normalizedRow['parent name'] || normalizedRow['father name'] || normalizedRow['guardian name'] || null,
                                parent_phone: normalizedRow['parent phone'] || normalizedRow['father phone'] || normalizedRow['mobile'] || null,
                                parent_email: normalizedRow['parent email'] || normalizedRow['email'] || null,
                                relationship: normalizedRow['relationship'] || 'Father'
                            });
                        } catch (err) {
                            errors.push({
                                row: students.length + 1,
                                error: err.message
                            });
                        }
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            // Handle Excel
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const worksheet = workbook.getWorksheet(1);

            // Determine starting sequence for auto-generation
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

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row

                try {
                    // Generate Reg No
                    const sequenceString = nextSequence.toString().padStart(3, '0');
                    const newRegistrationNumber = `${yearPrefix}${sequenceString}`;
                    nextSequence++; // Increment for next student

                    students.push({
                        registration_number: newRegistrationNumber, // Auto-generated
                        first_name: row.getCell(1).value?.toString() || '',
                        last_name: row.getCell(2).value?.toString() || '',
                        date_of_birth: row.getCell(3).value ? new Date(row.getCell(3).value).toISOString().split('T')[0] : null,
                        gender: row.getCell(4).value?.toString() || 'Male',
                        blood_group: row.getCell(5).value?.toString() || null,
                        phone: row.getCell(6).value?.toString() || null,
                        email: row.getCell(7).value?.toString() || null,
                        admission_date: row.getCell(8).value ? new Date(row.getCell(8).value).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        class_name: row.getCell(9).value?.toString() || null,
                        section_name: row.getCell(10).value?.toString() || null,
                        academic_year: row.getCell(11).value?.toString() || academicYear,
                        address: row.getCell(12).value?.toString() || null,
                        city: row.getCell(13).value?.toString() || null,
                        state: row.getCell(14).value?.toString() || null,
                        pincode: row.getCell(15).value?.toString() || null,
                        // Parent Info (Assuming columns 16+)
                        parent_name: row.getCell(16).value?.toString() || null,
                        parent_phone: row.getCell(17).value?.toString() || null,
                        parent_email: row.getCell(18).value?.toString() || null,
                        relationship: row.getCell(19).value?.toString() || 'Father'
                    });
                } catch (error) {
                    errors.push({ row: rowNumber, error: error.message });
                }
            });
        }

        // Validate required fields
        const validStudents = [];
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            if (!student.first_name || !student.last_name) {
                errors.push({
                    row: i + 2, // +2 because 1st row is header
                    registration_number: student.registration_number || 'N/A',
                    error: 'First name and last name are required'
                });
                failCount++;
                continue;
            }
            validStudents.push(student);
        }

        // Insert students with transaction and handle enrollments
        if (validStudents.length > 0) {
            await transaction(async (conn) => {
                for (const student of validStudents) {
                    try {
                        // Insert student
                        const studentResult = await conn.query(
                            `INSERT INTO students 
              (registration_number, first_name, last_name, date_of_birth, gender, 
               blood_group, phone, email, admission_date, address, city, state, pincode)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
              ON CONFLICT (registration_number) 
              DO UPDATE SET 
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                date_of_birth = EXCLUDED.date_of_birth,
                gender = EXCLUDED.gender,
                blood_group = EXCLUDED.blood_group,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email,
                admission_date = EXCLUDED.admission_date,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                pincode = EXCLUDED.pincode
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
                                student.pincode
                            ]
                        );

                        const studentId = studentResult[0].id;
                        const targetYear = (student.academic_year || academicYear || '').trim();

                        // Handle enrollment if class and section are provided
                        if (student.class_name && student.section_name) {
                            // Get class ID - Try to match with academic year if provided
                            let classQuery = 'SELECT id, academic_year FROM classes WHERE class_name = $1';
                            let classParams = [student.class_name.trim()];

                            if (targetYear) {
                                classQuery += ' AND (academic_year = $2 OR academic_year ILIKE $3)';
                                classParams.push(targetYear, `%${targetYear}%`);
                            }

                            classQuery += ' ORDER BY academic_year DESC';

                            const classResult = await conn.query(classQuery, classParams);

                            if (classResult.length > 0) {
                                const classId = classResult[0].id;
                                const actualAcademicYear = classResult[0].academic_year;

                                // Get or create section
                                let sectionResult = await conn.query(
                                    'SELECT id FROM sections WHERE class_id = $1 AND section_name = $2',
                                    [classId, student.section_name.trim()]
                                );

                                let sectionId;
                                if (sectionResult.length > 0) {
                                    sectionId = sectionResult[0].id;
                                } else {
                                    // Create new section
                                    const newSection = await conn.query(
                                        `INSERT INTO sections (class_id, section_name, max_students, room_number)
                                         VALUES ($1, $2, 40, $3)
                                         RETURNING id`,
                                        [classId, student.section_name.trim(), `${student.class_name.trim()}-${student.section_name.trim()}`]
                                    );
                                    sectionId = newSection[0].id;
                                }

                                // Unset any other current enrollments for this student
                                await conn.query(
                                    'UPDATE student_enrollments SET is_current = FALSE WHERE student_id = $1',
                                    [studentId]
                                );

                                // Create or update enrollment for this year
                                await conn.query(
                                    `INSERT INTO student_enrollments 
                                     (student_id, class_id, section_id, academic_year, enrollment_date, is_current)
                                     VALUES ($1, $2, $3, $4, $5, TRUE)
                                     ON CONFLICT (student_id, academic_year)
                                     DO UPDATE SET 
                                       class_id = EXCLUDED.class_id,
                                       section_id = EXCLUDED.section_id,
                                       enrollment_date = EXCLUDED.enrollment_date,
                                       is_current = TRUE`,
                                    [studentId, classId, sectionId, actualAcademicYear, student.admission_date]
                                );
                            }
                        }

                        // Handle parent onboarding
                        if (student.parent_email) {
                            // 1. Ensure User account exists
                            let parentUserRes = await conn.query(
                                'SELECT id FROM users WHERE email = $1',
                                [student.parent_email.trim().toLowerCase()]
                            );

                            let parentUserId;
                            if (parentUserRes.length === 0) {
                                // Create new user for parent
                                const hashedPassword = await bcrypt.hash('Parent@123', 10);
                                const parentName = student.parent_name || 'Parent';
                                const newUser = await conn.query(
                                    `INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
                                     VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE role_name = 'parent'), TRUE)
                                     RETURNING id`,
                                    [student.parent_email.trim().toLowerCase(), student.parent_email.trim().toLowerCase(), hashedPassword, parentName]
                                );
                                parentUserId = newUser[0].id;
                            } else {
                                parentUserId = parentUserRes[0].id;
                            }

                            // 2. Ensure Parent record exists
                            let parentRes = await conn.query(
                                'SELECT id FROM parents WHERE user_id = $1',
                                [parentUserId]
                            );

                            let parentId;
                            if (parentRes.length === 0) {
                                const newParent = await conn.query(
                                    `INSERT INTO parents (user_id, first_name, last_name, email, phone, relationship)
                                     VALUES ($1, $2, $3, $4, $5, $6)
                                     RETURNING id`,
                                    [
                                        parentUserId,
                                        student.parent_name?.split(' ')[0] || 'Parent',
                                        student.parent_name?.split(' ').slice(1).join(' ') || '',
                                        student.parent_email.trim().toLowerCase(),
                                        student.parent_phone,
                                        student.relationship || 'Father'
                                    ]
                                );
                                parentId = newParent[0].id;
                            } else {
                                parentId = parentRes[0].id;
                            }

                            // 3. Link Student to Parent
                            await conn.query(
                                `INSERT INTO student_parents (student_id, parent_id, is_primary_contact)
                                 VALUES ($1, $2, TRUE)
                                 ON CONFLICT (student_id, parent_id) DO NOTHING`,
                                [studentId, parentId]
                            );
                        }

                        successCount++;
                    } catch (error) {
                        failCount++;
                        errors.push({
                            registration_number: student.registration_number,
                            error: error.message
                        });
                    }
                }
            });
        }

        res.json({
            success: true,
            message: `Bulk upload completed: ${successCount} succeeded, ${failCount} failed`,
            data: {
                successCount,
                failCount,
                totalCount: students.length,
                errors: errors.slice(0, 50) // Limit errors to prevent huge responses
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

module.exports = router;
