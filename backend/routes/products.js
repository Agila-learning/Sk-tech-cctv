const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

// Get all products with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { category, brand, search, minPrice, maxPrice, usage, resolution, sort, page = 1, limit = 10 } = req.query;
    let query = {};
    if (category) {
      const categories = category.split(',').filter(Boolean);
      if (categories.length > 0) query.category = { $in: categories };
    }
    if (brand) query.brand = brand;
    if (usage) query.usage = usage;
    if (resolution) query.resolution = resolution;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { 'ratings.average': -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.send({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send({ error: 'Product not found' });
    res.send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get related products
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send({ error: 'Product not found' });
    
    // Find products in same category, excluding current product
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);
    
    res.send(related);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Create product (Admin only)
router.post('/', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    console.error('[Product Create Error]:', error.message, error.errors ? JSON.stringify(error.errors) : '');
    res.status(400).send({ error: error.message, details: error.errors });
  }
});

// Update product (Admin only)
router.patch('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) return res.status(404).send({ error: 'Product not found' });

    const updates = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    // Audit Log for Price Change
    if (updates.price !== undefined && oldProduct.price !== updates.price) {
      await AuditLog.create({
        entityId: product._id,
        entityType: 'Product',
        action: 'PRICE_CHANGE',
        performedBy: req.user._id,
        previousValues: { price: oldProduct.price },
        newValues: { price: updates.price },
        remarks: `Price updated from ${oldProduct.price} to ${updates.price} by ${req.user.name}`
      });
    }

    res.send(product);
  } catch (error) {
    console.error('[Product Update Error]:', error.message, error.errors ? JSON.stringify(error.errors) : '');
    res.status(400).send({ error: error.message, details: error.errors });
  }
});

// Delete product (Admin only)
router.delete('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).send({ error: 'Product not found' });
    res.send(product);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
