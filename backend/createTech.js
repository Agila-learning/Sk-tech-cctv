const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createTech = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sk-technology');
  
  // Delete any existing technician user to start fresh
  await User.deleteOne({ email: 'tech@sktech.com' });
  console.log('Removed old technician if existed...');

  // The User pre-save hook hashes the password automatically — don't hash manually
  const newTech = new User({
    name: 'Field Technician Alpha',
    email: 'tech@sktech.com',
    password: 'techpassword',
    role: 'technician',
    phone: '555-0192',
    address: 'HQ Sector'
  });

  await newTech.save();
  console.log('Technician re-created successfully!');
  console.log('Email: tech@sktech.com');
  console.log('Password: techpassword');
  process.exit(0);
};

createTech().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

