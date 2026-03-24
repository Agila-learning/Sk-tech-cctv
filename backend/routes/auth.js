const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

// Request OTP placeholder
router.post('/otp/request', async (req, res) => {
  const { phone } = req.body;
  // In a real app, generate OTP and send via SMS (e.g. Twilio)
  const otp = '123456'; 
  console.log(`[AUTH] OTP for ${phone}: ${otp}`);
  res.send({ message: 'OTP sent to mobile device', status: 'pending' });
});

// Verify OTP placeholder
router.post('/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;
  if (otp === '123456') {
    // Generate JWT and send response
    res.send({ message: 'Authentication Successful', token: 'production-jwt-token' });
  } else {
    res.status(401).send({ message: 'Invalid OTP Code' });
  }
});

module.exports = router;
