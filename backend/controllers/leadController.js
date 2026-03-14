const { query } = require('../config/database');
const { verifyToken } = require('../config/auth');
const fs = require('fs');
const csv = require('csv-parser');
const ExcelJS = require('exceljs');
const path = require('path');

const getAllLeads = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, assignedTo, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let queryText = 'SELECT l.*, u.full_name as assigned_agent_name FROM leads l LEFT JOIN users u ON l.assigned_agent = u.id WHERE 1=1';
        const queryParams = [];

        if (status) {
            queryParams.push(status);
            queryText += ` AND l.status = $${queryParams.length}`;
        }

        if (assignedTo) {
            queryParams.push(assignedTo);
            queryText += ` AND l.assigned_agent = $${queryParams.length}`;
        }

        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND (l.name ILIKE $${queryParams.length} OR l.email ILIKE $${queryParams.length} OR l.company ILIKE $${queryParams.length})`;
        }

        // Count total for pagination
        const totalRes = await query(`SELECT COUNT(*) as count FROM (${queryText}) as sub`, queryParams);
        const totalLeads = parseInt(totalRes[0].count);

        // Add sorting and pagination
        queryText += ` ORDER BY l.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(parseInt(limit), offset);

        const leads = await query(queryText, queryParams);

        res.status(200).json({
            success: true,
            message: 'Leads retrieved successfully',
            data: {
                leads,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalLeads / parseInt(limit)),
                    totalLeads,
                    hasNextPage: parseInt(page) * parseInt(limit) < totalLeads,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all leads error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;
        const leadRes = await query(
            'SELECT l.*, u.full_name as assigned_agent_name FROM leads l LEFT JOIN users u ON l.assigned_agent = u.id WHERE l.id = $1',
            [id]
        );

        if (leadRes.length === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Lead retrieved successfully',
            data: { lead: leadRes[0] }
        });
    } catch (error) {
        console.error('Get lead by ID error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const createLead = async (req, res) => {
    try {
        const { name, email, phone, company, source, notes } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Lead name is required' });
        }

        const result = await query(
            `INSERT INTO leads (name, email, phone, company, source, notes, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, email, phone, company, source || 'Manual', notes, 'new']
        );

        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: { lead: result[0] }
        });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, company, status, assignedAgent, source, notes } = req.body;

        const checkRes = await query('SELECT * FROM leads WHERE id = $1', [id]);
        if (checkRes.length === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const updated = await query(
            `UPDATE leads SET 
                name = COALESCE($1, name), 
                email = COALESCE($2, email), 
                phone = COALESCE($3, phone), 
                company = COALESCE($4, company), 
                status = COALESCE($5, status), 
                assigned_agent = COALESCE($6, assigned_agent), 
                source = COALESCE($7, source), 
                notes = COALESCE($8, notes), 
                updated_at = NOW() 
             WHERE id = $9 RETURNING *`,
            [name, email, phone, company, status, assignedAgent, source, notes, id]
        );

        res.status(200).json({
            success: true,
            message: 'Lead updated successfully',
            data: { lead: updated[0] }
        });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM leads WHERE id = $1 RETURNING *', [id]);

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        res.status(200).json({ success: true, message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const assignLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { agentId } = req.body;

        const result = await query(
            'UPDATE leads SET assigned_agent = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [agentId, id]
        );

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Lead assigned successfully',
            data: { lead: result[0] }
        });
    } catch (error) {
        console.error('Assign lead error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const bulkUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const leads = [];
    const errors = [];
    let successCount = 0;
    let failCount = 0;

    try {
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        if (fileExt === '.csv') {
            const results = [];
            await new Promise((resolve, reject) => {
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });

            for (const row of results) {
                const normalizedRow = {};
                Object.keys(row).forEach(key => normalizedRow[key.toLowerCase().trim()] = row[key]);

                leads.push({
                    name: normalizedRow['name'] || normalizedRow['full name'] || normalizedRow['fullname'],
                    email: normalizedRow['email'],
                    phone: normalizedRow['phone'] || normalizedRow['phone number'] || normalizedRow['mobile'],
                    company: normalizedRow['company'] || normalizedRow['company name'],
                    source: normalizedRow['source'] || 'Bulk Upload',
                    status: normalizedRow['status'] || 'new',
                    notes: normalizedRow['notes'] || normalizedRow['remarks'] || ''
                });
            }
        } else if (fileExt === '.xlsx' || fileExt === '.xls') {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(req.file.path);
            const worksheet = workbook.getWorksheet(1);

            const headerRow = worksheet.getRow(1);
            const colMap = {};
            headerRow.eachCell((cell, colNumber) => {
                const header = cell.value?.toString().toLowerCase().trim();
                colMap[header] = colNumber;
            });

            const getVal = (row, ...names) => {
                for (const name of names) {
                    const col = colMap[name.toLowerCase()];
                    if (col) return row.getCell(col).value?.toString().trim();
                }
                return null;
            };

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                leads.push({
                    name: getVal(row, 'name', 'full name', 'fullname'),
                    email: getVal(row, 'email'),
                    phone: getVal(row, 'phone', 'phone number', 'mobile'),
                    company: getVal(row, 'company', 'company name'),
                    source: getVal(row, 'source') || 'Bulk Upload',
                    status: getVal(row, 'status') || 'new',
                    notes: getVal(row, 'notes', 'remarks') || ''
                });
            });
        }

        for (const leadData of leads) {
            try {
                if (!leadData.name) throw new Error('Name is required');
                await query(
                    `INSERT INTO leads (name, email, phone, company, source, status, notes) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [leadData.name, leadData.email, leadData.phone, leadData.company, leadData.source, leadData.status, leadData.notes]
                );
                successCount++;
            } catch (err) {
                failCount++;
                errors.push(`Row ${leads.indexOf(leadData) + 2}: ${err.message}`);
            }
        }

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            message: 'Bulk upload completed',
            data: { successCount, failCount, errors: errors.slice(0, 50) }
        });

    } catch (error) {
        console.error('Bulk upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: 'Failed to process bulk upload: ' + error.message });
    }
};

module.exports = {
    getAllLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead,
    assignLead,
    bulkUpload
};
