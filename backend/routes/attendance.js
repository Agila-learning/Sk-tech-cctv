const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { exportToExcel, exportToPDF } = require('../utils/exportHelper');

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

// Punch In (Technician)
router.post('/punch-in', auth, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { lat, lng, address, deviceInfo } = req.body;
    const date = new Date().toISOString().split('T')[0];

    let record = await Attendance.findOne({ user: req.user._id, date });
    if (record) return res.status(400).send({ message: 'Already punched in for today.' });

    const user = await User.findById(req.user._id);
    const cfg = user.salaryConfig || {};
    const effectiveHourlyRate = cfg.type === 'hourly' 
      ? (cfg.base || 0) 
      : (cfg.base ? cfg.base / (26 * (cfg.workingHoursPerDay || 8)) : 0);

    record = new Attendance({
      user: req.user._id,
      date,
      type: 'automatic',
      status: 'present',
      hourlyRate: effectiveHourlyRate,
      checkIn: {
        time: new Date(),
        location: { lat, lng, address },
        deviceInfo
      }
    });

    await record.save();
    res.status(201).send(record);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Punch Out (Technician)
router.post('/punch-out', auth, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { lat, lng, address, deviceInfo } = req.body;
    const date = new Date().toISOString().split('T')[0];

    let record = await Attendance.findOne({ user: req.user._id, date });
    if (!record) return res.status(404).send({ message: 'No punch-in record found for today.' });
    if (record.checkOut && record.checkOut.time) return res.status(400).send({ message: 'Already punched out today.' });

    record.checkOut = {
      time: new Date(),
      location: { lat, lng, address },
      deviceInfo
    };

    // Calculate hours worked
    const diffMs = record.checkOut.time - record.checkIn.time;
    record.hoursWorked = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

    await record.save();
    res.send(record);
  } catch (error) {
    res.status(500).send({ message: error.message });
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

// Export Attendance
router.get('/export', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { format } = req.query;
    let data = await Attendance.find().populate('user', 'name role email').lean();
    
    data = data.map(a => ({
      employee: a.user?.name || 'N/A',
      role: a.user?.role || 'N/A',
      date: a.date,
      status: a.status || 'present',
      hoursWorked: a.hoursWorked || 0,
      checkIn: a.checkIn?.time ? new Date(a.checkIn.time).toLocaleTimeString() : 'N/A',
      checkOut: a.checkOut?.time ? new Date(a.checkOut.time).toLocaleTimeString() : 'N/A'
    }));

    if (format === 'excel') {
      const buffer = await exportToExcel(data, 'attendance_report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');
      return res.send(buffer);
    } else {
      const buffer = exportToPDF(data, 'Attendance Log');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.pdf');
      return res.send(Buffer.from(buffer));
    }
  } catch (error) {
    res.status(500).send({ message: 'Export failed' });
  }
});

module.exports = router;
