const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { auth, authorize } = require('../middleware/auth');

// Get all active offers
router.get('/', async (req, res) => {
    try {
      const offers = await Offer.find({ isActive: true });
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

module.exports = router;
