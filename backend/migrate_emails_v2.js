const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sk-technology';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');
  
  const users = await User.find({});
  for (const user of users) {
    const lowerEmail = user.email.toLowerCase();
    if (user.email !== lowerEmail) {
      console.log(`Normalizing: ${user.email} -> ${lowerEmail}`);
      user.email = lowerEmail;
      try {
        await user.save();
      } catch (err) {
        console.error(`Failed to save ${lowerEmail}: likely duplicate`, err.message);
      }
    }
  }
  
  console.log('Migration complete');
  process.exit(0);
}

migrate();
