const { query } = require('../config/database');

async function createSampleFees() {
    try {
        console.log('Creating sample fee records...\n');

        const academicYear = process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';

        // Get all active students
        const students = await query(
            `SELECT s.id, s.registration_number, s.first_name, s.last_name, c.class_name
             FROM students s
             JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
             JOIN classes c ON se.class_id = c.id
             WHERE s.is_active = TRUE`,
            []
        );

        console.log(`Found ${students.length} active students`);

        if (students.length === 0) {
            console.log('No students found. Please add students first.');
            process.exit(0);
        }

        let created = 0;
        let updated = 0;

        for (const student of students) {
            // Determine fee based on class (just for demo)
            const classNumber = parseInt(student.class_name.match(/\d+/)?.[0] || 1);
            const baseFee = 10000 + (classNumber * 1000); // Base fee increases with class

            // Random payment status for demo
            const rand = Math.random();
            let paidAmount, status;

            if (rand < 0.3) {
                // 30% fully paid
                paidAmount = baseFee;
                status = 'paid';
            } else if (rand < 0.6) {
                // 30% partial payment
                paidAmount = Math.floor(baseFee * (0.3 + Math.random() * 0.5));
                status = 'partial';
            } else {
                // 40% pending
                paidAmount = 0;
                status = 'pending';
            }

            const pendingAmount = baseFee - paidAmount;
            const lastPaymentDate = paidAmount > 0 ? new Date() : null;

            try {
                // Check if fee record already exists
                const existing = await query(
                    'SELECT id FROM fees WHERE student_id = $1 AND academic_year = $2',
                    [student.id, academicYear]
                );

                if (existing.length > 0) {
                    // Update existing record
                    await query(
                        `UPDATE fees SET 
                            total_fee = $1, 
                            paid_amount = $2, 
                            pending_amount = $3, 
                            payment_status = $4,
                            last_payment_date = $5,
                            updated_at = NOW()
                         WHERE student_id = $6 AND academic_year = $7`,
                        [baseFee, paidAmount, pendingAmount, status, lastPaymentDate, student.id, academicYear]
                    );
                    updated++;
                } else {
                    // Create new record
                    await query(
                        `INSERT INTO fees (
                            student_id, total_fee, paid_amount, pending_amount, 
                            academic_year, payment_status, last_payment_date, 
                            created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
                        [student.id, baseFee, paidAmount, pendingAmount, academicYear, status, lastPaymentDate]
                    );
                    created++;
                }

                console.log(`✓ ${student.first_name} ${student.last_name} (${student.class_name}): ₹${baseFee} - ${status}`);
            } catch (error) {
                console.error(`✗ Failed for ${student.first_name} ${student.last_name}:`, error.message);
            }
        }

        console.log(`\n✅ Fee records processed successfully!`);
        console.log(`   Created: ${created}`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Total: ${created + updated}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating fee records:', error);
        process.exit(1);
    }
}

createSampleFees();
