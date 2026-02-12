const { body, validationResult } = require('express-validator');

/**
 * Password strength validation
 */
const validatePasswordStrength = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

/**
 * User registration validation
 */
const validateRegistration = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .trim(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .custom((value) => {
            if (!validatePasswordStrength(value)) {
                throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            }
            return true;
        }),
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
    body('role')
        .optional()
        .isIn(['admin', 'teacher', 'agent', 'management'])
        .withMessage('Invalid role')
];

/**
 * User login validation
 */
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .trim(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    handleValidationErrors,
    validatePasswordStrength
};
