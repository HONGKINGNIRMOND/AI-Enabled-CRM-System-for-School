const { calculateClassRankings, recalculateAllRankings } = require('../services/studentService');
const { Student } = require('../models/school');
const { Op } = require('sequelize');

/**
 * Get rankings for a specific class
 */
const getClassRankings = async (req, res) => {
    try {
        const { class: classValue, section } = req.query;

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
            order: [
                ['classRank', 'ASC'],
                ['percentage', 'DESC'],
                ['totalMarks', 'DESC'],
                ['name', 'ASC']
            ]
        });

        res.status(200).json({
            success: true,
            class: classValue,
            section: section || 'All',
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Get class rankings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve rankings',
            error: error.message
        });
    }
};

/**
 * Recalculate rankings for a specific class
 */
const recalculateClassRankings = async (req, res) => {
    try {
        const { class: classValue, section } = req.body;

        if (!classValue) {
            return res.status(400).json({
                success: false,
                message: 'Class parameter is required'
            });
        }

        const count = await calculateClassRankings(classValue, section);

        res.status(200).json({
            success: true,
            message: 'Rankings recalculated successfully',
            data: {
                class: classValue,
                section: section || 'All',
                studentsRanked: count
            }
        });
    } catch (error) {
        console.error('Recalculate rankings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to recalculate rankings',
            error: error.message
        });
    }
};

/**
 * Recalculate all rankings
 */
const recalculateAllRankingsEndpoint = async (req, res) => {
    try {
        await recalculateAllRankings();

        res.status(200).json({
            success: true,
            message: 'All rankings recalculated successfully'
        });
    } catch (error) {
        console.error('Recalculate all rankings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to recalculate rankings',
            error: error.message
        });
    }
};

/**
 * Get top performers
 */
const getTopPerformers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
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
            order: [
                ['percentage', 'DESC'],
                ['totalMarks', 'DESC'],
                ['name', 'ASC']
            ],
            limit
        });

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error('Get top performers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve top performers',
            error: error.message
        });
    }
};

module.exports = {
    getClassRankings,
    recalculateClassRankings,
    recalculateAllRankingsEndpoint,
    getTopPerformers
};
