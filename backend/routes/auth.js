const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    // Security: Only allow public registration for 'customer' role
    const user = new User({ 
      name, 
      email: email.toLowerCase(), 
      password, 
      role: 'customer', 
      phone, 
      address 
    });
    await user.save();
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send({ error: 'Invalid login credentials' });
    }
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).send({ error: 'System: User not found in database.' });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Log the reset link (Simulating email)
    console.log(`\n[SECURITY] Password Reset Requested for ${email}`);
    console.log(`[LINK] http://localhost:3000/reset-password/${token}\n`);

    res.send({ message: 'Security: Password reset link generated and dispatched.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ error: 'Security: Reset token is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.send({ message: 'Security: Credential update successful. You may now login.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Request OTP placeholder
router.post('/otp/request', async (req, res) => {
  const { phone } = req.body;
  const otp = '123456'; 
  console.log(`[AUTH] OTP for ${phone}: ${otp}`);
  res.send({ message: 'OTP sent to mobile device', status: 'pending' });
});

// Verify OTP placeholder
router.post('/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;
  if (otp === '123456') {
    res.send({ message: 'Authentication Successful', token: 'production-jwt-token' });
  } else {
    res.status(401).send({ message: 'Invalid OTP Code' });
  }
});

module.exports = router;
