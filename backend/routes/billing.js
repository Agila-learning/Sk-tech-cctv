const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { auth, authorize } = require('../middleware/auth');

// Get all invoices
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer', 'name email phone')
      .populate('order')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create invoice
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { orderId, items: manualItems, manualCustomer, taxRate: reqTaxRate } = req.body;
    
    let finalItems = manualItems || [];
    let subtotal = 0;
    let orderRef = null;
    let customerRef = req.body.customer;

    const Order = require('../models/Order');
    const Product = require('../models/Product');

    if (orderId) {
      const order = await Order.findById(orderId).populate('products.product');
      if (!order) return res.status(404).send({ message: "Order not found" });
      
      orderRef = order._id;
      customerRef = order.customer;
      
      // Map order products to invoice items if not manually provided
      if (!manualItems) {
        finalItems = order.products.map(item => ({
          description: item.product?.name || 'Hardware Cluster',
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.price * item.quantity
        }));
      }
    }

    finalItems.forEach(item => {
      subtotal += item.total || (item.unitPrice * item.quantity);
    });

    const taxRate = reqTaxRate || 18; // Default 18% GST
    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    const invoice = new Invoice({
      ...req.body,
      customer: customerRef,
      order: orderRef,
      items: finalItems,
      taxRate,
      taxAmount,
      totalAmount,
      status: 'sent'
    });

    const newInvoice = await invoice.save();
    res.status(201).json(newInvoice);
  } catch (err) {
    console.error('[Billing Error]:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update invoice status
router.patch('/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    if (req.body.status) invoice.status = req.body.status;
    if (req.body.paidAt) invoice.paidAt = req.body.paidAt;
    
    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete invoice
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
