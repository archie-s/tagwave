const NFCTag = require('../models/NFCTag');
const ScanEvent = require('../models/ScanEvent');

/**
 * @desc    Get all NFC tags
 * @route   GET /api/tags
 * @access  Private
 */
exports.getAllTags = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;
    let query = {};

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name or tagId
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagId: { $regex: search, $options: 'i' } },
      ];
    }

    const tags = await NFCTag.find(query)
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
 * @desc    Get single NFC tag
 * @route   GET /api/tags/:id
 * @access  Private
 */
exports.getTag = async (req, res, next) => {
  try {
    const tag = await NFCTag.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tag by tagId (for public scanning)
 * @route   GET /api/tags/scan/:tagId
 * @access  Public
 */
exports.getTagByTagId = async (req, res, next) => {
  try {
    const tag = await NFCTag.findOne({ tagId: req.params.tagId });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    if (!tag.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tag is not active',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tagId: tag.tagId,
        name: tag.name,
        destinationUrl: tag.destinationUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new NFC tag
 * @route   POST /api/tags
 * @access  Private (Staff/Admin)
 */
exports.createTag = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    const tag = await NFCTag.create(req.body);

    res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update NFC tag
 * @route   PUT /api/tags/:id
 * @access  Private (Staff/Admin)
 */
exports.updateTag = async (req, res, next) => {
  try {
    let tag = await NFCTag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    tag = await NFCTag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete NFC tag
 * @route   DELETE /api/tags/:id
 * @access  Private (Admin)
 */
exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await NFCTag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    await tag.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tag statistics
 * @route   GET /api/tags/:id/stats
 * @access  Private
 */
exports.getTagStats = async (req, res, next) => {
  try {
    const tag = await NFCTag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    // Get scan events for this tag
    const scans = await ScanEvent.find({ tag: req.params.id });
    
    // Get unique IPs for unique scans
    const uniqueScans = [...new Set(scans.map(scan => scan.ipAddress))].length;

    res.status(200).json({
      success: true,
      data: {
        totalScans: tag.scanCount,
        uniqueScans,
        lastScannedAt: tag.lastScannedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign attendee to NFC tag
 * @route   PUT /api/tags/:id/assign-attendee
 * @access  Private (Staff/Admin)
 */
exports.assignAttendee = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Attendee name is required',
      });
    }

    const tag = await NFCTag.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: {
          name: name.trim(),
          email: email?.trim() || '',
          phone: phone?.trim() || '',
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk assign attendees from array
 * @route   POST /api/tags/bulk-assign
 * @access  Private (Staff/Admin)
 */
exports.bulkAssignAttendees = async (req, res, next) => {
  try {
    const { assignments, groupId } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'assignments array is required and must not be empty',
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < assignments.length; i++) {
      try {
        const { tagId, name, email, phone } = assignments[i];

        if (!tagId || !name) {
          errors.push({
            index: i,
            message: 'tagId and name are required for each assignment',
          });
          continue;
        }

        const tag = await NFCTag.findOneAndUpdate(
          { tagId: tagId.trim() },
          {
            assignedTo: {
              name: name.trim(),
              email: email?.trim() || '',
              phone: phone?.trim() || '',
            },
            bulkReadGroup: groupId || '',
          },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!tag) {
          errors.push({
            index: i,
            message: `Tag with ID "${tagId}" not found`,
          });
        } else {
          results.push(tag);
        }
      } catch (err) {
        errors.push({
          index: i,
          message: err.message,
        });
      }
    }

    res.status(200).json({
      success: errors.length === 0,
      message: `${results.length} assignments successful${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tags by bulk group
 * @route   GET /api/tags/group/:groupId
 * @access  Private
 */
exports.getTagsByGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const tags = await NFCTag.find({ bulkReadGroup: groupId })
      .populate('createdBy', 'name email')
      .sort('createdAt');

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};
