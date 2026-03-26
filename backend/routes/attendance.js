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
    const isLate = now.getHours() >= 10; // Late after 10 AM
    
    record = new Attendance({
      user: req.user._id,
      date: today,
      checkIn: now,
      status: 'present',
      remarks: isLate ? 'Late Arrival' : 'On Time'
    });
    
    await record.save();
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
    await record.save();
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
    }

    await record.save();
    res.send(record);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
