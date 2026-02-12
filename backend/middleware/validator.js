const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        req.validatedData = value;
        next();
    };
};

// Common validation schemas
const schemas = {
    // Student validation
    student: Joi.object({
        registration_number: Joi.string().required().max(50),
        first_name: Joi.string().required().max(100),
        last_name: Joi.string().required().max(100),
        date_of_birth: Joi.date().required(),
        gender: Joi.string().valid('Male', 'Female', 'Other').required(),
        blood_group: Joi.string().max(5).optional(),
        address: Joi.string().optional(),
        city: Joi.string().max(100).optional(),
        state: Joi.string().max(100).optional(),
        pincode: Joi.string().max(10).optional(),
        phone: Joi.string().max(20).optional(),
        email: Joi.string().email().optional(),
        admission_date: Joi.date().required()
    }),

    // Student enrollment validation
    enrollment: Joi.object({
        student_id: Joi.number().integer().required(),
        class_id: Joi.number().integer().required(),
        section_id: Joi.number().integer().required(),
        academic_year: Joi.string().required().max(20),
        roll_number: Joi.string().max(20).optional()
    }),

    // Attendance validation
    attendance: Joi.object({
        student_id: Joi.number().integer().required(),
        class_id: Joi.number().integer().required(),
        section_id: Joi.number().integer().required(),
        attendance_date: Joi.date().required(),
        status: Joi.string().valid('Present', 'Absent', 'Late', 'Excused').required(),
        session: Joi.string().valid('Morning', 'Afternoon').optional(),
        remarks: Joi.string().optional()
    }),

    // Bulk attendance validation
    bulkAttendance: Joi.object({
        class_id: Joi.number().integer().required(),
        section_id: Joi.number().integer().required(),
        attendance_date: Joi.date().required(),
        session: Joi.string().valid('Morning', 'Afternoon').optional(),
        attendance_records: Joi.array().items(
            Joi.object({
                student_id: Joi.number().integer().required(),
                status: Joi.string().valid('Present', 'Absent', 'Late', 'Excused').required()
            })
        ).required()
    }),

    // Marks validation
    marks: Joi.object({
        student_id: Joi.number().integer().required(),
        class_subject_id: Joi.number().integer().required(),
        exam_type_id: Joi.number().integer().required(),
        academic_year: Joi.string().required().max(20),
        marks_obtained: Joi.number().min(0).optional(),
        max_marks: Joi.number().min(0).required(),
        is_absent: Joi.boolean().optional(),
        remarks: Joi.string().optional()
    }),

    // Login validation
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    // User creation validation
    user: Joi.object({
        username: Joi.string().required().max(100),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role_id: Joi.number().integer().optional(),
        full_name: Joi.string().required().max(255),
        phone: Joi.string().max(20).optional().allow('', null)
    }),

    teacherBulk: Joi.object({
        teachers: Joi.array().items(
            Joi.object({
                username: Joi.string().required().max(100),
                full_name: Joi.string().required().max(255),
                email: Joi.string().email().required(),
                phone: Joi.string().max(20).optional().allow('', null),
                password: Joi.string().min(6).required()
            })
        ).required()
    })
};

module.exports = {
    validate,
    schemas
};
