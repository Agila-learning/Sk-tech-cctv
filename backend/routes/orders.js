const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const WorkFlow = require('../models/WorkFlow');
const User = require('../models/User');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');
const { auth, authorize } = require('../middleware/auth');

// Helper: Auto-assign technician based on load (with Fallback to Manual Pool)
const autoAssignTechnician = async (order, req) => {
  try {
    let technicians = await User.find({ role: 'technician' });
    
    let eligibleTechs = technicians.filter(t => t.availabilityStatus === 'Available' && !t.currentOrder);

    // Prioritize those who are online
    const onlineAvailable = eligibleTechs.filter(t => t.isOnline);
    
    if (onlineAvailable.length > 0) {
       eligibleTechs = onlineAvailable;
    }

    if (eligibleTechs.length === 0) {
      // If no available technicians exist, fallback to manual pool
      return null;
    }

    // Simple load balancing: find tech with lowest active orders
    const techLoads = await Promise.all(eligibleTechs.map(async (tech) => {
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

      // Create/Sync Task entry for Smart Multi-Technician Management
      const Task = require('../models/Task');
      await Task.findOneAndUpdate(
        { order: order._id },
        {
          title: `Work Order #${order._id.toString().slice(-6)}`,
          customerName: order.customerName,
          customerPhone: order.contactNumber,
          description: order.notes || 'System assigned task',
          assignee: bestTech._id, // Primary Technician
          status: 'Assigned',
          priority: 'medium'
        },
        { upsert: true, new: true }
      );

      // Notify Assigned Technician
      await createNotification(req.app, {
        userId: order.technician,
        role: 'technician',
        type: 'technician_assigned',
        message: `New installation assignment for order #${order._id.toString().slice(-6)}`,
        orderId: order._id
      });

      // Notify Admins
      await createNotification(req.app, {
        role: 'admin',
        type: 'system_alert',
        message: `System Auto-Assigned Technician ${bestTech.name} to order #${order._id.toString().slice(-6)}.`,
        orderId: order._id
      });
      
      const io = req.app?.get?.('socketio');
      if (io) {
        io.emit('new_notification', {
          title: 'Auto-Assignment Complete',
          message: `Technician ${bestTech.name} has been assigned to Order #${order._id.toString().slice(-6)}.`,
          role: 'admin'
        });
      }

      // Notify Customer
      if (order.customer) {
        await createNotification(req.app, {
          userId: order.customer,
          role: 'customer',
          type: 'order_update',
          message: `Technician ${bestTech.name} has been assigned to your order #${order._id.toString().slice(-6)}.`,
          orderId: order._id
        });
      }

      return bestTech;
    }
  } catch (error) {
    console.error("Auto Assign Error:", error);
  }
  return null;
};

// --- Helper: Stock Management ---
const handleInventoryDecrement = async (order, reqApp) => {
  if (order.isStockDecremented) return;
  if (!['completed', 'delivered'].includes(order.status)) return;
  
  try {
    for (const item of order.products) {
      if (!item.product) continue;
      const prod = await Product.findById(item.product);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        await prod.save();
        
        // Check low stock threshold
        if (prod.stock <= 5) {
          const admins = await User.find({ role: 'admin' });
          await Promise.all(admins.map(async (admin) => {
            await createNotification(reqApp, {
              userId: admin._id,
              role: 'admin',
              type: 'system_alert',
              message: `LOW STOCK ALERT: ${prod.name} has only ${prod.stock} items left in inventory.`,
            });
          }));
        }
      }
    }
    order.isStockDecremented = true;
    await order.save();
  } catch (err) {
    console.error('[Inventory] Failed to decrement stock:', err);
  }
};

// Manual Auto-Assign Route for Admin
router.post('/:id/auto-assign', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    
    if (order.technician) {
      return res.status(400).send({ message: 'Order is already assigned to a technician.' });
    }

    const tech = await autoAssignTechnician(order, req);
    if (tech) {
      await order.save();
      return res.send({ message: 'Technician auto-assigned successfully', technician: tech });
    } else {
      return res.status(400).send({ message: 'No technicians available for assignment.' });
    }
  } catch (err) {
    console.error("Auto Assign API Error:", err);
    res.status(500).send(err);
  }
});

