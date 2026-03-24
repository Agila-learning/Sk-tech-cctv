const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const { auth, authorize } = require('../middleware/auth');

// Get available slots by date
router.get('/available', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).send({ message: 'Date is required' });

    // Find slots for this date that are not booked
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const availableSlots = await Slot.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      isBooked: false
    }).populate('technician', 'name phone');

    res.send(availableSlots);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin: Bulk create slots for a technician
router.post('/bulk-create', auth, authorize('admin', 'technician'), async (req, res) => {
  try {
    const { technicianId, date, slots } = req.body; // slots: [{startTime, endTime}]
    if (!technicianId || !date || !slots || !slots.length) {
      return res.status(400).send({ message: 'TechnicianId, date, and slots array are required' });
    }

    const slotData = slots.map(s => {
      if (!s.startTime || !s.endTime) throw new Error('Each slot must have startTime and endTime');
      return {
        technician: technicianId,
        date: new Date(date),
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: false
      };
    });

    // Use insertMany with ordered: false to skip duplicates if index exists
    const createdSlots = await Slot.insertMany(slotData, { ordered: false });
    res.status(201).send(createdSlots);
  } catch (error) {
    console.error("Bulk Slot Create Error:", error);
    if (error.code === 11000) {
      return res.status(400).send({ message: 'One or more slots already exist for this time and technician.', error: error });
    }
    res.status(400).send({ message: error.message || "Failed to create slots", error });
  }
});

// Admin/Technician: Delete a slot
router.delete('/:id', auth, authorize('admin', 'technician'), async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).send({ error: 'Slot not found' });
    
    if (slot.isBooked) {
      return res.status(400).send({ error: 'Cannot delete a booked slot' });
    }

    await slot.deleteOne();
    res.send({ message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
