const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Update Profile Photo
router.patch('/photo', auth, async (req, res) => {
  try {
    const { profilePic } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { profilePic }, { new: true });
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Upload Document
router.patch('/document', auth, async (req, res) => {
  try {
    const { name, url } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, {
      $push: { documents: { name, url, uploadedAt: new Date() } }
    }, { new: true });
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Reset Password
router.patch('/reset-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).send({ error: 'Invalid current password' });
    
    user.password = newPassword;
    await user.save();
    res.send({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get Profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
