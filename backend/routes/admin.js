const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const Order = require('../models/Order');
const User = require('../models/User');
const ServiceReport = require('../models/ServiceReport');
const SystemSettings = require('../models/SystemSettings');
const { exportToExcel, exportToPDF } = require('../utils/exportHelper');

// Log Helper
const logActivity = async (adminId, action, resource, resourceId, details, ip) => {
  await ActivityLog.create({ admin: adminId, action, resource, resourceId, details, ipAddress: ip });
};

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
    const revenueByDay = {};
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.toISOString().split('T')[0];
      revenueByDay[day] = 0;
      return day;
    }).reverse();

    stats.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0];
      if (revenueByDay[day] !== undefined) revenueByDay[day] += order.totalAmount;
    });

    const activeJobs = await Order.countDocuments({ workStatus: 'in_progress' });
    const totalTechs = technicians.length;
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    res.send({
      technicians: technicians.map(t => ({
        ...t.toObject(),
        status: t.availabilityStatus || (t.isOnline ? 'Available' : 'Offline')
      })),
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
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const { period } = req.query;
    let startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setDate(startDate.getDate() - 30);
    else startDate = null; // all time

    const query = startDate ? { createdAt: { $gte: startDate } } : {};
    const orders = await Order.find(query).sort({ createdAt: 1 });
    
    // Revenue by day (last 7 days)
    const revenueByDay = {};
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(day => revenueByDay[day] = 0);
    
    orders.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0];
      if (revenueByDay[day] !== undefined) {
        revenueByDay[day] += order.totalAmount;
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
router.patch('/orders/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.status = status;
    order.trackingTimeline.push({ status, remarks: remarks || `Order status updated to ${status} by admin.` });
    await order.save();
    
    // Log activity
    await logActivity(req.user._id, 'Update', 'Order', order._id, `Status changed to ${status}`, req.ip);

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Export admin reports
router.get('/export', auth, authorize('admin'), async (req, res) => {
  try {
    const { type, format } = req.query; // type: orders, revenue, technicians | format: excel, pdf
    
    let data = [];
    let title = 'SK Technology Report';

    if (type === 'orders') {
      data = await Order.find().populate('customer', 'name email').lean();
      data = data.map(o => ({
        id: o._id.toString(),
        customer: o.customer.name,
        amount: o.totalAmount,
        status: o.status,
        date: o.createdAt.toDateString()
      }));
      title = 'Cumulative Order Service Logs';
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

// Admin: Assign technician to order
router.patch('/orders/:id/assign', auth, authorize('admin'), async (req, res) => {
  try {
    const { technicianId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.technician = technicianId || null;
    order.status = technicianId ? 'assigned' : 'pending';
    
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

      // Create persistent Notification
      const Notification = require('../models/Notification');
      const notif = new Notification({
        userId: technicianId,
        role: 'technician',
        message: `Professional Service: New assignment #${order._id.toString().slice(-6)}`,
        orderId: order._id,
        type: 'technician_assigned'
      });
      await notif.save();
    }
    
    const remark = technicianId 
      ? `Technician assigned for installation.`
      : `Technician assignment retracted.`;
      
    order.trackingTimeline.push({ status: order.status, remarks: remark });
    await order.save();

    // Socket eOrder for real-time update
    const io = req.app.get('socketio');
    if (io && technicianId) {
      io.emit('technician_assigned', { orderId: order._id, technicianId });
      // Also send a general notification
      io.emit('notification', { 
        userId: technicianId, 
        message: `New Order assigned: ${order._id.toString().slice(-6)}`,
        type: 'technician_assigned'
      });
    }

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Auto-assign technicians to orders
router.post('/auto-assign', auth, authorize('admin'), async (req, res) => {
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
       
       // Emit socket signal
       const io = req.app.get('socketio');
       if (io) {
         io.emit('technician_assigned', { orderId: order._id, technicianId: technician._id });
         io.emit('notification', { 
           userId: technician._id, 
           message: `Professional Service Auto-Assigned: ${order._id.toString().slice(-6)}`,
           type: 'technician_assigned'
         });
       }

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

// Get all technicians (minimal info)
router.get('/technicians', auth, authorize('admin'), async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('name email phone location');
    res.send(technicians);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all customers
router.get('/customers', auth, authorize('admin'), async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('name email phone address createdAt');
    res.send(customers);
  } catch (error) {
    res.status(500).send(error);
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

// Get technician availability board
router.get('/technicians/status', auth, authorize('admin'), async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('name email location profilePic phone address');
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
router.get('/tracking/live', auth, authorize('admin'), async (req, res) => {
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

// --- Service Report Review ---
router.get('/reports', auth, authorize('admin'), async (req, res) => {
  try {
    const reports = await ServiceReport.find()
      .populate('technicianId', 'name email')
      .populate('jobId')
      .sort({ createdAt: -1 });
    res.send(reports);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/reports/:id/review', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const report = await ServiceReport.findByIdAndUpdate(req.params.id, {
      $set: { 
        'adminApproval.status': status, 
        'adminApproval.reason': reason,
        'adminApproval.reviewedAt': new Date()
      }
    }, { new: true });
    
    if (!report) return res.status(404).send({ error: 'Report not found' });
    
    if (status === 'approved') {
      const order = await Order.findByIdAndUpdate(report.jobId, { status: 'completed', workStatus: 'completed' }, { new: true });
      
      // Notify Customer via socket and database
      const Notification = require('../models/Notification');
      const customerNotif = new Notification({
        userId: order.customer,
        role: 'customer',
        message: `Your service order #${order._id.toString().slice(-6)} has been completed and verified.`,
        orderId: order._id,
        type: 'order_update'
      });
      await customerNotif.save();

      if (io) {
        io.to(order.customer.toString()).emit('notification', {
          message: `Service completed and verified for #${order._id.toString().slice(-6)}`,
          type: 'order_update'
        });
      }
    }

    // Notify Technician via socket
    if (io) {
      io.emit('notification', {
        userId: report.technicianId,
        message: `Your report for Job #${report.jobId.toString().slice(-6)} was ${status === 'rejected' ? 'sent back for correction' : 'approved'}.`,
        type: 'installation_update'
      });
    }

    res.send(report);
  } catch (error) {
    res.status(400).send(error);
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
    const io = req.app.get('socketio');
    const message = `Reschedule for Order #${order._id.toString().slice(-6)} was ${action}d.`;
    
    const Notification = require('../models/Notification');
    await new Notification({ userId: order.customer, role: 'customer', message, orderId: order._id, type: 'order_update' }).save();
    if (order.technician) {
      await new Notification({ userId: order.technician, role: 'technician', message, orderId: order._id, type: 'installation_update' }).save();
    }

    if (io) {
      io.to(order.customer.toString()).emit('notification', { message, type: 'order_update' });
      if (order.technician) {
        io.to(order.technician.toString()).emit('notification', { message, type: 'installation_update' });
      }
    }

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
