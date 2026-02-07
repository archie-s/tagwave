const Event = require('../models/Event');
const NFCTag = require('../models/NFCTag');

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Private
 */
exports.getAllEvents = async (req, res, next) => {
  try {
    const { status, isActive, search } = req.query;
    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single event
 * @route   GET /api/events/:id
 * @access  Private
 */
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new event
 * @route   POST /api/events
 * @access  Private (Staff/Admin)
 */
exports.createEvent = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/events/:id
 * @access  Private (Staff/Admin)
 */
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (Admin)
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if event has tags
    const tagCount = await NFCTag.countDocuments({ event: event._id });
    if (tagCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete event with ${tagCount} associated tags. Please delete or reassign tags first.`,
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tags for an event
 * @route   GET /api/events/:id/tags
 * @access  Private
 */
exports.getEventTags = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const tags = await NFCTag.find({ event: req.params.id })
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk create tags for an event from CSV/Excel data
 * @route   POST /api/events/:id/tags/bulk
 * @access  Private (Staff/Admin)
 */
exports.bulkCreateTags = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of tags',
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      createdTags: [],
    };

    for (let i = 0; i < tags.length; i++) {
      const tagData = tags[i];
      
      try {
        // Add event reference and creator
        tagData.event = event._id;
        tagData.createdBy = req.user.id;
        
        // Set defaults if not provided
        if (!tagData.isActive) tagData.isActive = true;
        if (!tagData.destinationUrl) {
          return res.status(400).json({
            success: false,
            message: `Row ${i + 1}: destinationUrl is required`,
          });
        }

        const tag = await NFCTag.create(tagData);
        results.successful++;
        results.createdTags.push(tag);
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          tagId: tagData.tagId,
          message: error.message,
        });
      }
    }

    // Update event's tag count
    event.tagCount = await NFCTag.countDocuments({ event: event._id });
    await event.save();

    res.status(201).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get event statistics
 * @route   GET /api/events/:id/stats
 * @access  Private
 */
exports.getEventStats = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const tags = await NFCTag.find({ event: req.params.id });
    
    const stats = {
      totalTags: tags.length,
      activeTags: tags.filter(t => t.isActive).length,
      inactiveTags: tags.filter(t => !t.isActive).length,
      totalScans: tags.reduce((sum, tag) => sum + tag.scanCount, 0),
      assignedTags: tags.filter(t => t.assignedTo && t.assignedTo.name).length,
      unassignedTags: tags.filter(t => !t.assignedTo || !t.assignedTo.name).length,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
