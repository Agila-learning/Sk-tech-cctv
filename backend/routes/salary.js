const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { auth, authorize } = require('../middleware/auth');

// Get salary config for a technician (Admin)
router.get('/admin/config/:userId', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name salaryConfig role');
    if (!user || user.role !== 'technician') return res.status(404).send({ message: 'Technician not found' });
    res.send(user.salaryConfig);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update salary config (Admin)
router.patch('/admin/config/:userId', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { salaryConfig: req.body } },
      { new: true }
    );
    res.send(user.salaryConfig);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get technician's own salary history
router.get('/my', auth, authorize('technician'), async (req, res) => {
  try {
    const salaries = await Salary.find({ technician: req.user._id }).sort({ month: -1 });
    res.send(salaries);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get all salaries for a month
router.get('/admin/all', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { month } = req.query; // Format: YYYY-MM
    const query = month ? { month } : {};
    const salaries = await Salary.find(query).populate('technician', 'name serviceCity');
    res.send(salaries);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get specific technician's salary for a month
router.get('/admin/technician/:userId', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { month } = req.query; // Format: YYYY-MM
    const salary = await Salary.findOne({ technician: req.params.userId, month })
      .populate('technician', 'name serviceCity salaryConfig');
    
    if (!salary) {
       // If no record, return basic info so frontend can trigger calculation
       const user = await User.findById(req.params.userId).select('name salaryConfig');
       return res.send({ technician: user, status: 'no_record' });
    }
    
    // Calculate components for frontend convenience
    const breakdown = {
       base: salary.baseSalary,
       overtime: salary.overtimeAmount,
       commission: salary.commissionAmount,
       adjustments: salary.adjustments.reduce((acc, adj) => acc + adj.amount, 0)
    };
    
    res.send({ ...salary.toObject(), payout: salary.totalPayable, breakdown });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Manual Adjustment
router.post('/admin/adjust/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).send({ message: 'Salary record not found' });

    salary.adjustments.push({ amount, reason });
    salary.totalPayable += amount;
    await salary.save();

    res.send(salary);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Calculate Salary for a technician for a specific month
router.post('/calculate', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { technicianId, month } = req.body; // month: YYYY-MM
    const technician = await User.findById(technicianId);
    if (!technician || !technician.salaryConfig) {
      return res.status(400).send({ message: 'Technician has no salary configuration' });
    }

    const { base, type, workingHoursPerDay, overtimeRate, commissionPerService } = technician.salaryConfig;

    // Fetch attendance for the month
    const startOfMonth = new Date(`${month}-01`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    
    // Fetch completed service reports for commissions
    const ServiceReport = require('../models/ServiceReport');
    const reports = await ServiceReport.find({
      technicianId,
      completionTime: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const commissionAmount = (reports.length || 0) * (commissionPerService || 0);

    const attendances = await Attendance.find({
      user: technicianId,
      date: { $gte: `${month}-01`, $lte: `${month}-31` } 
    });

    let totalWorkedMinutes = 0;
    let totalOTMinutes = 0;

    attendances.forEach(att => {
      if (att.checkIn && att.checkOut) {
        const durationMinutes = (new Date(att.checkOut) - new Date(att.checkIn)) / (1000 * 60);
        totalWorkedMinutes += durationMinutes;

        const maxNormalMinutes = (workingHoursPerDay || 8) * 60;
        if (durationMinutes > maxNormalMinutes) {
          totalOTMinutes += (durationMinutes - maxNormalMinutes);
        }
      }
    });

    const totalWorkedHours = totalWorkedMinutes / 60;
    const overtimeHours = totalOTMinutes / 60;
    const overtimeAmount = overtimeHours * (overtimeRate || 0);

    let totalPayable = base;
    if (type === 'hourly') {
      totalPayable = totalWorkedHours * base;
    }
    totalPayable += overtimeAmount;
    totalPayable += commissionAmount;

    // Upsert salary record
    let salary = await Salary.findOne({ technician: technicianId, month });
    if (salary) {
      salary.baseSalary = base;
      salary.salaryType = type;
      salary.totalWorkedHours = totalWorkedHours;
      salary.overtimeHours = overtimeHours;
      salary.overtimeAmount = overtimeAmount;
      salary.commissionAmount = commissionAmount;
      salary.totalServiceReports = reports.length;
      salary.totalPayable = totalPayable + (salary.adjustments.reduce((acc, adj) => acc + adj.amount, 0));
    } else {
      salary = new Salary({
        technician: technicianId,
        month,
        baseSalary: base,
        salaryType: type,
        totalWorkedHours,
        overtimeHours,
        overtimeAmount,
        commissionAmount,
        totalServiceReports: reports.length,
        totalPayable
      });
    }

    await salary.save();
    res.send(salary);
  } catch (error) {
    console.error("Salary Calculation Error:", error);
    res.status(400).send(error);
  }
});

const { 
  startOfDay, endOfDay, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  format, parseISO 
} = require('date-fns');

// Get stats for current technician
router.get('/stats/my', auth, authorize('technician'), async (req, res) => {
  try {
    const technicianId = req.user._id;
    const stats = await calculateTechnicianStats(technicianId);
    res.send(stats);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Admin: Get stats for a specific technician
router.get('/admin/stats/:userId', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const stats = await calculateTechnicianStats(req.params.userId);
    res.send(stats);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

async function calculateTechnicianStats(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  
  // Fetch all attendance/log records
  const attendances = await Attendance.find({ user: userId });
  
  const daily = attendances.filter(a => a.date === todayStr);
  const weekly = attendances.filter(a => {
    const d = parseISO(a.date);
    return d >= startOfWeek(now) && d <= endOfWeek(now);
  });
  const monthly = attendances.filter(a => {
    const d = parseISO(a.date);
    return d >= startOfMonth(now) && d <= endOfMonth(now);
  });

  const calcEarnings = (records) => records.reduce((acc, r) => acc + (r.hoursWorked * (r.hourlyRate || user.salaryConfig?.base || 0)), 0);

  return {
    today: {
      hours: daily.reduce((acc, r) => acc + (r.hoursWorked || 0), 0),
      earnings: calcEarnings(daily)
    },
    week: {
      hours: weekly.reduce((acc, r) => acc + (r.hoursWorked || 0), 0),
      earnings: calcEarnings(weekly)
    },
    month: {
      hours: monthly.reduce((acc, r) => acc + (r.hoursWorked || 0), 0),
      earnings: calcEarnings(monthly)
    },
    history: attendances.slice(-30).map(a => ({
      date: a.date,
      hours: a.hoursWorked,
      earnings: a.hoursWorked * (a.hourlyRate || user.salaryConfig?.base || 0),
      type: a.type
    }))
  };
}

module.exports = router;
