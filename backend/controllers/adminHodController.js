const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

// 1. Get all HODs along with their assigned departments
const getAllHods = async (req, res) => {
    try {
        const hods = await query(`
            SELECT 
                u.id, 
                u.username, 
                u.email, 
                u.full_name as "fullName", 
                u.phone, 
                u.is_active as "isActive", 
                u.gender, u.date_of_birth as "dateOfBirth", u.address, u.city, u.state, u.pincode, u.joining_date as "joiningDate",
                d.id as "departmentId",
                d.department_name as "departmentName"
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE r.role_name = 'hod'
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            data: hods
        });
    } catch (error) {
        console.error('Error fetching HODs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch HODs' });
    }
};

// 2. Create a new HOD
const createHod = async (req, res) => {
    const { username, email, password, fullName, phone, departmentId, gender, dateOfBirth, address, city, state, pincode, joiningDate } = req.body;

    if (!username || !email || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        await transaction(async (client) => {
            // Check if email or username exists
            const existingUser = await client.query(
                `SELECT id FROM users WHERE email = $1 OR username = $2`, 
                [email, username]
            );
            if (existingUser.length > 0) {
                throw new Error('Email or Username already exists');
            }

            // Get 'hod' role id
            const roleRes = await client.query(`SELECT id FROM roles WHERE role_name = 'hod'`);
            if (roleRes.length === 0) throw new Error('HOD role not found in database');
            const roleId = roleRes[0].id;

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Insert new HOD
            const userRes = await client.query(
                `INSERT INTO users (username, email, password_hash, role_id, department_id, full_name, phone, is_active,
                                  gender, date_of_birth, address, city, state, pincode, joining_date) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
                [username, email, passwordHash, roleId, departmentId || null, fullName, phone || null,
                 gender, dateOfBirth, address, city, state, pincode, joiningDate || new Date()]
            );

            const newHodId = userRes[0].id;

            // If a department is assigned, update the department to logically link the HOD
            if (departmentId) {
                await client.query(
                    `UPDATE departments SET hod_id = $1 WHERE id = $2`,
                    [newHodId, departmentId]
                );
            }

            res.status(201).json({
                success: true,
                message: 'HOD created successfully',
                data: { id: newHodId }
            });
        });
    } catch (error) {
        console.error('Error creating HOD:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create HOD' });
    }
};

// 3. Update an HOD (and their department assignment)
const updateHod = async (req, res) => {
    const { id } = req.params;
    const { username, email, fullName, phone, departmentId, isActive, gender, dateOfBirth, address, city, state, pincode, joiningDate } = req.body;

    try {
        await transaction(async (client) => {
            // Verify user is an HOD
            const userCheck = await client.query(
                `SELECT u.id, u.department_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND r.role_name = 'hod'`,
                [id]
            );
            if (userCheck.length === 0) {
                throw new Error('HOD not found');
            }
            
            const oldDepartmentId = userCheck[0].department_id;

            // Optional password update logic could go here, omitting for simplicity unless requested.

            await client.query(
                `UPDATE users 
                 SET username = COALESCE($1, username), 
                     email = COALESCE($2, email), 
                     full_name = COALESCE($3, full_name), 
                     phone = COALESCE($4, phone), 
                     department_id = $5,
                     is_active = COALESCE($6, is_active),
                     gender = COALESCE($7, gender),
                     date_of_birth = COALESCE($8, date_of_birth),
                     address = COALESCE($9, address),
                     city = COALESCE($10, city),
                     state = COALESCE($11, state),
                     pincode = COALESCE($12, pincode),
                     joining_date = COALESCE($13, joining_date),
                     updated_at = NOW()
                 WHERE id = $14`,
                [username, email, fullName, phone, departmentId || null, isActive, 
                 gender, dateOfBirth, address, city, state, pincode, joiningDate, id]
            );

            // Manage department's hod_id pointer:
            if (oldDepartmentId && oldDepartmentId !== departmentId) {
                // Remove HOD from the old department
                await client.query(`UPDATE departments SET hod_id = NULL WHERE id = $1`, [oldDepartmentId]);
            }

            if (departmentId) {
                // Reassign the new department
                await client.query(`UPDATE departments SET hod_id = $1 WHERE id = $2`, [id, departmentId]);
            }

            res.json({
                success: true,
                message: 'HOD updated successfully'
            });
        });
    } catch (error) {
        console.error('Error updating HOD:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update HOD' });
    }
};

// 4. Delete an HOD (soft delete)
const deleteHod = async (req, res) => {
    const { id } = req.params;

    try {
        await transaction(async (client) => {
            const userCheck = await client.query(
                `SELECT u.department_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1 AND r.role_name = 'hod'`,
                [id]
            );
            
            if (userCheck.length === 0) throw new Error('HOD not found');
            
            const deptId = userCheck[0].department_id;

            // Remove mapped references
            if (deptId) {
                await client.query(`UPDATE departments SET hod_id = NULL WHERE id = $1`, [deptId]);
            }

            // Deactivate and clear department map
            await client.query(`UPDATE users SET is_active = false, department_id = NULL WHERE id = $1`, [id]);

            res.json({
                success: true,
                message: 'HOD deactivated successfully'
            });
        });
    } catch (error) {
        console.error('Error deleting HOD:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to delete HOD' });
    }
};

// 5. Get all Departments (Helper for mapping)
const getDepartments = async (req, res) => {
    try {
        const departments = await query(`
            SELECT id, department_name as "departmentName", description, hod_id as "hodId", is_active as "isActive"
            FROM departments
            WHERE is_active = true
            ORDER BY department_name
        `);
        res.json({ success: true, data: departments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch departments' });
    }
};

// 6. Create Department
const createDepartment = async (req, res) => {
    const { departmentName, description } = req.body;
    
    if (!departmentName) return res.status(400).json({ success: false, message: 'Department name is required' });

    try {
        const deptRes = await query(
            `INSERT INTO departments (department_name, description) VALUES ($1, $2) RETURNING id`,
            [departmentName, description || '']
        );
        res.status(201).json({ success: true, data: { id: deptRes[0].id } });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Failed to create department' });
    }
};

module.exports = {
    getAllHods,
    createHod,
    updateHod,
    deleteHod,
    getDepartments,
    createDepartment
};
