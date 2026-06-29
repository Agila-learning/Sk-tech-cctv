const mongoose = require('mongoose');
require('dotenv').config({path: './backend/.env'});

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./backend/models/User');
    const admin = await User.findOne({role: 'admin'});
    const tech = await User.findOne({role: 'technician'});
    console.log('ADMIN_EMAIL:' + (admin ? admin.email : 'None'));
    console.log('TECH_EMAIL:' + (tech ? tech.email : 'None'));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
