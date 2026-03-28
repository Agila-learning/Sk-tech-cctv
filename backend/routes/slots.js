const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const WorkFlow = require('../models/WorkFlow');
const { auth, authorize } = require('../middleware/auth');

// ─── Helper: Check if times overlap ─────────────────────────────────────────
const timeOverlaps = (aStart, aEnd, bStart, bEnd) => {
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  return toMin(aStart) < toMin(bEnd) && toMin(aEnd) > toMin(bStart);
};

// ─── GET /slots/available ──────────────────────────────────────────────────────
// Existing: get available (unbooked) slots by date
router.get('/available', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).send({ message: 'Date is required' });

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const availableSlots = await Slot.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      isBooked: false
    }).populate('technician', 'name phone');

    res.send(availableSlots);
  } catch (error) {
    res.status(500).send(error);
  }
});

// ─── GET /slots/availability ──────────────────────────────────────────────────
// For a given date + time slot, return all technicians with their availability status
// Query: date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM)
router.get('/availability', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    if (!date) return res.status(400).json({ message: 'date is required' });

    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    const technicians = await User.find({ role: 'technician' }, 'name email phone skills zone rating');

    const results = await Promise.all(technicians.map(async (tech) => {
      let status = 'available';
      let reason = null;

      // 1. Check approved leave
      const leave = await LeaveRequest.findOne({
        user: tech._id, status: 'approved',
        startDate: { $lte: dayEnd }, endDate: { $gte: dayStart }
      });
      if (leave) { status = 'on_leave'; reason = `On Leave (${leave.leaveType || 'leave'})`; }

      // 2. Check slot conflict
      if (status === 'available' && startTime && endTime) {
        const bookedSlots = await Slot.find({ technician: tech._id, date: { $gte: dayStart, $lte: dayEnd }, isBooked: true });
        const conflict = bookedSlots.find(s => timeOverlaps(startTime, endTime, s.startTime, s.endTime));
        if (conflict) { status = 'booked'; reason = `Booked: ${conflict.startTime} - ${conflict.endTime}`; }
      }

      // 3. Check active job (workflow)
      if (status === 'available') {
        const activeJob = await WorkFlow.findOne({
          technician: tech._id,
          'stages.completed.status': false,
          'stages.accepted.status': true
        });
        if (activeJob) { status = 'busy'; reason = 'Currently in active job'; }
      }

      // Count today's booked slots
      const todayJobs = await Slot.countDocuments({
        technician: tech._id,
        date: { $gte: dayStart, $lte: dayEnd },
        isBooked: true
      });

      return {
        _id: tech._id, name: tech.name, email: tech.email, phone: tech.phone,
        skills: tech.skills || [], zone: tech.zone, rating: tech.rating || 5,
        status, reason, todayJobCount: todayJobs
      };
    }));

    // Sort: available first, then busy, booked, on_leave
    const sortOrder = { available: 0, busy: 1, booked: 2, on_leave: 3 };
    results.sort((a, b) => (sortOrder[a.status] || 9) - (sortOrder[b.status] || 9));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── GET /slots/summary ───────────────────────────────────────────────────────
// Live counts: total technicians, available now, busy now, on leave
router.get('/summary', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }, '_id');
    const total = technicians.length;

    const now = new Date();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let onLeave = 0, busyNow = 0;
    await Promise.all(technicians.map(async (tech) => {
      const leave = await LeaveRequest.findOne({
        user: tech._id, status: 'approved',
        startDate: { $lte: todayEnd }, endDate: { $gte: todayStart }
      });
      if (leave) { onLeave++; return; }

      const bookedSlot = await Slot.findOne({
        technician: tech._id,
        date: { $gte: todayStart, $lte: todayEnd },
        isBooked: true
      });
      if (bookedSlot && timeOverlaps(currentTime, currentTime, bookedSlot.startTime, bookedSlot.endTime)) {
        busyNow++;
      }
    }));

    res.json({
      total,
      availableNow: Math.max(0, total - onLeave - busyNow),
      busyNow,
      onLeave
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── PATCH /slots/live-status/:id ────────────────────────────────────────────
// Admin or technician updates the live job status on a specific slot
router.patch('/live-status/:id', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { jobStatus } = req.body;
    const validStatuses = ['assigned', 'on_way', 'in_progress', 'completed'];
    if (!validStatuses.includes(jobStatus)) {
      return res.status(400).json({ message: 'Invalid jobStatus. Must be one of: ' + validStatuses.join(', ') });
    }

    const slot = await Slot.findByIdAndUpdate(
      req.params.id,
      {
        jobStatus,
        status: jobStatus === 'completed' ? 'available' : 'booked'
      },
      { new: true }
    ).populate('technician', 'name').populate('order', '_id status');

    if (!slot) return res.status(404).json({ message: 'Slot not found' });

    // Emit socket event if available
    const io = req.app.get('socketio');
    if (io) io.emit('slot_status_update', { slotId: slot._id, jobStatus, technicianId: slot.technician?._id });

    res.json({ message: 'Status updated successfully', slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── POST /slots/bulk-create ──────────────────────────────────────────────────
// Admin/Technician: Bulk create slots for a technician
router.post('/bulk-create', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { technicianId, date, slots } = req.body;
    if (!technicianId || !date || !slots || !slots.length) {
      return res.status(400).send({ message: 'TechnicianId, date, and slots array are required' });
    }

    const slotData = slots.map(s => {
      if (!s.startTime || !s.endTime) throw new Error('Each slot must have startTime and endTime');
      return {
        technician: technicianId,
        date: new Date(date),
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: false,
        status: 'available'
      };
    });

    const createdSlots = await Slot.insertMany(slotData, { ordered: false });
    res.status(201).send(createdSlots);
  } catch (error) {
    console.error("Bulk Slot Create Error:", error);
    if (error.code === 11000) {
      return res.status(400).send({ message: 'One or more slots already exist for this time and technician.', error });
    }
    res.status(400).send({ message: error.message || "Failed to create slots", error });
  }
});

// ─── DELETE /slots/:id ────────────────────────────────────────────────────────
// Admin/Technician: Delete a slot
router.delete('/:id', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).send({ error: 'Slot not found' });
    if (slot.isBooked) return res.status(400).send({ error: 'Cannot delete a booked slot' });
    await slot.deleteOne();
    res.send({ message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
