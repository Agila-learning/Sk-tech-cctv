const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Create a booking (Customer)
router.post('/', auth, async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      customer: req.user._id
    });
    await booking.save();
    
    // Notify Admin
    const notif = new Notification({
      role: 'admin',
      message: `New Service Booking: ${booking.serviceType} at ${booking.address}`,
      type: 'order_update'
    });
    await notif.save();
    
    res.status(201).send(booking);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get my bookings (Customer)
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id }).populate('technician', 'name phone');
    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get all bookings
router.get('/admin/all', auth, authorize('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find().populate('customer', 'name email phone').populate('technician', 'name');
    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Assign technician to booking
router.patch('/admin/:id/assign', auth, authorize('admin'), async (req, res) => {
  try {
    const { technicianId } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { 
      technician: technicianId,
      status: 'assigned'
    }, { new: true });
    
    // Notify Technician
    const notif = new Notification({
      userId: technicianId,
      role: 'technician',
      message: `New Service Assignment: ${booking.serviceType} at ${booking.address}`,
      type: 'technician_assigned'
    });
    await notif.save();
    
    res.send(booking);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
