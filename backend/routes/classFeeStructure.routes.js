const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all class fee structures
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { academic_year, class_id } = req.query;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';

        let sql = `
            SELECT 
                cfs.*,
                c.class_name
            FROM class_fee_structure cfs
            JOIN classes c ON cfs.class_id = c.id
            WHERE cfs.academic_year = $1 AND cfs.is_active = TRUE
        `;
        const params = [year];

        if (class_id) {
            sql += ` AND cfs.class_id = $2`;
            params.push(class_id);
        }

        sql += ` ORDER BY c.class_name, cfs.fee_type`;

        const feeStructures = await query(sql, params);

        res.json({
            success: true,
            data: feeStructures
        });
    } catch (error) {
        console.error('Get fee structures error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fee structures'
        });
    }
});

// Get fee structure for a specific class
router.get('/class/:classId', authenticateToken, async (req, res) => {
    try {
        const { classId } = req.params;
        const { academic_year } = req.query;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';

        const feeStructures = await query(
            `SELECT 
                cfs.*,
                c.class_name
            FROM class_fee_structure cfs
            JOIN classes c ON cfs.class_id = c.id
            WHERE cfs.class_id = $1 AND cfs.academic_year = $2 AND cfs.is_active = TRUE
            ORDER BY cfs.fee_type`,
            [classId, year]
        );

        // Calculate total fee
        const totalFee = feeStructures.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

        res.json({
            success: true,
            data: {
                feeStructures,
                totalFee
            }
        });
    } catch (error) {
        console.error('Get class fee structure error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch class fee structure'
        });
    }
});

// Create or update fee structure
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { class_id, fee_type, amount, description, academic_year } = req.body;
        const year = academic_year || process.env.CURRENT_ACADEMIC_YEAR || '2026-2027';

        const result = await query(
            `INSERT INTO class_fee_structure (class_id, fee_type, amount, description, academic_year)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (class_id, fee_type, academic_year)
             DO UPDATE SET 
                amount = EXCLUDED.amount,
                description = EXCLUDED.description,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [class_id, fee_type, amount, description, year]
        );

        res.json({
            success: true,
            message: 'Fee structure saved successfully',
            data: result[0]
        });
    } catch (error) {
        console.error('Save fee structure error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save fee structure'
        });
    }
});

// Update fee structure
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, description } = req.body;

        const result = await query(
            `UPDATE class_fee_structure 
             SET amount = $1, description = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [amount, description, id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Fee structure not found'
            });
        }

        res.json({
            success: true,
            message: 'Fee structure updated successfully',
            data: result[0]
        });
    } catch (error) {
        console.error('Update fee structure error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update fee structure'
        });
    }
});

// Delete fee structure
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM class_fee_structure WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Fee structure deleted successfully'
        });
    } catch (error) {
        console.error('Delete fee structure error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete fee structure'
        });
    }
});

module.exports = router;
