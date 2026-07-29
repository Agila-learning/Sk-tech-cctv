const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const Order = require('../models/Order');
const User = require('../models/User');
const ServiceReport = require('../models/ServiceReport');
const SystemSettings = require('../models/SystemSettings');
const { createNotification } = require('../utils/notificationHelper');
const { exportToExcel, exportToPDF } = require('../utils/exportHelper');

// Log Helper
const logActivity = async (adminId, action, resource, resourceId, details, ip) => {
  await ActivityLog.create({ admin: adminId, action, resource, resourceId, details, ipAddress: ip });
};

// --- Badge Counts ---
router.get('/badges', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const Message = require('../models/Message');
    const ServiceRequest = require('../models/ServiceRequest');
    
    const [unreadChats, pendingOrders, openTickets] = await Promise.all([
      Message.countDocuments({ receiverRole: 'admin', isRead: false }),
      Order.countDocuments({ status: 'pending' }), // Not assigned yet
      ServiceRequest.countDocuments({ "timeline.status": "Submitted" })
    ]);
    
    res.json({ unreadChats, pendingOrders, openTickets });
  } catch (error) {
    res.status(500).send(error);
  }
});

// --- Consolidated Dashboard Summary ---
router.get('/dashboard-summary', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { period } = req.query;
    let startDate = new Date();
    if (period === 'month') startDate.setDate(startDate.getDate() - 30);
    else startDate.setDate(startDate.getDate() - 7);

    // Fetch all required data with concurrency limit (or simple Promise.all for low volume)
    const [technicians, activityLogs, stats, notifications, subscriptions, bookings, tickets] = await Promise.all([
      User.find({ role: 'technician' }).select('name email location profilePic phone address availabilityStatus isOnline'),
      ActivityLog.find().populate('admin', 'name email').sort({ createdAt: -1 }).limit(10),
      Order.find({ createdAt: { $gte: startDate } }).sort({ createdAt: 1 }),
      require('../models/Notification').find({ role: 'admin' }).sort({ createdAt: -1 }).limit(10),
      require('../models/Subscription').find().sort({ createdAt: -1 }).limit(5),
      require('../models/Booking').find().populate('customer', 'name email phone').sort({ createdAt: -1 }).limit(5),
      require('../models/Ticket').find().sort({ createdAt: -1 }).limit(10)
    ]);

    // Calculate chart stats (Reuse logic from /stats if possible, but localized here for speed)
    const getISTDateString = (date) => {
      const d = new Date(date);
      d.setMinutes(d.getMinutes() + 330);
      return d.toISOString().split('T')[0];
    };

    const revenueByDay = {};
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = getISTDateString(d);
      revenueByDay[day] = 0;
      return day;
    }).reverse();

    stats.forEach(order => {
      if (order.createdAt) {
        const day = getISTDateString(order.createdAt);
        if (revenueByDay[day] !== undefined) revenueByDay[day] += order.totalAmount;
      }
    });

    const activeJobs = await Order.countDocuments({ 
      status: { $in: ['assigned', 'accepted', 'in_progress'] },
      workStatus: { $ne: 'completed' }
    });
    
    // Group technicians by their actual status with legacy status normalization
    const techDetails = await Promise.all(technicians.map(async (t) => {
      let currentStatus = t.availabilityStatus || 'Offline';
      const rawLower = currentStatus.toLowerCase();
      
      // Normalize legacy statuses
      if (['active', 'on-duty', 'working', 'busy'].includes(rawLower)) {
         currentStatus = 'Busy';
      } else if (rawLower === 'assigned') {
         currentStatus = 'Assigned';
      } else if (rawLower === 'available') {
         currentStatus = 'Available';
      } else if (['offline', 'on-leave', 'inactive', 'suspended', 'logged-out'].includes(rawLower)) {
         currentStatus = 'Offline'; 
      }
      
      // Secondary check: If they have an active order, they are Busy
      const activeOrder = await Order.findOne({
        technician: t._id,
        workStatus: { $in: ['assigned', 'dispatched', 'reached', 'in_progress'] },
        status: { $ne: 'completed' }
      });
      
      if (activeOrder) currentStatus = 'Busy';
      else if (currentStatus === 'Assigned' && !activeOrder) currentStatus = 'Available';

      const validWorking = ['active', 'available', 'assigned', 'on-duty', 'working', 'busy'];
      const isOnline = validWorking.includes(currentStatus.toLowerCase());

      return {
        ...t.toObject(),
        status: currentStatus,
        isOnline: isOnline
      };
    }));

    const totalTechs = technicians.length;
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    res.send({
      technicians: techDetails,
      logs: activityLogs,
      stats: {
        revenueGrowth: Object.values(revenueByDay),
        revenueLabels: last7Days.map(d => new Date(d).toLocaleDateString([], { weekday: 'short' })),
        summary: {
           totalRevenue: stats.reduce((sum, o) => sum + o.totalAmount, 0),
           pendingOrders,
           totalTechs,
           activeStreams: activeJobs
        }
      },

      notifications,
      subscriptions,
      bookings,
      tickets
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).send({ message: "Failed to compile dashboard summary" });
  }
});

