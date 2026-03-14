require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

// ─── Configuration ───────────────────────────────────────────────────────────
const ACADEMIC_YEAR = '2025';
const ACADEMIC_YEAR_LABEL = '2025-2026';
const STUDENTS_PER_CLASS = 5;
const TEACHERS_COUNT = 10;

// ─── Consistent Name Bank (Matching CSV Templates) ──────────────────────────
const SEED_STUDENTS = [
  { first: 'Aarav', last: 'Sharma', dob: '2010-04-15', gender: 'Male', phone: '9876543210', email: 'aarav.sharma@student.com', father: 'Rajesh Sharma', mother: 'Sunita Sharma' },
  { first: 'Priya', last: 'Verma', dob: '2011-08-22', gender: 'Female', phone: '9765432109', email: 'priya.verma@student.com', father: 'Anil Verma', mother: 'Rekha Verma' },
  { first: 'Rohan', last: 'Patel', dob: '2009-12-10', gender: 'Male', phone: '9654321098', email: 'rohan.patel@student.com', father: 'Dilip Patel', mother: 'Mina Patel' },
  { first: 'Anjali', last: 'Singh', dob: '2010-03-05', gender: 'Female', phone: '9543210987', email: 'anjali.singh@student.com', father: 'Vikram Singh', mother: 'Kavita Singh' },
  { first: 'Ishaan', last: 'Kumar', dob: '2009-07-19', gender: 'Male', phone: '9432109876', email: 'ishaan.kumar@student.com', father: 'Suresh Kumar', mother: 'Geeta Kumar' }
];

const TEACHER_NAMES = [
  { full: 'Rajesh Sharma', user: 'rajesh.sharma' },
  { full: 'Sunita Verma', user: 'sunita.verma' },
  { full: 'Vivek Patel', user: 'vivek.patel' },
  { full: 'Anita Joshi', user: 'anita.joshi' },
  { full: 'Mohan Das', user: 'mohan.das' }
];

const SUBJECTS_LIST = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Computer Science'];
const EXAM_TYPES = [
  { name: 'Unit Test 1', code: 'UT1', weight: 10 },
  { name: 'Unit Test 2', code: 'UT2', weight: 10 },
  { name: 'Midterm', code: 'MID', weight: 30 },
  { name: 'Final Exam', code: 'FINAL', weight: 50 }
];

const LEAD_DATA = [
  { name: 'Kiran Mehta', email: 'kiran.mehta@gmail.com', phone: '9876501234', source: 'Website' },
  { name: 'Divya Nair', email: 'divya.nair@gmail.com', phone: '9765401234', source: 'Referral' },
  { name: 'Sanjay Gupta', email: 'sanjay.gupta@gmail.com', phone: '9654301234', source: 'Walk-in' }
];

