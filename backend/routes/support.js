const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { auth, authorize } = require('../middleware/auth');

// Submit Inquiry
router.post('/', async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    await inquiry.save();
    res.status(201).send({ message: 'Support inquiry received', inquiry });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all (Admin)
router.get('/', auth, authorize('admin'), async (req, res) => {
    try {
      const inquiries = await Inquiry.find().sort({ createdAt: -1 });
      res.send(inquiries);
    } catch (error) {
      res.status(500).send(error);
    }
});

module.exports = router;
