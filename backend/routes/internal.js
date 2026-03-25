const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const LeaveRequest = require('../models/LeaveRequest');
const Task = require('../models/Task');
const Category = require('../models/Category');
const { auth, authorize } = require('../middleware/auth');

// --- Attendance (Legacy redirection or cleanup) ---
// Admin can still view all via this if needed, but better to use /api/attendance
router.get('/attendance', auth, authorize('admin'), async (req, res) => {
  try {
    const attendance = await Attendance.find().populate('user').sort({ date: -1 });
    res.send(attendance);
  } catch (error) {
    res.status(500).send(error);
  }
});

// --- Announcements ---
router.get('/announcements', auth, async (req, res) => {
  try {
    const announcements = await Announcement.find({
      $or: [{ targetAudience: 'all' }, { targetAudience: req.user.role }]
    }).sort({ isPinned: -1, createdAt: -1 });
    
    // Add read status for each announcement
    const data = announcements.map(ann => ({
      ...ann._doc,
      isRead: ann.readBy.includes(req.user._id)
    }));
    
    res.send(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/announcements/:id/read', auth, async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id }
    }, { new: true });
    res.send(ann);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post('/announcements', auth, authorize('admin'), async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.status(201).send(announcement);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/announcements/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return res.status(404).send({ error: 'Announcement not found' });
    res.send({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// --- Leave Requests ---
router.post('/leave', auth, async (req, res) => {
  try {
    const leave = new LeaveRequest({ ...req.body, user: req.user._id });
    await leave.save();
    res.status(201).send(leave);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/leave', auth, async (req, res) => {
  try {
    let query = { user: req.user._id };
    if (req.user.role === 'admin') query = {};
    const leaves = await LeaveRequest.find(query).populate('user');
    res.send(leaves);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/leave/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await LeaveRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!leave) return res.status(404).send({ error: 'Leave request not found' });
    res.send(leave);
  } catch (error) {
    res.status(400).send(error);
  }
});

// --- Tasks (Admin Assigned Internal Work) ---
router.get('/tasks', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'technician') {
      query = { assignee: req.user._id };
    }
    const tasks = await Task.find(query).populate('assignee', 'name email role').sort({ createdAt: -1 });
    res.send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/tasks', auth, authorize('admin'), async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.patch('/tasks/:id/status', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send({ error: 'Task not found' });
    
    // Security check: only admin or the assignee can change status
    if (req.user.role !== 'admin' && task.assignee.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: 'Access denied' });
    }
    
    task.status = req.body.status;
    if (req.body.notes) task.notes = req.body.notes;
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

// --- Categories (Home Page Sections) ---
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.send(categories);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/categories', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, image, order } = req.body;
    const category = await Category.findOneAndUpdate(
      { name },
      { name, image, order },
      { upsert: true, new: true }
    );
    res.send(category);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
