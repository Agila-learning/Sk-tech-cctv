const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({path: './backend/.env'});

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./backend/models/User');
    const email = 'naveenkumarfriend143@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Technician not found');
      process.exit(1);
    }
    user.password = 'password123';
    await user.save();
    console.log('Password reset successfully for ' + email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
