const { Fee, Student } = require('../models/school');
const { Op } = require('sequelize');

/**
 * Get fee status for a student
 */
const getStudentFeeStatus = async (req, res) => {
    try {
        const { registrationNumber } = req.params;
        const academicYear = req.query.academicYear || new Date().getFullYear().toString();

        const student = await Student.findOne({
            where: { registrationNumber },
            include: [
                {
                    model: Fee,
                    as: 'fees',
                    where: { academicYear },
                    required: false
                }
            ]
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    registrationNumber: student.registrationNumber,
                    name: student.name,
                    class: student.class,
                    section: student.section
                },
                fees: student.fees || []
            }
        });
    } catch (error) {
        console.error('Get fee status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fee status',
            error: error.message
        });
    }
};

/**
 * Get fee status for all students in a class
 */
const getClassFeeStatus = async (req, res) => {
    try {
        const { class: classValue, section } = req.query;
        const academicYear = req.query.academicYear || new Date().getFullYear().toString();

        if (!classValue) {
            return res.status(400).json({
                success: false,
                message: 'Class parameter is required'
            });
        }

        const whereClause = {
            class: classValue,
            isActive: true
        };

        if (section) {
            whereClause.section = section;
        }

        const students = await Student.findAll({
            where: whereClause,
            include: [
                {
                    model: Fee,
                    as: 'fees',
                    where: { academicYear },
                    required: false
                }
            ],
            order: [
                ['section', 'ASC'],
                ['name', 'ASC']
            ]
        });

        res.status(200).json({
            success: true,
            class: classValue,
            section: section || 'All',
            academicYear,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Get class fee status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fee status',
            error: error.message
        });
    }
};

/**
 * Get students with pending fees
 */
const getPendingFees = async (req, res) => {
    try {
        const academicYear = req.query.academicYear || new Date().getFullYear().toString();
        const classFilter = req.query.class || '';
        const sectionFilter = req.query.section || '';

        const whereClause = {
            isActive: true
        };

        if (classFilter) {
            whereClause.class = classFilter;
        }

        if (sectionFilter) {
            whereClause.section = sectionFilter;
        }

        const students = await Student.findAll({
            where: whereClause,
            include: [
                {
                    model: Fee,
                    as: 'fees',
                    where: {
                        academicYear,
                        paymentStatus: { [Op.in]: ['pending', 'partial'] }
                    },
                    required: true
                }
            ],
            order: [
                ['class', 'ASC'],
                ['section', 'ASC'],
                ['name', 'ASC']
            ]
        });

        res.status(200).json({
            success: true,
            academicYear,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Get pending fees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pending fees',
            error: error.message
        });
    }
};

/**
 * Update fee payment
 */
const updateFeePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paidAmount, totalFee, academicYear } = req.body;

        const fee = await Fee.findByPk(id);

        if (!fee) {
            return res.status(404).json({
                success: false,
                message: 'Fee record not found'
            });
        }

        if (paidAmount !== undefined) {
            fee.paidAmount = parseFloat(paidAmount);
        }

        if (totalFee !== undefined) {
            fee.totalFee = parseFloat(totalFee);
        }

        if (academicYear) {
            fee.academicYear = academicYear;
        }

        // Calculate pending amount
        fee.pendingAmount = fee.totalFee - fee.paidAmount;

        // Update payment status
        if (fee.pendingAmount <= 0) {
            fee.paymentStatus = 'paid';
            fee.lastPaymentDate = new Date();
        } else if (fee.paidAmount > 0) {
            fee.paymentStatus = 'partial';
            fee.lastPaymentDate = new Date();
        } else {
            fee.paymentStatus = 'pending';
        }

        await fee.save();

        res.status(200).json({
            success: true,
            message: 'Fee payment updated successfully',
            data: fee
        });
    } catch (error) {
        console.error('Update fee payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update fee payment',
            error: error.message
        });
    }
};

/**
 * Get fee statistics
 */
const getFeeStatistics = async (req, res) => {
    try {
        const academicYear = req.query.academicYear || new Date().getFullYear().toString();
        const classFilter = req.query.class || '';

        const whereClause = {
            academicYear
        };

        if (classFilter) {
            whereClause['$student.class$'] = classFilter;
        }

        const fees = await Fee.findAll({
            where: whereClause,
            include: [
                {
                    model: Student,
                    as: 'student',
                    where: { isActive: true },
                    required: true
                }
            ]
        });

        const stats = {
            totalStudents: fees.length,
            totalFeeAmount: 0,
            totalPaidAmount: 0,
            totalPendingAmount: 0,
            paidCount: 0,
            partialCount: 0,
            pendingCount: 0
        };

        fees.forEach(fee => {
            stats.totalFeeAmount += parseFloat(fee.totalFee || 0);
            stats.totalPaidAmount += parseFloat(fee.paidAmount || 0);
            stats.totalPendingAmount += parseFloat(fee.pendingAmount || 0);

            if (fee.paymentStatus === 'paid') stats.paidCount++;
            else if (fee.paymentStatus === 'partial') stats.partialCount++;
            else stats.pendingCount++;
        });

        stats.collectionRate = stats.totalFeeAmount > 0 
            ? ((stats.totalPaidAmount / stats.totalFeeAmount) * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            academicYear,
            data: stats
        });
    } catch (error) {
        console.error('Get fee statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve fee statistics',
            error: error.message
        });
    }
};

module.exports = {
    getStudentFeeStatus,
    getClassFeeStatus,
    getPendingFees,
    updateFeePayment,
    getFeeStatistics
};
