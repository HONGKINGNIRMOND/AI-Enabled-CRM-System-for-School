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
        first_name: 'Aarav',
        last_name: 'Sharma',
        dob: '2010-04-15',
        gender: 'Male',
        blood_group: 'A+',
        phone: '9876543210',
        email: 'aarav.sharma@student.com',
        address: '12 MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        admission_date: '2025-06-10',
        class: 'Class 6',
        section: 'A',
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

    worksheet.addRow({
        first_name: 'Priya',
        last_name: 'Verma',
        dob: '2011-08-22',
        gender: 'Female',
        blood_group: 'B+',
        phone: '9765432109',
        email: 'priya.verma@student.com',
        address: '45 Gandhi Nagar',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110005',
        admission_date: '2025-06-10',
        class: 'Class 6',
        section: 'A',
        father_name: 'Anil Verma',
        father_phone: '9765432110',
        father_whatsapp: '9765432110',
        father_email: 'anil.verma@gmail.com',
        father_occupation: 'Business Owner',
        mother_name: 'Rekha Verma',
        mother_phone: '9765432111',
        mother_whatsapp: '9765432111',
        mother_email: 'rekha.verma@gmail.com',
        mother_occupation: 'Teacher'
    });

    worksheet.addRow({
        first_name: 'Rohan',
        last_name: 'Patel',
        dob: '2009-12-10',
        gender: 'Male',
        blood_group: 'O+',
        phone: '9654321098',
        email: 'rohan.patel@student.com',
        address: '78 Sakar Complex',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        admission_date: '2025-06-10',
        class: 'Class 7',
        section: 'A',
        father_name: 'Dilip Patel',
        father_phone: '9654321099',
        father_whatsapp: '9654321099',
        father_email: 'dilip.patel@gmail.com',
        father_occupation: 'Chartered Accountant',
        mother_name: 'Mina Patel',
        mother_phone: '9654321100',
        mother_whatsapp: '9654321100',
        mother_email: 'mina.patel@gmail.com',
        mother_occupation: 'Homemaker'
    });

    const templatePath = path.join(__dirname, '../public/templates/student_bulk_template.xlsx');
    await workbook.xlsx.writeFile(templatePath);
    console.log('✓ Excel template created successfully at:', templatePath);
}

createTemplate().catch(error => {
    console.error('Error creating template:', error);
    process.exit(1);
});
