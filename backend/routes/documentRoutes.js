const express = require('express');
const router = express.Router();
const multer = require('multer'); // ✅ FIX: Changed from a string to a require statement
const { fileUploadLogger } = require('../middleware/logging');

// IMPORT THE CONTROLLER FUNCTIONS
const {
  getDocuments,
  uploadDocument,
  getDocumentAnalysis,
  deleteDocument,
  getDashboardStats,
  getUploadTrends,
  getDepartmentDistribution,
  getProcessingEfficiency
} = require('../controllers/documentController');

// Define allowed file types
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'image/jpeg',
  'image/png',
  'text/plain'
];

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure 'uploads' directory exists
  },
  filename: function (req, file, cb) {
    // Keep original filename but add a timestamp to avoid conflicts
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Add a file filter to reject unsupported files
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Unsupported file type!'), false); // Reject the file
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// --- Define the routes ---

// Routes for the main collection /api/documents
router.route('/')
  .get(getDocuments);

// Route for uploading
router.route('/upload')
  .post(upload.single('file'), fileUploadLogger, uploadDocument);

// Analytics and Statistics Routes
router.route('/stats/dashboard')
  .get(getDashboardStats);

router.route('/stats/upload-trends')
  .get(getUploadTrends);

router.route('/stats/department-distribution')
  .get(getDepartmentDistribution);

router.route('/stats/processing-efficiency')
  .get(getProcessingEfficiency);

// Routes for a specific document by its ID /api/documents/:id
router.route('/:id')
  .get(getDocumentAnalysis)
  .delete(deleteDocument);

module.exports = router;