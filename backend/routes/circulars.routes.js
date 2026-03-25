const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// Storage for circular attachments (PDF, Excel, etc.)
const circularsDir = path.join(__dirname, '..', 'public', 'circulars');
const filesDir = path.join(circularsDir, 'files');
const metadataFile = path.join(circularsDir, 'metadata.json');

// Ensure directories exist
if (!fs.existsSync(circularsDir)) {
    fs.mkdirSync(circularsDir, { recursive: true });
}
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, filesDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${timestamp}_${safeName}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024 }, // 10MB default
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/csv'
        ];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only PDF, Excel, Word and CSV files are allowed'));
        }
        cb(null, true);
    }
});

// Helpers to read/write metadata
const readMetadata = () => {
    try {
        if (!fs.existsSync(metadataFile)) {
            return [];
        }
        const raw = fs.readFileSync(metadataFile, 'utf8');
        return raw ? JSON.parse(raw) : [];
    } catch (err) {
        console.error('Failed to read circular metadata:', err);
        return [];
    }
};

const writeMetadata = (data) => {
    try {
        fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Failed to write circular metadata:', err);
    }
};

// All circular routes require authentication
router.use(authenticateToken);

// Create a new e-circular
router.post('/', upload.array('files', 10), (req, res) => {
    try {
        if (!['admin', 'hod'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Only admins and HODs can create circulars'
            });
        }

        let { title, message, targetRoles, targetDepartments, targetSubjects, targetUsers, scheduledDate } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        const files = req.files || [];
        const metadata = readMetadata();

        const id = Date.now().toString();
        const now = new Date().toISOString();

        const attachments = files.map((file) => ({
            fileName: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size
        }));

        // Parse JSON targets
        const parseJsonField = (field) => {
            if (!field) return [];
            try { return typeof field === 'string' ? JSON.parse(field) : field; } 
            catch { return []; }
        };

        const circular = {
            id,
            title,
            message,
            targetRoles: parseJsonField(targetRoles),
            targetDepartments: parseJsonField(targetDepartments),
            targetSubjects: parseJsonField(targetSubjects),
            targetUsers: parseJsonField(targetUsers),
            scheduledDate: scheduledDate || null,
            createdBy: req.user.fullName || req.user.username || req.user.email,
            creatorId: req.user.id,
            creatorRole: req.user.role,
            createdAt: now,
            attachments
        };

        metadata.unshift(circular);
        writeMetadata(metadata);

        return res.status(201).json({
            success: true,
            message: 'Circular created and sent successfully',
            data: circular
        });
    } catch (error) {
        console.error('Create circular error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create circular'
        });
    }
});

// Get all circulars visible to the current user
router.get('/', async (req, res) => {
    try {
        const metadata = readMetadata();
        const role = req.user.role || '';
        const userId = req.user.id;
        const departmentId = req.user.departmentId;
        
        // Find subjects taught by the current user
        let userSubjects = [];
        if (role === 'teacher' || role === 'hod') {
            const subjectRes = await pool.query('SELECT subject_id FROM class_subjects WHERE teacher_id = $1', [userId]);
            userSubjects = subjectRes.rows.map(r => r.subject_id);
        }

        const now = new Date();

        const filtered = metadata.filter((c) => {
            // Admins see everything, Creators see their own
            if (role === 'admin' || c.creatorId === userId) return true;

            // Check if scheduled date is in the future
            if (c.scheduledDate && new Date(c.scheduledDate) > now) {
                return false;
            }

            // Legacy circulars without target rules
            if (c.audience === 'all') return true;
            if (c.audience === 'teachers' && role === 'teacher') return true;

            // Target mapping logic (OR condition across specified targets)
            let isTargeted = false;
            
            // If no targets are specified, it's not visible (or visible to none besides creator/admin)
            if (!c.targetRoles?.length && !c.targetDepartments?.length && !c.targetSubjects?.length && !c.targetUsers?.length && !c.audience) {
               return false;
            }

            if (c.targetRoles?.includes(role)) isTargeted = true;
            if (departmentId && c.targetDepartments?.includes(departmentId)) isTargeted = true;
            if (c.targetUsers?.includes(userId)) isTargeted = true;
            if (c.targetSubjects?.some(subId => userSubjects.includes(subId))) isTargeted = true;

            return isTargeted;
        });

        // Attach absolute URLs for files
        const host = `${req.protocol}://${req.get('host')}`;
        const withUrls = filtered.map((c) => ({
            ...c,
            attachments: (c.attachments || []).map((f) => ({
                ...f,
                url: `${host}/circulars/files/${f.fileName}`
            }))
        }));

        return res.json({
            success: true,
            data: withUrls
        });
    } catch (error) {
        console.error('Get circulars error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch circulars'
        });
    }
});

// Delete a circular (admin and creator HODs)
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const metadata = readMetadata();
        const index = metadata.findIndex((c) => c.id === id);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Circular not found'
            });
        }

        const circular = metadata[index];

        // Check permissions
        if (req.user.role !== 'admin' && circular.creatorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this circular'
            });
        }

        // Delete associated files
        if (circular.attachments && circular.attachments.length > 0) {
            circular.attachments.forEach((file) => {
                const filePath = path.join(filesDir, file.fileName);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (err) {
                        console.error(`Failed to delete file: ${filePath}`, err);
                    }
                }
            });
        }

        // Remove from metadata
        metadata.splice(index, 1);
        writeMetadata(metadata);

        return res.json({
            success: true,
            message: 'Circular deleted successfully'
        });
    } catch (error) {
        console.error('Delete circular error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete circular'
        });
    }
});

// Preview recipients count based on target criteria
router.post('/preview-recipients', async (req, res) => {
    try {
        if (!['admin', 'hod'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { targetRoles, targetDepartments, targetSubjects, targetUsers } = req.body;
        
        let sqlQuery = `
            SELECT DISTINCT u.id 
            FROM users u
            JOIN roles ro ON u.role_id = ro.id
            LEFT JOIN class_subjects cs ON u.id = cs.teacher_id
            WHERE u.is_active = true
        `;
        const params = [];
        const conditions = [];

        if (targetRoles && targetRoles.length > 0) {
            params.push(targetRoles);
            conditions.push(`ro.role_name = ANY($${params.length})`);
        }

        if (targetDepartments && targetDepartments.length > 0) {
            params.push(targetDepartments);
            conditions.push(`u.department_id = ANY($${params.length})`);
        }

        if (targetSubjects && targetSubjects.length > 0) {
            params.push(targetSubjects);
            conditions.push(`cs.subject_id = ANY($${params.length})`);
        }

        if (targetUsers && targetUsers.length > 0) {
            params.push(targetUsers);
            conditions.push(`u.id = ANY($${params.length})`);
        }

        if (conditions.length > 0) {
            sqlQuery += ` AND (${conditions.join(' OR ')})`;
        } else {
            // If no criteria, return 0
            return res.json({ success: true, count: 0 });
        }

        const result = await pool.query(sqlQuery, params);
        
        return res.json({
            success: true,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Preview recipients error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate preview'
        });
    }
});

module.exports = router;

