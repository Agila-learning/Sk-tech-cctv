const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Slot = require('../models/Slot');
const LeaveRequest = require('../models/LeaveRequest');
const WorkFlow = require('../models/WorkFlow');
const Order = require('../models/Order');
const TechnicianSchedule = require('../models/TechnicianSchedule');
const { auth, authorize } = require('../middleware/auth');

// ─── Helper: Check if a time overlaps with an existing slot ───────────────────
const timeOverlaps = (aStart, aEnd, bStart, bEnd) => {
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return toMin(aStart) < toMin(bEnd) && toMin(aEnd) > toMin(bStart);
};

// ─── GET /availability/technicians ───────────────────────────────────────────
// Returns all technicians with their availability status for a specific date+time slot
// Query: date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM), skill, area
router.get('/technicians', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { date, startTime, endTime, skill, area } = req.query;

    // Fetch all active technicians with case-insensitive filters
    const techQuery = { role: 'technician' };
    if (skill) techQuery.skills = { $in: [new RegExp(skill, 'i')] };
    if (area) techQuery.zone = { $regex: new RegExp(area, 'i') };
    const technicians = await User.find(techQuery, 'name email phone skills zone rating');

    // Build result with availability status for each technician
    const results = await Promise.all(technicians.map(async (tech) => {
      let status = 'available';
      let reason = null;

      if (date && startTime && endTime) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        // 1. Check if on approved leave
        const leave = await LeaveRequest.findOne({
          user: tech._id,
          status: 'approved',
          startDate: { $lte: dayEnd },
          endDate: { $gte: dayStart }
        });
        if (leave) { status = 'on_leave'; reason = 'Approved Leave'; }

        if (status === 'available') {
          // 2. Check slot conflict
          const conflictingSlot = await Slot.findOne({
            technician: tech._id,
            date: { $gte: dayStart, $lte: dayEnd },
            isBooked: true
          });
          if (conflictingSlot && timeOverlaps(startTime, endTime, conflictingSlot.startTime, conflictingSlot.endTime)) {
            status = 'booked';
            reason = `Already booked: ${conflictingSlot.startTime} - ${conflictingSlot.endTime}`;
          }
        }

        if (status === 'available') {
          // 3. Check if in an ongoing job today
          const activeWorkflow = await WorkFlow.findOne({
            technician: tech._id,
            'stages.completed.status': false,
            'stages.accepted.status': true
          }).populate('order');
          if (activeWorkflow) {
            status = 'busy';
            reason = `Busy: In progress on Order #${activeWorkflow.order?._id?.toString().slice(-6)}`;
          }
        }
      }

      // Count today's jobs
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const todaySlots = await Slot.countDocuments({ technician: tech._id, date: { $gte: todayStart, $lte: todayEnd }, isBooked: true });

      // Get upcoming jobs  
      const upcomingSlots = await Slot.find({ technician: tech._id, date: { $gte: new Date() }, isBooked: true })
        .sort({ date: 1, startTime: 1 }).limit(3).populate('order', '_id');

      return {
        _id: tech._id,
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        skills: tech.skills || [],
        zone: tech.zone,
        rating: tech.rating || 5,
        status,
        reason,
        todayJobCount: todaySlots,
        upcomingSlots: upcomingSlots.map(s => ({
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          orderId: s.order
        }))
      };
    }));

    // Sort: available first, then busy, then booked, then on_leave
    const sortOrder = { available: 0, busy: 1, booked: 2, on_leave: 3 };
    results.sort((a, b) => (sortOrder[a.status] || 99) - (sortOrder[b.status] || 99));

    res.json(results);
  } catch (error) {
    console.error('Availability fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /availability/summary ────────────────────────────────────────────────
// Returns live counts: total, available now, busy, on_leave
router.get('/summary', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }, '_id');
    const total = technicians.length;

    const now = new Date();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

    let onLeave = 0, busyNow = 0;

    await Promise.all(technicians.map(async (tech) => {
      // 1. Check Approved Leave
      const leave = await LeaveRequest.findOne({
        user: tech._id, status: 'approved',
        startDate: { $lte: todayEnd }, endDate: { $gte: todayStart }
      });
      if (leave) { onLeave++; return; }

      // 2. Check overlap with current time (Busy Now)
      const bookedSlot = await Slot.findOne({ 
        technician: tech._id, 
        date: { $gte: todayStart, $lte: todayEnd }, 
        isBooked: true 
      });
      
      if (bookedSlot && timeOverlaps(currentTime, currentTime, bookedSlot.startTime, bookedSlot.endTime)) {
        busyNow++;
        return;
      }
      
      // 3. Check if in an active workflow (Busy Now)
      const activeJob = await WorkFlow.findOne({
        technician: tech._id,
        'stages.completed.status': false,
        'stages.accepted.status': true
      });
      if (activeJob) {
        busyNow++;
        return;
      }
    }));

    const availableNow = total - onLeave - busyNow;

    res.json({ total, availableNow: Math.max(0, availableNow), busyNow, onLeave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /availability/conflicts/:technicianId ────────────────────────────────
// Check if a specific technician has a conflict for a given date+time
router.get('/conflicts/:technicianId', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'date, startTime, endTime are required' });
    }

    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    // Check leave
    const leave = await LeaveRequest.findOne({
      user: req.params.technicianId, status: 'approved',
      startDate: { $lte: dayEnd }, endDate: { $gte: dayStart }
    });
    if (leave) {
      return res.json({ hasConflict: true, reason: 'Technician is on approved leave', type: 'on_leave' });
    }

    // Check slot conflict
    const slots = await Slot.find({ technician: req.params.technicianId, date: { $gte: dayStart, $lte: dayEnd }, isBooked: true });
    const conflict = slots.find(s => timeOverlaps(startTime, endTime, s.startTime, s.endTime));
    if (conflict) {
      return res.json({
        hasConflict: true,
        reason: `Already booked from ${conflict.startTime} to ${conflict.endTime}`,
        type: 'already_booked',
        conflictSlot: { startTime: conflict.startTime, endTime: conflict.endTime }
      });
    }

    // Check ongoing job
    const activeJob = await WorkFlow.findOne({
      technician: req.params.technicianId,
      'stages.completed.status': false,
      'stages.accepted.status': true
    });
    if (activeJob) {
      return res.json({ hasConflict: true, reason: 'Technician is currently on an active job', type: 'in_job' });
    }

    res.json({ hasConflict: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /availability/assign ─────────────────────────────────────────────────
// Assign a technician to an order — validates availability and blocks the slot
router.post('/assign', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { orderId, technicianId, date, startTime, endTime } = req.body;
    if (!orderId || !technicianId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'orderId, technicianId, date, startTime, endTime are required' });
    }

    // Validate and fix orderId if shortId passed
    let finalOrderId = orderId;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      // Robust Short ID lookup
      const sid = orderId.toString().toUpperCase();
      const orderSearch = await Order.findOne({ shortId: sid });
      if (!orderSearch) {
        // Log for debugging
        console.warn(`[Assignment] No order found for ShortID: ${sid}`);
        return res.status(400).json({ message: `Invalid Order ID and no matching Short ID found for "${orderId}"` });
      }
      finalOrderId = orderSearch._id;
    }

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({ message: 'Invalid Technician ID format' });
    }

    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    // Re-validate conflict before assigning
    const leave = await LeaveRequest.findOne({
      user: technicianId, status: 'approved',
      startDate: { $lte: dayEnd }, endDate: { $gte: dayStart }
    });
    if (leave) return res.status(409).json({ message: 'Technician is on approved leave for this date.' });

    const slots = await Slot.find({ technician: technicianId, date: { $gte: dayStart, $lte: dayEnd }, isBooked: true });
    const conflict = slots.find(s => timeOverlaps(startTime, endTime, s.startTime, s.endTime));
    if (conflict) {
      return res.status(409).json({
        message: `Technician not available for this slot. Already booked from ${conflict.startTime} to ${conflict.endTime}. Please assign another technician.`
      });
    }

    // Create or update the slot — mark as booked
    let slot = await Slot.findOne({ technician: technicianId, date: { $gte: dayStart, $lte: dayEnd }, startTime, endTime });
    if (slot) {
      slot.isBooked = true; slot.order = finalOrderId;
      await slot.save();
    } else {
      slot = await Slot.create({ technician: technicianId, date: new Date(date), startTime, endTime, isBooked: true, order: finalOrderId });
    }

    // Update the order with the assigned technician
    const updatedOrder = await Order.findByIdAndUpdate(finalOrderId, {
      technician: technicianId,
      status: 'assigned',
      scheduledDate: new Date(date),
      scheduledSlot: `${startTime} - ${endTime}`
    }, { new: true }).populate('technician', 'name phone email');

    if (!updatedOrder) return res.status(404).json({ message: 'Order record not found during update' });

    // Create workflow for the technician
    let workflow = await WorkFlow.findOne({ order: finalOrderId });
    if (!workflow) {
      workflow = await WorkFlow.create({
        order: finalOrderId,
        technician: technicianId,
        stages: { assigned: { status: true, timestamp: new Date() } }
      });
    }
 else {
      workflow.technician = technicianId;
      workflow.stages = workflow.stages || {};
      workflow.stages.assigned = { status: true, timestamp: new Date() };
      await workflow.save();
    }

    res.json({ 
      message: 'Technician assigned successfully. Slot is now blocked.',
      order: updatedOrder,
      slot,
      workflow
    });
  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /availability/schedule/:technicianId ──────────────────────────────────
