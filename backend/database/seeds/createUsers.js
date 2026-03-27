const bcrypt = require('bcryptjs');
const { query } = require('../../config/database');

// Note: query helper in ../config/database uses pg pool now.

async function createInitialUsers() {
    try {
        console.log('Creating initial users...\n');

        // Hash passwords
        const adminPassword = bcrypt.hashSync('admin123', 10);
        const teacherPassword = bcrypt.hashSync('teacher123', 10);

        // Get role IDs
        const roles = await query('SELECT id, role_name FROM roles', []);
        const adminRoleId = roles.find(r => r.role_name === 'admin').id;
        const teacherRoleId = roles.find(r => r.role_name === 'teacher').id;

        // Create admin user
        // PostgreSQL syntax: ON CONFLICT (email) DO UPDATE ...
        await query(
            `INSERT INTO users (username, email, password_hash, role_id, full_name, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO UPDATE SET password_hash = $8, email = $2`,
            ['admin', 'admin@school.com', adminPassword, adminRoleId, 'System Administrator', '+1234567890', true, adminPassword]
        );
        console.log('✓ Admin user created: admin@school.com / admin123');

        // Create teacher user
        await query(
            `INSERT INTO users (username, email, password_hash, role_id, full_name, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO UPDATE SET password_hash = $8, email = $2`,
            ['teacher', 'teacher@school.com', teacherPassword, teacherRoleId, 'John Teacher', '+1234567891', true, teacherPassword]
        );
        console.log('✓ Teacher user created: teacher@school.com / teacher123');


        console.log('\n✅ Initial users created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating users:', error);
        process.exit(1);
    }
}

createInitialUsers();
