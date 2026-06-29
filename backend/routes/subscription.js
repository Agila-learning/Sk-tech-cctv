const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, authorize('admin', 'technician'), async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ subscribedAt: -1 });
    res.send(subscriptions);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send({ error: 'Email is required' });
    
    const existing = await Subscription.findOne({ email });
    if (existing) return res.status(200).send({ message: 'Already subscribed' });

    const subscription = new Subscription({ email });
    await subscription.save();

    // Create system lead/notification
    try {
      const Notification = require('../models/Notification');
      const notification = new Notification({
        role: 'admin',
        type: 'subscription',
        message: `New operative signed up for updates: ${email}`,
        isRead: false
      });
      await notification.save();
    } catch (e) {
      console.log("Notification system bypass: Success saved without alert.");
    }

    res.status(201).send({ message: 'Subscribed successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
