const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const WorkFlow = require('../models/WorkFlow');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');
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

      // Lock Technician
      bestTech.availabilityStatus = 'Assigned';
      bestTech.currentOrder = order._id;
      await bestTech.save();

      // Create WorkFlow entry
      const workflow = new WorkFlow({
        order: order._id,
        technician: order.technician,
        stages: { assigned: { status: true, timestamp: new Date() } }
      });
      await workflow.save();

      // Notify Assigned Technician
      await createNotification(req.app, {
        userId: order.technician,
        role: 'technician',
        type: 'technician_assigned',
        message: `New installation assignment for order #${order._id.toString().slice(-6)}`,
        orderId: order._id
      });

      // Notify Customer
      if (order.customer) {
        await createNotification(req.app, {
          userId: order.customer,
          role: 'customer',
          type: 'order_update',
          message: `Strategic Partner Assigned: ${bestTech.name} has been assigned to your order #${order._id.toString().slice(-6)}.`,
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
    const { 
      products: incomingProducts, 
      slot: slotId, 
      deliveryAddress, 
      locationDetails,
      installationRequired,
      paymentMethod,
      orderType,
      category,
      notes,
      preferredDate,
      preferredTiming
    } = req.body;
    
    if (!incomingProducts || incomingProducts.length === 0) {
      return res.status(400).send({ message: "No products in order payload." });
    }

    // 1. Backend Price Validation & Financial Calculation
    const Product = require('../models/Product');
    let subtotal = 0;
    const verifiedProducts = [];

    for (const item of incomingProducts) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).send({ message: `Product with ID ${item.product} not found.` });
      }

      // Use Master Price from DB
      const verifiedPrice = product.price;
      const quantity = parseInt(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).send({ message: `Invalid quantity for product ${product.name}.` });
      }
      
      subtotal += verifiedPrice * quantity;
      
      verifiedProducts.push({
        product: product._id,
        quantity: quantity,
        price: verifiedPrice
      });
    }

    const GST_RATE = 0.18; // 18% Professional standard
    const gstAmount = Math.round(subtotal * GST_RATE * 100) / 100;
    const discountAmount = 0; // Future logic: Validate promo codes here
    const totalAmount = subtotal + gstAmount - discountAmount;

    const order = new Order({
      customer: req.user._id,
      products: verifiedProducts,
      subtotal,
      gstAmount,
      discountAmount,
      totalAmount,
      deliveryAddress,
      locationDetails,
      installationRequired,
      paymentMethod: paymentMethod || 'cod',
      orderType: orderType || 'online',
      category: category || 'installation',
      notes,
      preferredDate,
      preferredTiming,
      trackingTimeline: [{ status: 'order_placed', remarks: 'Order received and verified at Command Center.' }]
    });

    // If slot is provided, validate and book it

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

      // Lock Technician for slot booking
      const tech = await User.findById(order.technician);
      if (tech) {
        tech.availabilityStatus = 'Assigned';
        tech.currentOrder = order._id;
        await tech.save();
      }
    } else if (order.installationRequired || order.orderType === 'service') {
      await autoAssignTechnician(order, req);
    }

    await order.save();

    // Notify Admins
    await createNotification(req.app, {
      role: 'admin',
      type: 'new_order',
      message: `New order #${order._id.toString().slice(-6)} placed by ${req.user.name}`,
      orderId: order._id
    });

    // Notify Assigned Technician
    if (order.technician) {
      await createNotification(req.app, {
        userId: order.technician,
        role: 'technician',
        type: 'technician_assigned',
        message: `New installation assignment for order #${order._id.toString().slice(-6)}`,
        orderId: order._id
      });
    }

    // Broadcast notification to ALL technicians
    await createNotification(req.app, {
      role: 'technician',
      type: 'new_order',
      message: `New Order Created #${order._id.toString().slice(-6)}. Open tasks to view details.`,
      orderId: order._id
    });
    
    // Notify Customer
    await createNotification(req.app, {
      userId: req.user._id,
      role: 'customer',
      type: 'new_order',
      message: `Your order #${order._id.toString().slice(-6)} has been placed successfully.`,
      orderId: order._id
    });

    res.status(201).send(order);
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(400).send({ message: error.message || "Failed to create order.", error: error.errors || error });
  }
});

