const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const WorkFlow = require('../models/WorkFlow');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

// Helper: Auto-assign technician based on load
const autoAssignTechnician = async (order, req) => {
  try {
    const technicians = await User.find({ role: 'technician' });
    if (technicians.length === 0) return null;

    // Simple load balancing: find tech with lowest active orders
    const techLoads = await Promise.all(technicians.map(async (tech) => {
      const count = await Order.countDocuments({ 
        technician: tech._id, 
        status: { $in: ['assigned', 'accepted', 'in_progress'] } 
      });
      return { tech, count };
    }));
    
    const sortedTechs = techLoads.sort((a, b) => a.count - b.count);
    const bestTech = sortedTechs[0]?.tech;
    
    if (bestTech) {
      order.technician = bestTech._id;
      order.status = 'assigned';
      order.trackingTimeline.push({ 
        status: 'assigned', 
        remarks: `Automatically assigned to ${bestTech.name} based on workload.` 
      });

      // Create WorkFlow entry
      const workflow = new WorkFlow({
        order: order._id,
        technician: order.technician,
        stages: { assigned: { status: true, timestamp: new Date() } }
      });
      await workflow.save();

      // Notify Assigned Technician
      const notif = new Notification({
        userId: order.technician,
        role: 'technician',
        message: `New installation assignment for order #${order._id.toString().slice(-6)}`,
        orderId: order._id,
        type: 'technician_assigned'
      });
      await notif.save();

      const io = req.app.get('socketio');
      if (io) {
        io.to(order.technician.toString()).emit('notification', { 
          type: 'technician_assigned',
          title: 'New Job Assignment',
          message: `New installation assignment for order #${order._id.toString().slice(-6)}`,
          priority: 'urgent',
          orderId: order._id
        });
      }
      return bestTech;
    }
    return null;
  } catch (error) {
    console.error("Auto-assign Error:", error);
    return null;
  }
};

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { slot: slotId } = req.body;
    
    const order = new Order({
      ...req.body,
      customer: req.user._id,
      trackingTimeline: [{ status: 'order_placed', remarks: 'Order received and awaiting confirmation' }]
    });

    // If slot is provided, validate and book it
    if (slotId) {
      const Slot = require('../models/Slot');
      const slot = await Slot.findById(slotId);
      if (!slot) return res.status(404).send({ message: 'Selected slot not found' });
      if (slot.isBooked) return res.status(400).send({ message: 'Slot is already booked' });
      
      order.technician = slot.technician;
      order.status = 'assigned';
      order.installationSlot = slot.date;
      
      slot.isBooked = true;
      slot.order = order._id;
      await slot.save();

      const workflow = new WorkFlow({
        order: order._id,
        technician: order.technician,
        stages: { assigned: { status: true, timestamp: new Date() } }
      });
      await workflow.save();
    } else if (order.installationRequired || order.orderType === 'service') {
      await autoAssignTechnician(order, req);
    }

    await order.save();

    // Notify Admins
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(async (admin) => {
      const notif = new Notification({
        userId: admin._id,
        role: 'admin',
        message: `New order #${order._id.toString().slice(-6)} placed by ${req.user.name}`,
        orderId: order._id,
        type: 'new_order'
      });
      await notif.save();
    }));

    // Notify Assigned Technician
    if (order.technician) {
      const notif = new Notification({
        userId: order.technician,
        role: 'technician',
        message: `New installation assignment for order #${order._id.toString().slice(-6)}`,
        orderId: order._id,
        type: 'new_order'
      });
      await notif.save();
    }
    
    // Notify Customer
    const customerNotif = new Notification({
      userId: req.user._id,
      role: 'customer',
      message: `Your order #${order._id.toString().slice(-6)} has been placed successfully.`,
      orderId: order._id,
      type: 'new_order'
    });
    await customerNotif.save();

    const io = req.app.get('socketio');
    if (io) {
      // Notify all admins about the new order placement
      io.to('role:admin').emit('notification', { 
        type: 'new_order',
        title: 'New Service Placement',
        message: `High-priority: New order #${order._id.toString().slice(-6)} placed by ${req.user.name}`,
        orderId: order._id,
        priority: 'high'
      });
      io.to('role:admin').emit('new_order', { orderId: order._id, customer: req.user.name, total: order.totalAmount });
      
      // Notify the customer specifically
      io.to(req.user._id.toString()).emit('notification', {
        type: 'new_order',
        title: 'Order Confirmed',
        message: `Success: Your order #${order._id.toString().slice(-6)} has been placed and is being processed.`,
        orderId: order._id
      });

      if (order.technician) {
        // Notify the assigned technician
        io.to(order.technician.toString()).emit('notification', { 
          type: 'technician_assigned',
          title: 'Operation Assignment',
          message: `Field Alert: New installation assignment for order #${order._id.toString().slice(-6)}`,
          priority: 'urgent',
          orderId: order._id
        });
      }
    }

    res.status(201).send(order);
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(400).send({ message: error.message || "Failed to create order.", error: error.errors || error });
  }
});

