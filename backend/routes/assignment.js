const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
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
// @desc    Auto calculate best technicians and ASSIGN them
// @access  Admin
router.post('/auto-assign', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { orderId, requiredTechnicians = 1, requiredSkills = [] } = req.body;
    
    let job = await Order.findById(orderId);
    if (!job) return res.status(404).json({ error: 'Order not found' });
    
    // Get job location
    const jobLat = job.location?.lat || job.locationDetails?.gpsLocation?.lat;
    const jobLng = job.location?.lng || job.locationDetails?.gpsLocation?.lng;

    // 1. Fetch all eligible technicians
    const technicians = await User.find({
      role: 'technician',
      isOnline: true,
      availabilityStatus: 'Available'
    });

    const eligibleTechs = [];

    for (const tech of technicians) {
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
        status: { $in: ['assigned', 'accepted', 'travel_started', 'reached_site', 'in_progress', 'paused'] } 
      });
      score -= (pendingOrdersCount * 15);

      // Add to eligible list with score
      eligibleTechs.push({ technician: tech, score });
    }

    if (eligibleTechs.length < requiredTechnicians) {
      return res.status(404).json({ error: `Only found ${eligibleTechs.length} eligible technicians, but ${requiredTechnicians} were required.` });
    }

    // Sort by score descending
    eligibleTechs.sort((a, b) => b.score - a.score);

    const primaryTech = eligibleTechs[0].technician;
    const secondaryTechs = eligibleTechs.slice(1, requiredTechnicians).map(e => e.technician);

    // Save Assignment
    job.technician = primaryTech._id;
    job.supportingTechnicians = secondaryTechs.map(t => t._id);
    job.assignmentMode = 'auto';
    job.status = 'assigned';
    job.teamChatRoomId = job._id.toString(); 

    job.trackingTimeline.push({
      status: 'assigned',
      timestamp: new Date(),
      remarks: 'Auto-assigned by system'
    });

    await job.save();

    // Update statuses
    await User.findByIdAndUpdate(primaryTech._id, { availabilityStatus: 'Assigned', currentOrder: job._id });
    for (const st of secondaryTechs) {
      await User.findByIdAndUpdate(st._id, { availabilityStatus: 'Assigned', currentOrder: job._id });
    }

    // Send notifications
    await Notification.create({
      user: primaryTech._id,
      title: 'New Order Assigned',
      message: `You have been assigned as the Primary Technician for order ${job.shortId}.`,
      type: 'order_assigned'
    });

    for (const st of secondaryTechs) {
      await Notification.create({
        user: st._id,
        title: 'New Order Assigned',
        message: `You have been assigned as a Secondary Technician for order ${job.shortId}.`,
        type: 'order_assigned'
      });
    }

    res.json({
      message: 'Auto assignment completed successfully',
      jobId: job._id,
      primaryTechnician: primaryTech,
      secondaryTechnicians: secondaryTechs,
      scores: eligibleTechs.map(e => ({ id: e.technician._id, name: e.technician.name, score: e.score }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during auto assignment' });
  }
});

// @route   POST /api/assignment/manual-assign
// @desc    Admin explicitly sets primary, secondary, and helpers
// @access  Admin
router.post('/manual-assign', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { orderId, primaryId, secondaryIds = [], helperIds = [] } = req.body;

    let job = await Order.findById(orderId);
    if (!job) return res.status(404).json({ error: 'Order not found' });

    job.technician = primaryId;
    job.supportingTechnicians = secondaryIds;
    job.helpers = helperIds;
    job.assignmentMode = 'manual';
    job.status = 'assigned';
    job.teamChatRoomId = job._id.toString();

    job.trackingTimeline.push({
      status: 'assigned',
      timestamp: new Date(),
      remarks: 'Manually assigned by admin'
    });

    await job.save();

    const allAssignedIds = [primaryId, ...secondaryIds, ...helperIds];
    
    // Update statuses
    for (const tId of allAssignedIds) {
      await User.findByIdAndUpdate(tId, { availabilityStatus: 'Assigned', currentOrder: job._id });
      
      await Notification.create({
        user: tId,
        title: 'New Order Assigned',
        message: `You have been assigned to order ${job.shortId}.`,
        type: 'order_assigned'
      });
    }

    res.json({ message: 'Manual assignment saved successfully', job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during manual assignment' });
  }
});

module.exports = router;
