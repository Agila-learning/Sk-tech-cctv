const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { auth } = require('../middleware/auth');

// Email Transporter (Placeholder for production config)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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
    if (!email || !password) {
      return res.status(400).send({ error: 'Email and password are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    console.log(`[AUTH] Login attempt received for: "${cleanEmail}"`);
    
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      console.warn(`[AUTH] Login failed: User not found for email "${cleanEmail}"`);
      return res.status(401).send({ error: 'Invalid login credentials' });
    }

    const isMatch = await user.comparePassword(password.trim());
    if (!isMatch) {
      console.warn(`[AUTH] Login failed: Incorrect password for "${cleanEmail}"`);
      return res.status(401).send({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'fallback_secret_key');
    console.log(`[AUTH] Login successful for: "${cleanEmail}" (Role: ${user.role})`);
    res.send({ user, token });
  } catch (error) {
    console.error(`[AUTH] Login Route Error:`, error);
    res.status(400).send({ error: 'Authentication processing error', details: error.message });
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

    // Generate 6-digit OTP token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

    const mailOptions = {
      from: `"SK Tech CCTV Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Security: Password Reset OTP Initialized',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb; text-transform: uppercase;">Security Alert</h2>
          <p>A password reset was requested for your account at SK Tech CCTV.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin-bottom: 10px; font-size: 14px; color: #64748b;">Your 6-Digit Password Reset Verification Code:</p>
            <h1 style="color: #1e3a8a; font-size: 36px; letter-spacing: 8px; margin: 0;">${token}</h1>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Enter this code in the SK Tech mobile application to reset your password. This code expires in 1 hour.</p>
          </div>
          <p style="color: #64748b; font-size: 12px;">If you did not request this, please ignore this email or contact support immediately.</p>
        </div>
      `
    };

    // Attempt to send email
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
        console.log(`[SECURITY] Reset OTP email dispatched to ${user.email}`);
      } else {
        console.log(`\n[SECURITY] [NO SMTP CONFIG] Password Reset OTP Requested for ${email}`);
        console.log(`[OTP CODE] ${token}\n`);
      }
    } catch (mailError) {
      console.error('[SECURITY] Mailer Error:', mailError);
      // Still log the code as fallback
      console.log(`[FALLBACK OTP CODE] ${token}`);
    }

    res.send({ message: 'Security: Password reset OTP generated and dispatched.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: req.params.token.trim(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ error: 'Security: Reset OTP is invalid or has expired.' });
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

// Change Password (Authenticated)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).send({ error: 'Security: Primary authentication failed. Current password incorrect.' });
    }

    req.user.password = newPassword;
    await req.user.save();

    res.send({ message: 'Security: Credential update successful within secure session.' });
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

// Update Push Token
router.patch('/push-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    req.user.pushToken = token;
    await req.user.save();
    res.send({ message: 'Push token updated successfully' });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
