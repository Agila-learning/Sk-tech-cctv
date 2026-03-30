const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Get all attendance for admin
router.get('/', auth, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    let query = {};
    if (userId) query.user = userId;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('user', 'name email role')
      .sort({ date: -1 });
    res.send(attendance);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get my attendance (Technician)
router.get('/my', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ user: req.user._id }).sort({ date: -1 });
    res.send(attendance);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Punch in
router.post('/punch-in', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let record = await Attendance.findOne({ user: req.user._id, date: today });
    
    if (record) {
      if (!record.checkOut) {
        return res.status(400).send({ message: 'Already punched in. Shift is currently active.' });
      }
      // If already punched out, we can either block it or allow a second shift.
      // For now, let's just clear checkOut to "resume" the shift if they accidentally ended it.
      record.checkOut = undefined;
      await record.save();
      return res.send(record);
    }
    
    const now = new Date();
    const isLate = now.getHours() >= 10;
    
    const user = await User.findById(req.user._id);
    const cfg = user.salaryConfig || {};
    // Calculate effective hourly rate if monthly: base / (26 days * workingHoursPerDay)
    const effectiveHourlyRate = cfg.type === 'hourly' 
      ? (cfg.base || 0) 
      : (cfg.base ? cfg.base / (26 * (cfg.workingHoursPerDay || 8)) : 0);

    record = new Attendance({
      user: req.user._id,
      date: today,
      checkIn: now,
      status: 'present',
      type: 'automatic',
      hourlyRate: effectiveHourlyRate,
      remarks: isLate ? 'Late Arrival' : 'On Time'
    });
    
    await record.save();
    await User.findByIdAndUpdate(req.user._id, { availabilityStatus: 'Available', isOnline: true });
    res.send(record);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Punch out
router.post('/punch-out', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ user: req.user._id, date: today });
    
    if (!record) return res.status(400).send({ error: 'No punch-in record found for today' });
    if (record.checkOut) return res.status(400).send({ error: 'Already punched out for today' });
    
    record.checkOut = new Date();
    // Calculate hours worked
    const diffMs = record.checkOut - record.checkIn;
    record.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
    
    await record.save();
    await User.findByIdAndUpdate(req.user._id, { availabilityStatus: 'Offline', isOnline: false });
    res.send(record);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Unified Punch Toggle
router.post('/punch', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let record = await Attendance.findOne({ user: req.user._id, date: today });

    const now = new Date();
    if (!record) {
      // Punch In
      const isLate = now.getHours() >= 10;
      record = new Attendance({
        user: req.user._id,
        date: today,
        checkIn: now,
        status: 'present',
        remarks: isLate ? 'Late Arrival' : 'On Time'
      });
    } else {
      // Punch Out
      if (record.checkOut) return res.status(400).send({ error: 'Already punched out for today' });
      record.checkOut = now;
      const diffMs = record.checkOut - record.checkIn;
      record.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    await record.save();
    const isPunchedIn = !record.checkOut;
    await User.findByIdAndUpdate(req.user._id, { 
      availabilityStatus: isPunchedIn ? 'Available' : 'Offline', 
      isOnline: isPunchedIn 
    });
    res.send(record);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Manual Hour Logging (Technician)
router.post('/manual-log', auth, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { date, hours, remarks } = req.body;
    if (!date || !hours) return res.status(400).send({ message: 'Date and hours are required' });

    // Check if a record already exists for this date
    let record = await Attendance.findOne({ user: req.user._id, date });
    if (record) {
      return res.status(400).send({ message: 'Attendance record already exists for this date. Use update if needed.' });
    }

    const user = await User.findById(req.user._id);
    const cfg = user.salaryConfig || {};
    const effectiveHourlyRate = cfg.type === 'hourly' 
      ? (cfg.base || 0) 
      : (cfg.base ? cfg.base / (26 * (cfg.workingHoursPerDay || 8)) : 0);

    record = new Attendance({
      user: req.user._id,
      date,
      hoursWorked: hours,
      type: 'manual',
      status: 'present',
      hourlyRate: effectiveHourlyRate,
      remarks: remarks || 'Manual Hourly Log'
    });

    await record.save();
    res.status(201).send(record);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update manual log or existing record
router.patch('/:id', auth, authorize('technician', 'admin'), async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).send({ message: 'Record not found' });
    
    // Only allow technicians to edit their own records
    if (req.user.role === 'technician' && record.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized' });
    }

    if (req.body.hoursWorked !== undefined) record.hoursWorked = req.body.hoursWorked;
    if (req.body.remarks !== undefined) record.remarks = req.body.remarks;
    if (req.body.status !== undefined) record.status = req.body.status;
    
    record.type = 'manual'; // Mark as manual if edited
    await record.save();
    res.send(record);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
