const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { parseFile } = require('../services/fileParserService');
const { processStudentData, recalculateAllRankings, getStudentByRegistration, getStudentsByClass } = require('../services/studentService');
// Audit logging removed - no authentication required
const { Student, Mark, Fee, Subject } = require('../models/school');
const { Op } = require('sequelize');

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
        cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * Upload and process student data file
 */
const uploadStudentData = async (req, res) => {
    let filePath = null;
    let recordsProcessed = 0;
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors = [];

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please upload an Excel or CSV file.'
            });
        }

        filePath = req.file.path;
        const academicYear = req.body.academicYear || new Date().getFullYear().toString();
        const customMapping = req.body.columnMapping ? JSON.parse(req.body.columnMapping) : null;
        const recalculateRankings = req.body.recalculateRankings !== 'false'; // Default to true

        // Parse file
        const { rawData, columnMapping } = await parseFile(filePath, customMapping);

        recordsProcessed = rawData.length;

        // Process each row
        for (let i = 0; i < rawData.length; i++) {
            try {
                const result = await processStudentData(rawData[i], columnMapping, academicYear);

                if (result.created) {
                    recordsInserted++;
                } else {
                    recordsUpdated++;
                }
            } catch (error) {
                recordsFailed++;
                errors.push({
                    row: i + 2, // +2 because row 1 is header, and arrays are 0-indexed
                    error: error.message,
                    data: rawData[i]
                });
            }
        }

        // Recalculate rankings if requested
        if (recalculateRankings) {
            await recalculateAllRankings();
        }

        // Audit logging removed

        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(200).json({
            success: true,
            message: 'File processed successfully',
            data: {
                recordsProcessed,
                recordsInserted,
                recordsUpdated,
                recordsFailed,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Audit logging removed

        console.error('File upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process file',
            error: error.message
        });
    }
};

/**
 * Create a new student
 */
const createStudent = async (req, res) => {
    try {
        const {
            registration_number,
            first_name,
            last_name,
            date_of_birth,
            gender,
            blood_group,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            admission_date,
            father_name,
            father_phone,
            father_whatsapp,
            father_email,
            father_occupation,
            mother_name,
            mother_phone,
            mother_whatsapp,
            mother_email,
            mother_occupation
        } = req.body;

        // Validate required fields
        if (!registration_number || !first_name || !last_name || !date_of_birth || !admission_date) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: registration_number, first_name, last_name, date_of_birth, admission_date'
            });
        }

        const assigned_teacher_id = req.body.assigned_teacher_id || null;

        // Check if student with registration number already exists
        const existingStudent = await Student.findOne({
            where: { registrationNumber: registration_number }
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this registration number already exists'
            });
        }

        // Create student
        const student = await Student.create({
            registrationNumber: registration_number,
            firstName: first_name,
            lastName: last_name,
            dateOfBirth: date_of_birth,
            gender: gender,
            bloodGroup: blood_group,
            phone: phone,
            email: email,
            address: address,
            city: city,
            state: state,
            pincode: pincode,
            admissionDate: admission_date,
            assignedTeacherId: assigned_teacher_id,
            fatherName: father_name,
            fatherPhone: father_phone,
            fatherWhatsapp: father_whatsapp,
            fatherEmail: father_email,
            fatherOccupation: father_occupation,
            motherName: mother_name,
            motherPhone: mother_phone,
            motherWhatsapp: mother_whatsapp,
            motherEmail: mother_email,
            motherOccupation: mother_occupation
        });

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create student',
            error: error.message
        });
    }
};

/**
 * Get student by registration number
 */
const getStudent = async (req, res) => {
    try {
        const { registrationNumber } = req.params;

        const student = await getStudentByRegistration(registrationNumber);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve student',
            error: error.message
        });
    }
};

/**
 * Get students by class
 */
const getStudents = async (req, res) => {
    try {
        const { class: classValue, section } = req.query;
        const includeInactive = req.query.includeInactive === 'true';

        if (!classValue) {
            return res.status(400).json({
                success: false,
                message: 'Class parameter is required'
            });
        }

        const students = await getStudentsByClass(classValue, section, includeInactive);

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve students',
            error: error.message
        });
    }
};

/**
 * Get all students with pagination
 */