// Admin / Technician: Create offline order / quotation
router.post('/admin/offline', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { 
      customerName, contactNumber, alternatePhone, serviceType, deliveryAddress, 
      locationDetails, preferredDate, preferredTiming,
      paymentMethod, notes, totalAmount, technicianId, warrantyPeriod 
    } = req.body;
    
    // Find or create a shadow user for the offline customer
    let customer = await User.findOne({ phone: contactNumber });
    if (!customer) {
      customer = new User({
        name: customerName,
        phone: contactNumber,
        alternatePhone: alternatePhone || '',
        email: `offline_${contactNumber}@sktech.com`,
        password: Math.random().toString(36).slice(-8),
        role: 'customer',
        address: deliveryAddress,
        notes: notes || '',
        warrantyPeriod: warrantyPeriod || '12 Months'
      });
      await customer.save();
    } else {
      customer.name = customerName || customer.name;
      customer.address = deliveryAddress || customer.address;
      customer.alternatePhone = alternatePhone || customer.alternatePhone;
      customer.notes = notes || customer.notes;
      customer.warrantyPeriod = warrantyPeriod || customer.warrantyPeriod || '12 Months';
      await customer.save();
    }

    const order = new Order({
      customer: customer._id,
      customerName: customerName || customer.name,
      contactNumber: contactNumber || customer.phone,
      alternatePhone: alternatePhone || '',
      orderType: 'offline',
      deliveryAddress,
      locationDetails,
      preferredDate,
      preferredTiming,
      paymentMethod,
      totalAmount: totalAmount || 0,
      subtotal: req.body.subtotal || 0,
      gstAmount: req.body.gstAmount || 0,
      products: req.body.products || [],
      notes,
      category: serviceType || 'service',
      serviceType: serviceType || 'service',
      warrantyPeriod: warrantyPeriod || '12 Months',
      status: technicianId ? 'assigned' : 'pending',
      trackingTimeline: [{ status: 'order_placed', remarks: 'Offline order created by admin' }]
    });

    if (technicianId) {
      const validDate = preferredDate && !isNaN(new Date(preferredDate).valueOf()) ? new Date(preferredDate) : new Date();
      order.technician = technicianId;
      order.scheduledDate = validDate;
      order.scheduledSlot = preferredTiming;
      order.trackingTimeline.push({ status: 'assigned', remarks: `Manually assigned to technician during creation.` });
      
      const Slot = require('../models/Slot');
      const WorkFlow = require('../models/WorkFlow');
      
      // Parse timing for slot (e.g., "Morning (9 AM - 12 PM)")
      let startTime = "09:00", endTime = "12:00";
      if (preferredTiming?.includes("Afternoon")) { startTime = "13:00"; endTime = "16:00"; }
      else if (preferredTiming?.includes("Evening")) { startTime = "16:00"; endTime = "19:00"; }
      else if (preferredTiming?.includes("Full Day")) { startTime = "09:00"; endTime = "18:00"; }

      // Block Slot
      await Slot.create({
        technician: technicianId,
        date: validDate,
        startTime,
        endTime,
        isBooked: true,
        order: order._id,
        status: 'booked'
      });

      // Create WorkFlow
      await WorkFlow.create({
        order: order._id,
        technician: technicianId,
        stages: { assigned: { status: true, timestamp: new Date() } }
      });

      // Lock Technician
      const tech = await User.findById(technicianId);
      if (tech) {
        tech.availabilityStatus = 'Assigned';
        tech.currentOrder = order._id;
        await tech.save();
      }
    } else {
      // Auto-assignment for offline orders if no tech selected
      await autoAssignTechnician(order, req);
    }

    await order.save();

    
    // Notify Admins
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_order', { orderId: order._id, customer: customerName, total: order.totalAmount, type: 'offline' });
    }

    await createNotification(req.app, {
      role: 'admin',
      type: 'new_order',
      message: `New offline order #${order._id.toString().slice(-6)} created for ${customerName}`,
      orderId: order._id
    });

    // Broadcast notification to ALL technicians
    await createNotification(req.app, {
      role: 'technician',
      type: 'new_order',
      message: `New Offline Order Created #${order._id.toString().slice(-6)}. Open tasks to view details.`,
      orderId: order._id
    });

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
      order.status = 'pending_admin_approval';
      order.completedAt = new Date();
      order.warrantyPeriod = order.warrantyPeriod || '12 Months';
      order.warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      order.warrantyStatus = 'Valid';
      order.trackingTimeline.push({ status: 'pending_admin_approval', remarks: `Work completed by ${req.user.name} and verified with photo. Pending admin approval (auto-approves in 30 mins).` });
      
      // Notify Admin
      const adminMsg = `Strategic Operation: Work completed for Order #${order._id.toString().slice(-6)} by ${req.user.name}. Waiting for your approval.`;
      await createNotification(req.app, { role: 'admin', message: adminMsg, orderId: order._id, type: 'installation_update' });

      // Notify Customer
      if (order.customer) {
        const custMsg = `Work completed by technician ${req.user.name}. Pending final admin verification.`;
        await createNotification(req.app, { userId: order.customer, role: 'customer', message: custMsg, orderId: order._id, type: 'order_update' });
      }

      if (io) {
        io.to('role:admin').emit('notification', { title: 'Job Pending Approval', message: adminMsg, type: 'installation_update', orderId: order._id });
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

      // Start 30-minute auto-approve timeout
      setTimeout(async () => {
        try {
          const checkOrder = await Order.findById(order._id);
          if (checkOrder && checkOrder.status === 'pending_admin_approval') {
            checkOrder.status = 'completed';
            checkOrder.trackingTimeline.push({ status: 'completed', remarks: 'Automatically approved by system after 30 minutes of admin inactivity.' });
            await checkOrder.save();
            
            if (checkOrder.technician) {
              const tech = await User.findById(checkOrder.technician);
              if (tech) {
                tech.availabilityStatus = 'Available';
                tech.currentOrder = null;
                await tech.save();
              }
            }
            
            await createNotification(req.app, {
              role: 'admin',
              type: 'installation_update',
              message: `Order #${checkOrder._id.toString().slice(-6)} was automatically approved to completed status after 30 minutes.`,
              orderId: checkOrder._id
            });
            
            if (checkOrder.customer) {
              await createNotification(req.app, {
                userId: checkOrder.customer,
                role: 'customer',
                type: 'order_update',
                message: `Your order #${checkOrder._id.toString().slice(-6)} is now fully completed and verified.`,
                orderId: checkOrder._id
              });
            }
          }
        } catch (err) {
          console.error('Auto-approve timeout error:', err);
        }
      }, 30 * 60 * 1000);
    }

    await order.save();
    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Manually approve task completion
