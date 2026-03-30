const express = require('express');
const router = express.Router();
const WorkFlow = require('../models/WorkFlow');
const Order = require('../models/Order');
const ServiceReport = require('../models/ServiceReport');
const Booking = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');

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

  // Create persistent Notification for Admin/Customer
  if (req) {
    const io = req.app.get('socketio');
    let message = "";
    if (stageName === 'reached') message = `Technician ${workflow.technician.name} has arrived at Site #${workflow.order._id.toString().slice(-6)}`;
    if (stageName === 'started') message = `Installation started for Order #${workflow.order._id.toString().slice(-6)}`;
    if (stageName === 'completed') message = `Work finished by ${workflow.technician.name}. Please review our service: ${process.env.FRONTEND_URL || 'https://sk-tech-cctv.onrender.com'}/review/${workflow.order._id}`;

    if (message) {
       // Notify Admin
       await new Notification({ role: 'admin', message, orderId: workflow.order._id, type: 'installation_update' }).save();
       // Notify Customer
       await new Notification({ userId: workflow.order.customer, message, orderId: workflow.order._id, type: 'order_update' }).save();

       if (io) {
          io.emit('notification', { message, type: 'installation_update' });
          io.emit('work_update', { orderId: workflow.order._id, status: stageName });
       }
    }
  }
  return workflow;
};

// --- Routes ---

// Get my assignments (Active and Completed)
router.get('/my-tasks', auth, authorize('technician'), async (req, res) => {
  try {
    const tasks = await WorkFlow.find({ technician: req.user._id })
      .populate({
        path: 'order',
        populate: [
          { path: 'products.product' },
          { path: 'customer', select: 'name phone' }
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
    const workflow = await updateWorkflowStage(req.params.id, 'accepted', {}, { status: 'accepted' });
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
    if (stageName === 'completed' && finalize) orderUpdate = { workStatus: 'completed', status: 'completed' };
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

// Update Live GPS
router.patch('/gps', auth, authorize('technician'), async (req, res) => {
  try {
    const { lat, lng, status } = req.body;
    
    // Update all active workflows for this technician
    const workflows = await WorkFlow.find({ 
      technician: req.user._id, 
      'stages.completed.status': false 
    });

    for (let wf of workflows) {
      wf.currentLocation = { lat, lng, lastUpdate: new Date(), status };
      wf.locationHistory.push({ lat, lng, timestamp: new Date() });
      await wf.save();
    }

    // Emit to admin via socket
    const io = req.app.get('socketio');
    if (io) io.emit('gps_update', { technicianId: req.user._id, lat, lng, status });

    res.status(200).send({ message: 'GPS updated' });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Submit Service Report
router.post('/report', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const reportData = { ...req.body, technicianId: req.user._id };
    const report = new ServiceReport(reportData);
    await report.save();

    const workflow = await WorkFlow.findOneAndUpdate(
      { order: req.body.jobId },
      { $set: { serviceReport: report._id } },
      { new: true }
    );

    // Attempt to update either Order or Booking
    const order = await Order.findByIdAndUpdate(req.body.jobId, { status: 'delivered', workStatus: 'completed' });
    const booking = await Booking.findByIdAndUpdate(req.body.jobId, { status: 'completed' });

    const targetId = (order?._id || booking?._id || req.body.jobId).toString().slice(-6);

    // Notify Admin of Report Submission
    await new Notification({ 
      role: 'admin', 
      message: `Professional Alert: Service Report submitted for ID #${targetId}`, 
      orderId: order?._id || booking?._id, 
      type: 'report_review' 
    }).save();

    const io = req.app.get('socketio');
    if (io) io.emit('notification', { message: 'New Service Report Submitted', type: 'report_review' });

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

module.exports = router;
