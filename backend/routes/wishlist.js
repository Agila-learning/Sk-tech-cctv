const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get user wishlist
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) return res.status(404).send({ error: 'User not found' });
    res.send(user.wishlist);
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

    const exists = user.wishlist.some(id => id.toString() === productId);
    if (!exists) {
      user.wishlist.push(productId);
    } else {
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    }

    await user.save();
    res.send(user.wishlist);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
