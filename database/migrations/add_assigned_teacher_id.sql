-- Migration: Add assigned_teacher_id to students table
ALTER TABLE students ADD COLUMN assigned_teacher_id INTEGER;
ALTER TABLE students ADD CONSTRAINT fk_assigned_teacher FOREIGN KEY (assigned_teacher_id) REFERENCES users(id) ON DELETE SET NULL;
