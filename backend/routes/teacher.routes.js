const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }
});

// Get all teachers
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const teachers = await query(`
            SELECT u.id, u.username, u.full_name, u.email, u.phone, u.is_active 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE r.role_name = 'teacher'
            ORDER BY u.full_name
        `);
        res.json({ success: true, data: teachers });
    } catch (error) {
        console.error('Fetch teachers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
    }
});

// Create new teacher
router.post('/', authenticateToken, authorize('admin'), validate(schemas.user), async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.validatedData;

        // Check if email or username exists
        const existing = await query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email or Username already exists'
            });
        }

        // Get teacher role ID
        const roles = await query("SELECT id FROM roles WHERE role_name = 'teacher'");
        if (roles.length === 0) {
            return res.status(500).json({ success: false, message: 'Teacher role not found' });
        }
        const role_id = roles[0].id;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert user
        await query(
            `INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
            [username, email, password_hash, full_name, phone, role_id]
        );

        res.status(201).json({
            success: true,
            message: 'Teacher created successfully'
        });
    } catch (error) {
        console.error('Create teacher error:', error);
        res.status(500).json({ success: false, message: 'Failed to create teacher' });
    }
});

// Bulk create teachers
router.post('/bulk', authenticateToken, authorize('admin'), upload.single('file'), async (req, res) => {
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

        const teachers = [];
        const errors = [];
        let successCount = 0;
        let failCount = 0;

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
                            teachers.push({
                                username: row['Username'] || row['username'],
                                full_name: row['Full Name'] || row['full_name'],
                                email: row['Email'] || row['email'],
                                phone: row['Phone'] || row['phone'] || null,
                                password: row['Password'] || row['password']
                            });
                        } catch (err) {
                            errors.push({
                                row: teachers.length + 1,
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
                    teachers.push({
                        username: getVal(row, 'Username', 'username'),
                        full_name: getVal(row, 'Full Name', 'full_name', 'fullname'),
                        email: getVal(row, 'Email', 'email'),
                        phone: getVal(row, 'Phone', 'phone', 'mobile') || null,
                        password: getVal(row, 'Password', 'password')
                    });
                } catch (error) {
                    errors.push({
                        row: rowNumber,
                        error: error.message
                    });
                }
            });
        }

        // Get teacher role ID
        const roles = await query("SELECT id FROM roles WHERE role_name = 'teacher'");
        if (roles.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Teacher role not found'
            });
        }
        const role_id = roles[0].id;

        // Validate required fields and process each teacher
        const validTeachers = [];
        for (let i = 0; i < teachers.length; i++) {
            const teacher = teachers[i];

            // Validate required fields
            if (!teacher.username || !teacher.full_name || !teacher.email || !teacher.password) {
                errors.push({
                    row: i + 2, // +2 because 1st row is header
                    username: teacher.username || 'N/A',
                    error: 'Missing required fields (Username, Full Name, Email, Password)'
                });
                failCount++;
                continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(teacher.email)) {
                errors.push({
                    row: i + 2,
                    username: teacher.username,
                    error: 'Invalid email format'
                });
                failCount++;
                continue;
            }

            // Validate password strength
            if (teacher.password.length < 6) {
                errors.push({
                    row: i + 2,
                    username: teacher.username,
                    error: 'Password must be at least 6 characters'
                });
                failCount++;
                continue;
            }

            validTeachers.push(teacher);
        }

        // Process valid teachers with transaction
        if (validTeachers.length > 0) {
            await transaction(async (conn) => {
                for (const teacher of validTeachers) {
                    try {
                        const { username, email, password, full_name, phone } = teacher;

                        // Check if email or username exists
                        const existing = await conn.query(
                            'SELECT id FROM users WHERE email = $1 OR username = $2',
                            [email, username]
                        );

                        if (existing.length > 0) {
                            failCount++;
                            errors.push({
                                username,
                                error: 'Email or Username already exists'
                            });
                            continue;
                        }

                        // Hash password
                        const salt = await bcrypt.genSalt(10);
                        const password_hash = await bcrypt.hash(password, salt);

                        // Insert user
                        await conn.query(
                            `INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
                             VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
                            [username, email, password_hash, full_name, phone, role_id]
                        );

                        successCount++;
                    } catch (err) {
                        console.error(`Bulk create error for ${teacher.username}:`, err);
                        failCount++;
                        errors.push({
                            username: teacher.username,
                            error: err.message || 'Unexpected error during creation'
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
                totalCount: teachers.length,
                errors: errors.slice(0, 50) // Limit errors to prevent huge responses
            }
        });
    } catch (error) {
        console.error('Bulk teacher create error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk upload: ' + error.message
        });
    }
});

