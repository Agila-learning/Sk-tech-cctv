const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const QRCode = require('../models/QRCode');
const { createNotification } = require('../utils/notificationHelper');

// Get active QR codes (For Technician & Admin)
router.get('/', auth, authorize('admin', 'sub-admin', 'technician'), async (req, res) => {
  try {
    const qrcodes = await QRCode.find({ status: true }).sort({ displayOrder: 1, createdDate: -1 });
    res.json(qrcodes);
  } catch (error) {
    console.error('[QRCode GET Error]', error);
    res.status(500).json({ message: 'Error fetching QR codes' });
  }
});

// Get all QR codes (For Admin only - includes inactive)
router.get('/admin', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const qrcodes = await QRCode.find().sort({ displayOrder: 1, createdDate: -1 });
    res.json(qrcodes);
  } catch (error) {
    console.error('[QRCode GET Admin Error]', error);
    res.status(500).json({ message: 'Error fetching all QR codes' });
  }
});

// Create new QR Code (Admin only)
router.post('/', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const qrData = { ...req.body, createdBy: req.user.id };
    const newQRCode = new QRCode(qrData);
    await newQRCode.save();

    // Notify technicians
    if (newQRCode.status) {
      await createNotification(req.app, {
        role: 'technician',
        type: 'qrcode_update',
        title: 'New QR Code Added',
        message: `Admin added a new QR Code: ${newQRCode.qrName}. Please sync your app.`,
      });
    }

    res.status(201).json(newQRCode);
  } catch (error) {
    console.error('[QRCode POST Error]', error);
    res.status(500).json({ message: 'Error creating QR code' });
  }
});

// Update QR Code (Admin only)
router.put('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const updatedQRCode = await QRCode.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!updatedQRCode) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    // Notify technicians
    await createNotification(req.app, {
      role: 'technician',
      type: 'qrcode_update',
      title: 'QR Code Updated',
      message: `Admin updated a QR Code: ${updatedQRCode.qrName}. Please sync your app.`,
    });

    res.json(updatedQRCode);
  } catch (error) {
    console.error('[QRCode PUT Error]', error);
    res.status(500).json({ message: 'Error updating QR code' });
  }
});

// Toggle QR Code Status (Admin only)
router.put('/:id/toggle', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const qrcode = await QRCode.findById(req.params.id);
    if (!qrcode) {
      return res.status(404).json({ message: 'QR Code not found' });
    }
    
    qrcode.status = !qrcode.status;
    await qrcode.save();

    // Notify technicians
    await createNotification(req.app, {
      role: 'technician',
      type: 'qrcode_update',
      title: 'QR Code Status Updated',
      message: `Admin ${qrcode.status ? 'activated' : 'deactivated'} a QR Code: ${qrcode.qrName}. Please sync your app.`,
    });

    res.json(qrcode);
  } catch (error) {
    console.error('[QRCode Toggle Error]', error);
    res.status(500).json({ message: 'Error toggling QR code status' });
  }
});

// Delete QR Code (Admin only)
router.delete('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const deletedQRCode = await QRCode.findByIdAndDelete(req.params.id);
    
    if (!deletedQRCode) {
      return res.status(404).json({ message: 'QR Code not found' });
    }

    // Notify technicians
    await createNotification(req.app, {
      role: 'technician',
      type: 'qrcode_update',
      title: 'QR Code Removed',
      message: `Admin removed a QR Code. Please sync your app.`,
    });

    res.json({ message: 'QR Code deleted successfully' });
  } catch (error) {
    console.error('[QRCode DELETE Error]', error);
    res.status(500).json({ message: 'Error deleting QR code' });
  }
});

module.exports = router;
