require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const readline = require('readline');

/**
 * CREATE ADMIN ACCOUNT SCRIPT
 * 
 * This script creates a new admin user account.
 * 
 * Usage: node createAdmin.js
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

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

const createAdmin = async () => {
  try {
    console.log('\n=== CREATE ADMIN ACCOUNT ===\n');

    // Get user input
    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');

    // Validate input
    if (!name || !email || !password) {
      console.log('\n❌ All fields are required!');
      rl.close();
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`\n❌ User with email ${email} already exists!`);
      console.log(`Current role: ${existingUser.role}`);
      
      if (existingUser.role !== 'admin') {
        const upgrade = await question('\nWould you like to upgrade this user to admin? (yes/no): ');
        if (upgrade.toLowerCase() === 'yes' || upgrade.toLowerCase() === 'y') {
          existingUser.role = 'admin';
          await existingUser.save();
          console.log(`\n✅ User ${email} has been upgraded to admin!`);
        }
      }
      rl.close();
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin',
    });

    console.log('\n✅ Admin account created successfully!\n');
    console.log('Account Details:');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`🔑 Role: ${adminUser.role}`);
    console.log('\nYou can now log in with these credentials.\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin account:', error.message);
    rl.close();
    process.exit(1);
  }
};

// Run the script
connectDB().then(() => createAdmin());
