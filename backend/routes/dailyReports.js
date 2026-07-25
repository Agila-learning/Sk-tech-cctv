const express = require('express');
const router = express.Router();
const DailyReport = require('../models/DailyReport');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

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

// Technician submits a daily progress report
router.post('/', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { orderId, dayNumber, workDate, startTime, endTime, description, progress, remarks, photos, voiceNoteUrl, location, isFinalCompletion } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }

    const report = new DailyReport({
      orderId,
      technicianId: req.user._id,
      dayNumber: Number(dayNumber) || 1,
      workDate: workDate || new Date(),
      startTime,
      endTime,
      description: description || 'Daily progress report',
      progress: Number(progress) || 10,
      remarks,
      photos: photos || [],
      voiceNoteUrl,
      location
    });

    await report.save();

    // Push report object to order's dailyReports array to avoid CastError
    order.dailyReports.push({
      dayNumber: Number(dayNumber) || 1,
      status: 'Submitted',
      photos: photos || [],
      voiceNoteUrl,
      workDescription: description || 'Daily progress update',
      issuesRemarks: remarks || '',
      progressPercent: `${progress || 10}%`,
      location: location ? { lat: location.latitude || 0, lng: location.longitude || 0, address: location.address || '' } : undefined,
      timestamp: new Date()
    });

    const isFinal = isFinalCompletion || Number(progress) >= 100;

    if (isFinal) {
      order.status = 'pending_approval';
      order.workStatus = 'completed';
      order.trackingTimeline.push({
        status: 'pending_approval',
        remarks: `Day ${report.dayNumber} Final Progress Report submitted by ${req.user.name}. Pending Admin Verification.`
      });
      
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
    }

    res.status(201).send(report);
  } catch (error) {
    console.error('Daily Report Submission Error:', error);
    res.status(400).send({ message: error.message || 'Failed to submit daily report' });
  }
});

// Get all daily reports for a specific order
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const reports = await DailyReport.find({ orderId: req.params.orderId })
      .populate('technicianId', 'name email phone profilePic')
      .sort({ dayNumber: 1, createdAt: 1 });
    res.send(reports);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Admin review daily report (Approve / Reject / Rework)
router.patch('/:id/review', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const report = await DailyReport.findByIdAndUpdate(
      req.params.id,
      { status, adminRemarks },
      { new: true }
    ).populate('orderId technicianId');

    if (!report) {
      return res.status(404).send({ message: 'Daily report not found' });
    }

    const order = await Order.findById(report.orderId._id || report.orderId);
    if (order) {
      order.trackingTimeline.push({
        status: `daily_report_${status}`,
        remarks: `Day ${report.dayNumber} Report ${status.toUpperCase()} by Admin. Remarks: ${adminRemarks || 'None'}`,
        timestamp: new Date()
      });

      if (status === 'approved' && report.progress >= 100) {
        order.status = 'completed';
        order.workStatus = 'completed';
        order.completionDate = new Date();
      }
      await order.save();
    }

    // Notify Technician live
    if (report.technicianId) {
      await createNotification(req.app, {
        userId: report.technicianId._id || report.technicianId,
        role: 'technician',
        type: status === 'approved' ? 'daily_report_approved' : 'daily_report_rejected',
        message: `Your Day ${report.dayNumber} Progress Report for Order #${order._id.toString().slice(-6)} was ${status.toUpperCase()} by Admin.`,
        orderId: order._id
      });
    }

    res.send(report);
  } catch (error) {
    console.error('Daily Report Review Error:', error);
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