// Admin: Create offline order
router.post('/admin/offline', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { customerName, contactNumber, serviceType, deliveryAddress, locationDetails, preferredDate, paymentMethod, notes, totalAmount } = req.body;
    
    // Find or create a shadow user for the offline customer
    let customer = await User.findOne({ phone: contactNumber });
    if (!customer) {
      customer = new User({
        name: customerName,
        phone: contactNumber,
        email: `offline_${contactNumber}@sktech.com`,
        password: Math.random().toString(36).slice(-8),
        role: 'customer',
        address: deliveryAddress
      });
      await customer.save();
    }

    const order = new Order({
      customer: customer._id,
      orderType: 'offline',
      deliveryAddress,
      locationDetails,
      preferredDate,
      paymentMethod,
      totalAmount: totalAmount || 0,
      notes,
      status: 'pending',
      trackingTimeline: [{ status: 'order_placed', remarks: 'Offline order created by admin' }]
    });

    // Auto-assignment for offline orders
    await autoAssignTechnician(order, req);

    await order.save();
    
    // Notify Admins
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_order', { orderId: order._id, customer: customerName, total: order.totalAmount, type: 'offline' });
    }

    res.status(201).send(order);
  } catch (error) {
    console.error("Offline Order Error:", error);
    res.status(400).send({ message: error.message });
  }
});

