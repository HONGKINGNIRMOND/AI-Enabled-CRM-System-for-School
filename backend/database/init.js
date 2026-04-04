/**
 * Runtime database initialization script.
 *
 * Runs migrations and seeds essential data (classes, subjects, exam types,
 * and default users) before the application server starts. All operations
 * are idempotent — safe to call on every startup.
 */

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ─── Connection config ────────────────────────────────────────────────────────

function getClientConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'school_crm',
  };
}

// ─── Migration ────────────────────────────────────────────────────────────────

async function runMigration(client) {
  console.log('🔄 Running migrations...');

  // Resolve schema.sql — it lives at <repo-root>/database/schema.sql
  const candidates = [
    path.join(__dirname, '../../../database/schema.sql'),  // repo root (Railway)
    path.join(__dirname, '../../../../database/schema.sql'), // alternate depth
  ];

  let schemaPath = candidates.find(p => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error(
      `schema.sql not found. Tried:\n  ${candidates.join('\n  ')}`
    );
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');
  await client.query(schema);
  console.log('✓ Migrations complete');
}

// ─── Seeds ────────────────────────────────────────────────────────────────────

async function seedClasses(client) {
  console.log('🌱 Seeding classes and sections...');

  const ACADEMIC_YEAR = '2025-2026';
  const classNames = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12',
  ];
  const sectionNames = ['A', 'B', 'C', 'D'];

  for (const className of classNames) {
    const res = await client.query(
      `INSERT INTO classes (class_name, academic_year, is_active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (class_name, academic_year) DO UPDATE SET is_active = TRUE
       RETURNING id`,
      [className, ACADEMIC_YEAR]
    );
    const classId = res.rows[0].id;

    for (const sectionName of sectionNames) {
      await client.query(
        `INSERT INTO sections (class_id, section_name, max_students)
         VALUES ($1, $2, 40)
         ON CONFLICT (class_id, section_name) DO NOTHING`,
        [classId, sectionName]
      );
    }
  }
  console.log('✓ Classes and sections ready');
}

async function seedSubjects(client) {
  console.log('📖 Seeding subjects...');

  const subjects = ['English', 'Science', 'Social', 'Maths'];
  for (const name of subjects) {
    await client.query(
      `INSERT INTO subjects (subject_name, is_active)
       VALUES ($1, TRUE)
       ON CONFLICT (subject_name) DO UPDATE SET is_active = TRUE`,
      [name]
    );
  }
  console.log('✓ Subjects ready');
}

async function seedExamTypes(client) {
  console.log('📝 Seeding exam types...');

  const examTypes = [
    { name: 'First Internal', code: 'INT1', weightage: 20.00 },
    { name: 'Mid-Term',       code: 'MID',  weightage: 30.00 },
    { name: 'Second Internal', code: 'INT2', weightage: 20.00 },
    { name: 'Final Exam',     code: 'FINAL', weightage: 30.00 },
  ];

  for (const et of examTypes) {
    await client.query(
      `INSERT INTO exam_types (exam_name, exam_code, weightage)
       VALUES ($1, $2, $3)
       ON CONFLICT (exam_code) DO UPDATE SET exam_name = EXCLUDED.exam_name, weightage = EXCLUDED.weightage`,
      [et.name, et.code, et.weightage]
    );
  }
  console.log('✓ Exam types ready');
}

async function seedUsers(client) {
  console.log('👤 Seeding default users...');

  // bcryptjs is a runtime dependency — safe to require here
  const bcrypt = require('bcryptjs');

  // Ensure roles exist
  const defaultRoles = ['admin', 'teacher', 'hod', 'student'];
  for (const roleName of defaultRoles) {
    await client.query(
      `INSERT INTO roles (role_name) VALUES ($1) ON CONFLICT (role_name) DO NOTHING`,
      [roleName]
    );
  }

  const rolesRes = await client.query('SELECT id, role_name FROM roles');
  const roles = rolesRes.rows;
  const adminRoleId  = roles.find(r => r.role_name === 'admin')?.id;
  const teacherRoleId = roles.find(r => r.role_name === 'teacher')?.id;

  if (!adminRoleId || !teacherRoleId) {
    throw new Error('Required roles (admin, teacher) not found after seeding.');
  }

  const adminPassword   = bcrypt.hashSync('admin123', 10);
  const teacherPassword = bcrypt.hashSync('teacher123', 10);

  await client.query(
    `INSERT INTO users (username, email, password_hash, role_id, full_name, phone, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email`,
    ['admin', 'admin@school.com', adminPassword, adminRoleId, 'System Administrator', '+1234567890']
  );

  await client.query(
    `INSERT INTO users (username, email, password_hash, role_id, full_name, phone, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, email = EXCLUDED.email`,
    ['teacher', 'teacher@school.com', teacherPassword, teacherRoleId, 'John Teacher', '+1234567891']
  );

  console.log('✓ Default users ready (admin@school.com / admin123)');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function init() {
  console.log('\n🚀 Starting database initialization...\n');

  const client = new Client(getClientConfig());

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL\n');

    await runMigration(client);
    await seedClasses(client);
    await seedSubjects(client);
    await seedExamTypes(client);
    await seedUsers(client);

    console.log('\n✅ Database initialization complete!\n');
  } catch (err) {
    console.error('\n❌ Database initialization failed:', err.message);
    // Exit with failure so Railway knows the start command failed
    process.exit(1);
  } finally {
    await client.end();
  }
}

init();
