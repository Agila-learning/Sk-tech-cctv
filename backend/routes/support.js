const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { auth, authorize } = require('../middleware/auth');

// Submit Inquiry
router.post('/', async (req, res) => {
  try {
    const inquiryData = { ...req.body };
    // If authorization header exists, try to extract user
    // (auth middleware might not be strictly required for submissions, but we'll use it if available)
    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();
    res.status(201).send({ message: 'Support inquiry received', inquiry });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get my inquiries
router.get('/my', auth, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ 
      $or: [
        { customer: req.user._id },
        { email: req.user.email }
      ]
    }).sort({ createdAt: -1 });
    res.send(inquiries);
  } catch (error) {
    res.status(500).send(error);
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
