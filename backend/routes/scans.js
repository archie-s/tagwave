const express = require('express');
const { body } = require('express-validator');
const {
  logScan,
  getAllScans,
  getAnalytics,
  getStats,
} = require('../controllers/scanController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Validation rules
const logScanValidation = [
  body('tagId').trim().notEmpty().withMessage('Tag ID is required'),
];

// Public route for logging scans
router.post('/', logScanValidation, validate, logScan);

// Protected routes
router.use(protect);

router.get('/', getAllScans);
router.get('/analytics', getAnalytics);
router.get('/stats', getStats);

module.exports = router;
