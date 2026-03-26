const { Student, Subject, Mark, Fee } = require('../models/school');
const { Sequelize } = require('sequelize');
const { cleanValue, toNumber } = require('./fileParserService');
const { generateRollNumberForAcademicYear } = require('../utils/rollNumberGenerator');

/**
 * Calculate grade based on percentage
 */
const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
};

/**
 * Process student data from file upload
 */
const processStudentData = async (row, columnMapping, academicYear = null) => {
    const registrationNumber = cleanValue(row[columnMapping.registrationNumber]);
    const name = cleanValue(row[columnMapping.name]);
    const classValue = cleanValue(row[columnMapping.class]);

    // Split the full name into first and last name
    const nameParts = name ? name.split(' ') : [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || ' '; // Handle case where there's only one name

    const section = columnMapping.section ? cleanValue(row[columnMapping.section]) : null;
    const dateOfBirth = cleanValue(row[columnMapping.dateOfBirth] || row['date_of_birth'] || row['dob']);
    const gender = cleanValue(row[columnMapping.gender] || 'Male');
    const admissionDate = cleanValue(row[columnMapping.admissionDate] || row['admission_date'] || new Date());
    const phone = cleanValue(row[columnMapping.phone] || '');
    const email = cleanValue(row[columnMapping.email] || '');
    const address = cleanValue(row[columnMapping.address] || '');
    const city = cleanValue(row[columnMapping.city] || '');
    const state = cleanValue(row[columnMapping.state] || '');
    const pincode = cleanValue(row[columnMapping.pincode] || '');
    const bloodGroup = cleanValue(row[columnMapping.bloodGroup] || '');

    // Parent information
    const fatherName = cleanValue(row[columnMapping.fatherName] || '');
    const fatherPhone = cleanValue(row[columnMapping.fatherPhone] || '');
    const fatherWhatsapp = cleanValue(row[columnMapping.fatherWhatsApp] || '');
    const fatherEmail = cleanValue(row[columnMapping.fatherEmail] || '');
    const fatherOccupation = cleanValue(row[columnMapping.fatherOccupation] || '');
    
    const motherName = cleanValue(row[columnMapping.motherName] || '');
    const motherPhone = cleanValue(row[columnMapping.motherPhone] || '');
    const motherWhatsapp = cleanValue(row[columnMapping.motherWhatsApp] || '');
    const motherEmail = cleanValue(row[columnMapping.motherEmail] || '');
    const motherOccupation = cleanValue(row[columnMapping.motherOccupation] || '');

    // Validate required fields
    if (!registrationNumber || !firstName || !classValue) {
        throw new Error(`Missing required fields for row: Registration Number, Name, or Class is missing.`);
    }

    // Get or create student
    let [student, created] = await Student.findOrCreate({
        where: { registrationNumber: registrationNumber },
        defaults: {
            registrationNumber,
            firstName,
            lastName,
            dateOfBirth: dateOfBirth || new Date(),
            gender,
            admissionDate: admissionDate || new Date(),
            phone,
            email,
            address,
            city,
            state,
            pincode,
            bloodGroup,
            fatherName,
            fatherPhone,
            fatherWhatsapp,
            fatherEmail,
            fatherOccupation,
            motherName,
            motherPhone,
            motherWhatsapp,
            motherEmail,
            motherOccupation
        }
    });

    // Update student if exists
    if (!created) {
        student.firstName = firstName;
        student.lastName = lastName;
        student.dateOfBirth = dateOfBirth || student.dateOfBirth;
        student.gender = gender || student.gender;
        student.admissionDate = admissionDate || student.admissionDate;
        student.phone = phone || student.phone;
        student.email = email || student.email;
        student.address = address || student.address;
        student.city = city || student.city;
        student.state = state || student.state;
        student.pincode = pincode || student.pincode;
        student.bloodGroup = bloodGroup || student.bloodGroup;
        
        // Update parent info
        if (fatherName) student.fatherName = fatherName;
        if (fatherPhone) student.fatherPhone = fatherPhone;
        if (fatherWhatsapp) student.fatherWhatsapp = fatherWhatsapp;
        if (fatherEmail) student.fatherEmail = fatherEmail;
        if (fatherOccupation) student.fatherOccupation = fatherOccupation;
        if (motherName) student.motherName = motherName;
        if (motherPhone) student.motherPhone = motherPhone;
        if (motherWhatsapp) student.motherWhatsapp = motherWhatsapp;
        if (motherEmail) student.motherEmail = motherEmail;
        if (motherOccupation) student.motherOccupation = motherOccupation;
        
        await student.save();
    }

    // Process subjects and marks
    const subjectMarks = {};
    let totalMarks = 0;
    let maxTotalMarks = 0;

    if (columnMapping.subjects && Object.keys(columnMapping.subjects).length > 0) {
        for (const [header, subjectName] of Object.entries(columnMapping.subjects)) {
            const marksValue = toNumber(row[header], 0);
            const maxMarksValue = toNumber(row[`${header}_max`] || row[`Max ${header}`] || row[`${header} Max`], 100);

            if (marksValue > 0 || maxMarksValue > 0) {
                // Get or create subject
                let subject = await Subject.findOne({ where: { name: subjectName } });
                if (!subject) {
                    subject = await Subject.create({
                        name: subjectName,
                        maxMarks: maxMarksValue
                    });
                }

                // Create or update mark
                const [mark] = await Mark.findOrCreate({
                    where: {
                        studentId: student.id,
                        subjectId: subject.id,
                        examType: 'Final',
                        academicYear: academicYear || new Date().getFullYear().toString()
                    },
                    defaults: {
                        studentId: student.id,
                        subjectId: subject.id,
                        marks: marksValue,
                        maxMarks: maxMarksValue,
                        examType: 'Final',
                        academicYear: academicYear || new Date().getFullYear().toString()
                    }
                });

                if (!mark.isNewRecord) {
                    mark.marks = marksValue;
                    mark.maxMarks = maxMarksValue;
                    await mark.save();
                }

                subjectMarks[subjectName] = { marks: marksValue, maxMarks: maxMarksValue };
                totalMarks += marksValue;
                maxTotalMarks += maxMarksValue;
            }
        }
    }

    // Calculate percentage and grade
    const percentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0;
    const grade = calculateGrade(percentage);

    // Note: totalMarks, percentage, and grade fields don't exist in the student table
    // So we won't update the student record with these values

    // Process fee information if available
    if (columnMapping.totalFee || columnMapping.paidAmount || columnMapping.pendingAmount) {
        const totalFee = toNumber(row[columnMapping.totalFee], 0);
        const paidAmount = toNumber(row[columnMapping.paidAmount], 0);
        const pendingAmount = columnMapping.pendingAmount
            ? toNumber(row[columnMapping.pendingAmount], 0)
            : (totalFee - paidAmount);

        if (totalFee > 0) {
            const [fee] = await Fee.findOrCreate({
                where: {
                    studentId: student.id,
                    academicYear: academicYear || new Date().getFullYear().toString()
                },
                defaults: {
                    studentId: student.id,
                    totalFee: totalFee,
                    paidAmount: paidAmount,
                    pendingAmount: pendingAmount,
                    academicYear: academicYear || new Date().getFullYear().toString()
                }
            });

            if (!fee.isNewRecord) {
                fee.totalFee = totalFee;
                fee.paidAmount = paidAmount;
                fee.pendingAmount = pendingAmount;
                await fee.save();
            }
        }
    }

    // Since we can't store class and section in the student table, we need to enroll the student
    // in the appropriate class and section
    if (classValue) {
        await enrollStudentInClass(student.id, classValue, section, academicYear);
    }

    return {
        student,
        created,
        subjectMarks,
        totalMarks,
        percentage,
        grade
    };
};

/**
 * Enroll student in a class and section
 */
const enrollStudentInClass = async (studentId, className, sectionName, academicYear = null) => {
    const { query } = require('../config/database');

    const year = academicYear || new Date().getFullYear().toString();

    // First, find the class ID
    const classResult = await query(
        'SELECT id FROM classes WHERE class_name = $1 AND academic_year = $2',
        [className, year]
    );

    if (classResult.length === 0) {
        throw new Error(`Class ${className} for academic year ${year} does not exist.`);
    }

    const classId = classResult[0].id;

    // Find the section ID
    let sectionId;
    if (sectionName) {
        const sectionResult = await query(
            'SELECT id FROM sections WHERE class_id = $1 AND section_name = $2',
            [classId, sectionName]
        );

        if (sectionResult.length === 0) {
            throw new Error(`Section ${sectionName} does not exist for class ${className}.`);
        }

        sectionId = sectionResult[0].id;
    } else {
        // If no section is specified, get the first section for this class
        const sectionResult = await query(
            'SELECT id FROM sections WHERE class_id = $1 LIMIT 1',
            [classId]
        );

        if (sectionResult.length === 0) {
            throw new Error(`No sections available for class ${className}.`);
        }

        sectionId = sectionResult[0].id;
    }

    // Check if student is already enrolled
    const existingEnrollment = await query(
        'SELECT id FROM student_enrollments WHERE student_id = $1 AND academic_year = $2 AND is_current = true',
        [studentId, year]
    );

    if (existingEnrollment.length > 0) {
        // Update existing enrollment
        await query(
            `UPDATE student_enrollments SET 
             class_id = $1, 
             section_id = $2, 
             updated_at = NOW() 
             WHERE student_id = $3 AND academic_year = $4 AND is_current = true`,
            [classId, sectionId, studentId, year]
        );
    } else {
        // Create new enrollment - generate automatic roll number
        const rollNumber = await generateRollNumberForAcademicYear(year);

        await query(
            `INSERT INTO student_enrollments 
             (student_id, class_id, section_id, academic_year, enrollment_date, is_current, roll_number) 
             VALUES ($1, $2, $3, $4, $5, true, $6)`,
            [studentId, classId, sectionId, year, new Date(), rollNumber]
        );
    }
};

/**
 * Calculate class-wise rankings
 */
const calculateClassRankings = async (classValue, section = null) => {
    const { query } = require('../config/database');

    // Get class ID
    const classResult = await query(
        'SELECT id FROM classes WHERE class_name = $1',
        [classValue]
    );

    if (classResult.length === 0) {
        throw new Error(`Class ${classValue} does not exist.`);
    }

    const classId = classResult[0].id;

    // Get section ID if provided
    let sectionId = null;
    if (section) {
        const sectionResult = await query(
            'SELECT id FROM sections WHERE class_id = $1 AND section_name = $2',
            [classId, section]
        );

        if (sectionResult.length === 0) {
            throw new Error(`Section ${section} does not exist for class ${classValue}.`);
        }

        sectionId = sectionResult[0].id;
    }

    // Get all students in the class/section by calculating averages from marks
    let whereClause = sectionId
        ? 'se.section_id = $1 AND se.is_current = true'
        : 'se.class_id = $1 AND se.is_current = true';

    // Query to get students with their average marks
    const studentsQuery = `
        SELECT 
            s.id,
            se.roll_number,
            s.first_name,
            s.last_name,
            s.is_active,
            COALESCE(AVG(im.marks * 100.0 / im.max_marks), 0) as avg_percentage
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id
        LEFT JOIN internal_marks im ON s.id = im.student_id
        WHERE ${whereClause}
        GROUP BY s.id, se.roll_number, s.first_name, s.last_name, s.is_active
        ORDER BY avg_percentage DESC, s.first_name ASC
    `;

    const studentsData = sectionId
        ? await query(studentsQuery, [sectionId])
        : await query(studentsQuery, [classId]);

    // Calculate ranks
    let currentRank = 1;
    let previousPercentage = null;

    for (let i = 0; i < studentsData.length; i++) {
        const studentData = studentsData[i];
        const percentage = parseFloat(studentData.avg_percentage);

        // If same percentage as previous, same rank
        if (previousPercentage !== null && previousPercentage === percentage) {
            // Same rank as previous student
        } else {
            // New rank
            currentRank = i + 1;
        }

        // Update the student's rank in the enrollment record
        await query(
            `UPDATE student_enrollments 
             SET roll_number = $1 
             WHERE student_id = $2 AND is_current = true`,
            [`RANK_${currentRank}`, studentData.id]
        );

        previousPercentage = percentage;
    }

    return studentsData.length;
};

/**
 * Recalculate all class rankings
 */
const recalculateAllRankings = async () => {
    const { query } = require('../config/database');

    // Get all unique class-section combinations from student_enrollments
    const classSections = await query(
        `SELECT DISTINCT 
         c.class_name as class_name, 
         s.section_name as section_name 
         FROM student_enrollments se
         JOIN classes c ON se.class_id = c.id
         JOIN sections s ON se.section_id = s.id
         WHERE se.is_current = true`
    );

    // Calculate rankings for each class-section
    for (const cs of classSections) {
        await calculateClassRankings(cs.class_name, cs.section_name);
    }
};

/**
 * Get student by registration number
 */
const getStudentByRegistration = async (registrationNumber) => {
    const { query } = require('../config/database');

    // Get student data
    const student = await Student.findOne({
        where: { registrationNumber }
    });

    if (!student) {
        return null;
    }

    // Get enrollment data
    const enrollment = await query(
        `SELECT se.*, c.class_name, sec.section_name 
         FROM student_enrollments se
         JOIN classes c ON se.class_id = c.id
         JOIN sections sec ON se.section_id = sec.id
         WHERE se.student_id = $1 AND se.is_current = true`,
        [student.id]
    );

    // Get marks for this student
    const marks = await query(
        `SELECT im.*, sub.subject_name 
         FROM internal_marks im
         JOIN class_subjects cs ON im.class_subject_id = cs.id
         JOIN subjects sub ON cs.subject_id = sub.id
         WHERE im.student_id = $1`,
        [student.id]
    );

    // Get fees for this student
    const fees = await query(
        `SELECT * FROM fees WHERE student_id = $1`,
        [student.id]
    );

    // Combine the data
    student.dataValues.enrollment = enrollment.length > 0 ? enrollment[0] : null;
    student.dataValues.marks = marks;
    student.dataValues.fees = fees;

    return student;
};

/**
 * Get students by class
 */
const getStudentsByClass = async (classValue, section = null, includeInactive = false) => {
    const { query } = require('../config/database');

    // Get class ID
    const classResult = await query(
        'SELECT id FROM classes WHERE class_name = $1',
        [classValue]
    );

    if (classResult.length === 0) {
        throw new Error(`Class ${classValue} does not exist.`);
    }

    const classId = classResult[0].id;

    // Build the query
    let sql = `
        SELECT 
            s.*, 
            se.roll_number,
            c.class_name,
            sec.section_name,
            COALESCE(AVG(im.marks * 100.0 / im.max_marks), 0) as avg_percentage
        FROM students s
        JOIN student_enrollments se ON s.id = se.student_id
        JOIN classes c ON se.class_id = c.id
        JOIN sections sec ON se.section_id = sec.id
        LEFT JOIN internal_marks im ON s.id = im.student_id
        WHERE c.id = $1
    `;

    const params = [classId];
    let paramIndex = 2;

    if (section) {
        sql += ` AND sec.section_name = $${paramIndex}`;
        params.push(section);
        paramIndex++;
    }

    if (!includeInactive) {
        sql += ` AND s.is_active = true`;
    }

    sql += ` GROUP BY s.id, se.roll_number, c.class_name, sec.section_name`;
    sql += ` ORDER BY se.roll_number, s.first_name ASC`;

    const students = await query(sql, params);

    // For each student, get their marks and fees separately
    for (const student of students) {
        // Get marks for this student
        student.marks = await query(
            `SELECT im.*, sub.subject_name 
             FROM internal_marks im
             JOIN class_subjects cs ON im.class_subject_id = cs.id
             JOIN subjects sub ON cs.subject_id = sub.id
             WHERE im.student_id = $1`,
            [student.id]
        );

        // Get fees for this student
        student.fees = await query(
            `SELECT * FROM fees WHERE student_id = $1`,
            [student.id]
        );
    }

    return students;
};

module.exports = {
    processStudentData,
    calculateClassRankings,
    recalculateAllRankings,
    getStudentByRegistration,
    getStudentsByClass,
    calculateGrade
};
