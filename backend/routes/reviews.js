const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Get all reviews (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const reviews = await Review.find().populate('customer', 'name email').sort({ createdAt: -1 });
    res.send(reviews);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update review (Admin only - for manual overrides)
router.patch('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) return res.status(404).send({ error: 'Review not found' });

    // Re-calculate ratings if necessary
    if (review.technician) {
      const allTechReviews = await Review.find({ technician: review.technician, status: 'approved' });
      const avgRating = allTechReviews.length > 0 
        ? allTechReviews.reduce((acc, curr) => acc + curr.rating, 0) / allTechReviews.length 
        : 0;
      
      await User.findByIdAndUpdate(review.technician, {
        rating: avgRating.toFixed(1),
        reviewCount: allTechReviews.length
      });
    }

    res.send(review);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete review (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).send({ error: 'Review not found' });
    res.send({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ 
      product: req.params.productId,
      status: 'approved' 
    }).populate('customer', 'name avatar').sort({ createdAt: -1 });
    res.send(reviews);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Post a review
router.post('/', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();

    // If review is for a technician, update their average rating
    if (req.body.technician) {
      const User = require('../models/User');
      const allTechReviews = await Review.find({ technician: req.body.technician });
      const approvedReviews = allTechReviews.filter(r => r.status === 'approved');
      
      if (approvedReviews.length > 0) {
        const avgRating = approvedReviews.reduce((acc, curr) => acc + curr.rating, 0) / approvedReviews.length;
        await User.findByIdAndUpdate(req.body.technician, {
          rating: avgRating.toFixed(1),
          reviewCount: approvedReviews.length
        });
      }
    }

    res.status(201).send({ message: 'Review successfully recorded', review });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get average rating (internal)
router.get('/rating/:productId', async (req, res) => {
  try {
    const result = await Review.aggregate([
      { $match: { product: req.params.productId, status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    res.send(result[0] || { avgRating: 0, count: 0 });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
