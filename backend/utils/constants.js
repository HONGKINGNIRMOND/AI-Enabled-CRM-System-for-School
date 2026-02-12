/**
 * Application constants
 */

// Grade thresholds
const GRADE_THRESHOLDS = {
    'A+': 90,
    'A': 80,
    'B+': 70,
    'B': 60,
    'C+': 50,
    'C': 40,
    'F': 0
};

// Payment statuses
const PAYMENT_STATUS = {
    PAID: 'paid',
    PARTIAL: 'partial',
    PENDING: 'pending'
};

// User roles
const USER_ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    AGENT: 'agent',
    MANAGEMENT: 'management'
};

// File upload limits
const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['.xlsx', '.xls', '.csv']
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 1000
};

// Rate limiting
const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
};

module.exports = {
    GRADE_THRESHOLDS,
    PAYMENT_STATUS,
    USER_ROLES,
    FILE_UPLOAD,
    PAGINATION,
    RATE_LIMIT
};
