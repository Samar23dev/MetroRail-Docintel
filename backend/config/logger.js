const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            log += `\n  Metadata: ${JSON.stringify(meta, null, 2)}`;
        }

        // Add stack trace for errors
        if (stack) {
            log += `\n  Stack: ${stack}`;
        }

        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'kmrl-docintel-backend' },
    transports: [
        // Console transport (for development)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),

        // File transport for all logs
        new winston.transports.File({
            filename: path.join(logsDir, 'application.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),

        // Separate file for errors only
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 3,
            tailable: true
        }),

        // Separate file for document processing logs
        new winston.transports.File({
            filename: path.join(logsDir, 'document-processing.log'),
            level: 'debug',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),

        // API requests log
        new winston.transports.File({
            filename: path.join(logsDir, 'api-requests.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3,
            tailable: true
        })
    ],

    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            maxsize: 5242880,
            maxFiles: 2
        })
    ],

    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            maxsize: 5242880,
            maxFiles: 2
        })
    ]
});

// Create specialized loggers for different modules
const createModuleLogger = (moduleName) => {
    return {
        debug: (message, meta = {}) => logger.debug(message, { module: moduleName, ...meta }),
        info: (message, meta = {}) => logger.info(message, { module: moduleName, ...meta }),
        warn: (message, meta = {}) => logger.warn(message, { module: moduleName, ...meta }),
        error: (message, meta = {}) => logger.error(message, { module: moduleName, ...meta })
    };
};

// Document processing logger with extra detail
const documentLogger = {
    uploadStart: (filename, metadata = {}) => {
        logger.info(`🔄 Document upload started: ${filename}`, {
            type: 'document-processing',
            action: 'upload-start',
            filename,
            ...metadata
        });
    },

    uploadProgress: (filename, step, details = {}) => {
        logger.info(`📊 Upload progress - ${step}: ${filename}`, {
            type: 'document-processing',
            action: 'upload-progress',
            filename,
            step,
            ...details
        });
    },

    uploadComplete: (filename, documentId, metadata = {}) => {
        logger.info(`✅ Document upload completed: ${filename} (ID: ${documentId})`, {
            type: 'document-processing',
            action: 'upload-complete',
            filename,
            documentId,
            ...metadata
        });
    },

    uploadError: (filename, error, metadata = {}) => {
        logger.error(`❌ Document upload failed: ${filename}`, {
            type: 'document-processing',
            action: 'upload-error',
            filename,
            error: error.message,
            stack: error.stack,
            ...metadata
        });
    },

    textExtraction: (filename, method, length, duration = 0) => {
        logger.info(`📄 Text extracted from ${filename} using ${method}`, {
            type: 'document-processing',
            action: 'text-extraction',
            filename,
            method,
            textLength: length,
            duration: `${duration}ms`
        });
    },

    aiAnalysis: (filename, analysisType, duration = 0, confidence = 0) => {
        logger.info(`🤖 AI analysis completed for ${filename}`, {
            type: 'document-processing',
            action: 'ai-analysis',
            filename,
            analysisType,
            duration: `${duration}ms`,
            confidence
        });
    },

    databaseSave: (filename, documentId, metadata = {}) => {
        logger.info(`💾 Document saved to database: ${filename}`, {
            type: 'document-processing',
            action: 'database-save',
            filename,
            documentId,
            ...metadata
        });
    }
};

// API request logger
const apiLogger = {
    request: (req) => {
        logger.info(`📡 ${req.method} ${req.url}`, {
            type: 'api-request',
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
    },

    response: (req, res, duration) => {
        logger.info(`📤 ${req.method} ${req.url} - ${res.statusCode}`, {
            type: 'api-response',
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    }
};

module.exports = {
    logger,
    createModuleLogger,
    documentLogger,
    apiLogger
};