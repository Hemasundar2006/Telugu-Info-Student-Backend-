require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/UserModel');
const connectDB = require('../config/db');

const seedUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const users = [
      {
        name: 'Support User',
        email: 'supportteluguinfo@gmail.com',
        password: '1234567890',
        phone: '9000000001',
        role: 'SUPPORT',
        state: 'AP',
        tier: 'FREE',
      },
      {
        name: 'Admin User',
        email: 'adminteluguinfo@gmail.com',
        password: '1234567890',
        phone: '9000000002',
        role: 'ADMIN',
        state: 'AP',
        tier: 'FREE',
      },
      {
        name: 'Super Admin',
        email: 'teluguinfostudent@gmail.com',
        password: '1234567890',
        phone: '9000000003',
        role: 'SUPER_ADMIN',
        state: 'AP',
        tier: 'FREE',
      },
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { phone: userData.phone }],
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists. Updating...`);
        existingUser.name = userData.name;
        existingUser.email = userData.email;
        existingUser.password = userData.password;
        existingUser.role = userData.role;
        existingUser.state = userData.state;
        await existingUser.save();
        console.log(`✓ Updated: ${userData.email} (${userData.role})`);
      } else {
        const user = await User.create(userData);
        console.log(`✓ Created: ${user.email} (${user.role})`);
      }
    }

    console.log('\n✅ Seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
