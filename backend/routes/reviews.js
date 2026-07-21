const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');

// Get all reviews (Admin only)
router.get('/', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('customer', 'name email')
      .populate('technician', 'name phone')
      .populate('product', 'name sku')
      .sort({ createdAt: -1 });
    res.send(reviews);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update review status / flags (Admin moderation)
router.patch('/:id/moderate', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const { status, publishStatus, featured, pinned, adminReply } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id, 
      { $set: { status, publishStatus, featured, pinned, adminReply } }, 
      { new: true }
    );
    if (!review) return res.status(404).send({ error: 'Review not found' });

    // Update technician ratings if applicable and published
    if (review.technician && publishStatus) {
      const allTechReviews = await Review.find({ technician: review.technician, publishStatus: true });
      const avgRating = allTechReviews.length > 0 
        ? allTechReviews.reduce((acc, curr) => acc + (curr.technicianRating || curr.rating), 0) / allTechReviews.length 
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

// Get all published reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ 
      product: req.params.productId,
      publishStatus: true 
    }).populate('customer', 'name avatar').sort({ pinned: -1, featured: -1, createdAt: -1 });
    res.send(reviews);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Post a review
router.post('/', auth, async (req, res) => {
  try {
    const { 
      orderId, technician, product, rating, title, comment, recommendedProduct,
      installationRating, productRating, technicianRating, valueForMoney, 
      easyToUse, overallExperience, images, videoUrl, isAnonymous 
    } = req.body;
    
    // Validate Purchase
    let isVerifiedPurchase = false;
    let verifiedInstallation = false;

    if (orderId) {
      const existing = await Review.findOne({ order: orderId, product });
      if (existing) return res.status(400).send({ error: 'Review already submitted for this product in this order.' });
      
      const order = await Order.findOne({ _id: orderId, customer: req.user._id });
      if (!order) return res.status(403).send({ error: 'You have not purchased this product.' });
      
      if (order.orderStatus === 'Delivered' || order.orderStatus === 'Completed' || order.installationStatus === 'Completed') {
        isVerifiedPurchase = true;
        if (order.installationStatus === 'Completed') verifiedInstallation = true;
      } else {
        return res.status(403).send({ error: 'You can only review products that have been delivered or installed.' });
      }
    } else {
      return res.status(400).send({ error: 'Order ID is required to submit a verified review.' });
    }

    const review = new Review({
      order: orderId,
      technician,
      product,
      customer: req.user._id,
      rating,
      title,
      comment,
      recommendedProduct,
      installationRating,
      productRating,
      technicianRating,
      valueForMoney,
      easyToUse,
      overallExperience,
      images,
      videoUrl,
      isAnonymous,
      isVerifiedPurchase,
      verifiedInstallation,
      status: 'pending',
      publishStatus: false // Requires admin approval
    });
    await review.save();

    // Attach feedback flag to the Order so the frontend knows it was reviewed
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        feedback: { rating, comment, date: new Date() }
      });
    }

    res.status(201).send({ message: 'Review successfully submitted and is pending approval.', review });
  } catch (error) {
    res.status(400).send({ error: error.message || 'Error submitting review.' });
  }
});

// Upvote helpful count
router.post('/:id/helpful', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } }, { new: true });
    if (!review) return res.status(404).send({ error: 'Review not found' });
    res.send({ helpfulCount: review.helpfulCount });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get average rating and stats (internal)
router.get('/rating/:productId', async (req, res) => {
  try {
    const result = await Review.aggregate([
      { $match: { product: req.params.productId, publishStatus: true } },
      { $group: { 
          _id: null, 
          avgRating: { $avg: '$rating' }, 
          count: { $sum: 1 },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      }}
    ]);
    res.send(result[0] || { avgRating: 0, count: 0, star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