// Technician: Upload work photo and update status
router.patch('/:id/work-photo', auth, authorize('technician'), async (req, res) => {
  try {
    const { type, url, location } = req.body; // type: 'before' or 'after'
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.technician.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized. You are not the assigned technician.' });
    }

    order.workPhotos[type] = {
      url,
      timestamp: new Date(),
      location
    };

    // Auto-update status based on photo type if needed
    const io = req.app.get('socketio');
    if (type === 'before' && (order.status === 'assigned' || order.status === 'accepted')) {
      order.status = 'in_progress';
      order.trackingTimeline.push({ status: 'in_progress', remarks: `Work started by ${req.user.name} after photo upload` });
      
      // Notify Admin
      const adminMsg = `Strategic Operation: Job started for Order #${order._id.toString().slice(-6)} by ${req.user.name}`;
      await new Notification({ role: 'admin', message: adminMsg, orderId: order._id, type: 'installation_update' }).save();
      
      // Notify Customer
      if (order.customer) {
        const custMsg = `Your technician ${req.user.name} has started work on your Order #${order._id.toString().slice(-6)}.`;
        await new Notification({ userId: order.customer, role: 'customer', message: custMsg, orderId: order._id, type: 'order_update' }).save();
      }

      if (io) {
        io.to('role:admin').emit('notification', { title: 'Job Started', message: adminMsg, type: 'installation_update', orderId: order._id });
        if (order.customer) {
          io.to(order.customer.toString()).emit('notification', { title: 'Work In Progress', message: `Technician has started work on your order.`, type: 'order_update', orderId: order._id });
        }
      }
    } else if (type === 'after') {
      order.status = 'completed';
      order.trackingTimeline.push({ status: 'completed', remarks: 'Work completed and verified with photo' });
      
      // Notify Admin
      const completionMsg = `Industrial Success: Work completed for Order #${order._id.toString().slice(-6)} by ${req.user.name}.`;
      await new Notification({ role: 'admin', message: completionMsg, orderId: order._id, type: 'installation_update' }).save();

      if (io) {
        io.to('role:admin').emit('notification', { title: 'Job Completed', message: completionMsg, type: 'installation_update', orderId: order._id });
      }

      // Auto-generate ServiceReport metadata
      const ServiceReport = require('../models/ServiceReport');
      const startTime = order.workPhotos.before ? order.workPhotos.before.timestamp : order.createdAt;
      const endTime = new Date();
      const durationMs = endTime - startTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      const report = new ServiceReport({
        jobId: order._id,
        technicianId: req.user._id,
        customerName: (await User.findById(order.customer)).name,
        customerAddress: order.deliveryAddress,
        serviceType: 'CCTV Service',
        problemIdentified: order.notes || 'Routine check/Installation',
        workPerformed: 'Completed as per requirements',
        startTime,
        endTime,
        workDuration: `${hours}h ${minutes}m`,
        photos: {
          before: order.workPhotos.before?.url,
          after: url
        },
        gpsLocation: {
          start: order.workPhotos.before?.location,
          end: location
        }
      });
      await report.save();
    }

    await order.save();
    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get customer service reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const ServiceReport = require('../models/ServiceReport');
    // Find orders belonging to the customer
    const orders = await Order.find({ customer: req.user._id }).select('_id');
    const orderIds = orders.map(o => o._id);
    
    // Find reports for those orders
    const reports = await ServiceReport.find({ jobId: { $in: orderIds } })
      .populate('technicianId', 'name email phone')
      .populate('jobId', 'serviceType createdAt')
      .sort({ createdAt: -1 });
      
    res.send(reports);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get customer orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('products.product')
      .populate('technician', 'name phone');
    res.send(orders);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get all orders
router.get('/all', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const orders = await Order.find({}).populate('customer').populate('products.product').populate('technician');
    res.send(orders);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Assign technician (Enhanced)
router.patch('/assign/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { technicianId, dueDate, timeToComplete } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { 
      technician: technicianId,
      status: 'assigned',
      dueDate,
      timeToComplete
    }, { new: true });
    
    // Create/Update workflow entry
    const workflow = await WorkFlow.findOneAndUpdate(
      { order: order._id },
      { 
        technician: technicianId,
        $set: { 'stages.assigned': { status: true, timestamp: new Date() } }
      },
      { upsert: true, new: true }
    );

    // Notify Technician
    const notif = new Notification({
      userId: technicianId,
      role: 'technician',
      message: `You have been assigned to order #${order._id.toString().slice(-6)}`,
      orderId: order._id,
      type: 'technician_assigned'
    });
    await notif.save();

    const io = req.app.get('socketio');
    if (io) {
      io.to(technicianId.toString()).emit('notification', {
        type: 'technician_assigned',
        title: 'New Job Assigned',
        message: `You have been assigned to Order #${order._id.toString().slice(-6)}`,
        priority: 'urgent',
        orderId: order._id
      });
    }

    res.send({ order, workflow });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Delete order
router.delete('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });
    
    // Also delete associated workflow
    await WorkFlow.deleteMany({ order: order._id });
    
    res.send(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get workflow for an order
router.get('/workflow/:orderId', auth, async (req, res) => {
  try {
    const workflow = await WorkFlow.findOne({ order: req.params.orderId }).populate('technician', 'name email');
    res.send(workflow);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Technician: Respond to order (Enhanced)
router.patch('/respond/:id', auth, authorize('technician'), async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const status = action === 'accept' ? 'accepted' : 'pending';
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, technician: req.user._id },
      { 
        status, 
        technician: action === 'accept' ? req.user._id : null,
        $push: { trackingTimeline: { status, remarks: `Technician ${action}ed the installation assignment` } }
      },
      { new: true }
    );

    if (action === 'accept') {
      await WorkFlow.findOneAndUpdate(
        { order: order._id },
        { 
          $set: { 'stages.accepted': { status: true, timestamp: new Date() } },
          updatedAt: new Date()
        }
      );
    } else {
      // If rejected, clear workflow assignments
      await WorkFlow.findOneAndUpdate(
        { order: order._id },
        { 
          $set: { 
            technician: null,
            'stages.assigned.status': false,
            'stages.accepted.status': false
          }
        }
      );
    }

    // Notify Admins of response
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(async (admin) => {
       const notif = new Notification({
        userId: admin._id,
        role: 'admin',
        message: `Technician ${req.user.name} has ${action}ed order #${order._id.toString().slice(-6)}`,
        orderId: order._id,
        type: 'installation_update'
      });
      await notif.save();
    }));

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Technician: Get available (unassigned) jobs
router.get('/available-pool', auth, authorize('technician'), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ['pending', 'confirmed'] }, 
      technician: null 
    }).populate('customer', 'name address');
    res.send(orders);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Technician: Pickup / Self-assign a job
router.patch('/pickup/:id', auth, authorize('technician'), async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['pending', 'confirmed'] }, technician: null },
      { 
        technician: req.user._id,
        status: 'assigned',
        $push: { trackingTimeline: { status: 'assigned', remarks: `Technician ${req.user.name} self-assigned this job.` } }
      },
      { new: true }
    );
    
    if (!order) return res.status(404).send({ error: 'Job not available for pickup' });

    await WorkFlow.findOneAndUpdate(
      { order: order._id },
      { 
        technician: req.user._id,
        $set: { 'stages.assigned': { status: true, timestamp: new Date() } }
      },
      { upsert: true, new: true }
    );

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Request Reschedule
router.post('/reschedule/:id', auth, async (req, res) => {
  try {
    const { date, reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    // Check if user is authorized (customer or assigned technician)
    if (order.customer.toString() !== req.user._id.toString() && 
        (!order.technician || order.technician.toString() !== req.user._id.toString())) {
      return res.status(403).send({ error: 'Unauthorized to reschedule this order' });
    }

    order.rescheduledTo = date;
    order.rescheduleReason = reason;
    order.rescheduleStatus = 'pending';
    order.trackingTimeline.push({ 
      status: 'reschedule_requested', 
      remarks: `Reschedule requested by ${req.user.name} for ${new Date(date).toLocaleDateString()}. Reason: ${reason}` 
    });

    await order.save();

    // Notify Admin
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(async (admin) => {
      const notif = new Notification({
        userId: admin._id,
        role: 'admin',
        message: `Reschedule request for Order #${order._id.toString().slice(-6)} from ${req.user.name}`,
        orderId: order._id,
        type: 'reschedule_request'
      });
      await notif.save();
    }));

    res.send({ message: 'Reschedule request submitted successfully', order });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
