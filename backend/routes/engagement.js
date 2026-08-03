const express = require('express');
const router = express.Router();
const EngagementTemplate = require('../models/EngagementTemplate');
const EngagementLog = require('../models/EngagementLog');
const SystemSettings = require('../models/SystemSettings');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');
const User = require('../models/User');

const adminOnly = authorize('admin', 'sub-admin');

// --- TEMPLATES CRUD ---

// Get all templates
router.get('/templates', auth, adminOnly, async (req, res) => {
  try {
    const templates = await EngagementTemplate.find().sort('-createdAt');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates' });
  }
});

// Create template
router.post('/templates', auth, adminOnly, async (req, res) => {
  try {
    const { title, message, category, active } = req.body;
    const template = new EngagementTemplate({ title, message, category, active });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update template
router.put('/templates/:id', auth, adminOnly, async (req, res) => {
  try {
    const template = await EngagementTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(template);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete template
router.delete('/templates/:id', auth, adminOnly, async (req, res) => {
  try {
    await EngagementTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// --- SETTINGS ---

// Get engagement settings
router.get('/settings', auth, adminOnly, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
      await settings.save();
    }
    res.json({ autoEngagementEnabled: settings.autoEngagementEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Toggle auto-engagement
router.put('/settings/toggle', auth, adminOnly, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings();
    if (typeof req.body.autoEngagementEnabled === 'boolean') {
      settings.autoEngagementEnabled = req.body.autoEngagementEnabled;
    } else {
      settings.autoEngagementEnabled = !settings.autoEngagementEnabled;
    }
    await settings.save();
    res.json({ autoEngagementEnabled: settings.autoEngagementEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// --- ANALYTICS ---

// Get summary stats
router.get('/analytics/summary', auth, adminOnly, async (req, res) => {
  try {
    const totalSent = await EngagementLog.countDocuments({ status: 'Delivered' });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sentThisMonth = await EngagementLog.countDocuments({ status: 'Delivered', sentAt: { $gte: thirtyDaysAgo } });
    
    // Group by category
    const byCategory = await EngagementLog.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    res.json({ totalSent, sentThisMonth, byCategory });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// --- MANUAL BROADCAST ---

// Get engagement logs
router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    const logs = await EngagementLog.find().populate('userId', 'name email').populate('templateId', 'title message').sort('-sentAt');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

// --- MANUAL BROADCAST ---

// Send instant manual broadcast
router.post('/manual-campaign', auth, adminOnly, async (req, res) => {
  try {
    const { templateId } = req.body;
    const template = await EngagementTemplate.findById(templateId);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    
    // In a real scenario, this could be targeted. Here we send to all customers.
    const customers = await User.find({ role: 'customer' });
    
    let sentCount = 0;
    for (const customer of customers) {
      // Record history
      await EngagementLog.create({
        userId: customer._id,
        templateId: template._id,
        category: template.category,
        status: 'Delivered'
      });
      
      // Fire FCM
      await createNotification(req.app, {
        userId: customer._id,
        role: 'customer',
        type: 'engagement',
        title: template.title,
        message: template.message
      });
      
      sentCount++;
    }
    
    res.json({ message: `Broadcast sent to ${sentCount} customers successfully!`, sentCount, totalFound: customers.length });
  } catch (error) {
    res.status(500).json({ message: 'Error sending broadcast' });
  }
});

module.exports = router;
