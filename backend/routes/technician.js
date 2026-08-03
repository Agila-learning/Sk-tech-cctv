const express = require('express');
const router = express.Router();
const WorkFlow = require('../models/WorkFlow');
const Order = require('../models/Order');
const ServiceReport = require('../models/ServiceReport');
const Booking = require('../models/Booking');
const DailyReport = require('../models/DailyReport');
const { auth, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');
const LeaveRequest = require('../models/LeaveRequest');

const Review = require('../models/Review');
const Salary = require('../models/Salary'); // if needed
const User = require('../models/User');

// Get real-time earnings, deductions, bonuses
router.get('/stats', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const techId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Base Pay logic (from User salary config or default)
    const user = await User.findById(techId);
    const basePay = user?.salaryConfig?.base || 15000;

    // Fetch workflows/orders completed this month
    const completedWorkflows = await WorkFlow.find({
      technician: techId,
      'stages.completed.status': true,
      updatedAt: { $gte: startOfMonth }
    }).populate('order');

    // Fetch reviews for quality rating
    const reviews = await Review.find({ 
      technician: techId, 
      createdAt: { $gte: startOfMonth } 
    });

    let incentives = 0;
    let bonus = 0;
    let deductions = 0;
    
    // Basic logic: 
    // 50 Rs incentive for every job completed.
    incentives = completedWorkflows.length * 50;

    // Bonus: If average rating > 4.5 and more than 5 jobs done, 1000 Rs bonus
    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      if (avgRating >= 4.5 && completedWorkflows.length >= 5) {
        bonus = 1000;
      }
    }

    // Deductions: 100 Rs per job that took more than 5 hours (assuming we have timestamps, but simplified here)
    // For now, let's just make a mock deduction if rating < 3
    const badReviews = reviews.filter(r => r.rating < 3).length;
    deductions = badReviews * 200;

    const totalEarnings = basePay + incentives + bonus - deductions;

    res.send({
      basePay,
      bonus,
      incentives,
      deductions,
      totalEarnings,
      jobsCompleted: completedWorkflows.length,
      avgRating: avgRating.toFixed(1)
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Get my direct bookings (Service-only)
router.get('/my-bookings', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const bookings = await Booking.find({ technician: req.user._id, status: { $ne: 'completed' } })
      .populate('customer', 'name phone email')
      .sort({ scheduledDate: 1 });
    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});

// --- Helper for Workflow Updates ---
const updateWorkflowStage = async (workflowId, stageName, data, orderUpdate = {}, req = null) => {
  const schemaStage = (stageName === 'started' || stageName === 'resume') ? 'inProgress' : 
                      (stageName === 'reached') ? 'reachedSite' : stageName;
  const update = { [`stages.${schemaStage}`]: { status: true, timestamp: new Date(), ...data } };
  let workflow = await WorkFlow.findByIdAndUpdate(workflowId, { $set: update }, { new: true }).populate('order technician');
  
  if (!workflow) {
    const Booking = require('../models/Booking');
    const booking = await Booking.findByIdAndUpdate(workflowId, { status: orderUpdate.status || 'in_progress' }, { new: true }).populate('customer technician');
    if (booking) {
      // Mock workflow for bookings
      workflow = {
        _id: booking._id,
        technician: booking.technician,
        order: { _id: booking._id, customer: booking.customer }
      };
    }
  } else if (Object.keys(orderUpdate).length > 0 && workflow.order) {
    await Order.findByIdAndUpdate(workflow.order._id, orderUpdate);
  }

  // Create persistent Notification for Admin/Customer with targeted socket delivery
  if (req && workflow && workflow.order && workflow.technician) {
    const io = req.app.get('socketio');
    let adminMessage = "";
    let customerMessage = "";
    let adminTitle = "";
    let customerTitle = "";

    if (stageName === 'accepted') {
      adminMessage = `Technician ${workflow.technician.name} has accepted Order #${workflow.order._id.toString().slice(-6)}`;
      customerMessage = `Your Order #${workflow.order._id.toString().slice(-6)} has been accepted by technician ${workflow.technician.name}. They will arrive at the scheduled time.`;
      adminTitle = 'Order Accepted';
      customerTitle = 'Technician Assigned';
    }
    if (stageName === 'reached') {
      adminMessage = `Technician ${workflow.technician.name} has arrived at Site for Order #${workflow.order._id.toString().slice(-6)}`;
      customerMessage = `Your technician has arrived at your location for Order #${workflow.order._id.toString().slice(-6)}`;
      adminTitle = 'Technician Arrived';
      customerTitle = 'Your Technician is Here';
    }
    if (stageName === 'started') {
      adminMessage = `Job Started: Installation in progress for Order #${workflow.order._id.toString().slice(-6)} by ${workflow.technician.name}`;
      customerMessage = `Work has started on your Order #${workflow.order._id.toString().slice(-6)}. Your technician is now on-site.`;
      adminTitle = 'Job Started';
      customerTitle = 'Work In Progress';
    }
    if (stageName === 'completed') {
      adminMessage = `Work completed by ${workflow.technician.name} for Order #${workflow.order._id.toString().slice(-6)}. Pending admin review.`;
      customerMessage = `Service completed for Order #${workflow.order._id.toString().slice(-6)}. Thank you for choosing SK Technology!`;
      adminTitle = 'Job Completed';
      customerTitle = 'Service Completed';
    }

    if (adminMessage) {
      await createNotification(req.app, {
        role: 'admin',
        type: stageName === 'reached' ? 'technician_arrived' : stageName === 'started' ? 'work_started' : 'technician_update',
        message: adminMessage,
        orderId: workflow.order._id
      });
    }

    if (customerMessage && workflow.order.customer) {
      await createNotification(req.app, {
        userId: workflow.order.customer,
        role: 'customer',
        type: stageName === 'reached' ? 'technician_arrived' : stageName === 'started' ? 'work_started' : 'order_update',
        message: customerMessage,
        orderId: workflow.order._id
      });
    }
  }

  // Recalculate Technician Availability Status
  if (workflow && workflow.technician) {
    const techId = typeof workflow.technician === 'object' ? workflow.technician._id : workflow.technician;
    const User = require('../models/User');
    const user = await User.findById(techId);
    if (user) {
      const activeTasks = await WorkFlow.countDocuments({
        technician: techId,
        'stages.completed.status': { $ne: true }
      });
      let newStatus = 'Offline';
      if (user.isOnline) {
        newStatus = activeTasks > 0 ? 'Busy' : 'Available';
      }
      if (user.availabilityStatus !== newStatus) {
        user.availabilityStatus = newStatus;
        await user.save();
        if (req && req.app.get('socketio')) {
          req.app.get('socketio').emit('availability_change', {
            userId: user._id,
            isOnline: user.isOnline,
            availabilityStatus: user.availabilityStatus,
            activeTasks
          });
          
          if (newStatus === 'Available') {
             await createNotification(req.app, {
               role: 'admin',
               type: 'technician_available',
               message: `Technician ${user.name} has completed tasks and is now Available.`
             });
          }
        }
      }
    }
  }

  return workflow;
};

// --- Routes ---

// Get my assignments (Active and Completed)
router.get('/my-tasks', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    // Update lastActive timestamp
    await require('../models/User').findByIdAndUpdate(req.user._id, { lastActive: new Date() });

    const orders = await Order.find({
      $or: [
        { technician: req.user._id },
        { supportingTechnicians: req.user._id }
      ]
    }).select('_id');
    const orderIds = orders.map(o => o._id);

    const tasks = await WorkFlow.find({ order: { $in: orderIds } })
      .populate({
        path: 'order',
        populate: [
          { path: 'products.product' },
          { path: 'customer', select: 'name phone email' },
          { path: 'warranty' },
          { path: 'supportingTechnicians', select: 'name' }
        ]
      })
      .populate('technician', 'name')
      .sort({ 'stages.assigned.timestamp': -1 });
      
    res.send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Accept Assignment
router.patch('/accept/:id', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const workflow = await updateWorkflowStage(req.params.id, 'accepted', {}, { status: 'accepted' }, req);
    res.send(workflow);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Generic Stage Update (Reached, Started, Completed) with Photo/GPS
router.patch('/workflow/:id/stage/:stageName', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { stageName } = req.params;
    const { photoUrl, lat, lng, finalize, reason, remarks } = req.body;
    
    // Support new FSM Multi-Day Workflow
    // Assigned -> Accepted -> Travel Started -> Reached Site -> Work Started -> Paused -> Resume -> Testing -> Completed
    
    let orderUpdate = {};
    let statusText = '';
    
    if (stageName === 'accepted') {
      orderUpdate = { status: 'accepted' };
      statusText = 'Accepted assignment';
    } else if (stageName === 'travel_started') {
      orderUpdate = { status: 'travel_started' };
      statusText = 'Travel started';
    } else if (stageName === 'reached') {
      orderUpdate = { status: 'reached_site' };
      statusText = 'Reached site';
    } else if (stageName === 'started' || stageName === 'resume') {
      orderUpdate = { status: 'in_progress', workStatus: 'in_progress' };
      statusText = stageName === 'resume' ? `Work resumed` : 'Work started';
    } else if (stageName === 'testing') {
      orderUpdate = { status: 'testing' };
      statusText = 'Testing phase started';
    } else if (stageName === 'waiting_for_material') {
      orderUpdate = { status: 'waiting_for_material' };
      statusText = 'Waiting for material';
    } else if (stageName === 'waiting_for_customer') {
      orderUpdate = { status: 'waiting_for_customer' };
      statusText = 'Waiting for customer';
    } else if (stageName === 'paused') {
      orderUpdate = { status: 'paused', workStatus: 'on_hold' };
      statusText = `Paused: ${reason || 'No reason provided'}`;
    } else if (stageName === 'completed' && finalize) {
      if (!req.body.notes && !remarks) {
        return res.status(400).send({ error: 'Notes/Report is mandatory for completion.' });
      }
      orderUpdate = { status: 'pending_admin_approval', workStatus: 'pending_approval' };
      statusText = 'Work completed, pending admin approval';
    } else {
      orderUpdate = { status: 'in_progress' };
      statusText = `Stage update: ${stageName}`;
    }

    const workflow = await updateWorkflowStage(req.params.id, stageName, { photo: photoUrl ? { url: photoUrl } : undefined, notes: req.body.notes || remarks }, orderUpdate, req);
    
    // Add to timeline
    const orderId = workflow.order._id || workflow.order;
    const updateObj = {
      $push: {
        trackingTimeline: {
          status: orderUpdate.status || stageName,
          remarks: statusText,
          timestamp: new Date()
        }
      }
    };
    
    if (stageName === 'paused') {
      updateObj.$push.pauseHistory = {
        reason: reason || 'Unknown',
        pausedAt: new Date()
      };
    } else if (stageName === 'resume') {
      // Find last pause without resume
      const currentOrder = await Order.findById(orderId);
      if (currentOrder && currentOrder.pauseHistory && currentOrder.pauseHistory.length > 0) {
        const lastPause = currentOrder.pauseHistory[currentOrder.pauseHistory.length - 1];
        if (!lastPause.resumedAt) {
          lastPause.resumedAt = new Date();
          lastPause.resumedRemarks = remarks;
          await currentOrder.save();
        }
      }
    }

    await Order.findByIdAndUpdate(orderId, updateObj);

    // Socket update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('work_update', { orderId: orderId, status: stageName });
      
      if (stageName === 'started' || stageName === 'resume') {
        io.emit('new_notification', {
          title: `Work ${stageName === 'resume' ? 'Resumed' : 'Started'}`,
          message: `Technician ${req.user.name} has ${stageName === 'resume' ? 'resumed' : 'started'} work on Order #${orderId.toString().slice(-6)}.`,
          role: 'technician',
          broadcastAll: true
        });
      }
    }

    if (stageName === 'started' || stageName === 'resume') {
      await createNotification(req.app, {
        role: 'admin',
        type: 'work_started',
        message: `Technician ${req.user.name} has ${stageName === 'resume' ? 'resumed' : 'started'} work on Order #${orderId.toString().slice(-6)}.`,
        orderId: orderId
      });
    }

    res.send(workflow);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Toggle Pause/Resume
router.patch('/workflow/:id/toggle-pause', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { action, reason } = req.body;
    let orderUpdate = {};
    let statusText = '';
    
    if (action === 'pause') {
      orderUpdate = { status: 'on_hold', workStatus: 'on_hold' };
      statusText = `Task paused. Reason: ${reason || 'Not provided'}`;
    } else {
      orderUpdate = { status: 'in_progress', workStatus: 'in_progress' };
      statusText = `Task resumed.`;
    }

    const workflow = await updateWorkflowStage(req.params.id, 'inProgress', { notes: statusText }, orderUpdate, req);
    
    // Add explicitly to Order timeline
    const Order = require('../models/Order');
    await Order.findByIdAndUpdate(workflow.order, {
      $push: {
        trackingTimeline: {
          status: orderUpdate.status,
          remarks: statusText,
          timestamp: new Date()
        }
      }
    });

    res.send(workflow);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Add In-Progress Photo
router.post('/workflow/:id/progress-photo', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { photoUrl, lat, lng } = req.body;
    const workflow = await WorkFlow.findByIdAndUpdate(req.params.id, {
      $push: { 'stages.inProgress.photos': { url: photoUrl, coordinates: { lat, lng }, timestamp: new Date() } },
      $set: { 'stages.inProgress.status': true, 'stages.inProgress.timestamp': new Date() }
    }, { new: true });
    res.send(workflow);
  } catch (error) {
    res.status(400).send(error);
  }
});

// --- Mini Tasks (FSM) ---
router.post('/order/:orderId/mini-task', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const MiniTask = require('../models/MiniTask');
    const task = new MiniTask({
      orderId: req.params.orderId,
      ...req.body
    });
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.patch('/mini-task/:taskId', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const MiniTask = require('../models/MiniTask');
    const task = await MiniTask.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
    
    // Automatically update order progress if all mini tasks are completed?
    // We can do that via daily report progress instead.
    
    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/order/:orderId/mini-tasks', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const MiniTask = require('../models/MiniTask');
    const tasks = await MiniTask.find({ orderId: req.params.orderId }).populate('assignedTo', 'name');
    res.send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Submit Daily Report & Final Completion (via WorkFlow ID or Order ID)
router.post('/workflow/:id/daily-report', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { dayNumber, workDate, startTime, endTime, description, progress, remarks, photos, location, isFinalCompletion, report } = req.body;
    
    // Resolve order ID from workflow ID or direct order ID
    let orderId = req.params.id;
    let workflow = await WorkFlow.findById(req.params.id);
    if (workflow && workflow.order) {
      orderId = workflow.order;
    } else {
      workflow = await WorkFlow.findOne({ order: req.params.id });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ message: 'Order not found for daily report submission' });
    }

    const reportObj = report || {
      dayNumber: Number(dayNumber) || (order.dailyReports?.length || 0) + 1,
      status: 'Submitted',
      photos: photos || [],
      workDescription: description || 'Daily progress update',
      issuesRemarks: remarks || '',
      progressPercent: `${progress || 10}%`,
      location: location ? { lat: location.latitude || 0, lng: location.longitude || 0, address: location.address || '' } : undefined,
      timestamp: new Date()
    };

    if (!order.dailyReports) order.dailyReports = [];
    if (!isFinalCompletion || report) {
      order.dailyReports.push(reportObj);
    }

    const isFinal = isFinalCompletion || Number(progress) >= 100;

    if (isFinal) {
      order.status = 'pending_approval';
      order.workStatus = 'completed';
      order.trackingTimeline.push({
        status: 'pending_approval',
        remarks: `Day ${reportObj.dayNumber} Final Progress Report submitted by ${req.user.name}. Pending Admin Verification.`
      });
      
      if (workflow) {
        if (!workflow.stages) workflow.stages = {};
        workflow.stages.completed = { status: true, timestamp: new Date(), photo: { url: reportObj.photos?.[0] || '', coordinates: reportObj.location } };
        await workflow.save();
      }
      
      await order.save();

      const io = req.app.get('socketio');
      if (io) io.emit('order_update', { orderId: order._id, status: 'pending_approval' });

      // Notify Admin live
      await createNotification(req.app, {
        role: 'admin',
        type: 'daily_report_submitted',
        message: `Work COMPLETED by ${req.user.name} for Order #${order._id.toString().slice(-6)}. Pending your approval.`,
        orderId: order._id
      });

      // Notify Customer live
      if (order.customer) {
        await createNotification(req.app, {
          userId: order.customer,
          role: 'customer',
          type: 'order_update',
          message: `Technician has completed the work for Order #${order._id.toString().slice(-6)}. Currently pending final verification by Admin.`,
          orderId: order._id
        });
      }

      // Start 30-minute auto-approval timer
      handleAutoApprovalTimer(order._id, req.app);

    } else {
      if (order.status !== 'in_progress' && order.status !== 'completed') {
        order.status = 'in_progress';
      }
      order.workStatus = 'in_progress';
      order.trackingTimeline.push({
        status: 'daily_report_submitted',
        remarks: `Day ${reportObj.dayNumber} Progress Report submitted by ${req.user.name}: ${progress || 10}% completed.`,
        timestamp: new Date()
      });

      await order.save();

      // Notify Admin live
      await createNotification(req.app, {
        role: 'admin',
        type: 'daily_report_submitted',
        message: `Day ${reportObj.dayNumber} Progress Report submitted by ${req.user.name} for Order #${order._id.toString().slice(-6)} (${progress || 10}% done).`,
        orderId: order._id
      });
    }

    res.status(201).send({ message: 'Daily report submitted successfully', order, workflow, report: reportObj });
  } catch (error) {
    console.error('Workflow Daily Report Submission Error:', error);
    res.status(400).send({ message: error.message || 'Failed to submit daily report' });
  }
});

// Update Live GPS
router.patch('/gps', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { lat, lng, heading, status } = req.body;
    
    // 1. Update Global Technician Location in User Model
    await req.user.updateOne({
      $set: { 
        'location.lat': lat, 
        'location.lng': lng, 
        'location.updatedAt': new Date() 
      }
    });

    // 2. Update all active workflows for this technician
    const workflows = await WorkFlow.find({ 
      technician: req.user._id, 
      'stages.completed.status': false 
    });

    for (let wf of workflows) {
      wf.currentLocation = { lat, lng, heading, lastUpdate: new Date(), status };
      wf.locationHistory.push({ lat, lng, heading, timestamp: new Date() });
      await wf.save();
    }

    // Emit to admin via socket
    const io = req.app.get('socketio');
    if (io) io.emit('gps_update', { technicianId: req.user._id, lat, lng, heading, status });

    res.status(200).send({ message: 'Location Update Successful' });
  } catch (error) {
    console.error("GPS Route Error:", error);
    res.status(400).send(error);
  }
});