// --- FSM Specific Dashboard Stats ---
router.get('/fsm-dashboard', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTechs, availableTechs, busyTechs, activeOrders, pendingOrders, delayedOrders] = await Promise.all([
      User.countDocuments({ role: 'technician' }),
      User.countDocuments({ role: 'technician', availabilityStatus: 'Available' }),
      User.countDocuments({ role: 'technician', availabilityStatus: 'Assigned' }),
      Order.countDocuments({ status: { $in: ['in_progress', 'paused', 'travel_started', 'reached_site'] } }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'paused' })
    ]);

    // Fetch team assignments per order
    const ongoingOrders = await Order.find({
      status: { $in: ['in_progress', 'paused', 'travel_started', 'reached_site'] }
    }).populate('technician supportingTechnicians helpers').select('shortId status trackingTimeline technician supportingTechnicians helpers locationDetails');

    res.json({
      metrics: {
        totalTechs,
        availableTechs,
        busyTechs,
        activeOrders,
        pendingOrders,
        delayedOrders
      },
      ongoingOrders
    });
  } catch (error) {
    console.error("FSM Dashboard Error:", error);
    res.status(500).send({ message: "Failed to compile FSM dashboard" });
  }
});

// Get activity logs
router.get('/logs', auth, authorize('admin'), async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate('admin', 'name email').sort({ createdAt: -1 }).limit(50);
    res.send(logs);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get dashboard stats for charts
router.get('/stats', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { period } = req.query;
    let startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setDate(startDate.getDate() - 30);
    else startDate = null; // all time

    const query = startDate ? { createdAt: { $gte: startDate } } : {};
    const orders = await Order.find(query).sort({ createdAt: 1 });
    
    const getISTDateString = (date) => {
      const d = new Date(date);
      d.setMinutes(d.getMinutes() + 330);
      return d.toISOString().split('T')[0];
    };

    // Revenue by day (last 7 days)
    const revenueByDay = {};
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return getISTDateString(d);
    }).reverse();

    last7Days.forEach(day => revenueByDay[day] = 0);
    
    orders.forEach(order => {
      if (order.createdAt) {
        const day = getISTDateString(order.createdAt);
        if (revenueByDay[day] !== undefined) {
          revenueByDay[day] += order.totalAmount;
        }
      }
    });

    // Category distribution
    const categoryDist = {};
    orders.forEach(order => {
      order.products.forEach(p => {
        const cat = p.product?.category || 'General';
        categoryDist[cat] = (categoryDist[cat] || 0) + p.quantity;
      });
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalTechs = await User.countDocuments({ role: 'technician' });
    const activeJobs = await Order.countDocuments({ workStatus: 'in_progress' });
    const subscribers = await require('../models/Subscription').countDocuments();

    res.send({
      revenueGrowth: Object.values(revenueByDay),
      revenueLabels: last7Days.map(d => new Date(d).toLocaleDateString([], { weekday: 'short' })),
      categoryDistribution: Object.values(categoryDist),
      categoryLabels: Object.keys(categoryDist),
      summary: {
        totalRevenue,
        pendingOrders,
        totalTechs,
        activeStreams: activeJobs,
        subscribers
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update Order Status (including tracking timeline)
router.patch('/orders/:id/status', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.status = status;
    order.trackingTimeline.push({ status, remarks: remarks || `Order status updated to ${status} by admin.` });
    await order.save();

    // Notify Customer about status change
    await createNotification(req.app, {
      userId: order.customer,
      role: 'customer',
      type: 'order_update',
      message: `Your Order #${order._id.toString().slice(-6)} status has been updated to ${status.toUpperCase()}.`,
      orderId: order._id
    });
    
    // Log activity
    await logActivity(req.user._id, 'Update', 'Order', order._id, `Status changed to ${status}`, req.ip);

    res.send(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update Order Status by short ID (used from Notes page)
router.patch('/orders/short/:shortId/status', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    // Find order that ends with shortId
    const orders = await Order.find();
    const order = orders.find(o => o._id.toString().toUpperCase().endsWith(req.params.shortId.toUpperCase()));
    
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.status = status;
    if (status === 'completed') {
       order.workStatus = 'completed';
       order.warrantyPeriod = '12 Months';
       order.warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
       order.warrantyStatus = 'Valid';
    }
    
    order.trackingTimeline.push({ status, remarks: remarks || `Order status updated to ${status} via Notes by admin.` });
    await order.save();

    // Notify Customer about status change
    await createNotification(req.app, {
      userId: order.customer,
      role: 'customer',
      type: 'order_update',
      message: `Your Order #${order._id.toString().slice(-6)} status has been updated to ${status.toUpperCase()}.`,
      orderId: order._id
    });

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Export admin reports
router.get('/export', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { type, format } = req.query; // type: orders, revenue, technicians | format: excel, pdf
    
    let data = [];
    let title = 'SK Technology Report';

    if (type === 'orders') {
      data = await Order.find().populate('customer', 'name email').lean();
      data = data.map(o => ({
        id: o._id.toString(),
        customer: o.customer?.name || 'N/A',
        amount: o.totalAmount || 0,
        status: o.status || 'Unknown',
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'
      }));
      title = 'Cumulative Order Service Logs';
    } else if (type === 'customers') {
      data = await User.find({ role: 'customer' }).lean();
      data = data.map(u => ({
        name: u.name || 'N/A',
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        address: u.address || 'N/A',
        joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'
      }));
      title = 'Customer Directory';
    } else if (type === 'revenue') {
      const orders = await Order.find({ status: { $in: ['completed', 'delivered'] } }).lean();
      data = orders.map(o => ({
        orderId: o.shortId || o._id.toString().slice(-6),
        amount: o.totalAmount || 0,
        type: o.orderType || 'online',
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'
      }));
      title = 'Revenue Report';
    }

    if (format === 'excel') {
      const buffer = await exportToExcel(data, `${type}_report.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);
      return res.send(buffer);
    } else {
      const buffer = exportToPDF(data, title);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.pdf`);
      return res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Export failed' });
  }
});


// Admin: Search/List Users by role (used for admin chat customer lookup)
router.get('/users', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query).select('name email phone role profilePic availabilityStatus').limit(20);
    res.send(users);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Admin: Get single user by ID (used for auto-select in chat from query param)
router.get('/users/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email phone role profilePic availabilityStatus');
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Admin: Assign technician to order
router.patch('/orders/:id/assign', auth, authorize('admin', 'sub-admin'), async (req, res) => {

  try {
    const { technicianId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.technician = technicianId || null;
    order.status = technicianId ? 'assigned' : 'pending';
    await order.save();
    
    // Create/Update workflow entry
    if (technicianId) {
      const WorkFlow = require('../models/WorkFlow');
      await WorkFlow.findOneAndUpdate(
        { order: order._id },
        { 
          technician: technicianId,
          $set: { 'stages.assigned': { status: true, timestamp: new Date() } }
        },
        { upsert: true, new: true }
      );

      // Set technician status to Assigned
      await User.findByIdAndUpdate(technicianId, { availabilityStatus: 'Assigned', isOnline: true });

      // Create persistent Notification broadcasted to ALL technicians
      await createNotification(req.app, {
        role: 'technician',
        type: 'technician_assigned',
        message: `New Order Task Assigned #${order._id.toString().slice(-6)}. Open tasks to accept or reject.`,
        orderId: order._id
      });

      const io = req.app.get('socketio');
      if (io) {
        io.emit('task_assigned', { orderId: order._id, technicianId, message: `New Order Task Assigned #${order._id.toString().slice(-6)}. Open tasks to accept or reject.` });
        io.to(technicianId.toString()).emit('task_assigned', { orderId: order._id, technicianId, message: `New Order Task Assigned #${order._id.toString().slice(-6)}. Open tasks to accept or reject.` });
      }
    }

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Auto-assign technicians to orders
router.post('/auto-assign', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    // Find orders that are pending or confirmed but have no technician
    const pendingOrders = await Order.find({ 
      status: { $in: ['pending', 'confirmed'] }, 
      $or: [{ technician: { $exists: false } }, { technician: null }] 
    });
    
    // Find all technicians
    const technicians = await User.find({ role: 'technician' });
    
    // Efficiency: Consider technicians busy if they have an active or pending job
    const activeJobs = await Order.find({ 
      workStatus: { $in: ['assigned', 'dispatched', 'reached', 'in_progress'] },
      status: { $ne: 'completed' }
    }).select('technician');
    const busyTechIds = activeJobs
      .filter(j => j.technician)
      .map(j => j.technician.toString());
    
    // Also consider technicians on leave as busy (if implementing leave status)
    
    const availableTechnicians = technicians.filter(t => !busyTechIds.includes(t._id.toString()));

    const assignments = [];
    const limit = Math.min(pendingOrders.length, availableTechnicians.length);
    
    for (let i = 0; i < limit; i++) {
       const order = pendingOrders[i];
       const technician = availableTechnicians[i];
       
       order.technician = technician._id;
       order.status = 'assigned';
       order.trackingTimeline.push({ status: 'assigned', remarks: `Auto-assigned to ${technician.name} via Global Optimizer` });
       await order.save();
       
       // Create Workflow entry
       const WorkFlow = require('../models/WorkFlow');
       await WorkFlow.findOneAndUpdate(
         { order: order._id },
         { 
           technician: technician._id,
           $set: { 'stages.assigned': { status: true, timestamp: new Date() } }
         },
         { upsert: true }
       );

       // Set technician status to Assigned
       await User.findByIdAndUpdate(technician._id, { availabilityStatus: 'Assigned', isOnline: true });
       
       // Create persistent Notification
       await createNotification(req.app, {
         userId: technician._id,
         role: 'technician',
         type: 'technician_assigned',
         message: `Strategic Alert: Auto-assigned to Order #${order._id.toString().slice(-6)}`,
         orderId: order._id
       });

       assignments.push({ order: order._id, technician: technician.name });
    }

    res.send({ 
      message: `Strategic Grid Optimization: Auto-assigned ${assignments.length} Technicians`, 
      assignments,
      stats: {
        pendingOrders: pendingOrders.length,
        availableTechs: availableTechnicians.length
      }
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all technicians (detailed info for stats)
router.get('/technicians', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('name email phone location availabilityStatus isOnline rating');
    
    // Enrich with job counts
    const techDetails = await Promise.all(technicians.map(async (t) => {
      const completedOrdersCount = await Order.countDocuments({ 
        technician: t._id, 
        status: 'completed' 
      });
      
      const activeJob = await Order.findOne({
        technician: t._id,
        workStatus: { $in: ['assigned', 'dispatched', 'reached', 'in_progress'] },
        status: { $ne: 'completed' }
      });

      return {
        ...t.toObject(),
        status: activeJob ? 'On Job' : (t.availabilityStatus || 'Available'),
        completedOrdersCount
      };
    }));

    res.send(techDetails);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Create Technician
router.post('/technicians', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;
    const User = require('../models/User');
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).send({ error: 'Email already in use' });

    const tech = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: password || 'sktech123',
      role: 'technician',
      address,
      availabilityStatus: 'Available'
    });
    await tech.save();
    res.status(201).send(tech);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Update Technician
router.patch('/technicians/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (!updateData.password) delete updateData.password;
    
    const tech = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'technician' }, 
      updateData, 
      { new: true, runValidators: true }
    );
    if (!tech) return res.status(404).send({ error: 'Technician not found' });
    res.send(tech);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Delete Technician
router.delete('/technicians/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const tech = await User.findOneAndDelete({ _id: req.params.id, role: 'technician' });
    if (!tech) return res.status(404).send({ error: 'Technician not found' });
    res.send(tech);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all customers (Unified: Online order customers + Manually added customers + Manual billing customers)
router.get('/customers', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const User = require('../models/User');
    const Order = require('../models/Order');
    const Invoice = require('../models/Invoice');

    const customers = await User.find({ role: 'customer' }).select('-password').lean();
    const customerIds = customers.map(c => c._id);
    const orders = await Order.find({ customer: { $in: customerIds } })
      .populate('products.product', 'name price category')
      .populate('technician', 'name phone')
      .sort({ createdAt: -1 }).lean();
    const invoices = await Invoice.find({ customer: { $in: customerIds } }).sort({ createdAt: -1 }).lean();
    
    const enrichedCustomers = customers.map(cust => {
      const custOrders = orders.filter(o => o.customer?.toString() === cust._id?.toString());
      const custInvoices = invoices.filter(i => i.customer?.toString() === cust._id?.toString());
      const latestOrder = custOrders[0];
      
      let warrantyStatus = cust.warrantyStatus || latestOrder?.warrantyStatus || 'Valid';
      const warrantyEndDate = cust.warrantyEndDate || latestOrder?.warrantyEndDate;
      if (warrantyEndDate && new Date() > new Date(warrantyEndDate)) {
        warrantyStatus = 'Expired - Paid Service Required';
      } else if (warrantyEndDate) {
        warrantyStatus = 'Under Warranty (Free Rework)';
      }

      return {
        ...cust,
        customerType: 'Registered Customer',
        address: cust.address || latestOrder?.deliveryAddress || '',
        alternatePhone: cust.alternatePhone || latestOrder?.alternatePhone || '',
        notes: cust.notes || latestOrder?.notes || '',
        warrantyPeriod: cust.warrantyPeriod || latestOrder?.warrantyPeriod || '12 Months',
        warrantyEndDate,
        warrantyStatus,
        locationDetails: latestOrder?.locationDetails || {},
        orders: custOrders,
        invoices: custInvoices
      };
    });

    // 2. Fetch manual billing customers who might not have a user account
    const manualInvoices = await Invoice.find({ 'manualCustomer.name': { $exists: true, $ne: '' } }).sort({ createdAt: -1 }).lean();
    manualInvoices.forEach(inv => {
      const mc = inv.manualCustomer;
      const exists = enrichedCustomers.find(c => 
        (mc.email && c.email && c.email.toLowerCase() === mc.email.toLowerCase()) || 
        (mc.phone && c.phone && c.phone === mc.phone)
      );
      if (!exists) {
        enrichedCustomers.push({
          _id: `manual_inv_${inv._id}`,
          name: mc.name || 'Manual Customer',
          email: mc.email || '',
          phone: mc.phone || '',
          alternatePhone: '',
          address: mc.address || inv.location?.address || '',
          notes: inv.notes || '',
          warrantyPeriod: inv.warranty || '12 Months',
          warrantyStatus: 'Under Warranty (Free Rework)',
          customerType: 'Manual Billing Customer',
          createdAt: inv.createdAt,
          orders: [],
          invoices: [inv]
        });
      }
    });

    // 3. Fetch offline orders who might not have a user account
    const offlineOrders = await Order.find({ orderType: 'offline' })
      .populate('customer', 'name email phone')
      .populate('technician', 'name phone')
      .sort({ createdAt: -1 }).lean();
    offlineOrders.forEach(ord => {
      if (!ord.customer || typeof ord.customer === 'string') {
        enrichedCustomers.push({
          _id: `offline_ord_${ord._id}`,
          name: ord.deliveryAddress || 'Offline Order Customer',
          email: '',
          phone: ord.alternatePhone || '',
          alternatePhone: '',
          address: ord.deliveryAddress || '',
          notes: ord.notes || '',
          warrantyPeriod: ord.warranty || '12 Months',
          warrantyStatus: 'Under Warranty (Free Rework)',
          customerType: 'Offline Order Customer',
          createdAt: ord.createdAt,
          orders: [ord],
          invoices: []
        });
      }
    });

    res.send(enrichedCustomers);
  } catch (error) {
    console.error('Unified Customers Fetch Error:', error);
    res.status(500).send(error);
  }
});

// Admin: Manually add a customer
router.post('/customers', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, address, alternatePhone, notes, warrantyPeriod, lat, lng } = req.body;
    if (!name || (!email && !phone)) {
      return res.status(400).send({ error: 'Name and at least Email or Phone are required' });
    }
    const query = [];
    if (email) query.push({ email: email.toLowerCase() });
    if (phone) query.push({ phone });
    const existingUser = await User.findOne({ $or: query });
    if (existingUser) return res.status(400).send({ error: 'Customer with this email or phone already exists' });

    const customer = new User({
      name,
      email: email ? email.toLowerCase() : `customer_${Date.now()}@sktech.com`,
      phone: phone || '',
      alternatePhone: alternatePhone || '',
      address: address || '',
      notes: notes || '',
      liveLocation: (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng), address: address || '', timestamp: new Date() } : undefined,
      warrantyPeriod: warrantyPeriod || '12 Months',
      password: Math.random().toString(36).slice(-8),
      role: 'customer'
    });
    await customer.save();
    res.status(201).send(customer);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Admin: Update Customer
router.patch('/customers/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (!updateData.password) delete updateData.password;
    
    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'customer' }, 
      updateData, 
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).send({ error: 'Customer not found' });
    res.send(customer);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Delete Customer
router.delete('/customers/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const customer = await User.findOneAndDelete({ _id: req.params.id, role: 'customer' });
    if (!customer) return res.status(404).send({ error: 'Customer not found' });
    res.send(customer);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get Customer Orders
router.get('/customers/:id/orders', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const Order = require('../models/Order');
    // If it's a manual or offline order ID string instead of a true User ID, it won't match a MongoDB ObjectId directly,
    // but the fallback in CustomersScreen.tsx handles those. For registered users:
    const orders = await Order.find({ customer: req.params.id })
      .populate('technician', 'name phone')
      .populate('products.product', 'name price')
      .sort({ createdAt: -1 });
    res.send(orders);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get technician availability board
router.get('/technicians/status', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('name email location profilePic phone address salaryConfig');
    const orders = await Order.find({ workStatus: 'in_progress' }).populate('technician');
    
    const board = technicians.map(tech => {
       const activeJob = orders.find(o => o.technician && o.technician._id.toString() === tech._id.toString());
       return {
          ...tech.toObject(),
          status: activeJob ? 'On Assignment' : 'Available',
          activeOrderId: activeJob ? activeJob._id : null
       };
    });
    
    res.send(board);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get live tracking data for active technicians
router.get('/tracking/live', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const WorkFlow = require('../models/WorkFlow');
    // Find all workflows that are active and have a location
    const activeWorkflows = await WorkFlow.find({ 
      'currentLocation.lat': { $exists: true },
      'stages.completed.status': false
    }).populate('technician', 'name phone profilePic').populate({
      path: 'order',
      select: 'deliveryAddress status workStatus _id'
    });
    
    // Group by technician so we only send the latest location per tech
    const techLocations = {};
    activeWorkflows.forEach(wf => {
      if (wf.technician && wf.currentLocation) {
        if (!techLocations[wf.technician._id] || 
            new Date(wf.currentLocation.lastUpdate) > new Date(techLocations[wf.technician._id].location.lastUpdate)) {
          techLocations[wf.technician._id] = {
            technician: wf.technician,
            location: wf.currentLocation,
            order: wf.order,
            workflowId: wf._id
          };
        }
      }
    });

    res.send(Object.values(techLocations));
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Create Technician
router.post('/technicians', auth, authorize('admin'), async (req, res) => {
  try {
    const technician = new User({ ...req.body, role: 'technician' });
    await technician.save();
    res.status(201).send(technician);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({ message: 'The email address is already in use by another account.' });
    }
    res.status(400).send({ message: error.message || 'Validation failed' });
  }
});

// Admin: Update Technician
router.patch('/technicians/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (!updateData.password) delete updateData.password;
    
    const technician = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'technician' }, 
      updateData, 
      { new: true, runValidators: true }
    );
    if (!technician) return res.status(404).send({ error: 'Technician not found' });
    res.send(technician);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Update Technician Status
router.patch('/technicians/:id/status', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const isOnline = normalizedStatus === 'Available';

    const technician = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'technician' },
      { $set: { availabilityStatus: normalizedStatus, isOnline } },
      { new: true }
    );
    if (!technician) return res.status(404).send({ error: 'Technician not found' });
    
    const io = req.app.get('socketio');
    if (io) {
      io.emit('user_status_change', { userId: technician._id, status: isOnline ? 'online' : 'offline' });
    }
    res.send(technician);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Delete Technician
router.delete('/technicians/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const technician = await User.findOneAndDelete({ _id: req.params.id, role: 'technician' });
    if (!technician) return res.status(404).send({ error: 'Technician not found' });
    res.send(technician);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Approve or Request Rework for a Daily Report
router.patch('/orders/:id/daily-report/:dayNumber/approval', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { action, notes } = req.body;
    const dayNumber = parseInt(req.params.dayNumber);
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    const report = order.dailyReports.find(r => r.dayNumber === dayNumber);
    if (!report) return res.status(404).send({ error: 'Daily report not found' });

    if (action === 'approve') {
      report.status = 'Approved';
      report.approvedByAdmin = true;
      report.reworkRequested = false;
      order.trackingTimeline.push({ status: order.status, remarks: `Admin approved Day ${dayNumber} daily report.` });
    } else if (action === 'rework') {
      report.status = 'Rework Required';
      report.reworkRequested = true;
      report.approvedByAdmin = false;
      report.adminNotes = notes;
      order.status = 'in_progress';
      order.workStatus = 'in_progress';
      order.trackingTimeline.push({ status: 'rework_requested', remarks: `Admin requested rework for Day ${dayNumber}. Reason: ${notes}` });

      // Notify Technician
      if (order.technician) {
        await createNotification(req.app, {
          userId: order.technician,
          role: 'technician',
          type: 'technician_update',
          message: `Rework requested for Day ${dayNumber} of Order #${order._id.toString().slice(-6)}. Reason: ${notes}`,
          orderId: order._id
        });
      }
    }

    await order.save();
    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: order._id, status: order.status });

    res.send(order);
  } catch (error) {
    console.error('Admin Daily Report Approval Error:', error);
    res.status(400).send({ error: error.message });
  }
});

// Admin: Approve Final Order
router.patch('/orders/:id/approval', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { action, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    if (action === 'approve') {
      order.status = 'completed';
      order.workStatus = 'completed';
      order.warrantyPeriod = order.warrantyPeriod || '12 Months';
      order.warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      order.warrantyStatus = 'Valid';
      order.trackingTimeline.push({ status: 'completed', remarks: `Admin verified and completed the work. 12-Month Warranty activated until ${order.warrantyEndDate.toLocaleDateString()}.` });
      
      // Unlock Technician
      if (order.technician) {
        await User.findByIdAndUpdate(order.technician, { availabilityStatus: 'Available', currentOrder: null });
      }
    } else if (action === 'rework') {
      order.status = 'in_progress';
      order.workStatus = 'in_progress';
      order.trackingTimeline.push({ status: 'rework_requested', remarks: `Admin rejected final work and requested rework. Reason: ${notes}` });

      if (order.technician) {
        await createNotification(req.app, {
          userId: order.technician,
          role: 'technician',
          type: 'technician_update',
          message: `Final work rejected for Order #${order._id.toString().slice(-6)}. Rework required: ${notes}`,
          orderId: order._id
        });
      }
    }

    await order.save();
    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: order._id, status: order.status });

    res.send(order);
  } catch (error) {
    console.error('Admin Order Approval Error:', error);
    res.status(400).send({ error: error.message });
  }
});

// --- Service Report Review ---
router.get('/reports', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const reports = await ServiceReport.find()
      .populate('technicianId', 'name email')
      .populate({ path: 'jobId', populate: { path: 'customer', select: 'name email phone' } })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch corresponding workflows
    const WorkFlow = require('../models/WorkFlow');
    const enrichedReports = await Promise.all(reports.map(async (report) => {
      const workflow = await WorkFlow.findOne({ order: report.jobId?._id }).lean();
      return { ...report, workflow };
    }));

    res.send(enrichedReports);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/reports/:id/review', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const io = req.app.get('socketio');
    const report = await ServiceReport.findByIdAndUpdate(req.params.id, {
      $set: { 
        'adminApproval.status': status, 
        'adminApproval.reason': reason,
        'adminApproval.reviewedAt': new Date(),
        'adminApproval.approvingAdmin': req.user._id
      }
    }, { new: true });
    
    if (!report) return res.status(404).send({ error: 'Report not found' });
    
    if (status === 'approved') {
      const warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const order = await Order.findByIdAndUpdate(report.jobId, { 
        status: 'completed', 
        workStatus: 'completed',
        warrantyPeriod: '12 Months',
        warrantyEndDate,
        warrantyStatus: 'Valid'
      }, { new: true });
      
      if (order && order.customer) {
        // Notify Customer
        await createNotification(req.app, {
          userId: order.customer,
          role: 'customer',
          type: 'order_update',
          message: `Your service order #${order._id.toString().slice(-6)} has been completed and verified. 12-Month Warranty active until ${warrantyEndDate.toLocaleDateString()}.`,
          orderId: order._id
        });
      }
    }

    // Notify Technician
    await createNotification(req.app, {
      userId: report.technicianId,
      role: 'technician',
      type: 'technician_update',
      message: `Your report for Job #${report.jobId.toString().slice(-6)} was ${status === 'rejected' ? 'sent back for correction' : 'approved'}.`,
      orderId: report.jobId
    });

    res.send(report);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Delete Service Report
router.delete('/reports/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const report = await ServiceReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).send({ error: 'Report not found' });
    
    // Delete associated note if exists
    const Note = require('../models/Note');
    await Note.deleteMany({ reportId: req.params.id });

    res.send({ message: 'Service report deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// --- System Settings ---
router.get('/settings', auth, authorize('admin'), async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
      await settings.save();
    }
    res.send(settings);
  } catch (error) {
    res.status(500).send(error);
  }
});
router.get('/inquiries', auth, authorize('admin'), async (req, res) => {
  try {
    const Inquiry = require('../models/Inquiry');
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.send(inquiries);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/inquiries', auth, authorize('admin'), async (req, res) => {
  try {
    const Inquiry = require('../models/Inquiry');
    const inquiry = new Inquiry(req.body);
    await inquiry.save();
    res.status(201).send(inquiry);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/inquiries/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const Inquiry = require('../models/Inquiry');
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(inquiry);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/inquiries/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const Inquiry = require('../models/Inquiry');
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    res.send(inquiry);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/settings', auth, authorize('admin'), async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings();
    
    Object.assign(settings, req.body);
    settings.lastUpdatedBy = req.user._id;
    await settings.save();
    
    res.send(settings);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Override Technician Rating
router.patch('/technicians/:id/rating', auth, authorize('admin'), async (req, res) => {
  try {
    const { rating } = req.body;
    const technician = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'technician' },
      { rating },
      { new: true }
    );
    if (!technician) return res.status(404).send({ error: 'Technician not found' });
    
    // Log activity
    await logActivity(req.user._id, 'Manual Override', 'Technician Rating', technician._id, `Rating changed to ${rating}`, req.ip);
    
    res.send(technician);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Approve/Reject Reschedule
router.patch('/orders/:id/reschedule-approve', auth, authorize('admin'), async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    if (action === 'approve') {
      order.installationSlot = order.rescheduledTo;
      order.rescheduleStatus = 'approved';
      order.trackingTimeline.push({ 
        status: 'reschedule_approved', 
        remarks: `Reschedule request approved by admin. New installation date: ${new Date(order.rescheduledTo).toLocaleDateString()}` 
      });
    } else {
      order.rescheduleStatus = 'rejected';
      order.trackingTimeline.push({ 
        status: 'reschedule_rejected', 
        remarks: `Reschedule request rejected by admin.` 
      });
    }

    await order.save();

    // Notify User (Customer and Tech)
    const message = `Reschedule for Order #${order._id.toString().slice(-6)} was ${action}d.`;
    
    await createNotification(req.app, {
      userId: order.customer,
      role: 'customer',
      type: 'order_update',
      message,
      orderId: order._id
    });
    
    if (order.technician) {
      await createNotification(req.app, {
        userId: order.technician,
        role: 'technician',
        type: 'technician_update',
        message,
        orderId: order._id
      });
    }

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

const Holiday = require('../models/Holiday');
const Attendance = require('../models/Attendance');

// --- Attendance Management ---
// Get all attendance for a specific date range
router.get('/attendance/all', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { startDate, endDate, technicianId } = req.query;
    let query = {};
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
    if (technicianId) query.user = technicianId;

    const attendance = await Attendance.find(query)
      .populate('user', 'name email phone profilePic')
      .sort({ date: -1 });
    
    res.send(attendance);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin Manual Override
router.patch('/attendance/:id/override', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, remarks, checkIn, checkOut } = req.body;
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).send({ message: 'Record not found' });

    if (status) record.status = status;
    if (remarks) record.adminRemarks = remarks;
    if (checkIn) record.checkIn = { ...record.checkIn, time: new Date(checkIn) };
    if (checkOut) record.checkOut = { ...record.checkOut, time: new Date(checkOut) };
    
    // Recalculate hours if both exist
    if (record.checkIn?.time && record.checkOut?.time) {
      const diffMs = new Date(record.checkOut.time) - new Date(record.checkIn.time);
      record.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    record.type = 'manual';
    await record.save();
    
    await logActivity(req.user._id, 'Override', 'Attendance', record._id, `Status updated to ${status}`, req.ip);
    res.send(record);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Sync Sundays & Holidays for a month
router.post('/attendance/sync', auth, authorize('admin'), async (req, res) => {
  try {
    const { month, year } = req.body; // MM, YYYY
    const technicians = await User.find({ role: 'technician' });
    const holidays = await Holiday.find({ 
      date: { $regex: `^${year}-${month}` } 
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    let syncedCount = 0;

    for (const tech of technicians) {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
        const d = new Date(year, month - 1, day);
        const isSunday = d.getDay() === 0;
        const holiday = holidays.find(h => h.date === dateStr);

        if (isSunday || holiday) {
          const existing = await Attendance.findOne({ user: tech._id, date: dateStr });
          if (!existing) {
            const newRecord = new Attendance({
              user: tech._id,
              date: dateStr,
              status: isSunday ? 'sunday' : 'holiday',
              type: isSunday ? 'sunday_auto' : 'holiday_auto',
              remarks: holiday ? holiday.name : 'Sunday'
            });
            await newRecord.save();
            syncedCount++;
          } else if (isSunday && existing.status === 'present') {
             // Upgrade to sunday_present
             existing.status = 'sunday_present';
             await existing.save();
          }
        }
      }
    }

    res.send({ message: `Sync completed. ${syncedCount} records generated/updated.` });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Admin / Technician: Customer lookup by phone number for offline order auto-fetch
router.get('/customer-lookup', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).send({ error: 'Phone number is required for lookup' });
    }

    const customer = await User.findOne({ phone, role: 'customer' }).select('-password');
    if (!customer) {
      return res.send({ exists: false });
    }

    // Find latest order for delivery address and location details
    const Order = require('../models/Order');
    const lastOrder = await Order.findOne({ customer: customer._id }).sort({ createdAt: -1 });

    res.send({
      exists: true,
      customer,
      lastOrder: lastOrder ? {
        deliveryAddress: lastOrder.deliveryAddress || customer.address || '',
        locationDetails: lastOrder.locationDetails || {},
        alternatePhone: lastOrder.alternatePhone || '',
        category: lastOrder.category || 'installation',
        serviceType: lastOrder.serviceType || 'CCTV Installation',
      } : null
    });
  } catch (error) {
    console.error('Customer Lookup Error:', error);
    res.status(500).send({ error: error.message });
  }
});

// Admin: Get Revenue Data
router.get('/revenue', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['completed', 'delivered'] } });
    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find({ status: 'paid' });
    const Subscription = require('../models/Subscription');
    const subs = await Subscription.find({ status: 'active' });

    let onlineRevenue = 0;
    let offlineRevenue = 0;
    let subscriptionRevenue = 0;

    orders.forEach(o => {
      if (o.orderType === 'offline') offlineRevenue += (o.totalAmount || 0);
      else onlineRevenue += (o.totalAmount || 0);
    });

    invoices.forEach(i => {
      offlineRevenue += (i.totalAmount || 0);
    });

    subs.forEach(s => {
      subscriptionRevenue += (s.plan === 'premium' ? 5000 : s.plan === 'basic' ? 2000 : 0);
    });

    res.json({
      totalRevenue: onlineRevenue + offlineRevenue + subscriptionRevenue,
      onlineRevenue,
      offlineRevenue,
      subscriptionRevenue
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Performance Dashboard for FSM
router.get('/performance-dashboard', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const Order = require('../models/Order');
    const DailyReport = require('../models/DailyReport');
    
    // Aggregated metrics
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const pendingReportsCount = await DailyReport.countDocuments({ status: 'Submitted' });
    const reworkCounts = await DailyReport.countDocuments({ status: 'Rework' });
    
    // Technician Productivity
    const techReports = await DailyReport.aggregate([
      {
        $group: {
          _id: '$technicianId',
          totalHours: { $sum: '$workingHours' },
          totalTasksCompleted: { $sum: '$tasksCompleted' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'technician'
        }
      },
      { $unwind: '$technician' },
      {
        $project: {
          technicianName: '$technician.name',
          totalHours: 1,
          totalTasksCompleted: 1
        }
      }
    ]);

    // Average completion time (simplified, using order tracking timeline)
    const completedOrdersData = await Order.find({ status: 'completed' });
    let totalTimeMs = 0;
    let validCount = 0;

    for (const o of completedOrdersData) {
      if (o.trackingTimeline && o.trackingTimeline.length > 0) {
        const start = o.trackingTimeline.find(t => t.status === 'in_progress');
        const end = o.trackingTimeline.find(t => t.status === 'completed');
        if (start && end) {
          totalTimeMs += (end.timestamp.getTime() - start.timestamp.getTime());
          validCount++;
        }
      }
    }

    const averageCompletionTimeHours = validCount > 0 ? (totalTimeMs / validCount / (1000 * 60 * 60)).toFixed(2) : 0;

    res.send({
      completedOrders,
      pendingReportsCount,
      reworkCounts,
      averageCompletionTimeHours,
      technicianProductivity: techReports
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
