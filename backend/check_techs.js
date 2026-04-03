const mongoose = require('mongoose');
require('dotenv').config();

async function checkTechs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/CCTV_BASE');
    const User = require('./models/User');
    const techs = await User.find({ role: 'technician' }, 'name email phone');
    console.log(JSON.stringify(techs, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTechs();
