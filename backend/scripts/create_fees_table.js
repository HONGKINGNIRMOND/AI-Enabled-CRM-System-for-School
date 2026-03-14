const { query } = require('../config/database');

async function createFeesTable() {
    try {
        console.log('Creating fees table...');

        await query(`
            CREATE TABLE IF NOT EXISTS fees (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                total_fee DECIMAL(10, 2) DEFAULT 0,
                paid_amount DECIMAL(10, 2) DEFAULT 0,
                pending_amount DECIMAL(10, 2) DEFAULT 0,
                academic_year VARCHAR(20),
                payment_status VARCHAR(20) DEFAULT 'pending',
                last_payment_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Create indexes
        await query('CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);');
        await query('CREATE INDEX IF NOT EXISTS idx_fees_academic_year ON fees(academic_year);');
        await query('CREATE INDEX IF NOT EXISTS idx_fees_payment_status ON fees(payment_status);');

        console.log('Fees table created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating fees table:', error);
        process.exit(1);
    }
}

createFeesTable();