router.patch('/:id/approve-completion', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.status = 'completed';
    order.trackingTimeline.push({
      status: 'completed',
      remarks: `Completion verified and approved by admin ${req.user.name}.`
    });

    await order.save();

    if (order.technician) {
      const tech = await User.findById(order.technician);
      if (tech) {
        tech.availabilityStatus = 'Available';
        tech.currentOrder = null;
        await tech.save();
      }
    }

    // Notify Technician
    if (order.technician) {
      await createNotification(req.app, {
        userId: order.technician,
        role: 'technician',
        type: 'technician_update',
        message: `Admin has approved your completion for order #${order._id.toString().slice(-6)}.`,
        orderId: order._id
      });
    }

    // Notify Customer
    if (order.customer) {
      await createNotification(req.app, {
        userId: order.customer,
        role: 'customer',
        type: 'order_update',
        message: `Your order #${order._id.toString().slice(-6)} has been fully verified and approved by our command center.`,
        orderId: order._id
      });
    }

    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: order._id, status: 'completed' });

    // Auto-assign the next pending order to available technicians
    const pendingOrder = await Order.findOne({ status: 'pending', installationRequired: true, technician: { $exists: false } }).sort({ createdAt: 1 });
    if (pendingOrder) {
      await autoAssignTechnician(pendingOrder, req);
    }

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

