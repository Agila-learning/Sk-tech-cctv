const express = require('express');
const router = express.Router();
const ProductWarranty = require('../models/ProductWarranty');
const { auth, authorize } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

// @route   POST /api/product-warranty
// @desc    Create a new product warranty request (Admin or Tech)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const warranty = new ProductWarranty({
      ...req.body,
      createdBy: req.user._id
    });
    const saved = await warranty.save();
    
    // Audit log
    await ActivityLog.create({
      user: req.user._id,
      action: 'Create Product Warranty',
      details: `Product Warranty for ${saved.productName} created.`,
      module: 'ProductWarranty'
    });

    if (saved.nextFollowUpDate) {
      const { createNotification } = require('../utils/notificationHelper');
      await createNotification(req.app, {
        role: 'admin',
        type: 'product_warranty',
        message: `New Product Warranty for ${saved.productName}. Follow-up Date: ${new Date(saved.nextFollowUpDate).toLocaleDateString()}`
      });
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/product-warranty
// @desc    Get all product warranties
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const filters = {};
    if (req.user.role === 'technician') {
       // Techs see what they created or what is assigned to them
       filters.$or = [{ createdBy: req.user._id }, { assignedTechnician: req.user._id }];
    }
    const warranties = await ProductWarranty.find(filters)
      .populate('createdBy', 'name email')
      .populate('assignedTechnician', 'name email')
      .sort('-createdAt');
    res.json(warranties);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/product-warranty/:id
// @desc    Update warranty
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const warranty = await ProductWarranty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (req.body.status) {
      await ActivityLog.create({
        user: req.user._id,
        action: 'Update Product Warranty Status',
        details: `Updated status to ${req.body.status} for ${warranty.productName}`,
        module: 'ProductWarranty'
      });
    }

    if (req.body.nextFollowUpDate) {
      const { createNotification } = require('../utils/notificationHelper');
      const followUpMsg = `Product Warranty follow-up for ${warranty.productName}. Next Follow-up: ${new Date(req.body.nextFollowUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      
      // Notify admin
      await createNotification(req.app, {
        role: 'admin',
        type: 'product_warranty',
        message: followUpMsg
      });

      // Also notify the assigned technician if there is one
      if (warranty.assignedTechnician) {
        await createNotification(req.app, {
          userId: warranty.assignedTechnician,
          type: 'product_warranty',
          message: `Follow-up scheduled: ${followUpMsg}`
        });
      }
    }

    res.json(warranty);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/product-warranty/:id
// @desc    Delete warranty (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await ProductWarranty.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
