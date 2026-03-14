const { query } = require('../config/database');

async function addParentInfoToStudents() {
    try {
        console.log('Adding parent information columns to students table...');

        // Add father information columns
        await query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS father_phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS father_whatsapp VARCHAR(20),
            ADD COLUMN IF NOT EXISTS father_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(100);
        `);
        console.log('✓ Added father information columns');

        // Add mother information columns
        await query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS mother_whatsapp VARCHAR(20),
            ADD COLUMN IF NOT EXISTS mother_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(100);
        `);
        console.log('✓ Added mother information columns');

        // Create indexes for WhatsApp numbers for quick lookup
        await query('CREATE INDEX IF NOT EXISTS idx_students_father_whatsapp ON students(father_whatsapp);');
        await query('CREATE INDEX IF NOT EXISTS idx_students_mother_whatsapp ON students(mother_whatsapp);');
        console.log('✓ Created indexes for WhatsApp numbers');

        // Make roll_number globally unique across student_enrollments
        console.log('\nMaking roll_number globally unique...');

        // First, check if there are any duplicate roll numbers
        const duplicates = await query(`
            SELECT roll_number, COUNT(*) as count 
            FROM student_enrollments 
            WHERE roll_number IS NOT NULL 
            GROUP BY roll_number 
            HAVING COUNT(*) > 1;
        `);

        if (duplicates.length > 0) {
            console.log(`⚠ Found ${duplicates.length} duplicate roll numbers. Fixing...`);

            // Fix duplicates by regenerating roll numbers
            for (const dup of duplicates) {
                const records = await query(
                    'SELECT id, academic_year FROM student_enrollments WHERE roll_number = $1 ORDER BY id',
                    [dup.roll_number]
                );

                // Keep the first one, regenerate others
                for (let i = 1; i < records.length; i++) {
                    const record = records[i];
                    const year = record.academic_year.split('-')[0];
                    const yearPrefix = year.slice(-2);

                    // Get next available sequence number
                    const maxRoll = await query(
                        `SELECT roll_number FROM student_enrollments 
                         WHERE roll_number LIKE $1 
                         ORDER BY roll_number DESC LIMIT 1`,
                        [`${yearPrefix}%`]
                    );

                    let nextSeq = 1;
                    if (maxRoll.length > 0 && maxRoll[0].roll_number) {
                        const lastNum = parseInt(maxRoll[0].roll_number.slice(-3));
                        if (!isNaN(lastNum)) {
                            nextSeq = lastNum + 1;
                        }
                    }

                    const newRollNumber = `${yearPrefix}${nextSeq.toString().padStart(3, '0')}`;
                    await query(
                        'UPDATE student_enrollments SET roll_number = $1 WHERE id = $2',
                        [newRollNumber, record.id]
                    );
                    console.log(`  Fixed: Changed duplicate ${dup.roll_number} to ${newRollNumber}`);
                }
            }
        }

        // Drop existing unique constraint if it exists (student_id, academic_year)
        try {
            await query(`
                ALTER TABLE student_enrollments 
                DROP CONSTRAINT IF EXISTS student_enrollments_student_id_academic_year_key;
            `);
            console.log('✓ Dropped old unique constraint');
        } catch (error) {
            console.log('  No old constraint to drop');
        }

        // Add unique constraint on roll_number
        try {
            await query(`
                ALTER TABLE student_enrollments 
                ADD CONSTRAINT student_enrollments_roll_number_unique 
                UNIQUE (roll_number);
            `);
            console.log('✓ Added unique constraint on roll_number');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('✓ Unique constraint on roll_number already exists');
            } else {
                throw error;
            }
        }

        // Create index on roll_number for faster lookups
        await query('CREATE INDEX IF NOT EXISTS idx_student_enrollments_roll_number ON student_enrollments(roll_number);');
        console.log('✓ Created index on roll_number');

        console.log('\n✅ Migration completed successfully!');
        console.log('\nSummary:');
        console.log('- Added father information columns (name, phone, whatsapp, email, occupation)');
        console.log('- Added mother information columns (name, phone, whatsapp, email, occupation)');
        console.log('- Made roll_number globally unique across all academic years');
        console.log('- Created indexes for better performance');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during migration:', error);
        process.exit(1);
    }
}

addParentInfoToStudents();
