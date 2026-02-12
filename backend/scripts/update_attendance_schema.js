const { query, pool } = require('../config/database');

async function updateSchema() {
    const client = await pool.connect();
    try {
        console.log('Starting schema update...');
        await client.query('BEGIN');

        // 1. Add session column if not exists
        console.log('Adding session column...');
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='session') THEN
                    ALTER TABLE attendance ADD COLUMN session VARCHAR(20) DEFAULT 'Morning';
                END IF;
            END $$;
        `);

        // 2. Drop old constraint
        console.log('Dropping old constraint...');
        await client.query(`
            ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_id_attendance_date_key;
        `);

        // 3. Add new constraint
        console.log('Adding new constraint...');
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_date_session_key') THEN
                    ALTER TABLE attendance ADD CONSTRAINT attendance_student_date_session_key UNIQUE (student_id, attendance_date, session);
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log('✅ Schema updated successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Schema update failed:', error);
    } finally {
        client.release();
        process.exit();
    }
}

updateSchema();
