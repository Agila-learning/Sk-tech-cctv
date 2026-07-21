const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all reviews (Admin only)
router.get('/', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('customer', 'name email avatar')
      .populate('technician', 'name phone')
      .populate('product', 'name images')
      .sort({ createdAt: -1 });
    res.send(reviews);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin Review Analytics
router.get('/analytics', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const total = await Review.countDocuments();
    const pending = await Review.countDocuments({ status: 'pending' });
    const approved = await Review.countDocuments({ status: 'approved' });
    const rejected = await Review.countDocuments({ status: 'rejected' });
    
    // Average ratings
    const avgProductObj = await Review.aggregate([
      { $match: { status: 'approved', publishStatus: true, productRating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$productRating' } } }
    ]);
    const avgTechObj = await Review.aggregate([
      { $match: { status: 'approved', publishStatus: true, technicianRating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$technicianRating' } } }
    ]);

    const avgProductRating = avgProductObj[0] ? avgProductObj[0].avgRating.toFixed(1) : 0;
    const avgTechnicianRating = avgTechObj[0] ? avgTechObj[0].avgRating.toFixed(1) : 0;

    res.send({ total, pending, approved, rejected, avgProductRating, avgTechnicianRating });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get all live reviews for a product (Public)
router.get('/product/:productId', async (req, res) => {
  try {
    const { sort, filter } = req.query;
    
    let query = { 
      product: req.params.productId,
      status: 'approved',
      publishStatus: true
    };
    
    // Filters
    if (filter === 'verified') query.isVerifiedPurchase = true;
    if (filter === 'images') query.images = { $exists: true, $not: { $size: 0 } };
    if (filter === 'videos') query.videoUrl = { $exists: true, $ne: '' };
    if (filter === '5star') query.rating = 5;
    if (filter === '4star') query.rating = 4;
    if (filter === '3star') query.rating = 3;
    if (filter === '2star') query.rating = 2;
    if (filter === '1star') query.rating = 1;

    let sortQuery = { createdAt: -1 }; // Newest default
    if (sort === 'highest') sortQuery = { rating: -1, createdAt: -1 };
    if (sort === 'lowest') sortQuery = { rating: 1, createdAt: -1 };
    if (sort === 'helpful') sortQuery = { helpfulCount: -1, createdAt: -1 };
    
    // Always pin featured/pinned reviews to top
    const sortConfig = { pinned: -1, featured: -1, ...sortQuery };

    const reviews = await Review.find(query)
      .populate('customer', 'name avatar')
      .populate('technician', 'name')
      .sort(sortConfig);
      
    res.send(reviews);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get average rating (internal/public stats)
router.get('/rating/:productId', async (req, res) => {
  try {
    const result = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.productId), status: 'approved', publishStatus: true } },
      { $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' }, 
          count: { $sum: 1 },
          star5: { $sum: { $cond: [ { $eq: ['$rating', 5] }, 1, 0 ] } },
          star4: { $sum: { $cond: [ { $eq: ['$rating', 4] }, 1, 0 ] } },
          star3: { $sum: { $cond: [ { $eq: ['$rating', 3] }, 1, 0 ] } },
          star2: { $sum: { $cond: [ { $eq: ['$rating', 2] }, 1, 0 ] } },
          star1: { $sum: { $cond: [ { $eq: ['$rating', 1] }, 1, 0 ] } }
      } }
    ]);
    res.send(result[0] || { avgRating: 0, count: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Post a review (Customer)
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, technician, product, rating, title, comment, recommendProduct, isAnonymous, installationRating, productRating, technicianRating, valueForMoney, easyToUse, overallExperience, images, videoUrl, variant } = req.body;
    
    // Check images limit
    if (images && images.length > 5) {
      return res.status(400).send({ error: 'Maximum 5 images allowed' });
    }

    let isVerifiedPurchase = false;

    // Check for duplicate review and verified purchase
    if (orderId) {
      const existing = await Review.findOne({ order: orderId, product, customer: req.user._id });
      if (existing) return res.status(400).send({ error: 'Review already submitted for this product in this order' });
      
      const order = await Order.findById(orderId);
      if (order && (order.status === 'delivered' || order.status === 'completed')) {
        isVerifiedPurchase = true;
      } else {
        return res.status(400).send({ error: 'Order must be delivered or completed to leave a review' });
      }
    }

    const review = new Review({
      order: orderId,
      technician,
      product,
      variant,
      title,
      rating,
      comment,
      recommendProduct,
      isAnonymous,
      installationRating,
      productRating,
      technicianRating,
      valueForMoney,
      easyToUse,
      overallExperience,
      images,
      videoUrl,
      customer: req.user._id,
      isVerifiedPurchase,
      status: 'pending',
      publishStatus: false
    });
    
    await review.save();

    // Attach feedback to the Order so the frontend knows it was reviewed
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        feedback: { rating, comment, images, date: new Date() }
      });
    }

    res.status(201).send({ message: 'Review successfully submitted for moderation', review });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Mark helpful (Public)
router.patch('/:id/helpful', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } }, { new: true });
    if (!review) return res.status(404).send({ error: 'Review not found' });
    res.send({ helpfulCount: review.helpfulCount });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Report review (Public)
router.patch('/:id/report', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { reportCount: 1 } }, { new: true });
    if (!review) return res.status(404).send({ error: 'Review not found' });
    res.send({ reportCount: review.reportCount });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Technician Recommend (Technician only)
router.patch('/:id/recommend', auth, authorize('technician', 'admin', 'sub-admin'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).send({ error: 'Review not found' });
    
    review.technicianRecommended = true;
    await review.save();
    res.send(review);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update review (Admin only - for moderation)
router.patch('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['status', 'publishStatus', 'featured', 'pinned', 'topRated', 'adminReply', 'title', 'comment'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates' });
    }

    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) return res.status(404).send({ error: 'Review not found' });

    // Re-calculate technician ratings if necessary (e.g. status changed to approved)
    if (review.technician && req.body.status === 'approved') {
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
router.delete('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).send({ error: 'Review not found' });
    res.send({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
