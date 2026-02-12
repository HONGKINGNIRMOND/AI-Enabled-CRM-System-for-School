const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware wrapper
 */
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    };
};

/**
 * Student validation rules
 */
const validateStudentRegistration = [
    body('registrationNumber')
        .notEmpty()
        .withMessage('Registration number is required')
        .isString()
        .withMessage('Registration number must be a string')
        .trim(),
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isString()
        .withMessage('Name must be a string')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('class')
        .notEmpty()
        .withMessage('Class is required')
        .isString()
        .withMessage('Class must be a string')
        .trim(),
    body('section')
        .optional()
        .isString()
        .withMessage('Section must be a string')
        .trim()
];

/**
 * Fee validation rules
 */
const validateFeeUpdate = [
    body('paidAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Paid amount must be a non-negative number'),
    body('totalFee')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total fee must be a non-negative number'),
    body('academicYear')
        .optional()
        .isString()
        .withMessage('Academic year must be a string')
        .trim()
];

/**
 * Ranking recalculation validation
 */
const validateRankingRecalculation = [
    body('class')
        .notEmpty()
        .withMessage('Class is required')
        .isString()
        .withMessage('Class must be a string')
        .trim(),
    body('section')
        .optional()
        .isString()
        .withMessage('Section must be a string')
        .trim()
];

/**
 * UUID parameter validation
 */
const validateUUID = [
    param('id')
        .isUUID()
        .withMessage('Invalid ID format')
];

/**
 * Registration number parameter validation
 */
const validateRegistrationNumber = [
    param('registrationNumber')
        .notEmpty()
        .withMessage('Registration number is required')
        .isString()
        .withMessage('Registration number must be a string')
        .trim()
];

module.exports = {
    validate,
    validateStudentRegistration,
    validateFeeUpdate,
    validateRankingRecalculation,
    validateUUID,
    validateRegistrationNumber
};