// Get orders based on role (Admin/Technician get all, Customer gets own)
router.get('/', auth, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin' || req.user.role === 'sub-admin' || req.user.role === 'technician') {
      orders = await Order.find({}).populate('customer').populate('products.product').populate('technician');
    } else {
      orders = await Order.find({ customer: req.user._id }).populate('customer').populate('products.product').populate('technician');
    }
    res.send(orders);
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

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer')
      .populate('products.product')
      .populate('technician');
    if (!order) return res.status(404).send({ error: 'Order not found' });
    res.send(order);
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

    // Notify Technician broadcasted to ALL technicians
    await createNotification(req.app, {
      role: 'technician',
      type: 'technician_assigned',
      message: `New Order Task Assigned #${order._id.toString().slice(-6)}. Open tasks to accept or reject.`,
      orderId: order._id
    });

    // Notify Customer
    if (order.customer) {
      await createNotification(req.app, {
        userId: order.customer,
        role: 'customer',
        type: 'order_update',
        message: `Command Center Update: A technician has been assigned to your order #${order._id.toString().slice(-6)}.`,
        orderId: order._id
      });
    }

    // Lock Technician manually assigned
    const techStatus = await User.findById(technicianId);
    if (techStatus) {
      techStatus.availabilityStatus = 'Assigned';
      techStatus.currentOrder = order._id;
      await techStatus.save();
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
      { _id: req.params.id },
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
          technician: req.user._id,
          $set: { 'stages.accepted': { status: true, timestamp: new Date() } },
          updatedAt: new Date()
        },
        { upsert: true }
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

    // Notify Customer
    if (order.customer) {
      await createNotification(req.app, {
        userId: order.customer,
        role: 'customer',
        type: 'order_update',
        message: `Field Update: Technician ${req.user.name} has picked up your order #${order._id.toString().slice(-6)} and is preparing for deployment.`,
        orderId: order._id
      });
    }

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
    await createNotification(req.app, {
      role: 'admin',
      type: 'rescheduled',
      message: `Reschedule request for Order #${order._id.toString().slice(-6)} from ${req.user.name}`,
      orderId: order._id
    });

    res.send({ message: 'Reschedule request submitted successfully', order });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin/Technician: Update order status
