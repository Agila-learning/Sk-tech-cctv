const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const { auth, authorize } = require('../middleware/auth');

// Helper: Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// @route   POST /api/assignment/auto-assign
// @desc    Auto assign technicians to a task based on AI/business rules (alias for /auto)
// @access  Admin
router.post(['/auto', '/auto-assign'], auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { taskId, type = 'order', requiredSkills = [] } = req.body;
    
    let job = null;
    if (type === 'order') {
      job = await Order.findById(taskId);
    } else {
      job = await Task.findById(taskId);
    }

    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    // Get job location
    const jobLat = job.location?.lat || job.locationDetails?.gpsLocation?.lat;
    const jobLng = job.location?.lng || job.locationDetails?.gpsLocation?.lng;

    // 1. Fetch all eligible technicians
    const technicians = await User.find({
      role: 'technician',
      isOnline: true,
      availabilityStatus: 'Available'
    });

    const today = new Date().toISOString().split('T')[0];
    const eligibleTechs = [];

    for (const tech of technicians) {
      // Rule 1: Calculate Score
      let score = 0;

      // Distance Score (Closer is better)
      if (jobLat && jobLng && tech.location?.lat && tech.location?.lng) {
        const dist = calculateDistance(jobLat, jobLng, tech.location.lat, tech.location.lng);
        if (dist < 10) score += 30;
        else if (dist < 30) score += 20;
        else if (dist < 50) score += 10;
      }

      // Skill Match Score
      if (requiredSkills.length > 0 && tech.skills && tech.skills.length > 0) {
        const matchCount = requiredSkills.filter(s => tech.skills.includes(s)).length;
        score += (matchCount * 10);
      }

      // Rating Score
      if (tech.rating) {
        score += (tech.rating * 5); // Max 25
      }

      // Workload Score (Fewer pending tasks = better score)
      const pendingOrdersCount = await Order.countDocuments({ 
        technician: tech._id, 
        status: { $in: ['assigned', 'accepted', 'in_progress'] } 
      });
      score -= (pendingOrdersCount * 15);

      // Add to eligible list with score
      eligibleTechs.push({
        technician: tech,
        score
      });
    }

    if (eligibleTechs.length === 0) {
      return res.status(404).json({ error: 'No eligible technicians available at this time' });
    }

    // Sort by score descending
    eligibleTechs.sort((a, b) => b.score - a.score);

    res.json({
      jobId: job._id,
      recommendedPrimary: eligibleTechs[0]?.technician,
      recommendedSupporting: eligibleTechs.slice(1, 4).map(e => e.technician),
      scores: eligibleTechs.map(e => ({ id: e.technician._id, name: e.technician.name, score: e.score }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during auto assignment' });
  }
});

// @route   POST /api/assignment/manual-assign
// @desc    Save task assignment (alias for /save)
// @access  Admin
router.post(['/save', '/manual-assign'], auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { taskId, type = 'order', primaryId, supportingIds = [], helpersIds = [], assignmentMode = 'manual' } = req.body;

    let update = {
      technician: primaryId,
      supportingTechnicians: supportingIds,
      helpers: helpersIds,
      assignmentMode: assignmentMode,
      status: 'assigned'
    };

    if (type === 'task') {
      update.assignee = primaryId;
    }

    let job;
    if (type === 'order') {
      job = await Order.findByIdAndUpdate(taskId, update, { new: true });
    } else {
      job = await Task.findByIdAndUpdate(taskId, update, { new: true });
    }

    // Update primary tech status
    await User.findByIdAndUpdate(primaryId, { availabilityStatus: 'Assigned', currentOrder: taskId });

    // Ensure Notification system notifies all assigned users here...

    res.json({ message: 'Assignment saved successfully', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