// Submit Service Report
router.post('/report', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { jobId } = req.body;
    
    // Resolve order ID from workflow ID or direct order ID
    let orderId = jobId;
    let workflow = await WorkFlow.findById(jobId);
    if (workflow && workflow.order) {
      orderId = workflow.order;
    } else {
      workflow = await WorkFlow.findOne({ order: jobId });
    }
    
    // Integrity Check: Prevent duplicate reports for same job
    const existingReport = await ServiceReport.findOne({ jobId: orderId });
    if (existingReport) {
      return res.status(400).send({ 
        message: 'A service report already exists for this job. Duplicate submissions are restricted.',
        reportId: existingReport._id 
      });
    }

    const reportData = { ...req.body, jobId: orderId, technicianId: req.user._id };
    const report = new ServiceReport(reportData);
    await report.save();

    if (workflow) {
      workflow.serviceReport = report._id;
      if (!workflow.stages) workflow.stages = {};
      if (!workflow.stages.completed) workflow.stages.completed = { status: true, timestamp: new Date() };
      workflow.stages.completed.status = true;
      await workflow.save();
    }

    // Attempt to update either Order or Booking
    const order = await Order.findByIdAndUpdate(orderId, { 
      status: 'pending_approval', 
      workStatus: 'pending_approval'
    }, { new: true });
    
    const booking = await Booking.findByIdAndUpdate(orderId, { status: 'pending_approval' }, { new: true });

    const targetId = (order?._id || booking?._id || orderId).toString().slice(-6);

    // Notify Admin of Report Submission
    await createNotification(req.app, {
      role: 'admin',
      type: 'report_review',
      message: `Professional Alert: Service Report submitted for ID #${targetId}`,
      orderId: order?._id || booking?._id
    });

    // Notify Customer if Tech recommends a review
    if (req.body.recommendReview && (order || booking)?.customer) {
      await createNotification(req.app, {
        userId: (order || booking).customer,
        role: 'customer',
        type: 'review_request',
        message: `Your technician has requested a review for the recent service. Please share your feedback!`,
        orderId: (order || booking)._id
      });
    }

    res.status(201).send(report);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Performance Stats (Refined)
router.get('/stats', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const workflows = await WorkFlow.find({ technician: req.user._id });
    const completed = workflows.filter(w => w.stages?.completed?.status).length;
    
    // Earnings calculation (example: 2500 per job)
    const weeklyEarnings = completed * 2500; 

    res.send({
      weeklyEarnings: `₹${weeklyEarnings.toLocaleString()}`,
      SystemsScore: `4.9/5`,
      TechniciansSecured: completed.toString(),
      responseTime: '18m',
      totalJobs: workflows.length,
      completedJobs: completed,
      pendingJobs: workflows.length - completed
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/earnings', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    // Find all completed workflows
    const workflows = await WorkFlow.find({ technician: req.user._id })
      .populate({
        path: 'order',
        populate: [
          { path: 'products.product' },
          { path: 'customer', select: 'name phone email' }
        ]
      });

    // Also find bookings or internal tasks if necessary
    const InternalTask = require('../models/InternalTask');
    const internalTasks = await InternalTask.find({ 
      assignedTo: req.user._id, 
      status: 'completed' 
    });

    const Booking = require('../models/Booking');
    const bookings = await Booking.find({
      assignedTo: req.user._id,
      status: 'completed'
    });

    let basePay = 0;
    let bonus = 0;
    let deductions = 0;
    let transactions = [];

    // Calculate earnings from Workflows
    workflows.forEach(w => {
      if (w.stages?.completed?.status) {
        const pay = 2500; // Base pay per installation
        basePay += pay;
        // Add some dynamic bonus based on on-time completion or rating if available
        const jobBonus = 250; 
        bonus += jobBonus;

        transactions.push({
          id: w._id,
          date: w.stages.completed.timestamp,
          title: `Order Installation #${(w.order && w.order._id) ? w.order._id.toString().slice(-6) : w._id.toString().slice(-6)}`,
          type: 'Base Pay',
          amount: pay + jobBonus,
          status: 'Cleared'
        });
      }
    });

    // Calculate earnings from Internal Tasks
    internalTasks.forEach(t => {
      const pay = 500; // Base pay for internal tasks
      basePay += pay;
      transactions.push({
        id: t._id,
        date: t.updatedAt,
        title: `Internal Task: ${t.title}`,
        type: 'Internal Task',
        amount: pay,
        status: 'Cleared'
      });
    });

    // Calculate earnings from Bookings
    bookings.forEach(b => {
      const pay = 1500; // Base pay for offline service/warranty
      basePay += pay;
      transactions.push({
        id: b._id,
        date: b.updatedAt,
        title: `Service/Warranty #${b._id.toString().slice(-6)}`,
        type: 'Service Pay',
        amount: pay,
        status: 'Cleared'
      });
    });

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.send({
      basePay,
      bonus,
      deductions,
      netEarnings: basePay + bonus - deductions,
      transactions
    });
  } catch (error) {
    console.error("Earnings Error:", error);
    res.status(500).send(error);
  }
});

// Manually Toggle Availability Status
router.patch('/status', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    // Capitalize correctly to match other state injections (e.g., 'Available', 'Offline')
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    // Update both availabilityStatus and isOnline persistently
    const isOnline = normalizedStatus === 'Available';
    
    // Prevent becoming available if assigned to an active workflow
    if (normalizedStatus === 'Available') {
      const Order = require('../models/Order');
      const activeJob = await Order.findOne({
        technician: req.user._id,
        status: { $in: ['assigned', 'accepted', 'dispatched', 'reached', 'in_progress', 'pending_approval', 'rework'] }
      });
      if (activeJob) {
        return res.status(400).send({ message: 'Cannot become available while assigned to an active job.' });
      }
    }
    
    const user = await req.user.updateOne({ 
      $set: { 
        availabilityStatus: normalizedStatus,
        isOnline: isOnline
      } 
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('user_status_change', { userId: req.user._id, status: isOnline ? 'online' : 'offline' });
    }

    res.send({ message: `Status updated to ${normalizedStatus}`, user });
  } catch (error) {
    res.status(400).send(error);
  }
});

