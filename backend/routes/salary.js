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
    
    // Calculate components for frontend convenience using the new granular model
    const breakdown = {
       fixed: salary.fixedSalary || 0,
       monthly: salary.monthlySalary || 0,
       daily: salary.dailyWage?.total || 0,
       hourly: salary.hourlyWage?.total || 0,
       incentive: salary.incentive || 0,
       overtime: salary.overtime?.total || 0,
       bonus: salary.bonus || 0,
       allowances: salary.allowances || 0,
       deductions: salary.deductions || 0,
       advance: salary.advanceTaken || 0,
       ledgerTotal: salary.ledger?.reduce((acc, item) => {
         // Sum up non-base components from ledger if they aren't already in fields
         return acc + (item.status === 'pending' ? item.amount : 0);
       }, 0) || 0
    };
    
    res.send({ ...salary.toObject(), payout: salary.totalPayable, breakdown });
  } catch (error) {
    console.error("Salary Fetch Error:", error);
    res.status(500).send({ message: error.message || "Failed to fetch salary record" });
  }
});

// Admin: Post Payout Item (Incentive, Bonus, Deduction, Advance, etc.)
router.post('/admin/payout-item/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).send({ message: 'Salary record not found' });

    // Update specific field based on type
    switch (type) {
      case 'incentive': salary.incentive += amount; break;
      case 'bonus': salary.bonus += amount; break;
      case 'deduction': salary.deductions += amount; break;
      case 'advance': salary.advanceTaken += amount; break;
      case 'allowance': salary.allowances += amount; break;
      case 'fixed': salary.fixedSalary += amount; break;
      default: return res.status(400).send({ message: 'Invalid payout type' });
    }

    // Add to ledger
    salary.ledger.push({
      type,
      amount,
      description,
      date: new Date(),
      status: 'pending'
    });

    await salary.save();
    res.send(salary);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// Admin: Manual Adjustment (Legacy support or simple catch-all)
router.post('/admin/adjust/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).send({ message: 'Salary record not found' });

    salary.deductions += (amount < 0 ? Math.abs(amount) : 0);
    salary.bonus += (amount > 0 ? amount : 0);
    
    salary.ledger.push({
      type: amount > 0 ? 'bonus' : 'deduction',
      amount: Math.abs(amount),
      description: reason,
      date: new Date()
    });

    await salary.save();
    res.send(salary);
  } catch (error) {
    res.status(400).send(error);
  }
});


