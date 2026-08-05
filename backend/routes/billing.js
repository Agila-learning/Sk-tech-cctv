const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// Get all invoices
router.get('/', auth, authorize('admin', 'technician'), async (req, res) => {
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
router.post('/', auth, authorize('admin', 'technician'), async (req, res) => {
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

    let locationObj = req.body.location;
    if (req.body.lat && req.body.lng) {
      locationObj = { address: req.body.locationAddress || req.body.address || '', lat: parseFloat(req.body.lat), lng: parseFloat(req.body.lng) };
    }

    const invoice = new Invoice({
      ...req.body,
      customer: customerRef,
      order: orderRef,
      items: finalItems,
      taxRate,
      taxAmount,
      totalAmount,
      type: req.body.type || 'invoice',
      warranty: req.body.warranty || '12 Months',
      notes: req.body.notes || '',
      location: locationObj,
      status: (req.user && req.user.role === 'technician') ? 'draft' : 'sent',
      quotationStatus: req.body.type === 'quotation' ? 'Pending' : undefined,
      followUpDate: req.body.type === 'quotation' ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : undefined,
      followUpHistory: [{
        remarks: `${req.body.type === 'quotation' ? 'Quotation' : 'Invoice'} created`,
        status: req.body.type === 'quotation' ? 'Pending' : 'Draft',
        calledBy: req.user ? req.user._id : undefined,
        date: new Date()
      }]
    });

    const newInvoice = await invoice.save();
    
    // Notify Admins
    const isTech = req.user && req.user.role === 'technician';
    await createNotification(req.app, {
      role: 'admin',
      title: isTech ? 'Draft Invoice Submitted' : 'New Manual Invoice Generated',
      message: isTech 
        ? `Technician ${req.user.name || ''} has submitted a draft invoice of ₹${totalAmount} for ${customerRef ? 'a registered customer' : (manualCustomer?.name || 'a new customer')} pending approval.`
        : `An invoice of ₹${totalAmount} for ${customerRef ? 'a registered customer' : (manualCustomer?.name || 'a new customer')} has been generated.`,
      type: 'billing',
      metadata: { invoiceId: newInvoice._id, amount: totalAmount }
    });

    // Notify Technician (Self Notification)
    if (req.user && req.user._id) {
      await createNotification(req.app, {
        userId: req.user._id,
        role: 'technician',
        title: isTech ? 'Draft Invoice Saved' : 'Invoice Saved',
        message: isTech
          ? `Your draft invoice for ₹${totalAmount} has been saved and sent to admins for approval.`
          : `Your invoice for ₹${totalAmount} has been successfully generated and saved.`,
        type: 'billing',
        metadata: { invoiceId: newInvoice._id, amount: totalAmount }
      });
    }

    res.status(201).json(newInvoice);
  } catch (err) {
    console.error('[Billing Error]:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update invoice status
router.patch('/:id/status', auth, authorize('admin', 'sub-admin'), async (req, res) => {
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

// Update follow-up status (Quotations/Billing)
router.patch('/:id/follow-up', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    if (req.body.followUpStatus) {
      invoice.followUpStatus = req.body.followUpStatus;
    }
    
    if (req.body.remarks || req.body.followUpStatus) {
      invoice.followUpHistory.push({
        remarks: req.body.remarks || `Status updated to ${req.body.followUpStatus}`,
        status: req.body.followUpStatus || invoice.followUpStatus,
        calledBy: req.user._id,
        date: new Date()
      });
    }
    
    const updatedInvoice = await invoice.save();
    
    // Notify Admins
    const { createNotification } = require('../utils/notificationHelper');
    await createNotification(req.app, {
      role: 'admin',
      type: 'system_alert',
      message: `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} #${invoice.invoiceNumber} follow-up status updated to: ${req.body.followUpStatus}`,
    });

    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_notification', {
        title: `Follow-Up Update`,
        message: `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} #${invoice.invoiceNumber} is now ${req.body.followUpStatus}.`,
        role: 'admin'
      });
    }

    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete invoice
router.delete('/:id', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Add Follow-up
router.post('/:id/follow-up', auth, authorize('admin', 'technician'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Quotation not found' });
    if (invoice.type !== 'quotation') return res.status(400).json({ message: 'Not a quotation' });

    const newHistory = {
      date: new Date(),
      remarks: req.body.remarks,
      calledBy: req.user._id,
      nextFollowUp: req.body.nextFollowUp || invoice.followUpDate,
      status: req.body.status || invoice.quotationStatus
    };

    invoice.followUpHistory.push(newHistory);
    invoice.quotationStatus = req.body.status || invoice.quotationStatus;
    if (req.body.nextFollowUp) invoice.followUpDate = new Date(req.body.nextFollowUp);

    await invoice.save();

    // Broadcast to Admin and all Technicians about follow up / status change
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_notification', {
        title: `Quotation Update: ${invoice.quotationStatus}`,
        message: `Quotation #${invoice._id.toString().slice(-6)} status is now ${invoice.quotationStatus}. Follow-up: ${invoice.followUpDate ? new Date(invoice.followUpDate).toLocaleDateString() : 'None'}`,
        role: 'technician',
        broadcastAll: true
      });
    }

    await createNotification(req.app, {
      role: 'admin',
      type: 'billing_update',
      message: `Quotation #${invoice._id.toString().slice(-6)} status is now ${invoice.quotationStatus}. Follow-up: ${invoice.followUpDate ? new Date(invoice.followUpDate).toLocaleDateString() : 'None'}`
    });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// General update endpoint - MUST be at the bottom to prevent route collisions
router.patch('/:id', auth, authorize('admin', 'technician'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // 1. Edit Full Invoice Details (from Manual Invoice page)
    if (req.body.items) {
      let subtotal = 0;
      req.body.items.forEach(item => {
        subtotal += item.total || (item.unitPrice * item.quantity);
      });
      const taxRate = req.body.taxRate !== undefined ? req.body.taxRate : invoice.taxRate;
      const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
      const totalAmount = subtotal + taxAmount;
      
      invoice.items = req.body.items;
      invoice.taxRate = taxRate;
      invoice.taxAmount = taxAmount;
      invoice.totalAmount = totalAmount;
      if (req.body.manualCustomer) invoice.manualCustomer = req.body.manualCustomer;
      if (req.body.type) invoice.type = req.body.type;
      if (req.body.dueDate) invoice.dueDate = req.body.dueDate;
      if (req.body.gstNumber !== undefined) invoice.gstNumber = req.body.gstNumber;
      
      invoice.followUpHistory.push({
        remarks: 'Invoice details edited manually',
        status: invoice.status,
        calledBy: req.user._id,
        date: new Date()
      });
    }

    // 2. Handle Payments
    if (req.body.paymentMethod || req.body.paymentStatus || req.body.paidAmount !== undefined) {
      if (req.body.paymentMethod) invoice.paymentMethod = req.body.paymentMethod;
      if (req.body.paymentStatus) invoice.paymentStatus = req.body.paymentStatus;
      if (req.body.paidAmount !== undefined) invoice.paidAmount = req.body.paidAmount;
      
      // If payment is completed, capture the date and logic
      if (req.body.paymentStatus === 'Completed' || invoice.paidAmount >= invoice.totalAmount) {
        invoice.paymentDate = new Date();
        invoice.paidAt = new Date();
        invoice.status = 'paid';
      } else if (invoice.paidAmount > 0) {
        invoice.status = 'partially_paid';
      }
      
      invoice.followUpHistory.push({
        remarks: `Payment status updated to ${req.body.paymentStatus || invoice.paymentStatus} via ${req.body.paymentMethod || invoice.paymentMethod}`,
        status: invoice.status,
        calledBy: req.user._id,
        date: new Date()
      });
      
      if (invoice.customer) {
        await createNotification(req.app, {
          userId: invoice.customer,
          role: 'customer',
          type: 'billing_update',
          message: `Payment update: ${invoice.status === 'paid' ? 'Full payment received' : 'Partial payment received'} for Invoice #${invoice.invoiceNumber}. Thank you!`
        });
      }
    }

    // 3. Handle Quotation Specific Updates
    if (invoice.type === 'quotation' && req.body.followUpStatus) {
      invoice.followUpStatus = req.body.followUpStatus;
      if (req.body.followUpDate) invoice.followUpDate = req.body.followUpDate;
    }

    // 4. General fields updates
    const updatableFields = ['discount', 'tax', 'notes', 'status', 'quotationStatus'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        invoice[field] = req.body[field];
      }
    });

    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