// --- Leave Request Routes ---

// Technician: Submit Leave Request
router.post('/leave-request', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const leave = new LeaveRequest({
      technician: req.user._id,
      startDate,
      endDate,
      reason
    });
    await leave.save();

    // Notify Admin
    await createNotification(req.app, {
      role: 'admin',
      type: 'technician_update',
      message: `New Leave Request submitted by technician ${req.user.name} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`
    });

    res.status(201).send(leave);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Technician: Get My Leave Requests
router.get('/my-leave-requests', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ technician: req.user._id }).sort({ createdAt: -1 });
    res.send(leaves);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get All Leave Requests
router.get('/leave-requests/all', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const leaves = await LeaveRequest.find().populate('technician', 'name phone email').sort({ createdAt: -1 });
    res.send(leaves);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Update Leave Request Status
router.patch('/leave-request/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const leave = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminRemarks },
      { new: true }
    ).populate('technician', 'name');

    if (!leave) return res.status(404).send({ error: 'Leave request not found' });

    // Notify Technician
    await createNotification(req.app, {
      userId: leave.technician._id,
      role: 'technician',
      type: 'technician_update',
      message: `Your leave request for ${new Date(leave.startDate).toLocaleDateString()} has been ${status}. ${adminRemarks ? `Remarks: ${adminRemarks}` : ''}`
    });

    res.send(leave);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Manual Online / Offline Toggle
router.post('/toggle-online', auth, authorize('technician', 'admin', 'sub-admin', 'team-leader'), async (req, res) => {
  try {
    const { isOnline } = req.body;
    const user = req.user;

    // Check if the user has active tasks
    const activeTasks = await WorkFlow.countDocuments({
      technician: user._id,
      'stages.completed.status': { $ne: true }
    });

    let newStatus = 'Offline';
    if (isOnline) {
      newStatus = activeTasks > 0 ? 'Busy' : 'Available';
    }

    const updatedUser = await require('../models/User').findByIdAndUpdate(
      user._id,
      { isOnline, availabilityStatus: newStatus },
      { new: true }
    );

    // Broadcast the status change in real time
    const io = req.app.get('socketio');
    if (io) {
      io.emit('availability_change', {
        userId: updatedUser._id,
        isOnline: updatedUser.isOnline,
        availabilityStatus: updatedUser.availabilityStatus,
        activeTasks
      });
    }

    res.send({ isOnline: updatedUser.isOnline, availabilityStatus: updatedUser.availabilityStatus });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
