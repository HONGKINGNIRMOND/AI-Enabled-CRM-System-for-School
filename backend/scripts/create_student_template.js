const ExcelJS = require('exceljs');
const path = require('path');

async function createTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Define columns
    worksheet.columns = [
        { header: 'First Name', key: 'first_name', width: 15 },
        { header: 'Last Name', key: 'last_name', width: 15 },
        { header: 'Date of Birth', key: 'dob', width: 15 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Blood Group', key: 'blood_group', width: 12 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Pincode', key: 'pincode', width: 10 },
        { header: 'Admission Date', key: 'admission_date', width: 15 },
        { header: 'Class', key: 'class', width: 10 },
        { header: 'Section', key: 'section', width: 10 },
        { header: 'Father Name', key: 'father_name', width: 20 },
        { header: 'Father Phone', key: 'father_phone', width: 15 },
        { header: 'Father WhatsApp', key: 'father_whatsapp', width: 15 },
        { header: 'Father Email', key: 'father_email', width: 25 },
        { header: 'Father Occupation', key: 'father_occupation', width: 20 },
        { header: 'Mother Name', key: 'mother_name', width: 20 },
        { header: 'Mother Phone', key: 'mother_phone', width: 15 },
        { header: 'Mother WhatsApp', key: 'mother_whatsapp', width: 15 },
        { header: 'Mother Email', key: 'mother_email', width: 25 },
        { header: 'Mother Occupation', key: 'mother_occupation', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add sample data
    worksheet.addRow({
        first_name: 'Alex',
        last_name: 'Johnson',
        dob: '2009-02-14',
        gender: 'Male',
        blood_group: 'A+',
        phone: '9876543210',
        email: 'alex.johnson@email.com',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        admission_date: '2024-06-01',
        class: 'Class 6',
        section: 'A',
        father_name: 'Robert Johnson',
        father_phone: '9876543211',
        father_whatsapp: '9876543211',
        father_email: 'robert.j@email.com',
        father_occupation: 'Engineer',
        mother_name: 'Mary Johnson',
        mother_phone: '9876543212',
        mother_whatsapp: '9876543212',
        mother_email: 'mary.j@email.com',
        mother_occupation: 'Teacher'
    });

    worksheet.addRow({
        first_name: 'Emma',
        last_name: 'Wilson',
        dob: '2010-11-05',
        gender: 'Female',
        blood_group: 'O-',
        phone: '8765432109',
        email: 'emma.wilson@email.com',
        address: '456 Park Avenue',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        admission_date: '2024-06-01',
        class: 'Class 7',
        section: 'B',
        father_name: 'David Wilson',
        father_phone: '8765432110',
        father_whatsapp: '8765432110',
        father_email: 'david.w@email.com',
        father_occupation: 'Doctor',
        mother_name: 'Sarah Wilson',
        mother_phone: '8765432111',
        mother_whatsapp: '8765432111',
        mother_email: 'sarah.w@email.com',
        mother_occupation: 'Nurse'
    });

    worksheet.addRow({
        first_name: 'Daniel',
        last_name: 'Brown',
        dob: '2009-07-22',
        gender: 'Male',
        blood_group: 'B+',
        phone: '7654321098',
        email: 'daniel.brown@email.com',
        address: '789 Lake Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        admission_date: '2024-06-01',
        class: 'Class 8',
        section: 'C',
        father_name: 'Michael Brown',
        father_phone: '7654321099',
        father_whatsapp: '7654321099',
        father_email: 'michael.b@email.com',
        father_occupation: 'Business',
        mother_name: 'Lisa Brown',
        mother_phone: '7654321100',
        mother_whatsapp: '7654321100',
        mother_email: 'lisa.b@email.com',
        mother_occupation: 'Accountant'
    });

    const templatePath = path.join(__dirname, '../public/templates/student_bulk_template.xlsx');
    await workbook.xlsx.writeFile(templatePath);
    console.log('✓ Excel template created successfully at:', templatePath);
}

createTemplate().catch(error => {
    console.error('Error creating template:', error);
    process.exit(1);
});
