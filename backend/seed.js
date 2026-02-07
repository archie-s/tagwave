require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const NFCTag = require('./models/NFCTag');
const ScanEvent = require('./models/ScanEvent');
const Event = require('./models/Event');

/**
 * ⚠️  SAMPLE DATA SEEDING SCRIPT ⚠️
 * 
 * This script creates sample/test data for demonstration purposes.
 * 
 * IMPORTANT: The deleteMany() commands are COMMENTED OUT to protect existing data.
 * 
 * Running this script will:
 * - Create sample users (if they don't exist)
 * - Create sample events (may create duplicates)
 * - Create sample tags
 * - Create sample scan events
 * 
 * To clear database first (USE WITH CAUTION):
 * - Uncomment the deleteMany() lines in the seedData function
 * 
 * Usage: node seed.js
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // WARNING: Uncommenting these lines will DELETE ALL existing data!
    // Only use for initial setup or testing on empty database
    // await User.deleteMany();
    // await Event.deleteMany();
    // await NFCTag.deleteMany();
    // await ScanEvent.deleteMany();
    // console.log('Cleared existing data');

    console.log('⚠️  Starting seed process (existing data will NOT be deleted)');
    console.log('⚠️  This may create duplicate users/events if run multiple times');
    console.log('⚠️  To clear database first, uncomment deleteMany lines in seed.js\n');

    // Create users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    let adminUser, staffUser, regularUser;

    try {
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@tagwave.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✓ Created admin user');
    } catch (err) {
      if (err.code === 11000) {
        adminUser = await User.findOne({ email: 'admin@tagwave.com' });
        console.log('⚠️  Admin user already exists, using existing');
      } else {
        throw err;
      }
    }

    try {
      staffUser = await User.create({
        name: 'Staff Member',
        email: 'staff@tagwave.com',
        password: hashedPassword,
        role: 'staff',
      });
      console.log('✓ Created staff user');
    } catch (err) {
      if (err.code === 11000) {
        staffUser = await User.findOne({ email: 'staff@tagwave.com' });
        console.log('⚠️  Staff user already exists, using existing');
      } else {
        throw err;
      }
    }

    try {
      regularUser = await User.create({
        name: 'Regular User',
        email: 'user@tagwave.com',
        password: hashedPassword,
        role: 'user',
      });
      console.log('✓ Created regular user');
    } catch (err) {
      if (err.code === 11000) {
        regularUser = await User.findOne({ email: 'user@tagwave.com' });
        console.log('⚠️  Regular user already exists, using existing');
      } else {
        throw err;
      }
    }

    // Create Events
    const techConference = await Event.create({
      name: 'Tech Conference 2026',
      description: 'Annual technology conference featuring latest innovations and networking',
      eventDate: new Date('2026-03-15'),
      location: 'Convention Center, Downtown',
      eventType: 'conference',
      organizerName: 'Tech Events Inc',
      organizerEmail: 'contact@techevents.com',
      organizerPhone: '555-0100',
      expectedAttendees: 500,
      status: 'upcoming',
      createdBy: adminUser._id,
      notes: 'VIP tags for keynote speakers, regular tags for attendees',
    });

    const productLaunch = await Event.create({
      name: 'Product Launch Event',
      description: 'Exciting new product launch with demonstrations and Q&A',
      eventDate: new Date('2026-02-20'),
      location: 'Retail Store, Main Street',
      eventType: 'campaign',
      organizerName: 'Marketing Team',
      organizerEmail: 'marketing@company.com',
      expectedAttendees: 150,
      status: 'ongoing',
      createdBy: staffUser._id,
      notes: 'Tags placed at demo stations and entrance',
    });

    const summerWorkshop = await Event.create({
      name: 'Summer Workshop Series',
      description: 'Hands-on workshops on various topics',
      eventDate: new Date('2026-06-01'),
      location: 'Community Center',
      eventType: 'workshop',
      organizerName: 'Education Department',
      organizerEmail: 'edu@community.org',
      expectedAttendees: 80,
      status: 'upcoming',
      createdBy: staffUser._id,
    });

    console.log('✓ Created events');

    // Create NFC tags associated with events
    const tags = await NFCTag.create([
      {
        tagId: 'TECH-001',
        name: 'VIP Registration',
        description: 'VIP attendee registration and check-in',
        destinationUrl: 'https://example.com/tech-conf/vip-checkin',
        location: 'VIP Entrance',
        isActive: true,
        createdBy: adminUser._id,
        event: techConference._id,
        scanCount: 45,
        lastScannedAt: new Date(),
      },
      {
        tagId: 'TECH-002',
        name: 'General Registration',
        description: 'General attendee registration',
        destinationUrl: 'https://example.com/tech-conf/registration',
        location: 'Main Entrance',
        isActive: true,
        createdBy: staffUser._id,
        event: techConference._id,
        scanCount: 32,
        lastScannedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        tagId: 'TECH-003',
        name: 'Keynote Hall Access',
        description: 'Access to keynote presentations',
        destinationUrl: 'https://example.com/tech-conf/keynote',
        location: 'Hall A - Main Stage',
        isActive: true,
        createdBy: adminUser._id,
        event: techConference._id,
        scanCount: 78,
        lastScannedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        tagId: 'PROD-001',
        name: 'Product Demo Station 1',
        description: 'Interactive product demonstration',
        destinationUrl: 'https://example.com/product/demo-1',
        location: 'Demo Area - Station 1',
        isActive: true,
        createdBy: staffUser._id,
        event: productLaunch._id,
        scanCount: 23,
        lastScannedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        tagId: 'PROD-002',
        name: 'Product Demo Station 2',
        description: 'Second product demonstration station',
        destinationUrl: 'https://example.com/product/demo-2',
        location: 'Demo Area - Station 2',
        isActive: true,
        createdBy: staffUser._id,
        event: productLaunch._id,
        scanCount: 18,
        lastScannedAt: new Date(),
      },
      {
        tagId: 'PROD-003',
        name: 'Feedback Collection',
        description: 'Collect visitor feedback',
        destinationUrl: 'https://example.com/product/feedback',
        location: 'Exit Area',
        isActive: true,
        createdBy: staffUser._id,
        event: productLaunch._id,
        scanCount: 15,
      },
      {
        tagId: 'WORK-001',
        name: 'Workshop Room A',
        description: 'Check-in for Workshop Room A',
        destinationUrl: 'https://example.com/workshop/room-a',
        location: 'Room A',
        isActive: true,
        createdBy: staffUser._id,
        event: summerWorkshop._id,
        scanCount: 12,
      },
      {
        tagId: 'WORK-002',
        name: 'Workshop Room B',
        description: 'Check-in for Workshop Room B',
        destinationUrl: 'https://example.com/workshop/room-b',
        location: 'Room B',
        isActive: false,
        createdBy: staffUser._id,
        event: summerWorkshop._id,
        scanCount: 8,
      },
    ]);

    console.log('✓ Created NFC tags');

    // Update event tag counts and total scans
    for (const event of [techConference, productLaunch, summerWorkshop]) {
      const eventTags = tags.filter(tag => tag.event.toString() === event._id.toString());
      event.tagCount = eventTags.length;
      event.totalScans = eventTags.reduce((sum, tag) => sum + tag.scanCount, 0);
      await event.save();
    }

    console.log('✓ Updated event statistics');

    // Create scan events for the past 30 days
    const scanEvents = [];
    const deviceTypes = ['mobile', 'tablet', 'desktop'];
    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const os = ['Android', 'iOS', 'Windows', 'macOS', 'Linux'];

    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const scansPerDay = Math.floor(Math.random() * 10) + 5;

      for (let j = 0; j < scansPerDay; j++) {
        const randomTag = tags[Math.floor(Math.random() * 4)]; // Only active tags
        const randomDeviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
        const randomBrowser = browsers[Math.floor(Math.random() * browsers.length)];
        const randomOs = os[Math.floor(Math.random() * os.length)];

        scanEvents.push({
          tag: randomTag._id,
          tagId: randomTag.tagId,
          scannedAt: new Date(
            date.getTime() + Math.random() * 24 * 60 * 60 * 1000
          ),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: `Mozilla/5.0 (${randomOs}) ${randomBrowser}`,
          deviceType: randomDeviceType,
          browser: randomBrowser,
          os: randomOs,
        });
      }
    }

    await ScanEvent.create(scanEvents);
    console.log(`✓ Created ${scanEvents.length} scan events`);

    console.log('\n=== Sample Data Created Successfully ===\n');
    console.log('⚠️  NOTE: Seed script has been updated to NOT delete existing data');
    console.log('⚠️  Your existing data is preserved on future runs\n');
    console.log('Test Accounts:');
    console.log('📧 Admin: admin@tagwave.com / password123');
    console.log('📧 Staff: staff@tagwave.com / password123');
    console.log('📧 User: user@tagwave.com / password123');
    console.log('\nSample Events:');
    console.log(`📅 ${techConference.name} - ${techConference.tagCount} tags, ${techConference.totalScans} scans`);
    console.log(`📅 ${productLaunch.name} - ${productLaunch.tagCount} tags, ${productLaunch.totalScans} scans`);
    console.log(`📅 ${summerWorkshop.name} - ${summerWorkshop.tagCount} tags, ${summerWorkshop.totalScans} scans`);
    console.log('\nSample NFC Tags:');
    tags.forEach((tag) => {
      console.log(`🏷️  ${tag.tagId}: ${tag.name} (${tag.scanCount} scans)`);
    });
    console.log(`\n📊 Total scan events: ${scanEvents.length}`);
    console.log('\n✅ Seeding complete! Your existing data (if any) was preserved.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seeding
connectDB().then(() => seedData());
