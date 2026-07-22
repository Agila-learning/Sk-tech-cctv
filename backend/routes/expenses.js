const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { auth, authorize } = require('../middleware/auth');
const { exportToExcel, exportToPDF } = require('../utils/exportHelper');
const { createNotification } = require('../utils/notificationHelper');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } = require('date-fns');

// Get expenses (Admin/Sub-Admin gets all, Technician gets own)
router.get('/', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { type, status, period, startDate, endDate } = req.query;
    const query = {};
    
    // Technicians only see their own. Sub-admins and Admins see all.
    if (req.user.role === 'technician') {
      query.user = req.user._id;
    } else {
      if (type) query.type = type;
    }
    
    if (status) query.status = status;

    // Temporal Filtering
    if (period) {
      const now = new Date();
      if (period === 'week') {
        query.date = { $gte: subDays(now, 7) };
      } else if (period === 'month') {
        query.date = { $gte: subDays(now, 30) };
      }
    } else if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const expenses = await Expense.find(query)
      .populate('user', 'name email role')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Export expenses to Excel
router.get('/export', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { type, status, period } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    if (period === 'week') {
      query.date = { $gte: subDays(new Date(), 7) };
    } else if (period === 'month') {
      query.date = { $gte: subDays(new Date(), 30) };
    } else if (req.query.startDate && req.query.endDate) {
      query.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }

    const expenses = await Expense.find(query).populate('user', 'name').lean();
    
    // Transform data for Excel
    const exportData = expenses.map(e => ({
      Date: e.date ? new Date(e.date).toISOString().split('T')[0] : 'N/A',
      Description: e.description || '',
      Category: e.category || 'General',
      Amount: e.amount || 0,
      Type: e.type || 'admin',
      Status: e.status || 'pending',
      User: e.user?.name || 'Admin'
    }));

    const buffer = await exportToExcel(exportData, 'expenses_report.xlsx', 'Expenses');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses_report.xlsx');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create expense
router.post('/', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  const expense = new Expense({
    ...req.body,
    type: req.user.role === 'technician' ? 'employee' : (req.body.type || 'admin'),
    user: (req.user.role === 'technician' || req.user.role === 'sub-admin') ? req.user._id : (req.body.type === 'employee' ? req.body.user : req.user._id)
  });

  try {
    const newExpense = await expense.save();
    
    // Notify admin live of expense submission
    await createNotification(req.app, {
      role: 'admin',
      type: 'expense_submitted',
      message: `Financial Notice: Expense submitted by ${req.user.name || 'Employee'} for ₹${newExpense.amount}. Description: ${newExpense.description}`
    });

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update expense status
router.patch('/:id/status', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    // Sub-admin restriction: can only manage their own expenses
    if (req.user.role === 'sub-admin' && expense.user && expense.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: Sub-admins can only manage their own expenses' });
    }

    if (req.body.status) expense.status = req.body.status;
    if (req.body.notes) expense.notes = req.body.notes;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete expense
router.delete('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    // Sub-admin restriction: can only delete their own expenses
    if (req.user.role === 'sub-admin' && expense.user && expense.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: Sub-admins can only delete their own expenses' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Export Expenses
router.get('/export', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { format } = req.query;
    let data = await Expense.find().populate('user', 'name role email').lean();
    
    data = data.map(e => ({
      employee: e.user?.name || 'N/A',
      title: e.title || 'N/A',
      amount: e.amount || 0,
      category: e.category || 'N/A',
      status: e.status || 'Pending',
      date: e.date ? new Date(e.date).toLocaleDateString() : 'N/A',
      notes: e.notes || ''
    }));

    if (format === 'excel') {
      const buffer = await exportToExcel(data, 'expenses_report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses_report.xlsx');
      return res.send(buffer);
    } else {
      const buffer = exportToPDF(data, 'Expense Report');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses_report.pdf');
      return res.send(Buffer.from(buffer));
    }
  } catch (error) {
    res.status(500).send({ message: 'Export failed' });
  }
});

module.exports = router;
