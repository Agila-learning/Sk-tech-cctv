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


// Get my direct bookings (Service-only)
router.get('/my-bookings', auth, authorize('technician'), async (req, res) => {
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
  const update = { [`stages.${stageName}`]: { status: true, timestamp: new Date(), ...data } };
  const workflow = await WorkFlow.findByIdAndUpdate(workflowId, { $set: update }, { new: true }).populate('order technician');
  
  if (Object.keys(orderUpdate).length > 0 && workflow && workflow.order) {
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
  return workflow;
};

// --- Routes ---

// Get my assignments (Active and Completed)
router.get('/my-tasks', auth, authorize('technician'), async (req, res) => {
  try {
    const tasks = await WorkFlow.find({
      $or: [
        { technician: req.user._id },
        { 'stages.accepted.status': { $ne: true } }
      ]
    })
      .populate({
        path: 'order',
        populate: [
          { path: 'products.product' },
          { path: 'customer', select: 'name phone email' },
          { path: 'dailyReports' }
        ]
      })
      .sort({ updatedAt: -1 });
    res.send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Accept Assignment
router.patch('/accept/:id', auth, authorize('technician'), async (req, res) => {
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
    const { photoUrl, lat, lng, finalize } = req.body;
    
    const photoData = photoUrl ? { url: photoUrl, coordinates: { lat, lng }, timestamp: new Date() } : undefined;
    
    let orderUpdate = {};
    if (stageName === 'started') orderUpdate = { workStatus: 'in_progress', status: 'in_progress' };
    if (stageName === 'completed' && finalize) {
      orderUpdate = { status: 'pending_approval' };
      if (req.body.followUpRequired) {
        orderUpdate.followUp = {
          required: true,
          note: req.body.followUpNote || '',
          status: 'pending'
        };
      }
    }
    if (stageName === 'reached') orderUpdate = { status: 'accepted' };

    const workflow = await updateWorkflowStage(req.params.id, stageName, { photo: photoData }, orderUpdate, req);
    
    // Socket update
    const io = req.app.get('socketio');
    if (io) io.emit('work_update', { orderId: workflow.order, status: stageName });

    res.send(workflow);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Submit Daily Progress Report (Multi-Day Workflow)
router.post('/workflow/:id/daily-report', auth, authorize('technician'), async (req, res) => {
  try {
    const { report, isFinalCompletion, followUpRequired, followUpNote } = req.body;
    const workflow = await WorkFlow.findById(req.params.id);
    if (!workflow) return res.status(404).send({ error: 'Workflow not found' });

    const order = await Order.findById(workflow.order);
    if (!order) return res.status(404).send({ error: 'Order not found' });

    if (!order.dailyReports) order.dailyReports = [];
    order.dailyReports.push(report);

    if (isFinalCompletion) {
      order.status = 'pending_approval';
      order.workStatus = 'completed';
      order.warrantyPeriod = order.warrantyPeriod || '12 Months';
      order.warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      order.warrantyStatus = 'Valid';
      order.trackingTimeline.push({ status: 'pending_approval', remarks: `Technician submitted final completion report for Day ${report.dayNumber}. 12-Month Warranty active.` });
      if (!workflow.stages) workflow.stages = {};
      workflow.stages.completed = { status: true, timestamp: new Date(), photo: { url: report.photos[0], coordinates: report.location } };
      await workflow.save();
    } else {
      order.status = 'in_progress';
      order.workStatus = 'in_progress';
      order.trackingTimeline.push({ status: 'in_progress', remarks: `Daily report submitted for Day ${report.dayNumber}: ${report.progressPercent} complete` });
    }

    await order.save();

    // Notify Admin
    const io = req.app.get('socketio');
    if (io) {
      io.emit('order_update', { orderId: order._id, status: order.status });
    }

    await createNotification(req.app, {
      role: 'admin',
      type: 'report_review',
      message: `Day ${report.dayNumber} progress report submitted for Order #${order._id.toString().slice(-6)}`,
      orderId: order._id
    });

    res.send({ message: 'Daily report submitted successfully', order, workflow });
  } catch (error) {
    console.error('Daily Report Error:', error);
    res.status(400).send({ error: error.message || 'Failed to submit daily report' });
  }
});

// Add In-Progress Photo
router.post('/workflow/:id/progress-photo', auth, authorize('technician'), async (req, res) => {
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

// Submit Daily Report (via WorkFlow ID or Order ID from mobile app)
router.post('/workflow/:id/daily-report', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { dayNumber, workDate, startTime, endTime, description, progress, remarks, photos, location } = req.body;
    
    // Resolve order ID from workflow ID or direct order ID
    let orderId = req.params.id;
    const workflow = await WorkFlow.findById(req.params.id);
    if (workflow && workflow.order) {
      orderId = workflow.order;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ message: 'Order not found for daily report submission' });
    }

    const report = new DailyReport({
      orderId,
      technicianId: req.user._id,
      dayNumber: Number(dayNumber) || 1,
      workDate: workDate || new Date(),
      startTime,
      endTime,
      description,
      progress: Number(progress) || 10,
      remarks,
      photos: photos || [],
      location
    });

    await report.save();

    // Push report to order's dailyReports array and update status if needed
    order.dailyReports.push(report._id);
    if (order.status !== 'in_progress' && order.status !== 'completed') {
      order.status = 'in_progress';
    }
    order.workStatus = 'in_progress';
    order.trackingTimeline.push({
      status: 'daily_report_submitted',
      remarks: `Day ${report.dayNumber} Progress Report submitted by ${req.user.name}: ${progress}% completed.`,
      timestamp: new Date()
    });

    await order.save();

    // Notify Admin live
    await createNotification(req.app, {
      role: 'admin',
      type: 'daily_report_submitted',
      message: `Day ${report.dayNumber} Progress Report submitted by ${req.user.name} for Order #${order._id.toString().slice(-6)} (${progress}% done).`,
      orderId: order._id
    });

    res.status(201).send(report);
  } catch (error) {
    console.error('Workflow Daily Report Submission Error:', error);
    res.status(400).send({ message: error.message || 'Failed to submit daily report' });
  }
});

// Update Live GPS
router.patch('/gps', auth, authorize('technician'), async (req, res) => {
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
    
    // Integrity Check: Prevent duplicate reports for same job
    const existingReport = await ServiceReport.findOne({ jobId });
    if (existingReport) {
      return res.status(400).send({ 
        message: 'A service report already exists for this job. Duplicate submissions are restricted.',
        reportId: existingReport._id 
      });
    }

    const reportData = { ...req.body, technicianId: req.user._id };
    const report = new ServiceReport(reportData);
    await report.save();

    const workflow = await WorkFlow.findOneAndUpdate(
      { order: req.body.jobId },
      { $set: { serviceReport: report._id } },
      { new: true }
    );

    // Attempt to update either Order or Booking
    const warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const order = await Order.findByIdAndUpdate(req.body.jobId, { 
      status: 'delivered', 
      workStatus: 'completed',
      warrantyPeriod: '12 Months',
      warrantyEndDate,
      warrantyStatus: 'Valid'
    });
    const booking = await Booking.findByIdAndUpdate(req.body.jobId, { status: 'completed' });

    const targetId = (order?._id || booking?._id || req.body.jobId).toString().slice(-6);

    // Notify Admin of Report Submission
    await createNotification(req.app, {
      role: 'admin',
      type: 'report_review',
      message: `Professional Alert: Service Report submitted for ID #${targetId}`,
      orderId: order?._id || booking?._id
    });

    res.status(201).send(report);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Performance Stats (Refined)
router.get('/stats', auth, authorize('technician'), async (req, res) => {
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

// Manually Toggle Availability Status
router.patch('/status', auth, authorize('technician'), async (req, res) => {
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

module.exports = router;
