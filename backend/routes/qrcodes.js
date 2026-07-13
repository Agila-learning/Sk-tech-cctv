const express = require('express');
const router = express.Router();
const QRCode = require('../models/QRCode');
const { auth, checkRole } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// ─── GET /api/qrcodes ────────────────────────────────────────────────────────
// Technicians get only active, Admins can get all (handled by query params or role)
router.get('/', auth, async (req, res) => {
  try {
    const query = {};
    if (req.user.role !== 'admin' || req.query.activeOnly === 'true') {
      query.status = true;
    }
    const qrcodes = await QRCode.find(query).sort({ displayOrder: 1, createdAt: -1 });
    res.json(qrcodes);
  } catch (error) {
    console.error('[Get QRCodes]', error);
    res.status(500).json({ message: 'Server error fetching QR codes' });
  }
});

// ─── POST /api/qrcodes ───────────────────────────────────────────────────────
// Admin only
router.post('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const newQr = new QRCode({
      ...req.body,
      createdBy: req.user._id
    });
    const savedQr = await newQr.save();
    
    // Notify technicians to sync
    await createNotification(req.app, {
      role: 'technician',
      type: 'qr_code_update',
      title: 'New QR Code Available',
      message: `A new QR code (${savedQr.qrName}) has been added. Please sync.`
    });

    res.status(201).json(savedQr);
  } catch (error) {
    console.error('[Create QRCode]', error);
    res.status(500).json({ message: 'Server error creating QR code' });
  }
});

// ─── PUT /api/qrcodes/:id ────────────────────────────────────────────────────
// Admin only
router.put('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const updatedQr = await QRCode.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedQr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    // Notify technicians to sync
    await createNotification(req.app, {
      role: 'technician',
      type: 'qr_code_update',
      title: 'QR Code Updated',
      message: `The QR code (${updatedQr.qrName}) has been updated. Please sync.`
    });

    res.json(updatedQr);
  } catch (error) {
    console.error('[Update QRCode]', error);
    res.status(500).json({ message: 'Server error updating QR code' });
  }
});

// ─── PUT /api/qrcodes/:id/toggle ─────────────────────────────────────────────
// Admin only
router.put('/:id/toggle', auth, checkRole('admin'), async (req, res) => {
  try {
    const qr = await QRCode.findById(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    qr.status = !qr.status;
    await qr.save();

    await createNotification(req.app, {
      role: 'technician',
      type: 'qr_code_update',
      title: 'QR Code Status Changed',
      message: `The QR code (${qr.qrName}) status has been changed. Please sync.`
    });

    res.json(qr);
  } catch (error) {
    console.error('[Toggle QRCode]', error);
    res.status(500).json({ message: 'Server error toggling QR code status' });
  }
});

// ─── DELETE /api/qrcodes/:id ─────────────────────────────────────────────────
// Admin only
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const qr = await QRCode.findByIdAndDelete(req.params.id);
    if (!qr) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    await createNotification(req.app, {
      role: 'technician',
      type: 'qr_code_update',
      title: 'QR Code Removed',
      message: `A QR code has been removed. Please sync.`
    });

    res.json({ message: 'QR Code deleted successfully' });
  } catch (error) {
    console.error('[Delete QRCode]', error);
    res.status(500).json({ message: 'Server error deleting QR code' });
  }
});

module.exports = router;
