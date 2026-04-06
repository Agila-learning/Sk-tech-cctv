const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Get all notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? { $or: [{ userId: req.user._id }, { role: 'admin' }] }
      : { userId: req.user._id };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
    res.send(notifications);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
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
      : { userId: req.user._id, isRead: false };
    
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
      : { _id: req.params.id, userId: req.user._id };
      
    const notification = await Notification.findOneAndDelete(query);
    if (!notification) return res.status(404).send({ error: 'Notification not found' });
    res.send({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
