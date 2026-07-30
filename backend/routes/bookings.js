const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');

const { createNotification } = require('../utils/notificationHelper');

// Create a booking (Customer)
router.post('/', auth, async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      customer: req.user._id
    });
    await booking.save();
    
    // Notify Admin
    await createNotification(req.app, {
      role: 'admin',
      message: `New Service Booking: ${booking.serviceType} at ${booking.address}`,
      type: 'order_update',
      orderId: booking._id
    });
    
    // Broadcast to Technicians
    await createNotification(req.app, {
      role: 'technician',
      message: `New Booking: ${booking.serviceType}. Check pool tasks.`,
      type: 'order_update',
      orderId: booking._id
    });

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
router.get('/admin/all', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const bookings = await Booking.find().populate('customer', 'name email phone').populate('technician', 'name');
    res.send(bookings);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Assign technician to booking
router.patch('/admin/:id/assign', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { technicianId } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { 
      technician: technicianId,
      status: 'assigned'
    }, { new: true });
    
    // Notify Technician
    await createNotification(req.app, {
      userId: technicianId,
      role: 'technician',
      message: `New Service Assignment: ${booking.serviceType} at ${booking.address}`,
      type: 'technician_assigned',
      orderId: booking._id
    });

    res.send(booking);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Update booking status directly
router.patch('/:id/status', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!booking) return res.status(404).send({ error: 'Booking not found' });
    
    // Notify Customer about update
    await createNotification(req.app, {
      userId: booking.customer,
      role: 'customer',
      message: `Service Status Update: Your booking for ${booking.serviceType} is now ${status}.`,
      type: 'order_update',
      orderId: booking._id
    });
    
    res.send(booking);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Update booking (Reschedule/Edit)
router.patch('/admin/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!booking) return res.status(404).send({ error: 'Booking not found' });
    
    // Notify Customer about update
    await createNotification(req.app, {
      userId: booking.customer,
      role: 'customer',
      message: `Service Update: Your deployment for ${booking.serviceType} has been modified.`,
      type: 'order_update',
      orderId: booking._id
    });
    
    res.send(booking);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin: Delete booking (supports both /:id and /admin/:id)
router.delete('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).send({ error: 'Booking not found' });
    
    // Notify Customer
    await createNotification(req.app, {
      userId: booking.customer,
      role: 'customer',
      message: `Protocol Aborted: Your service booking for ${booking.serviceType} has been cancelled.`,
      type: 'order_update',
      orderId: booking._id
    });
    
    res.send({ message: 'Booking successfully removed from grid' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/admin/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).send({ error: 'Booking not found' });
    
    // Notify Customer
    await createNotification(req.app, {
      userId: booking.customer,
      role: 'customer',
      message: `Protocol Aborted: Your service booking for ${booking.serviceType} has been cancelled.`,
      type: 'order_update',
      orderId: booking._id
    });
    
    res.send({ message: 'Booking successfully removed from grid' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Customer: Cancel Booking
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).send({ error: 'Booking not found' });
    
    // Check if customer owns the booking
    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'sub-admin') {
      return res.status(403).send({ error: 'Unauthorized to cancel this booking.' });
    }

    const uncancelableStates = ['in_progress', 'completed', 'delivered'];
    if (uncancelableStates.includes(booking.status)) {
      return res.status(400).send({ error: `Booking cannot be cancelled because it is in ${booking.status} state.` });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).send({ error: 'Booking is already cancelled.' });
    }

    booking.status = 'cancelled';

    // Unassign technician if any
    if (booking.technician) {
      const User = require('../models/User');
      const tech = await User.findById(booking.technician);
      if (tech) {
        tech.availabilityStatus = 'Available';
        tech.currentOrder = null;
        await tech.save();
      }
      
      await createNotification(req.app, {
        userId: booking.technician,
        role: 'technician',
        type: 'order_update',
        message: `Booking for ${booking.serviceType} has been cancelled by the customer.`,
        orderId: booking._id
      });
      
      booking.technician = undefined;
    }
    
    await booking.save();

    // Notify Admin
    await createNotification(req.app, {
      role: 'admin',
      type: 'order_update',
      message: `Booking for ${booking.serviceType} was cancelled by ${req.user.name}.`,
      orderId: booking._id
    });

    res.send(booking);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
