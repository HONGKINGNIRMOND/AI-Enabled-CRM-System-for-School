-- School Management CRM System - Database Schema
-- PostgreSQL Database Schema

-- Connect to 'school_crm' database before running this script if it exists,
-- or creating it via: CREATE DATABASE school_crm;

-- ============================================
-- HELPER FUNCTIONS & TYPES
-- ============================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ENUM Types
DO $$ BEGIN
    CREATE TYPE user_gender AS ENUM('Male', 'Female', 'Other');
    CREATE TYPE attendance_status_enum AS ENUM('Present', 'Absent', 'Late', 'Excused');
    CREATE TYPE notification_recipient_type AS ENUM('user', 'student');
    CREATE TYPE notification_channel AS ENUM('sms', 'email', 'whatsapp', 'in-app');
    CREATE TYPE notification_status AS ENUM('pending', 'sent', 'failed', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- USER MANAGEMENT TABLES
-- ============================================

-- Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_roles_modtime
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO
    roles (role_name, description)
VALUES (
        'admin',
        'System Administrator with full access'
    ),
    (
        'hod',
        'Head of Department'
    ),
    (
        'teacher',
        'Teacher with access to assigned classes'
    );

-- Departments Table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    hod_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_departments_modtime
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department_id INT,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
);

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE departments ADD CONSTRAINT fk_departments_hod FOREIGN KEY (hod_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role ON users (role_id);
CREATE INDEX idx_users_department ON users (department_id);

-- ============================================
-- ACADEMIC STRUCTURE TABLES
-- ============================================

-- Classes Table
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_name, academic_year)
);

CREATE TRIGGER update_classes_modtime
    BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_classes_academic_year ON classes (academic_year);

-- Sections Table
CREATE TABLE sections (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL,
    section_name VARCHAR(10) NOT NULL,
    max_students INT DEFAULT 40,
    room_number VARCHAR(20),
    class_teacher_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    FOREIGN KEY (class_teacher_id) REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE (class_id, section_name)
);

CREATE TRIGGER update_sections_modtime
    BEFORE UPDATE ON sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_sections_class ON sections (class_id);

-- Subjects Table
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL UNIQUE,
    subject_code VARCHAR(20) UNIQUE,
    department_id INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL
);

CREATE TRIGGER update_subjects_modtime
    BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_subjects_code ON subjects (subject_code);
CREATE INDEX idx_subjects_department ON subjects (department_id);

-- Class-Subject Mapping
CREATE TABLE class_subjects (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT,
    max_marks INT DEFAULT 100,
    min_passing_marks INT DEFAULT 35,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE (class_id, subject_id)
);

CREATE TRIGGER update_class_subjects_modtime
    BEFORE UPDATE ON class_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_class_subjects_teacher ON class_subjects (teacher_id);

-- ============================================
-- STUDENT & PARENT INFORMATION TABLES
-- ============================================

-- Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender user_gender NOT NULL,
    blood_group VARCHAR(5),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    admission_date DATE NOT NULL,
    photo_url VARCHAR(255),
    assigned_teacher_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_teacher_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TRIGGER update_students_modtime
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_students_registration ON students (registration_number);
CREATE INDEX idx_students_name ON students (first_name, last_name);
CREATE INDEX idx_students_active ON students (is_active);

-- Parents Table
CREATE TABLE parents (
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

CREATE TRIGGER update_parents_modtime
    BEFORE UPDATE ON parents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_parents_father_whatsapp ON parents(father_whatsapp);
CREATE INDEX idx_parents_mother_whatsapp ON parents(mother_whatsapp);

-- Student-Parents Junction Table
CREATE TABLE student_parents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    relationship VARCHAR(50),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, parent_id)
);

CREATE INDEX idx_student_parents_student_id ON student_parents(student_id);
CREATE INDEX idx_student_parents_parent_id ON student_parents(parent_id);

-- Student Enrollments
CREATE TABLE student_enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    roll_number VARCHAR(20),
    enrollment_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE CASCADE,
    UNIQUE (student_id, academic_year)
);

CREATE TRIGGER update_student_enrollments_modtime
    BEFORE UPDATE ON student_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_enrollments_class_section ON student_enrollments (class_id, section_id);
CREATE INDEX idx_enrollments_academic_year ON student_enrollments (academic_year);
CREATE INDEX idx_enrollments_current ON student_enrollments (is_current);

-- ============================================
-- ATTENDANCE TABLES
-- ============================================

