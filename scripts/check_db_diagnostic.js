const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');
const Order = require('../backend/models/Order');
const WorkFlow = require('../backend/models/WorkFlow');

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const technicians = await User.find({ role: 'technician' });
    console.log(`Found ${technicians.length} technicians:`);
    technicians.forEach(t => console.log(`- ${t.name} (${t.email}) - ID: ${t._id}`));

    const admins = await User.find({ role: 'admin' });
    console.log(`Found ${admins.length} admins:`);
    admins.forEach(a => console.log(`- ${a.name} (${a.email}) - ID: ${a._id}`));

    const pendingOrders = await Order.find({ status: 'pending' }).limit(5);
    console.log(`Found ${pendingOrders.length} pending orders:`);
    pendingOrders.forEach(o => console.log(`- Order #${o._id} - Status: ${o.status}`));

    const activeWorkflows = await WorkFlow.find().populate('technician').limit(5);
    console.log(`Found ${activeWorkflows.length} workflows:`);
    activeWorkflows.forEach(wf => {
      const step = wf.stages.completed.status ? 'Completed' : (wf.stages.started.status ? 'Started' : 'Assigned');
      console.log(`- Workflow #${wf._id} for Order #${wf.order} - Tech: ${wf.technician?.name} - Step: ${step}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkDb();
