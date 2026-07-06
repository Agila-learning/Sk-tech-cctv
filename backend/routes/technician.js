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
    const tasks = await WorkFlow.find({ technician: req.user._id })
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
    
    // Check if user is punched in for today (technicians only)
    if (req.user.role === 'technician') {
      const Attendance = require('../models/Attendance');
      const today = new Date().toISOString().split('T')[0];
      const record = await Attendance.findOne({ user: req.user._id, date: today });
      if (!record || !record.checkIn?.time || record.checkOut?.time) {
        return res.status(400).send({ error: 'You must be punched in to update workflow stages.' });
      }
    }
    
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

// 30-Minute Auto-Approval Timer Helper
const handleAutoApprovalTimer = (orderId, app) => {
  setTimeout(async () => {
    try {
      const Order = require('../models/Order');
      const User = require('../models/User');
      const WorkFlow = require('../models/WorkFlow');
      const { createNotification } = require('../utils/notificationHelper');

      const checkOrder = await Order.findById(orderId);
      if (checkOrder && checkOrder.status === 'pending_approval') {
        checkOrder.status = 'completed';
        checkOrder.workStatus = 'completed';
        checkOrder.completionDate = new Date();
        checkOrder.warrantyPeriod = checkOrder.warrantyPeriod || '12 Months';
        checkOrder.warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        checkOrder.warrantyStatus = 'Valid';
        checkOrder.trackingTimeline.push({
          status: 'completed',
          remarks: 'System Auto-Approval after 30 minutes of Admin inactivity. 12-Month Warranty activated.'
        });
        await checkOrder.save();

        const io = app.get('socketio');
        if (io) io.emit('order_update', { orderId: checkOrder._id, status: 'completed' });

        // Unlock Technician
        if (checkOrder.technician) {
          const tech = await User.findByIdAndUpdate(checkOrder.technician, { availabilityStatus: 'Available', currentOrder: null }, { new: true });
          
          // Auto-assign next pending order to this technician if available
          const nextOrder = await Order.findOne({ status: 'pending', technician: { $exists: false } });
          if (nextOrder) {
            nextOrder.technician = tech._id;
            nextOrder.status = 'assigned';
            nextOrder.trackingTimeline.push({
              status: 'assigned',
              remarks: `Automatically assigned to ${tech.name} after previous task completion.`
            });
            await nextOrder.save();

            tech.availabilityStatus = 'Assigned';
            tech.currentOrder = nextOrder._id;
            await tech.save();

            await WorkFlow.create({
              order: nextOrder._id,
              technician: tech._id,
              stages: { assigned: { status: true, timestamp: new Date() } }
            });

            await createNotification(app, {
              userId: tech._id,
              role: 'technician',
              type: 'technician_assigned',
              message: `New assignment for order #${nextOrder._id.toString().slice(-6)} after auto-completion`,
              orderId: nextOrder._id
            });
          }
        }

        if (checkOrder.customer) {
          await createNotification(app, {
            userId: checkOrder.customer,
            role: 'customer',
            type: 'order_update',
            message: `Your Order #${checkOrder._id.toString().slice(-6)} has been auto-verified and completed.`,
            orderId: checkOrder._id
          });
        }
      }
    } catch (err) {
      console.error('Auto Approval Timer Error:', err);
    }
  }, 30 * 60 * 1000); // 30 minutes
};

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
    const warrantyEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const order = await Order.findByIdAndUpdate(orderId, { 
      status: 'delivered', 
      workStatus: 'completed',
      warrantyPeriod: '12 Months',
      warrantyEndDate,
      warrantyStatus: 'Valid'
    }, { new: true });
    
    const booking = await Booking.findByIdAndUpdate(orderId, { status: 'completed' }, { new: true });

    const targetId = (order?._id || booking?._id || orderId).toString().slice(-6);

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

// --- Leave Request Routes ---

// Technician: Submit Leave Request
router.post('/leave-request', auth, authorize('technician'), async (req, res) => {
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
router.get('/my-leave-requests', auth, authorize('technician'), async (req, res) => {
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

module.exports = router;
