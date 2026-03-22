const { pool } = require('../../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting HOD mapping migration...');
    await client.query('BEGIN');

    // 1. Create departments table
    console.log('Creating departments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        hod_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_departments_modtime ON departments;
      CREATE TRIGGER update_departments_modtime
        BEFORE UPDATE ON departments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // 2. Add 'hod' role if it doesn't exist
    console.log('Checking for hod role...');
    const roleCheck = await client.query(`SELECT id FROM roles WHERE role_name = 'hod'`);
    if (roleCheck.rows.length === 0) {
      console.log('Adding hod role...');
      await client.query(`INSERT INTO roles (role_name, description) VALUES ('hod', 'Head of Department')`);
    }

    // 3. Add department_id to users
    console.log('Adding department_id to users...');
    const usersCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' and column_name='department_id';
    `);
    if (usersCols.rows.length === 0) {
      await client.query(`ALTER TABLE users ADD COLUMN department_id INT`);
      await client.query(`ALTER TABLE users ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_users_department ON users (department_id)`);
    }

    // 4. Add constraint to departments
    console.log('Adding hod_id constraint to departments...');
    const deptConstraintCheck = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'departments' AND constraint_name = 'fk_departments_hod';
    `);
    if (deptConstraintCheck.rows.length === 0) {
      await client.query(`ALTER TABLE departments ADD CONSTRAINT fk_departments_hod FOREIGN KEY (hod_id) REFERENCES users (id) ON DELETE SET NULL`);
    }

    // 5. Add department_id to subjects
    console.log('Adding department_id to subjects...');
    const subjCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='subjects' and column_name='department_id';
    `);
    if (subjCols.rows.length === 0) {
      await client.query(`ALTER TABLE subjects ADD COLUMN department_id INT`);
      await client.query(`ALTER TABLE subjects ADD CONSTRAINT fk_subjects_department FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE SET NULL`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_subjects_department ON subjects (department_id)`);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
