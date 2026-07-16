const express = require('express');
const router = express.Router();
const CustomerContact = require('../models/CustomerContact');
const { auth } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

// @route   POST /api/customer-contact
// @desc    Create a new customer contact
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const contact = new CustomerContact({
      ...req.body,
      createdBy: req.user._id
    });
    const saved = await contact.save();
    
    await ActivityLog.create({
      user: req.user._id,
      action: 'Create Customer Contact',
      details: `Customer ${saved.customerName} created.`,
      module: 'CustomerContact'
    });

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customer-contact
// @desc    Get all customer contacts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await CustomerContact.find().sort('-createdAt');
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/customer-contact/:id
// @desc    Update customer contact
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const contact = await CustomerContact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/customer-contact/:id
// @desc    Delete customer contact
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    await CustomerContact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
