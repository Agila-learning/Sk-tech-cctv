const express = require('express');
const router = express.Router();
const EngagementTemplate = require('../models/EngagementTemplate');
const EngagementLog = require('../models/EngagementLog');
const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const Order = require('../models/Order');
const { createNotification } = require('../utils/notificationHelper');
const { isAuth, authorize } = require('../middleware/auth'); // assuming isAuth/authorize exists

// GET /api/engagement/templates
router.get('/templates', isAuth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const templates = await EngagementTemplate.find().sort({ createdAt: -1 }).populate('createdBy', 'name');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/engagement/templates
router.post('/templates', isAuth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const template = new EngagementTemplate({
      ...req.body,
      createdBy: req.user._id
    });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/engagement/templates/:id
router.put('/templates/:id', isAuth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const template = await EngagementTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/engagement/templates/:id
router.delete('/templates/:id', isAuth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const template = await EngagementTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/engagement/logs
router.get('/logs', isAuth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const logs = await EngagementLog.find()
      .populate('userId', 'name email phone')
      .populate('templateId', 'title message')
      .sort({ sentAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/engagement/settings
router.get('/settings', isAuth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});
    res.json({ autoEngagementEnabled: settings.autoEngagementEnabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/engagement/settings
router.put('/settings', isAuth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { autoEngagementEnabled } = req.body;
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({ autoEngagementEnabled });
    } else {
      settings.autoEngagementEnabled = autoEngagementEnabled;
    }
    await settings.save();
    res.json({ autoEngagementEnabled: settings.autoEngagementEnabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/engagement/manual-campaign
// Targeting logic for Manual blasts
router.post('/manual-campaign', isAuth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { title, message, targetRole, productsPurchased, category } = req.body;
    
    if (!message) return res.status(400).json({ message: 'Message is required' });

    let query = {};
    if (targetRole && targetRole !== 'all') {
      query.role = targetRole;
    } else {
      query.role = 'customer'; // default target for engagement
    }

    // Purchase history filtering based on specific products
    if (productsPurchased && productsPurchased.length > 0) {
      // Find orders that contain these products and are completed
      const orders = await Order.find({ 
        'items.product': { $in: productsPurchased },
        status: { $in: ['Completed', 'Delivered'] }
      }).select('customer');

      const customerIds = orders.map(o => o.customer);
      query._id = { $in: customerIds };
    }

    const users = await User.find(query).select('_id pushToken');
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found matching the criteria.' });
    }

    let sentCount = 0;
    const errors = [];

    // Process push in batches to not overwhelm FCM
    for (const user of users) {
      try {
        await createNotification(req.app, {
          userId: user._id,
          role: user.role || 'customer',
          type: 'engagement',
          title: title || 'SK Technology Offer',
          message: message
        });

        const log = new EngagementLog({
          userId: user._id,
          category: category || 'Manual Campaign',
          sentAt: new Date(),
          status: 'Delivered'
        });
        await log.save();
        sentCount++;
      } catch (err) {
        errors.push({ userId: user._id, error: err.message });
      }
    }

    res.json({ 
      message: `Campaign sent successfully to ${sentCount} users.`, 
      totalFound: users.length, 
      sentCount,
      errors 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
