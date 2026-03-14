const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');

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
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only PDF and Excel files are allowed'));
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

// Create a new e-circular (admin only)
router.post('/', upload.array('files', 5), (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can create circulars'
            });
        }

        const { title, message, audience } = req.body;

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

        const circular = {
            id,
            title,
            message,
            audience: audience || 'teachers',
            createdBy: req.user.fullName || req.user.username || req.user.email,
            creatorId: req.user.id,
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
router.get('/', (req, res) => {
    try {
        const metadata = readMetadata();

        // For now, audience is simple: 'teachers' or 'all'
        const role = req.user.role || '';
        const filtered = metadata.filter((c) => {
            if (c.audience === 'all') return true;
            if (c.audience === 'teachers' && role === 'teacher') return true;
            if (role === 'admin') return true; // admin sees all
            return false;
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

// Delete a circular (admin only)
router.delete('/:id', (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete circulars'
            });
        }

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

module.exports = router;

