const crypto = require('crypto');

/**
 * Generate a random string of specified length
 */
const generateRandomString = (length = 10) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Format phone number to international format
 */
const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If the number starts with country code, return as is
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return '+' + cleaned;
    }

    // If it's a 10-digit US number, add +1
    if (cleaned.length === 10) {
        return '+1' + cleaned;
    }

    // For other cases, return as is
    return '+' + cleaned;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number format
 */
const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
};

/**
 * Sanitize user input to prevent XSS
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Calculate sentiment classification based on score
 */
const classifySentiment = (score) => {
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
};

/**
 * Format date to ISO string
 */
const formatDate = (date) => {
    return new Date(date).toISOString();
};

/**
 * Calculate the difference in days between two dates
 */
const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);

    return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay));
};

module.exports = {
    generateRandomString,
    formatPhoneNumber,
    isValidEmail,
    isValidPhone,
    sanitizeInput,
    classifySentiment,
    formatDate,
    daysBetween
};