const { query } = require('../config/database');

async function createParentsTables() {
    try {
        console.log('Creating parents and student_parents tables...');

        // Create parents table
        await query(`
            CREATE TABLE IF NOT EXISTS parents (
                id SERIAL PRIMARY KEY,
                father_name VARCHAR(255),
                mother_name VARCHAR(255),
                father_phone VARCHAR(20),
                mother_phone VARCHAR(20),
                father_email VARCHAR(255),
                mother_email VARCHAR(255),
                father_whatsapp VARCHAR(20),
                mother_whatsapp VARCHAR(20),
                father_occupation VARCHAR(100),
                mother_occupation VARCHAR(100),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Create student_parents junction table
        await query(`
            CREATE TABLE IF NOT EXISTS student_parents (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
                relationship VARCHAR(50),
                is_primary_contact BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(student_id, parent_id)
            );
        `);

        // Create indexes
        await query('CREATE INDEX IF NOT EXISTS idx_parents_father_whatsapp ON parents(father_whatsapp);');
        await query('CREATE INDEX IF NOT EXISTS idx_parents_mother_whatsapp ON parents(mother_whatsapp);');
        await query('CREATE INDEX IF NOT EXISTS idx_student_parents_student_id ON student_parents(student_id);');
        await query('CREATE INDEX IF NOT EXISTS idx_student_parents_parent_id ON student_parents(parent_id);');

        console.log('Parents tables created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating parents tables:', error);
        process.exit(1);
    }
}

createParentsTables();
