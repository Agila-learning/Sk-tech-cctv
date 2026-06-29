const express = require('express');
const router = express.Router();
const DailyReport = require('../models/DailyReport');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// Technician submits a daily progress report
router.post('/', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { orderId, dayNumber, workDate, startTime, endTime, description, progress, remarks, photos, location } = req.body;
    
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
        // Notify Customer if completed
        if (order.customer) {
          await createNotification(req.app, {
            userId: order.customer,
            role: 'customer',
            type: 'order_update',
            message: `Your Order #${order._id.toString().slice(-6)} has achieved 100% completion and was verified by Admin.`,
            orderId: order._id
          });
        }
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
