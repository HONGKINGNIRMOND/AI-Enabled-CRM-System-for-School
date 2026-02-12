const { AuditLog } = require('../models/school');

// Audit logging middleware
const logAudit = async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = function (data) {
        // Log audit after response is sent
        setImmediate(async () => {
            try {
                const userId = req.user?.id || null;
                const action = req.method + ' ' + req.path;
                const entityType = req.path.split('/')[2] || 'unknown';
                
                await AuditLog.create({
                    userId,
                    action,
                    entityType,
                    entityId: req.params.id || null,
                    details: {
                        method: req.method,
                        path: req.path,
                        query: req.query,
                        body: sanitizeRequestBody(req.body),
                        statusCode: res.statusCode,
                        responseSuccess: data?.success
                    },
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent')
                });
            } catch (error) {
                console.error('Audit logging error:', error);
                // Don't fail the request if audit logging fails
            }
        });

        return originalJson(data);
    };

    next();
};

// Sanitize request body to remove sensitive information
const sanitizeRequestBody = (body) => {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
};

// Special audit log for file uploads
const logFileUpload = async (userId, fileName, recordsProcessed, recordsInserted, recordsUpdated, recordsFailed, errorMessage = null) => {
    try {
        await AuditLog.create({
            userId,
            action: 'FILE_UPLOAD',
            entityType: 'student',
            fileName,
            recordsProcessed,
            recordsInserted,
            recordsUpdated,
            recordsFailed,
            errorMessage,
            details: {
                uploadType: 'bulk_import',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('File upload audit logging error:', error);
    }
};

module.exports = {
    logAudit,
    logFileUpload
};