-- Attendance Table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    session VARCHAR(20) DEFAULT 'Morning',
    status attendance_status_enum NOT NULL DEFAULT 'Present',
    marked_by INT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE (student_id, attendance_date, session)
);

CREATE TRIGGER update_attendance_modtime
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_attendance_date ON attendance (attendance_date);
CREATE INDEX idx_attendance_class_section_date ON attendance (class_id, section_id, attendance_date);
CREATE INDEX idx_attendance_student_date ON attendance (student_id, attendance_date);

-- Attendance Summary
CREATE TABLE attendance_summary (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    month INT NOT NULL,
    total_days INT DEFAULT 0,
    present_days INT DEFAULT 0,
    absent_days INT DEFAULT 0,
    late_days INT DEFAULT 0,
    excused_days INT DEFAULT 0,
    attendance_percentage DECIMAL(5, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    UNIQUE (student_id, academic_year, month)
);

CREATE TRIGGER update_attendance_summary_modtime
    BEFORE UPDATE ON attendance_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_attendance_summary_year_month ON attendance_summary (academic_year, month);

-- ============================================
-- MARKS AND GRADES TABLES
-- ============================================

-- Exam Types
CREATE TABLE exam_types (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    exam_code VARCHAR(20) UNIQUE,
    description TEXT,
    weightage DECIMAL(5, 2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_exam_types_modtime
    BEFORE UPDATE ON exam_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default exam types
INSERT INTO exam_types (exam_name, exam_code, weightage)
VALUES 
    ('First Internal', 'INT1', 20.00),
    ('Mid-Term', 'MID', 30.00),
    ('Second Internal', 'INT2', 20.00),
    ('Final Exam', 'FINAL', 30.00);

-- Internal Marks Table
CREATE TABLE internal_marks (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    class_subject_id INT NOT NULL,
    exam_type_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    marks_obtained DECIMAL(5, 2),
    max_marks DECIMAL(5, 2) NOT NULL,
    is_absent BOOLEAN DEFAULT FALSE,
    entered_by INT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (class_subject_id) REFERENCES class_subjects (id) ON DELETE CASCADE,
    FOREIGN KEY (exam_type_id) REFERENCES exam_types (id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES users (id) ON DELETE SET NULL,
    UNIQUE (student_id, class_subject_id, exam_type_id, academic_year)
);

CREATE TRIGGER update_internal_marks_modtime
    BEFORE UPDATE ON internal_marks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_internal_marks_student ON internal_marks (student_id);
CREATE INDEX idx_internal_marks_class_subject ON internal_marks (class_subject_id);
CREATE INDEX idx_internal_marks_academic_year ON internal_marks (academic_year);

-- Grading Rules Table
CREATE TABLE grading_rules (
    id SERIAL PRIMARY KEY,
    grade_name VARCHAR(5) NOT NULL,
    min_percentage DECIMAL(5, 2) NOT NULL,
    max_percentage DECIMAL(5, 2) NOT NULL,
    grade_point DECIMAL(4, 2),
    description VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_grading_rules_modtime
    BEFORE UPDATE ON grading_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_grading_rules_percentage ON grading_rules (min_percentage, max_percentage);

-- Insert default grading rules
INSERT INTO grading_rules (grade_name, min_percentage, max_percentage, grade_point, description)
VALUES 
    ('A+', 90.00, 100.00, 10.00, 'Outstanding'),
    ('A', 80.00, 89.99, 9.00, 'Excellent'),
    ('B+', 70.00, 79.99, 8.00, 'Very Good'),
    ('B', 60.00, 69.99, 7.00, 'Good'),
    ('C+', 50.00, 59.99, 6.00, 'Above Average'),
    ('C', 40.00, 49.99, 5.00, 'Average'),
    ('D', 35.00, 39.99, 4.00, 'Pass'),
    ('F', 0.00, 34.99, 0.00, 'Fail');

-- Student Grades Table (Calculated grades)
CREATE TABLE student_grades (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    class_subject_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    total_marks_obtained DECIMAL(6, 2),
    total_max_marks DECIMAL(6, 2),
    percentage DECIMAL(5, 2),
    grade_id INT,
    grade_point DECIMAL(4, 2),
    remarks TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (class_subject_id) REFERENCES class_subjects (id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grading_rules (id) ON DELETE SET NULL,
    UNIQUE (student_id, class_subject_id, academic_year)
);

CREATE TRIGGER update_student_grades_modtime
    BEFORE UPDATE ON student_grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_student_grades_student_year ON student_grades (student_id, academic_year);
CREATE INDEX idx_student_grades_grade ON student_grades (grade_id);

-- ============================================
-- FEES MANAGEMENT TABLES
-- ============================================

-- Fees table for student fee status
CREATE TABLE fees (
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

CREATE TRIGGER update_fees_modtime
    BEFORE UPDATE ON fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_fees_student_id ON fees(student_id);
CREATE INDEX idx_fees_academic_year ON fees(academic_year);
CREATE INDEX idx_fees_payment_status ON fees(payment_status);

-- Class Fee Structure Table
CREATE TABLE class_fee_structure (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL,
    fee_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    academic_year VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    UNIQUE (class_id, fee_type, academic_year)
);

CREATE TRIGGER update_class_fee_structure_modtime
    BEFORE UPDATE ON class_fee_structure
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_class_fee_structure_class ON class_fee_structure (class_id);
CREATE INDEX idx_class_fee_structure_academic_year ON class_fee_structure (academic_year);

-- ============================================
-- NOTIFICATION TABLES
-- ============================================

-- Notification Types
CREATE TABLE notification_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default notification types
INSERT INTO notification_types (type_name, description)
VALUES 
    ('attendance', 'Attendance related notifications'),
    ('marks', 'Marks and grades notifications'),
    ('announcement', 'General announcements'),
    ('fee', 'Fee payment reminders'),
    ('event', 'School events and activities');

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    notification_type_id INT NOT NULL,
    recipient_id INT NOT NULL,
    recipient_type notification_recipient_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel notification_channel NOT NULL,
    status notification_status DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    error_message TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types (id) ON DELETE CASCADE
);

CREATE TRIGGER update_notifications_modtime
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, recipient_type);
CREATE INDEX idx_notifications_status ON notifications (status);
CREATE INDEX idx_notifications_created ON notifications (created_at);

-- Notification Preferences
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    notification_type_id INT NOT NULL,
    sms_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (notification_type_id) REFERENCES notification_types (id) ON DELETE CASCADE,
    UNIQUE (user_id, notification_type_id)
);

CREATE TRIGGER update_notification_preferences_modtime
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- Audit Log
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_log_user ON audit_log (user_id);
CREATE INDEX idx_audit_log_table_record ON audit_log (table_name, record_id);
CREATE INDEX idx_audit_log_created ON audit_log (created_at);

-- System Settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TRIGGER update_system_settings_modtime
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
    ('current_academic_year', '2025-2026', 'Current academic year'),
    ('school_name', 'School Name', 'Name of the school'),
    ('school_address', '', 'School address'),
    ('school_phone', '', 'School contact number'),
    ('school_email', '', 'School email address'),
    ('attendance_notification_enabled', 'true', 'Enable attendance notifications'),
    ('marks_notification_enabled', 'true', 'Enable marks notifications'),
    ('min_attendance_percentage', '75', 'Minimum required attendance percentage');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Current Student Details
CREATE OR REPLACE VIEW v_current_students AS
SELECT
    s.id,
    s.registration_number,
    CONCAT(s.first_name, ' ', s.last_name) AS full_name,
    s.date_of_birth,
    s.gender,
    s.phone,
    s.email,
    c.class_name,
    sec.section_name,
    se.roll_number,
    se.academic_year
FROM
    students s
    JOIN student_enrollments se ON s.id = se.student_id
    JOIN classes c ON se.class_id = c.id
    JOIN sections sec ON se.section_id = sec.id
WHERE
    s.is_active = TRUE
    AND se.is_current = TRUE;

-- View: Student Attendance Summary
CREATE OR REPLACE VIEW v_student_attendance_summary AS
SELECT
    s.id AS student_id,
    s.registration_number,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    asm.academic_year,
    SUM(asm.total_days) AS total_days,
    SUM(asm.present_days) AS present_days,
    SUM(asm.absent_days) AS absent_days,
    ROUND(AVG(asm.attendance_percentage), 2) AS avg_attendance_percentage
FROM
    students s
    JOIN attendance_summary asm ON s.id = asm.student_id
GROUP BY
    s.id,
    s.registration_number,
    student_name,
    asm.academic_year;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_student_enrollment_current ON student_enrollments (student_id, is_current);
CREATE INDEX idx_attendance_student_year ON attendance (student_id, attendance_date);
CREATE INDEX idx_marks_student_year ON internal_marks (student_id, academic_year);

-- ============================================
-- END OF SCHEMA
-- ============================================