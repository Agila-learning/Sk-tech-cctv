const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const User = require('./backend/models/User');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' }, 'name email password role');
    console.log('Admins found:', admins.length);
    admins.forEach(a => console.log(`- ${a.email} (Role: ${a.role})` || 'No email found'));

    const techs = await User.find({ role: 'technician' }, 'name email password role');
    console.log('Technicians found:', techs.length);
    techs.forEach(t => console.log(`- ${t.email} (Role: ${t.role})` || 'No email found'));

    process.exit(0);
  } catch (err) {
    console.error('Check error:', err);
    process.exit(1);
  }
}

check();