// Calculate / Draft Salary for a technician for a specific month
router.post('/calculate', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { technicianId, month } = req.body; // month: YYYY-MM
    const technician = await User.findById(technicianId);
    if (!technician || !technician.salaryConfig) {
      return res.status(400).send({ message: 'Technician has no salary configuration' });
    }

    const cfg = technician.salaryConfig;
    const types = cfg.types || [];

    // Fetch attendance for the month
    const startOfMonth = new Date(`${month}-01`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    
    const attendances = await Attendance.find({
      user: technicianId,
      date: { $gte: `${month}-01`, $lte: `${month}-31` } 
    });

    // 1. Calculate Base Components
    let fixedSalary = types.includes('monthly') ? (cfg.monthlyRate || 0) : 0;
    
    let totalWorkedHours = 0;
    let totalWorkedDays = attendances.length;
    let totalOTHours = 0;

    attendances.forEach(att => {
      totalWorkedHours += (att.hoursWorked || 0);
      totalOTHours += (att.overtimeHours || 0);
    });

    const weeklyTotal = types.includes('weekly') ? (Math.ceil(totalWorkedDays / 7) * (cfg.weeklyRate || 0)) : 0;
    const dailyTotal = types.includes('daily') ? (totalWorkedDays * (cfg.dailyRate || 0)) : 0;
    const hourlyTotal = types.includes('hourly') ? (totalWorkedHours * (cfg.hourlyRate || 0)) : 0;
    const otTotal = types.includes('ot') ? (totalOTHours * (cfg.overtimeRate || 0)) : 0;

    // 2. Calculate Incentives (Service Commissions)
    let incentiveTotal = 0;
    if (types.includes('incentive')) {
      const ServiceReport = require('../models/ServiceReport');
      const reports = await ServiceReport.find({
        technicianId,
        'adminApproval.status': 'approved',
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      incentiveTotal = reports.length * (cfg.commissionRate || 0);
    }

    // 3. Upsert Salary Record
    let salary = await Salary.findOne({ technician: technicianId, month });
    
    const updateData = {
      fixedSalary,
      weeklyWage: { rate: cfg.weeklyRate || 0, weeks: Math.ceil(totalWorkedDays / 7), total: weeklyTotal },
      dailyWage: { rate: cfg.dailyRate || 0, days: totalWorkedDays, total: dailyTotal },
      hourlyWage: { rate: cfg.hourlyRate || 0, hours: totalWorkedHours, total: hourlyTotal },
      overtime: { rate: cfg.overtimeRate || 0, hours: totalOTHours, total: otTotal },
      incentive: incentiveTotal,
      updatedAt: new Date()
    };

    if (salary) {
      Object.assign(salary, updateData);
    } else {
      salary = new Salary({
        technician: technicianId,
        month,
        ...updateData,
        status: 'draft'
      });
    }

    await salary.save();
    res.send(salary);
  } catch (error) {
    console.error("Salary Calculation Error:", error);
    res.status(400).send({ message: error.message });
  }
});

// Admin: Export Salary Report
const { exportToExcel, exportToPDF } = require('../utils/exportHelper');
router.get('/admin/export', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { month, format } = req.query; // format: excel, pdf
    const query = month ? { month } : {};
    const salaries = await Salary.find(query).populate('technician', 'name email employeeId');
    
    const data = salaries.map(s => ({
      technician: s.technician?.name || 'N/A',
      employeeId: s.technician?.employeeId || 'N/A',
      month: s.month,
      fixed: s.fixedSalary,
      daily: s.dailyWage?.total || 0,
      hourly: s.hourlyWage?.total || 0,
      incentive: s.incentive || 0,
      bonus: s.bonus || 0,
      deductions: s.deductions || 0,
      netPayable: s.totalPayable || 0,
      status: s.status
    }));

    if (format === 'excel') {
      const buffer = await exportToExcel(data, `Salary_Report_${month}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Salary_Report_${month}.xlsx`);
      return res.send(buffer);
    } else {
      const buffer = await exportToPDF(data, `Professional Payroll Statement - ${month}`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Salary_Report_${month}.pdf`);
      return res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error("Salary Export Error:", error);
    res.status(500).send({ message: 'Failed to generate report' });
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
  
  // Helper to calculate total hours (stored + live)
  const getHours = (record) => {
    let hours = record.hoursWorked || 0;
    // If currently punched in but not out, calculate live hours
    if (record.checkIn && !record.checkOut && record.date === todayStr) {
      const liveDiff = (new Date() - new Date(record.checkIn)) / (1000 * 60 * 60);
      hours += Math.max(0, liveDiff);
    }
    return hours;
  };

  const daily = attendances.filter(a => a.date === todayStr);
  const weekly = attendances.filter(a => {
    try {
      const d = parseISO(a.date);
      return d >= startOfWeek(now) && d <= endOfWeek(now);
    } catch { return false; }
  });
  const monthly = attendances.filter(a => {
    try {
      const d = parseISO(a.date);
      return d >= startOfMonth(now) && d <= endOfMonth(now);
    } catch { return false; }
  });

  // Effective hourly rate: default to a reasonable fallback if not set to avoid 0 stats
  const cfg = user.salaryConfig || {};
  const base = cfg.base || 15000; // Fallback to 15k if not set
  const workingHoursPerDay = cfg.workingHoursPerDay || 8;
  
  const effectiveHourlyRate = cfg.type === 'hourly'
    ? base
    : (base / (26 * workingHoursPerDay));

  const calcEarnings = (records) => records.reduce((acc, r) => {
    const rate = (cfg.type === 'hourly' && r.hourlyRate) ? r.hourlyRate : effectiveHourlyRate;
    return acc + (getHours(r) * rate);
  }, 0);

  const calcTotalHours = (records) => records.reduce((acc, r) => acc + getHours(r), 0);

  return {
    today: {
      hours: Math.round(calcTotalHours(daily) * 100) / 100,
      earnings: Math.round(calcEarnings(daily))
    },
    week: {
      hours: Math.round(calcTotalHours(weekly) * 100) / 100,
      earnings: Math.round(calcEarnings(weekly))
    },
    month: {
      hours: Math.round(calcTotalHours(monthly) * 100) / 100,
      earnings: Math.round(calcEarnings(monthly))
    },
    history: attendances.slice(-30).map(a => ({
      date: a.date,
      hours: Math.round(getHours(a) * 100) / 100,
      earnings: Math.round(getHours(a) * (a.hourlyRate || effectiveHourlyRate)),
      type: a.type,
      remarks: a.remarks
    }))
  };
}

// Admin: Manual Hour Log (CRUD)
router.post('/admin/manual-log', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { technicianId, date, hoursWorked, overtimeHours, reason } = req.body;
    
    if (!technicianId || !date || !hoursWorked) {
      return res.status(400).send({ message: 'TechnicianId, date, and hoursWorked are required' });
    }

    const user = await User.findById(technicianId);
    if (!user) return res.status(404).send({ message: 'User not found' });

    // Compute hourlyRate to store based on salary config
    const effectiveHourlyRate = user.salaryConfig?.type === 'hourly'
      ? (user.salaryConfig.base || 0)
      : (user.salaryConfig?.base ? user.salaryConfig.base / (26 * (user.salaryConfig.workingHoursPerDay || 8)) : 0);

    // Update Attendance record
    let attendance = await Attendance.findOne({ user: technicianId, date });
    if (attendance) {
      attendance.hoursWorked = hoursWorked;
      attendance.overtimeHours = overtimeHours || 0;
      attendance.type = 'manual';
      attendance.hourlyRate = effectiveHourlyRate;
      attendance.remarks = reason || 'Manual Admin Log';
    } else {
      attendance = new Attendance({
        user: technicianId,
        date,
        hoursWorked,
        overtimeHours: overtimeHours || 0,
        type: 'manual',
        status: 'present',
        hourlyRate: effectiveHourlyRate,
        remarks: reason || 'Manual Admin Log'
      });
    }
    await attendance.save();

    // Trigger salary re-calculation for the month
    const month = date.substring(0, 7); // YYYY-MM
    // We can reuse the internal logic or just return success and let frontend refresh
    res.send({ message: 'Hours logged successfully', attendance });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
