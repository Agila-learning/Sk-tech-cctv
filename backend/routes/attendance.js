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
// Get Monthly Summary (Technician)
router.get('/summary', auth, async (req, res) => {
  try {
    const { month, year } = req.query; // Expecting MM and YYYY
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;

    const attendance = await Attendance.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const stats = {
      present: 0,
      absent: 0,
      half_day: 0,
      holiday: 0,
      sunday: 0,
      totalHours: 0
    };

    attendance.forEach(record => {
      if (record.status === 'present' || record.status === 'sunday_present') stats.present++;
      else if (record.status === 'absent') stats.absent++;
      else if (record.status === 'half_day') stats.half_day++;
      else if (record.status === 'holiday') stats.holiday++;
      else if (record.status === 'sunday') stats.sunday++;
      
      stats.totalHours += record.hoursWorked || 0;
    });

    res.send({ stats, history: attendance });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Punch in
router.post('/punch-in', auth, async (req, res) => {
  try {
    const { lat, lng, address, deviceInfo } = req.body;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const isSunday = now.getDay() === 0;
    
    let record = await Attendance.findOne({ user: req.user._id, date: today });
    
    if (record && record.checkIn?.time) {
      return res.status(400).send({ message: 'Already punched in for today.' });
    }

    const user = await User.findById(req.user._id);
    const cfg = user.salaryConfig || {};
    const effectiveHourlyRate = cfg.type === 'hourly' 
      ? (cfg.base || 0) 
      : (cfg.base ? cfg.base / (26 * (cfg.workingHoursPerDay || 8)) : 0);

    const isLate = now.getHours() >= 10;
    
    if (!record) {
      record = new Attendance({
        user: req.user._id,
        date: today,
        status: isSunday ? 'sunday_present' : 'present',
        type: 'automatic',
        hourlyRate: effectiveHourlyRate,
        remarks: isLate ? 'Late Arrival' : 'On Time'
      });
    }

    record.checkIn = {
      time: now,
      location: { lat, lng, address },
      deviceInfo
    };
    
    await record.save();
    await User.findByIdAndUpdate(req.user._id, { availabilityStatus: 'Available' });
    res.send(record);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Punch out
router.post('/punch-out', auth, async (req, res) => {
  try {
    const { lat, lng, address, deviceInfo } = req.body;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const record = await Attendance.findOne({ user: req.user._id, date: today });
    
    if (!record || !record.checkIn?.time) {
      return res.status(400).send({ error: 'No punch-in record found for today' });
    }
    if (record.checkOut?.time) {
      return res.status(400).send({ error: 'Already punched out for today' });
    }
    
    record.checkOut = {
      time: now,
      location: { lat, lng, address },
      deviceInfo
    };

    // Calculate hours worked
    const diffMs = record.checkOut.time - record.checkIn.time;
    record.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    
    await record.save();
    await User.findByIdAndUpdate(req.user._id, { availabilityStatus: 'Offline' });
    res.send(record);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Unified Punch Toggle (Simplified for compatibility)
router.post('/punch', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let record = await Attendance.findOne({ user: req.user._id, date: today });
    
    if (!record || !record.checkIn?.time) {
      // Forward to punch-in logic (simulated)
      req.url = '/punch-in';
      return router.handle(req, res);
    } else {
      // Forward to punch-out logic (simulated)
      req.url = '/punch-out';
      return router.handle(req, res);
    }
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

// Delete attendance record
router.delete('/:id', auth, authorize('technician', 'admin'), async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).send({ message: 'Record not found' });
    
    // Only allow technicians to delete their own records
    if (req.user.role === 'technician' && record.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: 'Unauthorized' });
    }

    await record.deleteOne();
    res.send({ message: 'Record deleted successfuly' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
