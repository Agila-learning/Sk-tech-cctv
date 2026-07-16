const express = require('express');
const router = express.Router();
const TaskMessage = require('../models/TaskMessage');
const Order = require('../models/Order');
const Task = require('../models/Task');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// @route   POST /api/task-messages
// @desc    Post a message/material request in a task
// @access  Admin, Technician, Sub-Admin
router.post('/', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { taskId, type = 'order', content, messageType, voiceUrl, images, videoUrl, pdfUrl, mentions = [], materialRequest } = req.body;

    let job;
    if (type === 'order') {
      job = await Order.findById(taskId);
    } else {
      job = await Task.findById(taskId);
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const message = new TaskMessage({
      [type === 'order' ? 'order' : 'task']: taskId,
      author: req.user._id,
      content,
      messageType,
      voiceUrl,
      images,
      videoUrl,
      pdfUrl,
      mentions,
      materialRequest,
      readBy: [{ user: req.user._id }]
    });

    await message.save();
    await message.populate('author', 'name role profilePic');
    await message.populate('mentions', 'name');

    // Notify mentioned users
    for (const userId of mentions) {
      await createNotification(req.app, {
        userId,
        role: 'technician', // Assuming mostly techs are mentioned
        type: 'mention',
        message: `${req.user.name} mentioned you in a task: "${content}"`,
        orderId: type === 'order' ? taskId : undefined
      });
    }

    // Notify admins if it's a material request
    if (messageType === 'material_request') {
      await createNotification(req.app, {
        role: 'admin',
        type: 'material_request',
        message: `${req.user.name} requested materials for Task #${taskId.toString().slice(-6)}`,
        orderId: type === 'order' ? taskId : undefined
      });
    }

    // Socket Broadcast
    const io = req.app.get('socketio');
    if (io) {
      io.emit(`task_message:${taskId}`, message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// @route   GET /api/task-messages/:taskId
// @desc    Get messages for a task
// @access  Admin, Technician, Sub-Admin
router.get('/:taskId', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Check if it's order or task based on what we find
    const messages = await TaskMessage.find({
      $or: [{ order: taskId }, { task: taskId }]
    }).populate('author', 'name role profilePic')
      .populate('mentions', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// @route   PATCH /api/task-messages/:messageId/read
// @desc    Mark a message as read
// @access  Admin, Technician
router.patch('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await TaskMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    const hasRead = message.readBy.find(r => r.user.toString() === req.user._id.toString());
    if (!hasRead) {
      message.readBy.push({ user: req.user._id });
      await message.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// @route   PATCH /api/task-messages/:messageId/approve-materials
// @desc    Approve/Reject material request
// @access  Admin, Sub-Admin
router.patch('/:messageId/approve-materials', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { itemsStatus } = req.body; // Array of { itemName, status }
    
    const message = await TaskMessage.findById(req.params.messageId).populate('author', 'name role');
    if (!message || message.messageType !== 'material_request') {
      return res.status(404).json({ error: 'Material request not found' });
    }

    itemsStatus.forEach(update => {
      const item = message.materialRequest.items.find(i => i.name === update.itemName);
      if (item) {
        item.status = update.status;
      }
    });

    message.materialRequest.approvedBy = req.user._id;
    await message.save();

    // Notify technician
    await createNotification(req.app, {
      userId: message.author._id,
      role: 'technician',
      type: 'material_approval',
      message: `Your material request for Task has been reviewed.`,
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update material request' });
  }
});

// @route   PUT /api/task-messages/:id
// @desc    Edit a message
// @access  Admin, Technician
router.put('/:id', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const { content } = req.body;
    const message = await TaskMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    // Only the author or an admin can edit
    if (message.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
       return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    message.content = content;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// @route   DELETE /api/task-messages/:id
// @desc    Delete a message
// @access  Admin, Technician
router.delete('/:id', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const message = await TaskMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    
    // Only the author or an admin can delete
    if (message.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
       return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
