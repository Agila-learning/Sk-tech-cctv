const express = require('express');
const router = express.Router();
const WorkLog = require('../models/WorkLog');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Start Work Session
router.post('/start', auth, async (req, res) => {
  try {
    const { taskId, taskDescription, lat, lng, address } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const activeLog = await WorkLog.findOne({ 
      technician: req.user._id, 
      status: 'active' 
    });

    if (activeLog) {
      return res.status(400).send({ message: 'A work session is already active.' });
    }

    const log = new WorkLog({
      technician: req.user._id,
      taskId,
      taskDescription,
      date: today,
      startTime: new Date(),
      location: {
        start: { lat, lng, address }
      }
    });

    await log.save();
    // Synchronize user status
    await User.findByIdAndUpdate(req.user._id, { availabilityStatus: 'Busy' });
    
    res.status(201).send(log);
  } catch (error) {
    res.status(500).send(error);
  }
});

// End Work Session
router.post('/end', auth, async (req, res) => {
  try {
    const { lat, lng, address, notes } = req.body;
    const log = await WorkLog.findOne({ 
      technician: req.user._id, 
      status: 'active' 
    });

    if (!log) {
      return res.status(404).send({ message: 'No active work session found.' });
    }

    log.endTime = new Date();
    log.status = 'completed';
    log.notes = notes;
    log.location.end = { lat, lng, address };
    
    const diffMs = log.endTime - log.startTime;
    log.duration = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    await log.save();
    // Synchronize user status (back to Available if still punched in)
    // We'll assume they go back to Available after finishing a task
    await User.findByIdAndUpdate(req.user._id, { availabilityStatus: 'Available' });
    
    res.send(log);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get My Work Logs (Today)
router.get('/my/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const logs = await WorkLog.find({ 
      technician: req.user._id, 
      date: today 
    }).populate('taskId');
    res.send(logs);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
