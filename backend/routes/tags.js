const express = require('express');
const { body } = require('express-validator');
const {
  getAllTags,
  getTag,
  getTagByTagId,
  createTag,
  updateTag,
  deleteTag,
  getTagStats,
  assignAttendee,
  bulkAssignAttendees,
  getTagsByGroup,
} = require('../controllers/tagController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Validation rules
const createTagValidation = [
  body('tagId').trim().notEmpty().withMessage('Tag ID is required'),
  body('name').trim().notEmpty().withMessage('Tag name is required'),
  body('destinationUrl')
    .trim()
    .notEmpty()
    .withMessage('Destination URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
];

// Public route for scanning
router.get('/scan/:tagId', getTagByTagId);

// Protected routes
router.use(protect);

router.get('/', getAllTags);
router.get('/:id', getTag);
router.get('/:id/stats', getTagStats);
router.get('/group/:groupId', getTagsByGroup);

// Staff and Admin only
router.post('/', authorize('staff', 'admin'), createTagValidation, validate, createTag);
router.put('/:id', authorize('staff', 'admin'), updateTag);
router.put('/:id/assign-attendee', authorize('staff', 'admin'), assignAttendee);
router.post('/bulk-assign', authorize('staff', 'admin'), bulkAssignAttendees);

// Admin only
router.delete('/:id', authorize('admin'), deleteTag);

module.exports = router;
