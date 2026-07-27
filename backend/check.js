require('mongoose').connect('mongodb://127.0.0.1:27017/sk-tech-cctv').then(async () => {
  const Order = require('./backend/models/Order');
  const unassigned = await Order.find({ status: 'pending' });
  console.log('Pending Orders:', unassigned.map(o => ({ id: o._id, status: o.status, tech: o.technician })));
  
  const internalTasks = await require('./backend/models/Task').find({ status: { $in: ['pending', 'Assigned'] } });
  console.log('Pending Internal Tasks:', internalTasks.map(t => ({ id: t._id, title: t.title, status: t.status, assignee: t.assignee })));
  
  process.exit(0);
}).catch(console.error);