// ─── Phases ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting refined data seed...');
  
  try {
    console.log('🧹 Clearing existing data...');
    await query('TRUNCATE students, student_enrollments, attendance, internal_marks, fees CASCADE');
    
    // 1. Roles & Initial Users
    const roles = await query('SELECT id, role_name FROM roles');
    const adminRole = roles.find(r => r.role_name === 'admin')?.id;
    const teacherRole = roles.find(r => r.role_name === 'teacher')?.id;

    // 2. Teachers
    console.log('👩‍🏫 Seeding Teachers...');
    const teacherPassword = bcrypt.hashSync('teacher@123', 10);
    const teacherIds = [];
    for (const t of TEACHER_NAMES) {
      const email = `${t.user}@school.com`;
      const res = await query(
        `INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [t.user, email, teacherPassword, t.full, teacherRole]
      );
      teacherIds.push(res[0].id);
    }

    // 3. Subjects & Exam Types
    console.log('📖 Seeding Subjects & Exams...');
    const subjectMap = {};
    for (const s of SUBJECTS_LIST) {
      const res = await query(
        `INSERT INTO subjects (subject_name, is_active) VALUES ($1, TRUE)
         ON CONFLICT (subject_name) DO UPDATE SET is_active = TRUE
         RETURNING id`, [s]);
      subjectMap[s] = res[0].id;
    }

    const examMap = {};
    for (const e of EXAM_TYPES) {
      const existing = await query('SELECT id FROM exam_types WHERE exam_code = $1', [e.code]);
      if (existing.length > 0) {
        await query('UPDATE exam_types SET exam_name = $1, weightage = $2 WHERE id = $3', [e.name, e.weight, existing[0].id]);
        examMap[e.name] = existing[0].id;
      } else {
        const res = await query(
          `INSERT INTO exam_types (exam_name, exam_code, weightage) VALUES ($1, $2, $3) RETURNING id`, 
          [e.name, e.code, e.weight]
        );
        examMap[e.name] = res[0].id;
      }
    }

    // 4. Classes & Sections
    const classes = await query('SELECT id, class_name FROM classes WHERE is_active = TRUE LIMIT 3');
    if (classes.length === 0) throw new Error('No classes found. Seed classes first.');

    // 5. Students & Enrollments
    console.log('🎓 Seeding Students...');
    for (let i = 0; i < SEED_STUDENTS.length; i++) {
      const s = SEED_STUDENTS[i];
      const regNo = `REG2025${String(i + 1).padStart(3, '0')}`;
      const res = await query(
        `INSERT INTO students (registration_number, first_name, last_name, date_of_birth, gender, phone, email, father_name, mother_name, admission_date, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
         ON CONFLICT (registration_number) DO UPDATE SET first_name = EXCLUDED.first_name
         RETURNING id`,
        [regNo, s.first, s.last, s.dob, s.gender, s.phone, s.email, s.father, s.mother, '2025-06-10']
      );
      const studentId = res[0].id;

      // Enrollment
      const cls = classes[i % classes.length];
      const sections = await query('SELECT id FROM sections WHERE class_id = $1 LIMIT 1', [cls.id]);
      const sectionId = sections[0].id;
      const rollNo = `25${String(i + 1).padStart(3, '0')}`;

      await query(
        `INSERT INTO student_enrollments (student_id, class_id, section_id, academic_year, roll_number, enrollment_date, is_current)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         ON CONFLICT (student_id, academic_year) DO UPDATE SET roll_number = EXCLUDED.roll_number`,
        [studentId, cls.id, sectionId, ACADEMIC_YEAR, rollNo, '2025-06-10']
      );

      // Attendance (Sample for last 5 days)
      for (let day = 0; day < 5; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        if (date.getDay() === 0) continue; // Skip Sunday
        const dateStr = date.toISOString().split('T')[0];
        await query(
          `INSERT INTO attendance (student_id, class_id, section_id, attendance_date, status, marked_by, session)
           VALUES ($1, $2, $3, $4, 'Present', $5, 'Morning')
           ON CONFLICT DO NOTHING`,
          [studentId, cls.id, sectionId, dateStr, teacherIds[0]]
        );
      }

      // Marks
      const subjects = await query('SELECT id FROM class_subjects WHERE class_id = $1', [cls.id]);
      // If no subjects assigned, assign them
      if (subjects.length === 0) {
        for (let k = 0; k < 3; k++) {
          const subId = subjectMap[SUBJECTS_LIST[k]];
          await query(`INSERT INTO class_subjects (class_id, subject_id, teacher_id, max_marks) 
                           VALUES ($1, $2, $3, 100) ON CONFLICT DO NOTHING`,
            [cls.id, subId, teacherIds[k % teacherIds.length]]);
        }
      }
      const updatedSubjects = await query('SELECT id FROM class_subjects WHERE class_id = $1', [cls.id]);

      for (const sub of updatedSubjects) {
        await query(
          `INSERT INTO internal_marks (student_id, class_subject_id, exam_type_id, academic_year, marks_obtained, max_marks, entered_by)
               VALUES ($1, $2, $3, $4, $5, 100, $6)
               ON CONFLICT (student_id, class_subject_id, exam_type_id, academic_year) DO NOTHING`,
          [studentId, sub.id, examMap['Unit Test 1'], ACADEMIC_YEAR, 80 + i, teacherIds[0]]
        );
      }

      // Fees
      await query(
        `INSERT INTO fees (student_id, total_fee, paid_amount, pending_amount, academic_year, payment_status)
           VALUES ($1, 15000, 5000, 10000, $2, 'partial')
           ON CONFLICT (student_id, academic_year) DO NOTHING`,
        [studentId, ACADEMIC_YEAR_LABEL]
      );
    }

    // 6. Leads
    console.log('📋 Seeding Leads...');
    for (const l of LEAD_DATA) {
      await query(
        `INSERT INTO leads (name, email, phone, source, status)
         VALUES ($1, $2, $3, $4, 'new')
         ON CONFLICT (email) DO NOTHING`,
        [l.name, l.email, l.phone, l.source]
      );
    }

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

main();
