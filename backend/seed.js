require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const NFCTag = require('./models/NFCTag');
const ScanEvent = require('./models/ScanEvent');

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
    // Clear existing data
    await User.deleteMany();
    await NFCTag.deleteMany();
    await ScanEvent.deleteMany();
    console.log('Cleared existing data');

    // Create users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@tagwave.com',
      password: hashedPassword,
      role: 'admin',
    });

    const staffUser = await User.create({
      name: 'Staff Member',
      email: 'staff@tagwave.com',
      password: hashedPassword,
      role: 'staff',
    });

    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@tagwave.com',
      password: hashedPassword,
      role: 'user',
    });

    console.log('✓ Created users');

    // Create NFC tags
    const tags = await NFCTag.create([
      {
        tagId: 'TAG-001',
        name: 'Product Demo Tag',
        description: 'Main product demonstration tag',
        destinationUrl: 'https://example.com/product-demo',
        location: 'Store Front - Main Entrance',
        isActive: true,
        createdBy: staffUser._id,
        scanCount: 45,
        lastScannedAt: new Date(),
      },
      {
        tagId: 'TAG-002',
        name: 'Promo Campaign Tag',
        description: 'Summer promotion campaign',
        destinationUrl: 'https://example.com/summer-promo',
        location: 'Display Window',
        isActive: true,
        createdBy: staffUser._id,
        scanCount: 32,
        lastScannedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        tagId: 'TAG-003',
        name: 'Event Registration',
        description: 'Event registration and information',
        destinationUrl: 'https://example.com/event-register',
        location: 'Reception Desk',
        isActive: true,
        createdBy: adminUser._id,
        scanCount: 78,
        lastScannedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        tagId: 'TAG-004',
        name: 'Feedback Form Tag',
        description: 'Customer feedback collection',
        destinationUrl: 'https://example.com/feedback',
        location: 'Exit Area',
        isActive: true,
        createdBy: staffUser._id,
        scanCount: 23,
        lastScannedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        tagId: 'TAG-005',
        name: 'Menu QR Code',
        description: 'Restaurant digital menu',
        destinationUrl: 'https://example.com/menu',
        location: 'Table 5',
        isActive: false,
        createdBy: staffUser._id,
        scanCount: 12,
        lastScannedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('✓ Created NFC tags');

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

    console.log('\n=== Seed Data Created Successfully ===\n');
    console.log('Test Accounts:');
    console.log('📧 Admin: admin@tagwave.com / password123');
    console.log('📧 Staff: staff@tagwave.com / password123');
    console.log('📧 User: user@tagwave.com / password123');
    console.log('\nNFC Tags:');
    tags.forEach((tag) => {
      console.log(`🏷️  ${tag.tagId}: ${tag.name} (${tag.scanCount} scans)`);
    });
    console.log(`\n📊 Total scan events: ${scanEvents.length}`);
    console.log('\n✓ Database seeded successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seeding
connectDB().then(() => seedData());
