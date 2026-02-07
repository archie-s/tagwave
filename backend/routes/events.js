const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventTags,
  bulkCreateTags,
  getEventStats,
} = require('../controllers/eventController');

const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Event CRUD routes
router
  .route('/')
  .get(getAllEvents)
  .post(authorize('staff', 'admin'), createEvent);

router
  .route('/:id')
  .get(getEvent)
  .put(authorize('staff', 'admin'), updateEvent)
  .delete(authorize('admin'), deleteEvent);

// Event-specific routes
router.get('/:id/tags', getEventTags);
router.post('/:id/tags/bulk', authorize('staff', 'admin'), bulkCreateTags);
router.get('/:id/stats', getEventStats);

module.exports = router;