// Task-Level Check-in
router.post('/:id/task-checkin', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { lat, lng, photoUrl } = req.body;
    const Task = require('../models/Task');
    const task = await Task.findOneAndUpdate(
      { order: req.params.id },
      { 
        $push: { 
          attendance: {
            technician: req.user._id,
            checkInTime: new Date(),
            checkInLocation: { lat, lng },
            checkInPhoto: photoUrl
          }
        },
        $set: { status: 'Reached Site' }
      },
      { new: true }
    );
    if (!task) return res.status(404).send({ message: 'Task not found' });
    
    // Update Order Timeline
    const order = await Order.findByIdAndUpdate(req.params.id, {
      $push: { trackingTimeline: { status: 'Reached Site', remarks: `Technician ${req.user.name} checked in at site.` } }
    });

    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: req.params.id, status: 'Reached Site' });
    
    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Task-Level Check-out
router.post('/:id/task-checkout', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const Task = require('../models/Task');
    const task = await Task.findOne({ order: req.params.id });
    if (!task) return res.status(404).send({ message: 'Task not found' });
    
    // Find the latest check-in for this technician without a checkout
    const attendanceRecord = task.attendance.slice().reverse().find(a => 
      a.technician.toString() === req.user._id.toString() && !a.checkOutTime
    );
    
    if (attendanceRecord) {
      attendanceRecord.checkOutTime = new Date();
      attendanceRecord.checkOutLocation = { lat, lng };
      
      const diffMs = attendanceRecord.checkOutTime.getTime() - attendanceRecord.checkInTime.getTime();
      attendanceRecord.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      await task.save();
    }
    
    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { 
      products: incomingProducts, 
      slot: slotId, 
      deliveryAddress, 
      liveLocation,
      installationRequired,
      paymentMethod,
      orderType,
      category,
      notes,
      preferredDate,
      preferredTiming,
      alternatePhone,
      isWarrantyClaim
    } = req.body;
    
    if (orderType !== 'warranty' && (!incomingProducts || incomingProducts.length === 0)) {
      return res.status(400).send({ message: "No products in order payload." });
    }

    // 1. Backend Price Validation & Financial Calculation
    const Product = require('../models/Product');
    let subtotal = 0;
    const verifiedProducts = [];

    if (incomingProducts && incomingProducts.length > 0) {
      for (const item of incomingProducts) {
        if (!item.product) continue;
        const product = await Product.findById(item.product);
        if (!product) {
          continue; // skip if invalid
        }

        // Use Master Price from DB, but 0 if warranty claim
        let verifiedPrice = product.price;
        if (orderType === 'warranty' || isWarrantyClaim) {
          verifiedPrice = 0;
        }

        const quantity = parseInt(item.quantity) || 1;
        
        subtotal += verifiedPrice * quantity;
        
        verifiedProducts.push({
          product: product._id,
          quantity: quantity,
          price: verifiedPrice
        });
      }
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
      liveLocation,
      installationRequired,
      paymentMethod: paymentMethod || 'cod',
      orderType: orderType || 'online',
      category: category || 'installation',
      notes,
      preferredDate,
      preferredTiming,
      alternatePhone,
      isWarrantyClaim,
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
    } else {
      // Auto-assign any order that does not have a specific technician or slot pre-booked
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

    // Broadcast notification to ALL technicians (only if not assigned yet)
    if (!order.technician) {
      await createNotification(req.app, {
        role: 'technician',
        type: 'new_order',
        message: `New Order Created #${order._id.toString().slice(-6)}. Open tasks to view details.`,
        orderId: order._id
      });
    }
    
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
      locationDetails, preferredDate, preferredTiming, cameraDetails,
      paymentMethod, notes, totalAmount, technicianId, warrantyPeriod,
      subtotal, gstAmount, gstPercentage, products, supportingTechnicians
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

    const validCategories = ['installation', 'service', 'maintenance', 'consultation'];
    const categoryMap = {
      'cctv installation': 'installation', 'installation': 'installation',
      'maintenance': 'maintenance', 'service': 'service', 'consultation': 'consultation'
    };
    const categoryKey = (serviceType || '').toLowerCase();
    const resolvedCategory = categoryMap[categoryKey] || 
      (validCategories.find(c => categoryKey.includes(c)) || 'service');

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
      paymentMethod: paymentMethod || 'cod',
      totalAmount: totalAmount || 0,
      subtotal: subtotal || 0,
      gstAmount: gstAmount || 0,
      gstPercentage: gstPercentage || 18,
      products: products || [],
      notes,
      cameraDetails: cameraDetails || '',
      category: resolvedCategory,
      serviceType: serviceType || 'service',
      warrantyPeriod: warrantyPeriod || '12 Months',
      status: technicianId ? 'assigned' : 'pending',
      supportingTechnicians: supportingTechnicians || [],
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
      if (!req.body.technician) {
        await autoAssignTechnician(order, req);
      }
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
router.patch('/:id/work-photo', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { type, url, audioUrl, location } = req.body; // type: 'before', 'inProgress', 'after' (maps to start, inProgress, completion)
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.technician.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized. You are not the assigned technician.' });
    }

    // Map 'before' -> 'start', 'after' -> 'completion'
    const proofType = type === 'before' ? 'start' : (type === 'after' ? 'completion' : 'inProgress');
    
    order.workProofs[proofType] = {
      url,
      audioUrl: audioUrl || undefined,
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
      await createNotification(req.app, { role: 'admin', title: 'Job Started', message: adminMsg, orderId: order._id, type: 'installation_update' });
      
      // Notify Customer
      if (order.customer) {
        const custMsg = `Your technician ${req.user.name} has started work on your Order #${order._id.toString().slice(-6)}.`;
        await createNotification(req.app, { userId: order.customer, role: 'customer', title: 'Work In Progress', message: custMsg, orderId: order._id, type: 'order_update' });
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
      await createNotification(req.app, { role: 'admin', title: 'Job Pending Approval', message: adminMsg, orderId: order._id, type: 'installation_update' });

      // Notify Customer
      if (order.customer) {
        const custMsg = `Work completed by technician ${req.user.name}. Pending final admin verification.`;
        await createNotification(req.app, { userId: order.customer, role: 'customer', title: 'Work Completed', message: custMsg, orderId: order._id, type: 'order_update' });
      }

      // Auto-generate ServiceReport metadata
      const ServiceReport = require('../models/ServiceReport');
      const startTime = order.workProofs.start ? order.workProofs.start.timestamp : order.createdAt;
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
          before: order.workProofs.start?.url,
          after: url
        },
        gpsLocation: {
          start: order.workProofs.start?.location,
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

// Technician: Accept an order from the available pool
router.patch('/pickup/:id', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ error: 'Order not found' });
    
    // Check if it's already assigned
    if (order.technician) {
      return res.status(400).send({ error: 'Order has already been picked up by another technician' });
    }

    order.technician = req.user._id;
    order.status = 'assigned';
    order.trackingTimeline.push({
      status: 'assigned',
      remarks: `Order manually accepted by ${req.user.name}`,
      timestamp: new Date()
    });

    await order.save();

    // Lock Technician
    req.user.availabilityStatus = 'Assigned';
    req.user.currentOrder = order._id;
    await req.user.save();

    // Create WorkFlow entry
    const WorkFlow = require('../models/WorkFlow');
    const workflow = new WorkFlow({
      order: order._id,
      technician: order.technician,
      stages: { assigned: { status: true, timestamp: new Date() } }
    });
    await workflow.save();

    // Create/Sync Task entry
    const Task = require('../models/Task');
    await Task.findOneAndUpdate(
      { order: order._id },
      {
        title: `Work Order #${order._id.toString().slice(-6)}`,
        customerName: order.customerName,
        customerPhone: order.contactNumber,
        description: order.notes || 'Task claimed from pool',
        assignee: req.user._id,
        status: 'Assigned',
        priority: 'medium'
      },
      { upsert: true, new: true }
    );

    // Notify ALL admins and techs that this order was accepted
    const adminsAndTechs = await User.find({ role: { $in: ['admin', 'technician'] } });
    await Promise.all(adminsAndTechs.map(async (user) => {
      // Don't notify the accepting tech in this loop
      if (user._id.toString() !== req.user._id.toString()) {
         await createNotification(req.app, {
           userId: user._id,
           role: user.role,
           type: 'system_alert',
           message: `Order #${order._id.toString().slice(-6)} was accepted by Technician ${req.user.name}.`,
           orderId: order._id
         });
      }
    }));

    // Notify Customer
    if (order.customer) {
      await createNotification(req.app, {
        userId: order.customer,
        role: 'customer',
        type: 'order_update',
        message: `Technician ${req.user.name} has been assigned to your order #${order._id.toString().slice(-6)}.`,
        orderId: order._id
      });
    }
    
    // Broadcast socket event so other tech's pools update in real time
    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: order._id, status: 'assigned' });

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
    if (req.body.adminNotes) {
      order.adminNotes = req.body.adminNotes;
    }
    
    order.trackingTimeline.push({
      status: 'completed',
      remarks: `Completion verified and approved by admin ${req.user.name}. ${req.body.adminNotes ? `Notes: ${req.body.adminNotes}` : ''}`
    });

    await order.save();
    await handleInventoryDecrement(order, req.app);

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

// Get orders based on role (Admin/Technician get all, Customer gets own) - with Pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    let query = {};
    if (!(req.user.role === 'admin' || req.user.role === 'sub-admin' || req.user.role === 'technician')) {
      query.customer = req.user._id;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer')
      .populate('products.product')
      .populate('technician')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.send({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get customer orders (with Pagination)
router.get('/my-orders', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = { customer: req.user._id };
    const total = await Order.countDocuments(query);
    
    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('products.product')
      .populate('technician', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.send({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get all orders (with Pagination and Filtering)
router.get('/all', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search;
    const status = req.query.status;

    let query = {};
    if (search) {
      query.$or = [
        { serviceType: { $regex: search, $options: 'i' } }
      ];
      // Note: searching by customer name requires aggregation or searching customer IDs first,
      // so for simplicity we filter by order details.
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('products.product', 'name price image images')
      .populate('technician', 'name phone role')
      .populate('supportingTechnicians', 'name phone role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.send({ orders, total, page, pages: Math.ceil(total / limit) });
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
      .populate('technician')
      .populate('supportingTechnicians');
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

    // Sync Task entry for Smart Multi-Technician Management
    const Task = require('../models/Task');
    await Task.findOneAndUpdate(
      { order: order._id },
      {
        title: `Work Order #${order._id.toString().slice(-6)}`,
        customerName: order.customerName,
        customerPhone: order.contactNumber,
        description: order.notes || 'Manually assigned task',
        assignee: technicianId, // Primary Technician
        status: 'Assigned',
        priority: 'medium',
        dueDate,
        timeToComplete
      },
      { upsert: true, new: true }
    );

    // Fetch Technician info for notifications and locking
    const techStatus = await User.findById(technicianId);

    // Notify Technician broadcasted to ALL technicians
    const techName = techStatus ? techStatus.name : 'a Technician';
    await createNotification(req.app, {
      role: 'technician',
      type: 'technician_assigned',
      message: `Order #${order._id.toString().slice(-6)} has been assigned to Technician ${techName}.`,
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
router.patch('/respond/:id', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
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
      // Release technician availability and unlink current order
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, { 
        availabilityStatus: 'Available',
        $unset: { currentOrder: 1 }
      });
    }

    // Notify Admins of response
    await createNotification(req.app, {
      role: 'admin',
      type: 'installation_update',
      message: `Technician ${req.user.name} has ${action}ed order #${order._id.toString().slice(-6)}`,
      orderId: order._id
    });
    
    // Broadcast to ALL technicians about the task action
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_notification', {
        title: `Task ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
        message: `Technician ${req.user.name} has ${action}ed Order #${order._id.toString().slice(-6)}`,
        role: 'technician',
        broadcastAll: true
      });
      io.emit('order_update', { orderId: order._id, status: action === 'accept' ? 'accepted' : 'pending' });
    }

    res.send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Technician: Get available (unassigned) jobs
router.get('/available-pool', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const orders = await Order.find({ 
      status: { $in: ['pending', 'confirmed'] }, 
      $or: [
        { technician: null },
        { technician: { $exists: false } }
      ]
    }).populate('customer', 'name address');
    
    // Also fetch unassigned internal tasks from Task collection
    const Task = require('../models/Task');
    const tasks = await Task.find({
      status: { $in: ['pending', 'Assigned'] },
      $or: [
        { assignee: null },
        { assignee: { $exists: false } }
      ]
    });

    const formattedTasks = tasks.map(t => ({
      _id: t._id,
      _unifiedType: 'internal',
      title: t.title,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt
    }));
    
    res.send([...orders, ...formattedTasks]);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Technician: Pickup / Self-assign a job
router.patch('/pickup/:id', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
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

    // Notify Admin of Pickup
    const admins = await User.find({ role: 'admin' });
    await Promise.all(admins.map(async (admin) => {
      await createNotification(req.app, {
        userId: admin._id,
        role: 'admin',
        type: 'system_alert',
        message: `Technician ${req.user.name} has manually picked up and accepted order #${order._id.toString().slice(-6)}.`,
        orderId: order._id
      });
    }));

    // Notify Technician themselves
    await createNotification(req.app, {
      userId: req.user._id,
      role: 'technician',
      type: 'system_alert',
      message: `You have successfully picked up order #${order._id.toString().slice(-6)}. Proceed to customer site.`,
      orderId: order._id
    });

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
    if ((order.customer && order.customer.toString() !== req.user._id.toString()) && 
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
    await handleInventoryDecrement(order, req.app);
    
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
      io.emit('new_notification', {
        title: `Work Status Update`,
        message: `Technician ${req.user.name} has marked Order #${order._id.toString().slice(-6)} as ${stage}.`,
        role: 'admin'
      });
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

// Warranty Claim Endpoint
router.post('/:id/warranty-claim', auth, async (req, res) => {
  try {
    const originalOrder = await Order.findById(req.params.id);
    if (!originalOrder) return res.status(404).send({ error: 'Order not found' });
    if (originalOrder.status !== 'completed' && originalOrder.status !== 'delivered') {
      return res.status(400).send({ error: 'Order must be completed to claim warranty.' });
    }

    const startDate = new Date(originalOrder.warrantyStartDate || originalOrder.updatedAt || originalOrder.createdAt || Date.now());
    const endDate = new Date(startDate);
    const wStr = originalOrder.warrantyPeriod || '12 Months';
    const wMatch = wStr.match(/\d+/);
    const months = wMatch ? parseInt(wMatch[0], 10) : 12;
    endDate.setMonth(endDate.getMonth() + months);

    if (new Date() > endDate) {
      return res.status(400).send({ error: 'Warranty has expired.' });
    }

    // Create the Warranty Claim Support Ticket
    const ticket = new Ticket({
      customer: originalOrder.customer,
      subject: `Warranty Claim for Order #${originalOrder.shortId || originalOrder._id.toString().slice(-6)}`,
      description: `Auto-generated warranty claim from Customer. Original order had ${originalOrder.products?.length || 0} items.`,
      category: 'Technical',
      priority: 'High',
      status: 'Open',
      orderId: originalOrder._id,
      history: [{ status: 'Open', comment: 'Warranty Claim Submitted via Orders Section' }]
    });

    await ticket.save();

    const message = `New Warranty Claim from ${req.user.name || 'Customer'} for Order #${originalOrder._id.toString().slice(-6)}`;
    
    // Notify Admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await createNotification(req.app, {
        userId: admin._id,
        role: 'admin',
        type: 'warranty_claim',
        message,
        orderId: originalOrder._id
      });
    }

    res.send({ message: 'Warranty claim processed successfully', ticket });
  } catch (error) {
    console.error('Warranty Claim Error:', error);
    res.status(500).send({ error: error.message });
  }
});

// Technician: Pause Work
router.patch('/:id/pause', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (req.user.role === 'technician' && order.technician.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized. You are not the assigned technician.' });
    }

    order.status = 'paused';
    order.pauseHistory = order.pauseHistory || [];
    order.pauseHistory.push({
      reason: reason || 'No reason provided',
      pausedAt: new Date()
    });

    order.trackingTimeline.push({
      status: 'paused',
      remarks: `Work paused by ${req.user.name}. Reason: ${reason}`
    });

    await order.save();
    
    const { createNotification } = require('../utils/notificationHelper');
    // Notify Admin
    await createNotification(req.app, {
      role: 'admin',
      type: 'order_update',
      message: `Work on order #${order._id.toString().slice(-6)} was paused by ${req.user.name}. Reason: ${reason}`,
      orderId: order._id
    });
    // Notify Customer
    if (order.customer) {
      await createNotification(req.app, {
        userId: order.customer,
        role: 'customer',
        type: 'order_update',
        message: `Work on your order #${order._id.toString().slice(-6)} has been paused. Reason: ${reason}`,
        orderId: order._id
      });
    }

    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: order._id, status: 'paused' });

    res.send(order);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Technician: Resume Work
router.patch('/:id/resume', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (req.user.role === 'technician' && order.technician.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized. You are not the assigned technician.' });
    }

    order.status = 'in_progress';
    if (order.pauseHistory && order.pauseHistory.length > 0) {
      const lastPause = order.pauseHistory[order.pauseHistory.length - 1];
      if (!lastPause.resumedAt) {
        lastPause.resumedAt = new Date();
      }
    }

    order.trackingTimeline.push({
      status: 'in_progress',
      remarks: `Work resumed by ${req.user.name}.`
    });

    await order.save();

    const { createNotification } = require('../utils/notificationHelper');
    // Notify Admin
    await createNotification(req.app, {
      role: 'admin',
      type: 'order_update',
      message: `Work on order #${order._id.toString().slice(-6)} was resumed by ${req.user.name}.`,
      orderId: order._id
    });
    // Notify Customer
    if (order.customer) {
      await createNotification(req.app, {
        userId: order.customer,
        role: 'customer',
        type: 'order_update',
        message: `Work on your order #${order._id.toString().slice(-6)} has been resumed.`,
        orderId: order._id
      });
    }
    
    const io = req.app.get('socketio');
    if (io) io.emit('order_update', { orderId: order._id, status: 'in_progress' });

    res.send(order);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Helper to release all assigned technicians
const releaseTechnicians = async (order, reqApp, cancelReason) => {
  const User = require('../models/User');
  const { createNotification } = require('../utils/notificationHelper');
  
  const techIds = [];
  if (order.technician) techIds.push({ id: order.technician, role: 'Primary' });
  if (order.supportingTechnicians?.length) {
    order.supportingTechnicians.forEach(t => techIds.push({ id: t, role: 'Secondary' }));
  }
  if (order.helpers?.length) {
    order.helpers.forEach(h => techIds.push({ id: h, role: 'Helper' }));
  }

  for (const tech of techIds) {
    const user = await User.findById(tech.id);
    if (user) {
      user.availabilityStatus = 'Available';
      if (user.currentOrder?.toString() === order._id.toString()) {
        user.currentOrder = null;
      }
      await user.save();
      
      await createNotification(reqApp, {
        userId: tech.id,
        role: 'technician',
        type: 'order_update',
        message: `Order #${order._id.toString().slice(-6)} has been cancelled (${cancelReason}). You have been released.`,
        orderId: order._id
      });
    }
  }

  order.technician = undefined;
  order.supportingTechnicians = [];
  order.helpers = [];
  
  // Trigger Auto Assign Engine for pending orders now that techs are free
  setTimeout(async () => {
    try {
      const OrderModel = require('../models/Order');
      const pendingOrders = await OrderModel.find({ status: 'pending', installationRequired: true }).sort({ createdAt: 1 }).limit(5);
      for (const po of pendingOrders) {
         // Re-trigger auto-assign logic (assuming autoAssignTechnician is globally available or defined above)
         if (typeof autoAssignTechnician === 'function') {
           await autoAssignTechnician(po, { app: reqApp });
         }
      }
    } catch(e) { console.error('Auto assign recalculation error:', e); }
  }, 1000);
};

// Customer: Cancel Order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason, feedback } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    
    // Check if customer owns the order (or allow admin to cancel on behalf)
    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
      return res.status(403).send({ message: 'Unauthorized to cancel this order.' });
    }

    // Restriction on cancellation states
    const uncancelableStates = ['in_progress', 'completed', 'delivered', 'shipped', 'testing', 'travel_started', 'reached_site'];
    if (uncancelableStates.includes(order.status)) {
      return res.status(400).send({ message: 'This order is already under execution. Please contact SK Technology support.' });
    }
    
    if (order.status === 'cancelled') {
      return res.status(400).send({ message: 'Order is already cancelled.' });
    }

    order.previousStatus = order.status;
    order.status = 'cancelled';
    order.cancellationReason = reason || 'Customer Cancelled';
    if (feedback) order.cancellationFeedback = feedback;
    order.cancelledBy = req.user._id;
    order.cancellationDate = new Date();
    order.cancellationSource = req.body.source || 'customer_web';
    
    if (order.paymentStatus === 'paid') {
      order.refundStatus = 'pending';
    }

    order.trackingTimeline.push({
      status: 'cancelled',
      remarks: `Order cancelled by ${req.user.name}. Reason: ${reason || 'N/A'}`
    });

    // Unassign all technicians
    await releaseTechnicians(order, req.app, order.cancellationReason);
    
    // Release slot if booked
    if (order.slot) {
       const Slot = require('../models/Slot');
       await Slot.findByIdAndUpdate(order.slot, { isBooked: false, order: null });
    }

    await order.save();

    // Notify Admin
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification(req.app, {
      role: 'admin',
      type: 'order_update',
      message: `Order #${order._id.toString().slice(-6)} was cancelled by ${req.user.name}. Reason: ${order.cancellationReason}`,
      orderId: order._id
    });

    // Notify Customer
    await createNotification(req.app, {
      userId: order.customer,
      role: 'customer',
      type: 'order_update',
      message: `Your order #${order._id.toString().slice(-6)} has been successfully cancelled.`,
      orderId: order._id
    });
    
    const io = req.app.get('socketio');
    if (io) io.emit('order_cancelled', { orderId: order._id, reason: order.cancellationReason });

    res.send(order);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Technician: Request Cancellation
router.post('/:id/cancel-request', auth, authorize('technician'), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    
    // Ensure the technician is assigned to this order
    const isAssigned = (order.technician?.toString() === req.user._id.toString()) || 
                       (order.supportingTechnicians?.some(t => t.toString() === req.user._id.toString())) ||
                       (order.helpers?.some(h => h.toString() === req.user._id.toString()));
                       
    if (!isAssigned) return res.status(403).send({ message: 'Unauthorized. You are not assigned to this order.' });

    order.previousStatus = order.status;
    order.status = 'cancellation_requested';
    order.cancellationReason = reason;
    order.cancelledBy = req.user._id;
    order.cancellationDate = new Date();
    order.cancellationSource = req.body.source || 'technician_app';
    
    order.trackingTimeline.push({
      status: 'cancellation_requested',
      remarks: `Cancellation requested by Technician ${req.user.name}. Reason: ${reason}`
    });

    await order.save();

    // Notify Admin
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification(req.app, {
      role: 'admin',
      type: 'order_update',
      message: `Technician ${req.user.name} requested cancellation for Order #${order._id.toString().slice(-6)}. Reason: ${reason}`,
      orderId: order._id
    });
    
    const io = req.app.get('socketio');
    if (io) io.emit('cancellation_requested', { orderId: order._id });

    res.send(order);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Admin: Approve Cancellation Request
router.patch('/:id/approve-cancel', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.status !== 'cancellation_requested') return res.status(400).send({ message: 'No cancellation request pending.' });

    order.status = 'cancelled';
    order.cancellationApprovedBy = req.user._id;
    order.cancellationDate = new Date();
    order.cancellationSource = 'admin_dashboard';
    
    if (order.paymentStatus === 'paid') {
      order.refundStatus = 'pending';
    }

    order.trackingTimeline.push({
      status: 'cancelled',
      remarks: `Cancellation request approved by Admin ${req.user.name}.`
    });

    await releaseTechnicians(order, req.app, order.cancellationReason);
    
    if (order.slot) {
       const Slot = require('../models/Slot');
       await Slot.findByIdAndUpdate(order.slot, { isBooked: false, order: null });
    }

    await order.save();
    
    const io = req.app.get('socketio');
    if (io) io.emit('cancellation_approved', { orderId: order._id });

    // Notify Customer
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification(req.app, {
      userId: order.customer,
      role: 'customer',
      type: 'order_update',
      message: `Your order #${order._id.toString().slice(-6)} has been cancelled. Reason: ${order.cancellationReason}`,
      orderId: order._id
    });

    res.send(order);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Admin: Reject Cancellation Request
router.patch('/:id/reject-cancel', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.status !== 'cancellation_requested') return res.status(400).send({ message: 'No cancellation request pending.' });

    // Restore to previous state or in_progress depending on what it was before
    order.status = order.previousStatus || 'assigned'; 
    
    order.cancellationReason = undefined;
    order.cancelledBy = undefined;
    order.cancellationDate = undefined;
    order.cancellationSource = undefined;

    order.trackingTimeline.push({
      status: 'cancellation_rejected',
      remarks: `Cancellation request rejected by Admin ${req.user.name}. Please resume work.`
    });

    await order.save();
    
    // Notify the technician
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification(req.app, {
      userId: order.cancellationRequestedBy,
      role: 'technician',
      type: 'order_update',
      message: `Your cancellation request for Order #${order._id.toString().slice(-6)} was REJECTED. Please resume work or contact Admin.`,
      orderId: order._id
    });
    
    const io = req.app.get('socketio');
    if (io) io.emit('cancellation_rejected', { orderId: order._id });

    res.send(order);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Admin: Force Cancel
router.patch('/:id/force-cancel', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { reason, feedback } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ message: 'Order not found' });

    order.previousStatus = order.status;
    order.status = 'cancelled';
    order.cancellationReason = reason || 'Admin Force Cancelled';
    if (feedback) order.cancellationFeedback = feedback;
    order.cancelledBy = req.user._id;
    order.cancellationDate = new Date();
    order.cancellationSource = 'admin_dashboard';
    
    if (order.paymentStatus === 'paid') {
      order.refundStatus = 'pending';
    }

    order.trackingTimeline.push({
      status: 'cancelled',
      remarks: `Force cancelled by Admin ${req.user.name}. Reason: ${order.cancellationReason}`
    });

    await releaseTechnicians(order, req.app, order.cancellationReason);
    
    if (order.slot) {
       const Slot = require('../models/Slot');
       await Slot.findByIdAndUpdate(order.slot, { isBooked: false, order: null });
    }

    await order.save();
    
    const io = req.app.get('socketio');
    if (io) io.emit('order_cancelled', { orderId: order._id });

    // Notify Customer
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification(req.app, {
      userId: order.customer,
      role: 'customer',
      type: 'order_update',
      message: `Your order #${order._id.toString().slice(-6)} has been cancelled by SK Technology. Reason: ${order.cancellationReason}`,
      orderId: order._id
    });

    res.send(order);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Admin: Restore Cancelled Order
router.patch('/:id/restore', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    if (order.status !== 'cancelled') return res.status(400).send({ message: 'Order is not cancelled.' });

    // Check if within 30 minutes
    if (order.cancellationDate) {
      const diffMs = new Date() - new Date(order.cancellationDate);
      if (diffMs > 30 * 60 * 1000) {
        return res.status(400).send({ message: 'Order cannot be restored after 30 minutes.' });
      }
    }

    order.status = order.previousStatus || 'pending'; // Reset to previous state
    order.cancellationReason = undefined;
    order.cancellationFeedback = undefined;
    order.cancelledBy = undefined;
    order.cancellationDate = undefined;
    order.cancellationSource = undefined;
    order.cancellationApprovedBy = undefined;
    if (order.refundStatus === 'pending') order.refundStatus = 'none';

    order.trackingTimeline.push({
      status: 'pending',
      remarks: `Order restored by Admin ${req.user.name}.`
    });

    await order.save();
    
    const io = req.app.get('socketio');
    if (io) io.emit('order_restored', { orderId: order._id });
    
    // Notify Customer
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification(req.app, {
      userId: order.customer,
      role: 'customer',
      type: 'order_update',
      message: `Your order #${order._id.toString().slice(-6)} has been restored successfully.`,
      orderId: order._id
    });

    res.send(order);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;

