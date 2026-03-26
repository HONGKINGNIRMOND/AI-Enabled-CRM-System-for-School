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

    // Mapping patterns
    const patterns = {
        registrationNumber: ['registration', 'reg', 'regno', 'reg_no', 'registration_number', 'student_id', 'id'],
        name: ['name', 'student_name', 'student name', 'full_name', 'full name', 'student_name'],
        class: ['class', 'grade', 'standard', 'std'],
        section: ['section', 'sec', 'division'],
        gender: ['gender', 'sex'],
        dateOfBirth: ['birth', 'dob', 'date of birth', 'date_of_birth'],
        admissionDate: ['admission', 'join', 'date of admission', 'admission_date'],
        phone: ['phone', 'mobile', 'contact', 'student_phone', 'student phone'],
        email: ['email', 'mail', 'student_email', 'student email'],
        address: ['address', 'residence', 'location'],
        city: ['city', 'town'],
        state: ['state', 'province', 'region'],
        pincode: ['pincode', 'zip', 'zipcode', 'postal'],
        bloodGroup: ['blood', 'group', 'blood_group', 'blood group'],
        
        // Parent patterns
        fatherName: ['father name', 'father_name', 'father\'s name'],
        fatherPhone: ['father phone', 'father_phone', 'father\'s phone'],
        fatherWhatsApp: ['father whatsapp', 'father_whatsapp', 'father\'s whatsapp'],
        motherName: ['mother name', 'mother_name', 'mother\'s name'],
        motherPhone: ['mother phone', 'mother_phone', 'mother\'s phone'],
        motherWhatsApp: ['mother whatsapp', 'mother_whatsapp', 'mother\'s whatsapp'],
        
        // Fee patterns
        totalFee: ['fee', 'total_fee', 'total fee', 'fees', 'amount'],
        paidAmount: ['paid', 'paid_amount', 'paid amount', 'amount_paid'],
        pendingAmount: ['pending', 'pending_amount', 'pending amount', 'balance', 'due']
    };

    // Find mappings
    for (const [key, patternList] of Object.entries(patterns)) {
        for (const pattern of patternList) {
            const index = headerLower.findIndex(h => h === pattern || h.includes(pattern));
            if (index !== -1) {
                mapping[key] = headers[index];
                break;
            }
        }
    }

    // Find subject columns (any column that doesn't match a pattern and isn't empty)
    mapping.subjects = {};
    const matchedHeaders = new Set(Object.values(mapping));
    
    headers.forEach((header, index) => {
        if (!matchedHeaders.has(header) && header && header.trim() !== '') {
            // Verify it's not a generic field we missed
            const h = headerLower[index];
            const isGeneric = Object.values(patterns).flat().some(p => h.includes(p));
            if (!isGeneric) {
                mapping.subjects[header] = header;
            }
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
