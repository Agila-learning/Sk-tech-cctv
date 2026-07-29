const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { auth, authorize } = require('../middleware/auth');

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Get offers (Admin gets all, others get active)
router.get('/', async (req, res) => {
    try {
      let query = { isActive: true };
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findOne({ _id: decoded._id });
          if (user && user.role === 'admin') {
            query = {};
          }
        } catch (e) {
          // Ignore token errors, fallback to public active offers
        }
      }
      const offers = await Offer.find(query).sort({ expiryDate: 1 });
      res.send(offers);
    } catch (error) {
      res.status(500).send(error);
    }
});

// Create Offer (Admin)
router.post('/', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const offer = new Offer(req.body);
    await offer.save();
    res.status(201).send(offer);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Update Offer (Admin)
router.patch('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) return res.status(404).send({ error: 'Offer not found' });
    res.send(offer);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete Offer (Admin)
router.delete('', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).send({ error: 'Offer not found' });
    res.send({ message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
