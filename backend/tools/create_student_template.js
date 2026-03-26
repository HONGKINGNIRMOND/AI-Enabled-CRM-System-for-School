const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createStudentTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Define columns based on detailed user request
    worksheet.columns = [
        { header: 'Admission Date', key: 'admission_date', width: 22 },
        { header: 'First Name', key: 'first_name', width: 20 },
        { header: 'Last Name', key: 'last_name', width: 20 },
        { header: 'Date of Birth', key: 'dob', width: 22 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Class', key: 'class', width: 12 },
        { header: 'Section', key: 'section', width: 10 },
        { header: 'Assigned Teacher', key: 'assigned_teacher', width: 25 },
        { header: 'Academic Year', key: 'academic_year', width: 15 },
        { header: 'Blood Group', key: 'blood_group', width: 12 },
        { header: 'Phone Number', key: 'phone', width: 15 },
        { header: 'Email Address', key: 'email', width: 30 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Pincode', key: 'pincode', width: 10 },
        { header: 'Father\'s Name', key: 'father_name', width: 20 },
        { header: 'Father\'s Phone', key: 'father_phone', width: 15 },
        { header: 'Father\'s WhatsApp', key: 'father_whatsapp', width: 15 },
        { header: 'Father\'s Email', key: 'father_email', width: 25 },
        { header: 'Father\'s Occupation', key: 'father_occupation', width: 20 },
        { header: 'Mother\'s Name', key: 'mother_name', width: 20 },
        { header: 'Mother\'s Phone', key: 'mother_phone', width: 15 },
        { header: 'Mother\'s WhatsApp', key: 'mother_whatsapp', width: 15 },
        { header: 'Mother\'s Email', key: 'mother_email', width: 25 },
        { header: 'Mother\'s Occupation', key: 'mother_occupation', width: 20 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Add sample data
    worksheet.addRow({
        admission_date: '2025-06-10',
        first_name: 'Aarav',
        last_name: 'Sharma',
        dob: '2010-04-15',
        gender: 'Male',
        class: 'Class 6',
        section: 'A',
        assigned_teacher: 'Rajesh Teacher',
        academic_year: '2025-26',
        blood_group: 'A+',
        phone: '9876543210',
        email: 'aarav.sharma@student.com',
        address: '12 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        father_name: 'Rajesh Sharma',
        father_phone: '9876543211',
        father_whatsapp: '9876543211',
        father_email: 'rajesh.sharma@gmail.com',
        father_occupation: 'Software Engineer',
        mother_name: 'Sunita Sharma',
        mother_phone: '9876543212',
        mother_whatsapp: '9876543212',
        mother_email: 'sunita.sharma@gmail.com',
        mother_occupation: 'Doctor'
    });

    const templatePath = path.join(__dirname, '../public/templates/student_bulk_template.xlsx');
    await workbook.xlsx.writeFile(templatePath);
    console.log('✓ Student Excel template created successfully at:', templatePath);

    // Also create CSV for students
    const csvPath = path.join(__dirname, '../public/templates/student_bulk_template.csv');
    const headers = worksheet.columns.map(col => col.header).join(',');
    const sampleRow = worksheet.getRow(2).values.slice(1).join(',');
    fs.writeFileSync(csvPath, `${headers}\n${sampleRow}\n`);
    console.log('✓ Student CSV template created successfully at:', csvPath);
}

async function createTeacherTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Teachers');

    // Define columns based on sharedRecordSchema + role specific
    worksheet.columns = [
        { header: 'Username', key: 'username', width: 20 },
        { header: 'Full Name', key: 'full_name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Password', key: 'password', width: 15 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Date of Birth', key: 'date_of_birth', width: 22 },
        { header: 'Joining Date', key: 'joining_date', width: 22 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Pincode', key: 'pincode', width: 10 },
        { header: 'Primary Subject', key: 'primary_subject', width: 25 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } }; // Green for teachers

    // Add sample data
    worksheet.addRow({
        username: 'rajesh.teacher',
        full_name: 'Rajesh Teacher',
        email: 'rajesh.t@school.com',
        password: 'password123',
        phone: '9876543301',
        gender: 'Male',
        date_of_birth: '1985-05-20',
        joining_date: '2024-01-15',
        address: '45 Teacher Colony',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        primary_subject: 'Mathematics'
    });

    const templatePath = path.join(__dirname, '../public/templates/teacher_bulk_template.xlsx');
    await workbook.xlsx.writeFile(templatePath);
    console.log('✓ Teacher Excel template created successfully at:', templatePath);

    // Also update/create CSV for teachers
    const csvPath = path.join(__dirname, '../public/templates/teacher_template.csv');
    const headers = worksheet.columns.map(col => col.header).join(',');
    const sampleRow = worksheet.getRow(2).values.slice(1).join(',');
    fs.writeFileSync(csvPath, `${headers}\n${sampleRow}\n`);
    console.log('✓ Teacher CSV template created successfully at:', csvPath);
}

async function run() {
    await createStudentTemplate();
    await createTeacherTemplate();
}

run().catch(error => {
    console.error('Error creating templates:', error);
    process.exit(1);
});
