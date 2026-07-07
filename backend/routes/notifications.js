const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Get all notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const query = {
      $and: [
        {
          $or: [
            { userId: req.user._id },
            { role: req.user.role },
            { role: 'all' }
          ]
        },
        { createdAt: { $gte: req.user.createdAt } }
      ]
    };

    if (req.user.createdAt) {
      query.createdAt = { $gte: req.user.createdAt };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    res.send(notifications);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Create a notification (Admin / System)
router.post('/', auth, async (req, res) => {
  try {
    const { title, message, role, type, userId, orderId } = req.body;
    const { createNotification } = require('../utils/notificationHelper');
    const notification = await createNotification(req.app, {
      userId,
      role: role || 'all',
      type: type || 'general',
      message: `${title ? title + ': ' : ''}${message}`,
      orderId
    });
    res.status(201).send(notification || { message: 'Notification created' });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    // Allow updating if it's targeted to user or role
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id }
      : req.user.role === 'technician'
      ? { _id: req.params.id, $or: [{ userId: req.user._id }, { role: 'technician' }] }
      : { _id: req.params.id, userId: req.user._id };

    const notification = await Notification.findOneAndUpdate(
      query,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).send({ error: 'Notification not found' });
    res.send(notification);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Mark all as read
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? { $or: [{ userId: req.user._id }, { role: 'admin' }], isRead: false }
      : req.user.role === 'technician'
      ? { $or: [{ userId: req.user._id }, { role: 'technician' }], isRead: false }
      : { userId: req.user._id, isRead: false };
    
    if (req.user.createdAt) {
      query.createdAt = { $gte: req.user.createdAt };
    }
    
    await Notification.updateMany(query, { isRead: true });
    res.send({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : req.user.role === 'technician'
      ? { _id: req.params.id, $or: [{ userId: req.user._id }, { role: 'technician' }] }
      : { _id: req.params.id, userId: req.user._id };
      
    const notification = await Notification.findOneAndDelete(query);
    if (!notification) return res.status(404).send({ error: 'Notification not found' });
    res.send({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete all notifications (Clear All)
router.delete('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? { $or: [{ userId: req.user._id }, { role: 'admin' }] }
      : req.user.role === 'technician'
      ? { $or: [{ userId: req.user._id }, { role: 'technician' }] }
      : { userId: req.user._id };
      
    if (req.user.createdAt) {
      query.createdAt = { $gte: req.user.createdAt };
    }
      
    await Notification.deleteMany(query);
    res.send({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