const getAllStudents = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const city = req.query.city || '';
        const state = req.query.state || '';
        const classId = req.query.class_id || '';
        const sectionId = req.query.section_id || '';
        const includeInactive = req.query.includeInactive === 'true';

        // Build the WHERE clause for search and filters
        let searchCondition = '';
        let params = [];
        let paramIndex = 1;

        if (search) {
            searchCondition += ` AND (
                s.first_name ILIKE $${paramIndex} OR 
                s.last_name ILIKE $${paramIndex} OR 
                s.registration_number ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (city) {
            searchCondition += ` AND s.city = $${paramIndex}`;
            params.push(city);
            paramIndex++;
        }

        if (state) {
            searchCondition += ` AND s.state = $${paramIndex}`;
            params.push(state);
            paramIndex++;
        }

        if (classId) {
            searchCondition += ` AND se.class_id = $${paramIndex}`;
            params.push(classId);
            paramIndex++;
        }

        if (sectionId) {
            searchCondition += ` AND se.section_id = $${paramIndex}`;
            params.push(sectionId);
            paramIndex++;
        }

        if (!includeInactive) {
            searchCondition += ' AND s.is_active = true';
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT s.id) as total
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = true
            WHERE 1=1 ${searchCondition}
        `;

        const countResult = await query(countQuery, params);
        const total = parseInt(countResult[0].total);

        // Get students with class, section, and teacher info
        const studentsQuery = `
            SELECT 
                s.id,
                s.registration_number,
                s.first_name,
                s.last_name,
                s.date_of_birth,
                s.gender,
                s.blood_group,
                s.phone,
                s.email,
                s.address,
                s.city,
                s.state,
                s.pincode,
                s.admission_date,
                s.is_active,
                s.created_at,
                s.updated_at,
                c.class_name,
                sec.section_name,
                u_teacher.full_name as assigned_teacher_name
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = true
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN sections sec ON se.section_id = sec.id
            LEFT JOIN users u_teacher ON s.assigned_teacher_id = u_teacher.id
            WHERE 1=1 ${searchCondition}
            ORDER BY c.class_name ASC NULLS LAST, sec.section_name ASC NULLS LAST, s.first_name ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);
        const students = await query(studentsQuery, params);

        res.status(200).json({
            success: true,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: {
                students: students
            }
        });
    } catch (error) {
        console.error('Get all students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve students',
            error: error.message
        });
    }
};

/**
 * Update student
 */
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            registration_number,
            first_name,
            last_name,
            date_of_birth,
            gender,
            blood_group,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            admission_date,
            is_active,
            father_name,
            father_phone,
            father_whatsapp,
            father_email,
            father_occupation,
            mother_name,
            mother_phone,
            mother_whatsapp,
            mother_email,
            mother_occupation
        } = req.body;

        const student = await Student.findByPk(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Update fields if provided
        if (registration_number !== undefined) student.registrationNumber = registration_number;
        if (first_name !== undefined) student.firstName = first_name;
        if (last_name !== undefined) student.lastName = last_name;
        if (date_of_birth !== undefined) student.dateOfBirth = date_of_birth;
        if (gender !== undefined) student.gender = gender;
        if (blood_group !== undefined) student.bloodGroup = blood_group;
        if (phone !== undefined) student.phone = phone;
        if (email !== undefined) student.email = email;
        if (address !== undefined) student.address = address;
        if (city !== undefined) student.city = city;
        if (state !== undefined) student.state = state;
        if (pincode !== undefined) student.pincode = pincode;
        if (admission_date !== undefined) student.admissionDate = admission_date;
        if (req.body.assigned_teacher_id !== undefined) student.assignedTeacherId = req.body.assigned_teacher_id;
        if (is_active !== undefined) student.isActive = is_active;
        
        // Update parent info
        if (father_name !== undefined) student.fatherName = father_name;
        if (father_phone !== undefined) student.fatherPhone = father_phone;
        if (father_whatsapp !== undefined) student.fatherWhatsapp = father_whatsapp;
        if (father_email !== undefined) student.fatherEmail = father_email;
        if (father_occupation !== undefined) student.fatherOccupation = father_occupation;
        if (mother_name !== undefined) student.motherName = mother_name;
        if (mother_phone !== undefined) student.motherPhone = mother_phone;
        if (mother_whatsapp !== undefined) student.motherWhatsapp = mother_whatsapp;
        if (mother_email !== undefined) student.motherEmail = mother_email;
        if (mother_occupation !== undefined) student.motherOccupation = mother_occupation;

        await student.save();

        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student',
            error: error.message
        });
    }
};

/**
 * Delete student (soft delete)
 */
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findByPk(id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        student.isActive = false;
        await student.save();

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete student',
            error: error.message
        });
    }
};

module.exports = {
    upload,
    uploadStudentData,
    createStudent,
    getStudent,
    getStudents,
    getAllStudents,
    updateStudent,
    deleteStudent
};
