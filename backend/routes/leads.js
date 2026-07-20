const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// Public route to submit a lead (e.g. from Chatbot)
router.post('/', async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();

    // Notify Admins
    await createNotification(req.app, {
      role: 'admin',
      message: `New Chatbot Lead: ${lead.name} from ${lead.city} is interested in ${lead.interest || 'services'}.`,
      type: 'user_registered', // Or a new type like 'lead_generated'
    });

    res.status(201).send(lead);
  } catch (error) {
    res.status(400).send({ error: 'Failed to create lead', details: error.message });
  }
});

// Admin: Get all leads
router.get('/', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.send(leads);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Update lead status
router.patch('/:id/status', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!lead) return res.status(404).send({ error: 'Lead not found' });
    res.send(lead);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
