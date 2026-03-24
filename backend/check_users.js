const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function check() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found');

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const admins = await User.find({ role: 'admin' }, 'name email password role');
    console.log('Admins found:', admins.length);
    admins.forEach(a => console.log(`- ${a.email} (Role: ${a.role})`));

    const techs = await User.find({ role: 'technician' }, 'name email password role');
    console.log('Technicians found:', techs.length);
    techs.forEach(t => console.log(`- ${t.email} (Role: ${t.role})`));

    process.exit(0);
  } catch (err) {
    console.error('Check error:', err);
    process.exit(1);
  }
}

check();
