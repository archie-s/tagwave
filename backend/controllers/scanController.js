const ScanEvent = require('../models/ScanEvent');
const NFCTag = require('../models/NFCTag');

/**
 * Parse user agent to get device info
 */
const parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  let deviceType = 'unknown';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) {
    deviceType = 'mobile';
  } else {
    deviceType = 'desktop';
  }

  let browser = 'unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';

  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { deviceType, browser, os };
};

/**
 * @desc    Log a scan event
 * @route   POST /api/scans
 * @access  Public
 */
exports.logScan = async (req, res, next) => {
  try {
    const { tagId } = req.body;

    // Find the tag
    const tag = await NFCTag.findOne({ tagId });

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

    // Parse user agent
    const userAgent = req.headers['user-agent'] || '';
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // Get IP address
    const ipAddress =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';

    // Create scan event
    const scanEvent = await ScanEvent.create({
      tag: tag._id,
      tagId: tag.tagId,
      ipAddress: ipAddress.split(',')[0].trim(),
      userAgent,
      deviceType,
      browser,
      os,
    });

    // Update tag scan count and last scanned time
    tag.scanCount += 1;
    tag.lastScannedAt = Date.now();
    await tag.save();

    res.status(201).json({
      success: true,
      data: {
        destinationUrl: tag.destinationUrl,
        scanEvent: scanEvent._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all scan events
 * @route   GET /api/scans
 * @access  Private
 */
exports.getAllScans = async (req, res, next) => {
  try {
    const { tagId, startDate, endDate, limit = 100 } = req.query;
    let query = {};

    // Filter by tag
    if (tagId) {
      query.tagId = tagId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.scannedAt = {};
      if (startDate) query.scannedAt.$gte = new Date(startDate);
      if (endDate) query.scannedAt.$lte = new Date(endDate);
    }

    const scans = await ScanEvent.find(query)
      .populate('tag', 'name tagId')
      .sort('-scannedAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: scans.length,
      data: scans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get scan analytics
 * @route   GET /api/scans/analytics
 * @access  Private
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, tagId } = req.query;
    
    let matchQuery = {};
    
    // Filter by tag if specified
    if (tagId) {
      matchQuery.tagId = tagId;
    }
    
    // Filter by date range if specified
    if (startDate || endDate) {
      matchQuery.scannedAt = {};
      if (startDate) matchQuery.scannedAt.$gte = new Date(startDate);
      if (endDate) matchQuery.scannedAt.$lte = new Date(endDate);
    }

    // Total scans
    const totalScans = await ScanEvent.countDocuments(matchQuery);

    // Unique scans (by IP)
    const uniqueScans = await ScanEvent.distinct('ipAddress', matchQuery);

    // Scans by device type
    const scansByDevice = await ScanEvent.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Scans by browser
    const scansByBrowser = await ScanEvent.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$browser',
          count: { $sum: 1 },
        },
      },
    ]);

    // Scans over time (daily)
    const scansOverTime = await ScanEvent.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top tags
    const topTags = await ScanEvent.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$tagId',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalScans,
        uniqueScans: uniqueScans.length,
        scansByDevice,
        scansByBrowser,
        scansOverTime,
        topTags,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get scan statistics summary
 * @route   GET /api/scans/stats
 * @access  Private
 */
exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total scans
    const totalScans = await ScanEvent.countDocuments();

    // Scans in last 7 days
    const scansLast7Days = await ScanEvent.countDocuments({
      scannedAt: { $gte: last7Days },
    });

    // Scans in last 30 days
    const scansLast30Days = await ScanEvent.countDocuments({
      scannedAt: { $gte: last30Days },
    });

    // Total unique users
    const uniqueUsers = await ScanEvent.distinct('ipAddress');

    // Active tags
    const activeTags = await NFCTag.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        totalScans,
        scansLast7Days,
        scansLast30Days,
        uniqueUsers: uniqueUsers.length,
        activeTags,
      },
    });
  } catch (error) {
    next(error);
  }
};
