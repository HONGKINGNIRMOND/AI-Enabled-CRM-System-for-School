const { Lead, User, Interaction } = require('../models');
const { verifyToken } = require('../config/auth');
const fs = require('fs');
const csv = require('csv-parser');

const getAllLeads = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { page = 1, limit = 10, status, assignedTo, search } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereCondition = {};

        if (status) {
            whereCondition.status = status;
        }

        if (assignedTo) {
            whereCondition.assignedAgent = assignedTo;
        }

        // Only show leads assigned to the current user if they are an agent
        if (req.user.role === 'agent') {
            whereCondition.assignedAgent = req.user.id;
        }

        if (search) {
            whereCondition[require('sequelize').Op.or] = [
                { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
                { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
                { company: { [require('sequelize').Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: leads } = await Lead.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'assignedAgentUser',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Leads retrieved successfully',
            data: {
                leads,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(limit)),
                    totalLeads: count,
                    hasNextPage: parseInt(page) * parseInt(limit) < count,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all leads error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getLeadById = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { id } = req.params;

        const lead = await Lead.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'assignedAgentUser',
                    attributes: ['id', 'name', 'email'],
                    required: false
                },
                {
                    model: Interaction,
                    as: 'interactions',
                    attributes: ['id', 'type', 'notes', 'outcome', 'timestamp'],
                    order: [['timestamp', 'DESC']]
                }
            ]
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        // Check if user can access this lead
        if (req.user.role === 'agent' && lead.assignedAgent !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this lead'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lead retrieved successfully',
            data: { lead }
        });
    } catch (error) {
        console.error('Get lead by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const createLead = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { name, email, phone, company, source, notes } = req.body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Lead name is required'
            });
        }

        if (email && typeof email === 'string' && email.length > 0) {
            if (!email.includes('@')) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid email is required if provided'
                });
            }
        }

        if (phone && typeof phone === 'string' && phone.length > 0) {
            // Basic phone validation - could be enhanced
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid phone number is required if provided'
                });
            }
        }

        const lead = await Lead.create({
            name,
            email,
            phone,
            company,
            source,
            notes,
            assignedAgent: req.user.role === 'agent' ? req.user.id : null // Auto-assign to agent if agent is creating
        });

        res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            data: { lead }
        });
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateLead = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { id } = req.params;
        const { name, email, phone, company, status, assignedAgent, source, notes, score } = req.body;

        // Validate inputs
        if (name && typeof name !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Name must be a string'
            });
        }

        if (email && typeof email === 'string' && email.length > 0) {
            if (!email.includes('@')) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid email is required if provided'
                });
            }
        }

        if (phone && typeof phone === 'string' && phone.length > 0) {
            // Basic phone validation
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid phone number is required if provided'
                });
            }
        }

        const lead = await Lead.findByPk(id);
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        await lead.update({
            name: name || lead.name,
            email: email || lead.email,
            phone: phone || lead.phone,
            company: company || lead.company,
            status: status !== undefined ? status : lead.status,
            assignedAgent: assignedAgent !== undefined ? assignedAgent : lead.assignedAgent,
            source: source || lead.source,
            notes: notes || lead.notes,
            score: score !== undefined ? score : lead.score
        });

        res.status(200).json({
            success: true,
            message: 'Lead updated successfully',
            data: { lead }
        });
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteLead = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { id } = req.params;

        const lead = await Lead.findByPk(id);
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        // Only admin can delete leads
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can delete leads'
            });
        }

        await lead.destroy();

        res.status(200).json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const assignLead = async (req, res) => {
    try {
        // Check authentication
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        try {
            const decoded = verifyToken(token, process.env.JWT_SECRET);

            // Check if user exists
            const currentUser = await User.findByPk(decoded.userId, {
                attributes: ['id', 'role', 'name']
            });

            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = currentUser;
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const { id } = req.params;
        const { agentId } = req.body;

        const lead = await Lead.findByPk(id);
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        // Only admin and management can assign leads
        if (!['admin', 'management'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Only admin and management can assign leads'
            });
        }

        // Verify agent exists
        const agent = await User.findByPk(agentId);
        if (!agent || agent.role !== 'agent') {
            return res.status(404).json({
                success: false,
                message: 'Agent not found or invalid role'
            });
        }

        await lead.update({ assignedAgent: agentId });

        const updatedLead = await Lead.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'assignedAgentUser',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Lead assigned successfully',
            data: { lead: updatedLead }
        });
    } catch (error) {
        console.error('Assign lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const bulkUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const results = [];
    const errors = [];
    let successCount = 0;
    let failCount = 0;

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            for (const row of results) {
                try {
                    // Map CSV columns to model fields
                    // Assuming CSV headers: Name, Email, Phone, Company, Source
                    const leadData = {
                        name: row.Name || row.name,
                        email: row.Email || row.email,
                        phone: row.Phone || row.phone,
                        company: row.Company || row.company,
                        source: row.Source || row.source || 'Bulk Upload',
                        status: 'new'
                    };

                    if (!leadData.name) {
                        throw new Error('Name is required');
                    }

                    await Lead.create(leadData);
                    successCount++;
                } catch (err) {
                    failCount++;
                    errors.push(`Row ${results.indexOf(row) + 2}: ${err.message}`);
                }
            }

            // Clean up file
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.json({
                success: true,
                message: 'Bulk upload completed',
                data: {
                    successCount,
                    failCount,
                    errors
                }
            });
        })
        .on('error', (err) => {
            console.error('CSV processing error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to process CSV file'
            });
        });
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