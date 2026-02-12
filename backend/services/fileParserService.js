const XLSX = require('xlsx');
const csv = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

/**
 * Parse Excel file
 */
const parseExcel = (filePath) => {
    try {
        const workbook = XLSX.readFile(filePath, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { 
            defval: null,
            raw: false 
        });
        return data;
    } catch (error) {
        throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
};

/**
 * Parse CSV file
 */
const parseCSV = (filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = csv.parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: true
        });
        return records;
    } catch (error) {
        throw new Error(`Failed to parse CSV file: ${error.message}`);
    }
};

/**
 * Auto-detect column mapping based on common patterns
 */
const detectColumnMapping = (headers) => {
    const mapping = {};
    const headerLower = headers.map(h => (h || '').toString().toLowerCase().trim());

    // Common patterns for registration number
    const regPatterns = ['registration', 'reg', 'regno', 'reg_no', 'registration_number', 'student_id', 'id'];
    // Common patterns for name
    const namePatterns = ['name', 'student_name', 'student name', 'full_name', 'full name'];
    // Common patterns for class
    const classPatterns = ['class', 'grade', 'standard', 'std'];
    // Common patterns for section
    const sectionPatterns = ['section', 'sec', 'division'];
    // Common patterns for fee
    const feePatterns = ['fee', 'total_fee', 'total fee', 'fees', 'amount'];
    // Common patterns for paid amount
    const paidPatterns = ['paid', 'paid_amount', 'paid amount', 'amount_paid'];
    // Common patterns for pending
    const pendingPatterns = ['pending', 'pending_amount', 'pending amount', 'balance', 'due'];

    // Find registration number
    for (const pattern of regPatterns) {
        const index = headerLower.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.registrationNumber = headers[index];
            break;
        }
    }

    // Find name
    for (const pattern of namePatterns) {
        const index = headerLower.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.name = headers[index];
            break;
        }
    }

    // Find class
    for (const pattern of classPatterns) {
        const index = headerLower.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.class = headers[index];
            break;
        }
    }

    // Find section
    for (const pattern of sectionPatterns) {
        const index = headerLower.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.section = headers[index];
            break;
        }
    }

    // Find fee fields
    for (const pattern of feePatterns) {
        const index = headerLower.findIndex(h => h.includes(pattern) && !h.includes('paid') && !h.includes('pending'));
        if (index !== -1) {
            mapping.totalFee = headers[index];
            break;
        }
    }

    for (const pattern of paidPatterns) {
        const index = headerLower.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.paidAmount = headers[index];
            break;
        }
    }

    for (const pattern of pendingPatterns) {
        const index = headerLower.findIndex(h => h.includes(pattern));
        if (index !== -1) {
            mapping.pendingAmount = headers[index];
            break;
        }
    }

    // Find subject columns (any column that looks like a subject)
    mapping.subjects = {};
    headers.forEach((header, index) => {
        const h = headerLower[index];
        // Skip known fields
        if (!regPatterns.some(p => h.includes(p)) &&
            !namePatterns.some(p => h.includes(p)) &&
            !classPatterns.some(p => h.includes(p)) &&
            !sectionPatterns.some(p => h.includes(p)) &&
            !feePatterns.some(p => h.includes(p)) &&
            !paidPatterns.some(p => h.includes(p)) &&
            !pendingPatterns.some(p => h.includes(p)) &&
            header && header.trim() !== '') {
            // This might be a subject column
            mapping.subjects[header] = header;
        }
    });

    return mapping;
};

/**
 * Parse file based on extension
 */
const parseFile = async (filePath, customMapping = null) => {
    const ext = path.extname(filePath).toLowerCase();
    let rawData;

    if (ext === '.xlsx' || ext === '.xls') {
        rawData = parseExcel(filePath);
    } else if (ext === '.csv') {
        rawData = parseCSV(filePath);
    } else {
        throw new Error(`Unsupported file format: ${ext}. Only .xlsx, .xls, and .csv files are supported.`);
    }

    if (!rawData || rawData.length === 0) {
        throw new Error('File is empty or contains no data.');
    }

    // Get headers from first row
    const headers = Object.keys(rawData[0]);
    
    // Auto-detect or use custom mapping
    const columnMapping = customMapping || detectColumnMapping(headers);

    // Validate required mappings
    if (!columnMapping.registrationNumber || !columnMapping.name || !columnMapping.class) {
        throw new Error('Required columns not found. Please ensure the file contains: Registration Number, Name, and Class columns.');
    }

    return {
        rawData,
        headers,
        columnMapping
    };
};

/**
 * Clean and validate data
 */
const cleanValue = (value) => {
    if (value === null || value === undefined) {
        return null;
    }
    
    if (typeof value === 'string') {
        return value.trim() || null;
    }
    
    return value;
};

/**
 * Convert value to number
 */
const toNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
        return defaultValue;
    }
    
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
};

module.exports = {
    parseFile,
    parseExcel,
    parseCSV,
    detectColumnMapping,
    cleanValue,
    toNumber
};
