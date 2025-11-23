const { apiLogger, logger } = require('../config/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log incoming request
    apiLogger.request(req);

    // Log request body for POST/PUT requests (excluding file uploads)
    if ((req.method === 'POST' || req.method === 'PUT') && req.body && !req.files) {
        logger.debug('📋 Request body received', {
            type: 'api-request-body',
            method: req.method,
            url: req.url,
            body: JSON.stringify(req.body, null, 2)
        });
    }

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = Date.now() - startTime;

        // Log response
        apiLogger.response(req, res, duration);

        // Log slow requests (>2 seconds)
        if (duration > 2000) {
            logger.warn('🐌 Slow request detected', {
                type: 'performance',
                method: req.method,
                url: req.url,
                duration: `${duration}ms`,
                statusCode: res.statusCode
            });
        }

        originalEnd.apply(this, args);
    };

    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    logger.error('💥 API Error occurred', {
        type: 'api-error',
        method: req.method,
        url: req.url,
        error: err.message,
        stack: err.stack,
        statusCode: res.statusCode || 500,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    next(err);
};

// File upload logging middleware
const fileUploadLogger = (req, res, next) => {
    if (req.files || req.file) {
        const files = req.files || [req.file];

        files.forEach(file => {
            if (file) {
                logger.info('📁 File upload received', {
                    type: 'file-upload',
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    fieldname: file.fieldname,
                    destination: file.destination,
                    uploadPath: file.path
                });
            }
        });
    }

    next();
};

module.exports = {
    requestLogger,
    errorLogger,
    fileUploadLogger
};