router.patch('/:id/status', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.status = status;
    order.trackingTimeline.push({
      status,
      remarks: remarks || `Status updated to ${status} by ${req.user.name}`
    });

    await order.save();
    
    // Notify via socket
    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: order._id, status });

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Technician/Admin: Increment expected days (Add Day button)
router.patch('/:id/add-expected-day', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.expectedDays = (order.expectedDays || 1) + 1;
    order.trackingTimeline.push({
      status: order.status,
      remarks: `Expected task duration extended to ${order.expectedDays} days by ${req.user.name}`
    });

    await order.save();
    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Update payment status
router.patch('/:id/payment', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    order.paymentStatus = paymentStatus;
    order.trackingTimeline.push({
      status: order.status,
      remarks: `Payment status updated to ${paymentStatus} by ${req.user.name}`
    });

    await order.save();
    
    // Sync Invoice status with Order payment status
    try {
      const Invoice = require('../models/Invoice');
      const invoiceStatus = paymentStatus === 'paid' ? 'paid' : 'sent';
      await Invoice.findOneAndUpdate(
        { order: order._id },
        { status: invoiceStatus, ...(paymentStatus === 'paid' ? { paidAt: new Date() } : {}) }
      );
    } catch (invErr) {
      console.warn("Failed to sync invoice status", invErr);
    }
    
    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: order._id, paymentStatus });

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Technician: Upload Work Proof Photo (start, inProgress, completion)
router.post('/technician/proof/:id', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { stage, photoUrl, lat, lng, remarks } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send({ error: 'Order not found' });
    }

    if (!order.workProofs) {
      order.workProofs = {};
    }

    const proofData = {
      url: photoUrl,
      timestamp: new Date(),
      location: { lat: Number(lat) || 0, lng: Number(lng) || 0 }
    };

    if (stage === 'start') {
      order.workProofs.start = proofData;
      order.workStatus = 'in_progress';
      order.status = 'in_progress';
    } else if (stage === 'inProgress') {
      order.workProofs.inProgress = proofData;
      order.workStatus = 'in_progress';
    } else if (stage === 'completion') {
      order.workProofs.completion = { ...proofData, remarks: remarks || '' };
      order.workStatus = 'completed';
      order.status = 'completed';
      order.completionDate = new Date();
      order.warrantyPeriod = order.warrantyPeriod || '12 Months';
      order.warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      order.warrantyStatus = 'Valid';
    }

    order.trackingTimeline.push({
      status: order.status || 'in_progress',
      remarks: `Work proof (${stage}) uploaded by ${req.user.name}. ${remarks ? 'Remarks: ' + remarks : ''}`,
      timestamp: new Date()
    });

    await order.save();

    // Sync WorkFlow stages so technician dashboard updates to the next step instantly
    const WorkFlow = require('../models/WorkFlow');
    const stageKey = stage === 'start' ? 'started' : stage === 'inProgress' ? 'inProgress' : 'completed';
    await WorkFlow.findOneAndUpdate(
      { order: order._id },
      { 
        $set: { 
          [`stages.${stageKey}`]: { 
            status: true, 
            timestamp: new Date(), 
            photo: { url: photoUrl, coordinates: { lat: Number(lat) || 0, lng: Number(lng) || 0 } } 
          } 
        } 
      },
      { upsert: true }
    );

    // Socket update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('work_update', { orderId: order._id, status: stage, photoUrl });
    }

    res.send(order);
  } catch (error) {
    console.error('Work Proof Upload Error:', error);
    res.status(500).send({ error: error.message });
  }
});

// Customer/Admin: Request Rework / Fault Report (Warranty Check & Notification)
router.post('/rework-request/:id', auth, async (req, res) => {
  try {
    const { faultDescription } = req.body;
    const order = await Order.findById(req.params.id).populate('customer').populate('technician');
    if (!order) return res.status(404).send({ error: 'Order not found' });

    let isWarrantyValid = false;
    if (order.warrantyEndDate && new Date() <= new Date(order.warrantyEndDate)) {
      isWarrantyValid = true;
      order.warrantyStatus = 'Under Warranty (Free Rework)';
    } else {
      order.warrantyStatus = 'Expired - Paid Service Required';
    }

    order.status = 'rework_requested';
    order.trackingTimeline.push({
      status: 'rework_requested',
      remarks: `Fault reported: "${faultDescription}". Warranty Status: ${order.warrantyStatus}`
    });
    
    // Auto-assign a technician for the warranty claim
    await autoAssignTechnician(order, req);
    
    await order.save();

    // Notify Admin, Technician, and Customer
    const message = `Fault Reported for Order #${order._id.toString().slice(-6)}. Status: ${order.warrantyStatus}. Fault: ${faultDescription}`;
    
    // Notify Admin
    await createNotification(req.app, {
      role: 'admin',
      type: 'order_update',
      message,
      orderId: order._id
    });

    // Notify Technician
    if (order.technician) {
      await createNotification(req.app, {
        userId: order.technician._id,
        role: 'technician',
        type: 'order_update',
        message,
        orderId: order._id
      });
    }

    // Notify Customer
    if (order.customer) {
      await createNotification(req.app, {
        userId: order.customer._id,
        role: 'customer',
        type: 'order_update',
        message,
        orderId: order._id
      });
    }

    res.send({ message: 'Rework request submitted successfully', order, isWarrantyValid });
  } catch (error) {
    console.error('Rework Request Error:', error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;

