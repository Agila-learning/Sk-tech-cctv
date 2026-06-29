const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sk-technology';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const email = 'admin@sktech.com';
    const adminExists = await User.findOne({ email });
    
    if (adminExists) {
      console.log(`Admin user with email ${email} already exists.`);
      process.exit(0);
    }

    const admin = new User({
      name: 'SK Admin',
      email,
      password: 'admin123',
      role: 'admin',
      phone: '1234567890',
      address: 'HQ Mumbai'
    });

    await admin.save();
    console.log('Admin user created successfully: admin@sktech.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
