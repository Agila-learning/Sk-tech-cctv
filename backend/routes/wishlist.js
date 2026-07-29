const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get user wishlist
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) return res.status(404).send({ error: 'User not found' });
    // Filter out nulls in case products were deleted
    const validWishlist = user.wishlist.filter(item => item != null);
    res.send(validWishlist);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Toggle wishlist item (Add/Remove)
router.post('/toggle', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send({ error: 'User not found' });

    const exists = user.wishlist.some(id => id && id.toString() === productId);
    if (!exists) {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: productId } });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: productId } });
    }

    const updatedUser = await User.findById(req.user._id);
    res.send(updatedUser.wishlist);
  } catch (error) {
    console.error("Wishlist Toggle Error:", error);
    res.status(400).send(error);
  }
});

module.exports = router;
