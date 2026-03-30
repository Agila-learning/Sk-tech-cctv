const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { auth, authorize } = require('../middleware/auth');
const { exportToExcel } = require('../utils/exportHelper');
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
      Date: e.date.toISOString().split('T')[0],
      Description: e.description,
      Category: e.category,
      Amount: e.amount,
      Type: e.type,
      Status: e.status,
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
    // If it's a technician, force the user ID to them. Sub-admins also tag as themselves if creating for own.
    user: (req.user.role === 'technician' || req.user.role === 'sub-admin') ? req.user._id : (req.body.type === 'employee' ? req.body.user : req.user._id)
  });

  try {
    const newExpense = await expense.save();
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

module.exports = router;
