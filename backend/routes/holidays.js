const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const { auth, authorize } = require('../middleware/auth');

// Add Holiday (Admin)
router.post('/', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { name, date, type, description, isRecurring } = req.body;
    const holiday = new Holiday({ name, date, type, description, isRecurring });
    await holiday.save();
    res.status(201).send(holiday);
  } catch (error) {
    if (error.code === 11000) return res.status(400).send({ message: 'Holiday already exists for this date.' });
    res.status(500).send(error);
  }
});

// Get All Holidays
router.get('/', auth, async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.send(holidays);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete Holiday (Admin)
router.delete('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).send({ message: 'Holiday not found.' });
    res.send(holiday);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
