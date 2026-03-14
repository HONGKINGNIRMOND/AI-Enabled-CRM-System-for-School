const { query } = require('../config/database');

/**
 * Generate automatic roll number in format YYXXX
 * YY = Last 2 digits of year
 * XXX = Sequential 3-digit number (001, 002, etc.)
 * 
 * @param {number} year - Full year (e.g., 2026)
 * @returns {Promise<string>} Generated roll number (e.g., "26001")
 */
async function generateRollNumber(year = null) {
    try {
        // Use current year if not provided
        const currentYear = year || new Date().getFullYear();
        const yearPrefix = currentYear.toString().slice(-2); // Get last 2 digits (e.g., "26" from 2026)

        // Find the latest roll number for this year
        const result = await query(
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
            // Extract the last 3 digits
            const sequencePart = parseInt(lastRollNumber.slice(-3));
            if (!isNaN(sequencePart)) {
                nextSequence = sequencePart + 1;
            }
        }

        // Format as 3-digit number with leading zeros
        const sequenceString = nextSequence.toString().padStart(3, '0');
        const rollNumber = `${yearPrefix}${sequenceString}`;

        return rollNumber;
    } catch (error) {
        console.error('Error generating roll number:', error);
        throw error;
    }
}

/**
 * Generate roll number for a specific academic year
 * @param {string} academicYear - Academic year (e.g., "2025-2026")
 * @returns {Promise<string>} Generated roll number
 */
async function generateRollNumberForAcademicYear(academicYear) {
    // Extract the starting year from academic year format "2025-2026"
    const year = parseInt(academicYear.split('-')[0]);
    return generateRollNumber(year);
}

module.exports = {
    generateRollNumber,
    generateRollNumberForAcademicYear
};
