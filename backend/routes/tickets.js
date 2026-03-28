const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { auth, authorize } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Create a ticket (Customer)
router.post('/', auth, async (req, res) => {
  try {
    const ticket = new Ticket({
      ...req.body,
      customer: req.user._id,
      status: 'Open'
    });
    
    // Initial history entry
    ticket.history.push({
      status: 'Open',
      updatedBy: req.user._id,
      comment: 'Ticket created'
    });
    
    await ticket.save();
    
    // Notify admin
    const notif = new Notification({
      role: 'admin',
      message: `New Ticket Raised: ${ticket.subject} by ${req.user.name}`,
      type: 'order_update'
    });
    await notif.save();
    
    res.status(201).send(ticket);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get my tickets (Customer)
router.get('/my', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name');
    res.send(tickets);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Get all tickets for pipeline
router.get('/admin/all', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 });
    res.send(tickets);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin/Technician: Update ticket status/assignee
router.patch('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).send({ error: 'Ticket not found' });
    
    // Only admin or assigned technician can modify (unless assigning someone)
    if (req.user.role !== 'admin' && req.user.role !== 'sub-admin' && ticket.assignedTo?.toString() !== req.user._id.toString()) {
       return res.status(403).send({ error: 'Access denied' });
    }
    
    const oldStatus = ticket.status;
    const { status, assignedTo, comment } = req.body;
    
    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    
    // Track history
    if (status || assignedTo || comment) {
      ticket.history.push({
        status: status || ticket.status,
        updatedBy: req.user._id,
        comment: comment || (status ? `Status changed from ${oldStatus} to ${status}` : 'Ticket updated')
      });
    }
    
    await ticket.save();
    
    // If status changed, notify customer
    if (status && status !== oldStatus) {
      const notif = new Notification({
        userId: ticket.customer,
        role: 'customer',
        message: `Support Update: Ticket #${ticket._id.toString().slice(-6)} moved to ${status}`,
        type: 'order_update'
      });
      await notif.save();
    }
    
    res.send(ticket);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
