const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');
const Order = require('../backend/models/Order');

async function getTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const admin = await User.findOne({ role: 'admin' });
    const technician = await User.findOne({ role: 'technician' });
    const order = await Order.findOne({ status: 'pending' });

    console.log(JSON.stringify({
      admin: admin ? { id: admin._id, email: admin.email } : null,
      technician: technician ? { id: technician._id, email: technician.email } : null,
      order: order ? { id: order._id, status: order.status } : null
    }, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

getTestData();