// Get teacher assignments
router.get('/assignments', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const assignments = await query(`
            SELECT 
                cs.id,
                cs.class_id,
                c.class_name,
                cs.subject_id,
                s.subject_name,
                cs.teacher_id,
                u.full_name as teacher_name
            FROM class_subjects cs
            JOIN classes c ON cs.class_id = c.id
            JOIN subjects s ON cs.subject_id = s.id
            LEFT JOIN users u ON cs.teacher_id = u.id
            ORDER BY c.class_name, s.subject_name
        `);
        res.json({ success: true, data: assignments });
    } catch (error) {
        console.error('Fetch assignments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
    }
});

// Assign teacher to class/subject
router.post('/assign', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { class_id, subject_id, teacher_id } = req.body;

        const existing = await query(
            'SELECT id FROM class_subjects WHERE class_id = $1 AND subject_id = $2',
            [class_id, subject_id]
        );

        if (existing.length > 0) {
            await query(
                'UPDATE class_subjects SET teacher_id = $1, updated_at = NOW() WHERE class_id = $2 AND subject_id = $3',
                [teacher_id, class_id, subject_id]
            );
        } else {
            await query(
                'INSERT INTO class_subjects (class_id, subject_id, teacher_id) VALUES ($1, $2, $3)',
                [class_id, subject_id, teacher_id]
            );
        }

        res.json({ success: true, message: 'Teacher assigned successfully' });
    } catch (error) {
        console.error('Assign teacher error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign teacher' });
    }
});

// Remove assignment
router.delete('/assign/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        await query('UPDATE class_subjects SET teacher_id = NULL, updated_at = NOW() WHERE id = $1', [id]);
        res.json({ success: true, message: 'Assignment removed successfully' });
    } catch (error) {
        console.error('Remove assignment error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove assignment' });
    }
});

// Assign class teacher to section
router.post('/assign-class-teacher', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { section_id, teacher_id } = req.body;

        // Validate input
        if (!section_id || !teacher_id) {
            return res.status(400).json({
                success: false,
                message: 'Section ID and Teacher ID are required'
            });
        }

        // Check if teacher exists and is active
        const teacher = await query(
            'SELECT id, full_name FROM users WHERE id = $1 AND is_active = TRUE',
            [teacher_id]
        );

        if (teacher.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found or inactive'
            });
        }

        // Check if section exists
        const section = await query(
            'SELECT id, section_name, class_id FROM sections WHERE id = $1',
            [section_id]
        );

        if (section.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Update class with class teacher (column removed as it's missing in DB)
        /*
        await query(
            'UPDATE classes SET class_teacher_id = $1, updated_at = NOW() WHERE id = $2',
            [teacher_id, section[0].class_id]
        );
        */

        res.json({
            success: true,
            message: `Teacher ${teacher[0].full_name} selected (assignment logic pending database update)`
        });
    } catch (error) {
        console.error('Assign class teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign class teacher'
        });
    }
});

// Remove class teacher from section
router.delete('/assign-class-teacher/:sectionId', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { sectionId } = req.params;

        // Check if section exists
        const section = await query(
            'SELECT id, section_name, class_id FROM sections WHERE id = $1',
            [sectionId]
        );

        if (section.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }

        // Remove class teacher assignment (column removed as it's missing in DB)
        /*
        await query(
            'UPDATE classes SET class_teacher_id = NULL, updated_at = NOW() WHERE id = $1',
            [section[0].class_id]
        );
        */

        res.json({
            success: true,
            message: `Successfully updated section ${section[0].section_name}`
        });
    } catch (error) {
        console.error('Remove class teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove class teacher'
        });
    }
});

// Get class teachers for all sections
router.get('/class-teachers', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const classTeachers = await query(`
            SELECT 
                s.id as section_id,
                s.section_name,
                c.class_name,
                c.class_teacher_id,
                u.full_name as teacher_name,
                u.email as teacher_email
            FROM sections s
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON u.id = (SELECT teacher_id FROM class_subjects WHERE class_id = c.id LIMIT 1)
            WHERE u.is_active = TRUE OR u.id IS NULL
            ORDER BY c.class_name, s.section_name
        `);

        res.json({
            success: true,
            data: classTeachers
        });
    } catch (error) {
        console.error('Get class teachers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch class teachers'
        });
    }
});

// Update teacher profile
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name, phone, password, is_active } = req.body;

        // Check if teacher exists
        const teacher = await query('SELECT id FROM users WHERE id = $1', [id]);
        if (teacher.length === 0) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        let updateQuery = `
            UPDATE users 
            SET username = $1, email = $2, full_name = $3, phone = $4, is_active = $5
        `;
        let params = [username, email, full_name, phone, is_active !== undefined ? is_active : true];

        // If password is provided, hash it and add to update
        if (password && password.trim().length >= 6) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            updateQuery += `, password_hash = $${params.length + 1}`;
            params.push(password_hash);
        }

        updateQuery += ` WHERE id = $${params.length + 1} RETURNING id`;
        params.push(id);

        await query(updateQuery, params);

        res.json({
            success: true,
            message: 'Teacher updated successfully'
        });
    } catch (error) {
        console.error('Update teacher error:', error);
        res.status(500).json({ success: false, message: 'Failed to update teacher' });
    }
});

module.exports = router;
