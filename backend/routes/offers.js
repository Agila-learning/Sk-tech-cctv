const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { auth, authorize } = require('../middleware/auth');

// Get offers (Admin gets all, others get active)
router.get('/', auth, async (req, res) => {
    try {
      const query = req.user && req.user.role === 'admin' ? {} : { isActive: true };
      const offers = await Offer.find(query).sort({ expiryDate: 1 });
      res.send(offers);
    } catch (error) {
      res.status(500).send(error);
    }
});

// Create Offer (Admin)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const offer = new Offer(req.body);
    await offer.save();
    res.status(201).send(offer);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update Offer (Admin)
router.patch('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) return res.status(404).send({ error: 'Offer not found' });
    res.send(offer);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete Offer (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).send({ error: 'Offer not found' });
    res.send({ message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