// Get full schedule for a specific technician (today + upcoming + completed)
router.get('/schedule/:technicianId', auth, async (req, res) => {
  try {
    const techId = req.params.technicianId;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // Today's slots
    const todaySlots = await Slot.find({ technician: techId, date: { $gte: todayStart, $lte: todayEnd } })
      .populate('order', '_id status products deliveryAddress customer').sort({ startTime: 1 });

    // Upcoming slots (next 30 days)
    const futureEnd = new Date(); futureEnd.setDate(futureEnd.getDate() + 30);
    const upcomingSlots = await Slot.find({ technician: techId, date: { $gt: todayEnd, $lte: futureEnd } })
      .populate('order', '_id status deliveryAddress').sort({ date: 1, startTime: 1 });

    // Leave dates
    const leaves = await LeaveRequest.find({ user: techId, status: 'approved', endDate: { $gte: new Date() } });

    // Workflows (jobs)
    const workflows = await WorkFlow.find({ technician: techId })
      .populate({ path: 'order', populate: { path: 'customer', select: 'name phone' } })
      .sort({ updatedAt: -1 }).limit(20);

    const completedJobs = workflows.filter(w => w.stages?.completed?.status).length;
    const pendingJobs = workflows.filter(w => !w.stages?.completed?.status).length;

    res.json({ todaySlots, upcomingSlots, leaves, completedJobs, pendingJobs, totalJobs: workflows.length, workflows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PATCH /availability/live-status ──────────────────────────────────────────
// Technician updates their live status
router.patch('/live-status', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const { workflowId, status } = req.body;
    const validStatuses = ['available', 'assigned', 'on_the_way', 'work_started', 'in_progress', 'completed', 'offline', 'on_leave'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const workflow = await WorkFlow.findByIdAndUpdate(workflowId,
      { $set: { liveStatus: status, liveStatusUpdatedAt: new Date() } }, { new: true }
    );
    const io = req.app.get('socketio');
    if (io) {
      // Notify all admins about the technician's status change
      io.to('role:admin').emit('technician_status_update', { 
        technicianId: req.user._id, 
        status, 
        workflowId,
        timestamp: new Date()
      });

      // If it's a critical status like 'on_the_way' or 'work_started', send a toast notification to admins
      if (['on_the_way', 'work_started', 'completed'].includes(status)) {
        io.to('role:admin').emit('notification', {
          title: 'Technician Update',
          message: `Technician status changed to ${status.replace(/_/g, ' ')}`,
          type: 'installation_update',
          priority: 'normal'
        });
      }
    }
    res.json({ workflow, status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
