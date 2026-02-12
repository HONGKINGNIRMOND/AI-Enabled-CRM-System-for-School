const { Customer, User, Interaction, Lead } = require('../models');
const { verifyToken } = require('../config/auth');

const getAllCustomers = async (req, res) => {
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

        const { page = 1, limit = 10, status, search } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereCondition = {};

        if (status) {
            whereCondition.status = status;
        }

        if (search) {
            whereCondition[require('sequelize').Op.or] = [
                { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
                { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
                { company: { [require('sequelize').Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: customers } = await Customer.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Customers retrieved successfully',
            data: {
                customers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / parseInt(limit)),
                    totalCustomers: count,
                    hasNextPage: parseInt(page) * parseInt(limit) < count,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getCustomerById = async (req, res) => {
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

        const customer = await Customer.findByPk(id, {
            include: [
                {
                    model: Interaction,
                    as: 'interactions',
                    attributes: ['id', 'type', 'notes', 'outcome', 'timestamp'],
                    order: [['timestamp', 'DESC']]
                }
            ]
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Customer retrieved successfully',
            data: { customer }
        });
    } catch (error) {
        console.error('Get customer by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const createCustomer = async (req, res) => {
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

        const { name, email, phone, company, leadSource, lifetimeValue, notes } = req.body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer name is required'
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

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ where: { email } });
        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: 'Customer with this email already exists'
            });
        }

        const customer = await Customer.create({
            name,
            email,
            phone,
            company,
            leadSource,
            lifetimeValue,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: { customer }
        });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateCustomer = async (req, res) => {
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
        const { name, email, phone, company, status, leadSource, lifetimeValue, notes } = req.body;

        // Validation
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

        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== customer.email) {
            const existingCustomer = await Customer.findOne({ where: { email } });
            if (existingCustomer) {
                return res.status(409).json({
                    success: false,
                    message: 'Customer with this email already exists'
                });
            }
        }

        await customer.update({
            name: name || customer.name,
            email: email || customer.email,
            phone: phone || customer.phone,
            company: company || customer.company,
            status: status !== undefined ? status : customer.status,
            leadSource: leadSource || customer.leadSource,
            lifetimeValue: lifetimeValue !== undefined ? lifetimeValue : customer.lifetimeValue,
            notes: notes || customer.notes
        });

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: { customer }
        });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteCustomer = async (req, res) => {
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

        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Only admin can delete customers
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admin can delete customers'
            });
        }

        await customer.destroy();

        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const convertLeadToCustomer = async (req, res) => {
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

        const { leadId } = req.body;

        // Find the lead
        const lead = await Lead.findByPk(leadId);
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        // Check if customer already exists for this lead
        if (lead.email) {
            const existingCustomer = await Customer.findOne({ where: { email: lead.email } });
            if (existingCustomer) {
                return res.status(409).json({
                    success: false,
                    message: 'Customer with this email already exists'
                });
            }
        }

        // Create customer from lead
        const customer = await Customer.create({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            leadSource: lead.source || 'unknown'
        });

        // Update lead status to converted
        await lead.update({ status: 'converted' });

        res.status(201).json({
            success: true,
            message: 'Lead converted to customer successfully',
            data: { customer }
        });
    } catch (error) {
        console.error('Convert lead to customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    convertLeadToCustomer
};