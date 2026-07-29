const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const notificationHelper = require('../utils/notificationHelper');
const multer = require('multer');
const path = require('path');
const { createNotification } = require('../utils/notificationHelper');

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'public/uploads/'); },
  filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// POST: Create Service Request (Customer)
router.post('/', auth, upload.array('media', 5), async (req, res) => {
  try {
    const { serviceType, installationAddress, installedProduct, issueCategory, issueDescription, preferredDate, preferredTime, serialNumber } = req.body;
    
    const mediaUrls = req.files ? req.files.map(f => f.filename) : [];

    // Optional logic: Auto-check warranty based on orders
    const pastOrders = await Order.find({ customer: req.user._id, status: { $in: ['completed', 'delivered'] } }).sort({ createdAt: -1 });
    let isWarrantyValid = false;
    for (let order of pastOrders) {
      if (order.warrantyEndDate && new Date(order.warrantyEndDate) > new Date()) {
        isWarrantyValid = true;
        break;
      }
    }

    const newRequest = new ServiceRequest({
      customer: req.user._id,
      serialNumber,
      serviceType,
      installationAddress,
      installedProduct,
      issueCategory,
      issueDescription,
      preferredDate,
      preferredTime,
      media: mediaUrls,
      timeline: [{
        status: 'Submitted',
        remarks: isWarrantyValid ? 'System detected active warranty from past orders.' : 'Submitted for verification.'
      }]
    });

    await newRequest.save();
    
    // Notify Admin via Push
    notificationHelper.sendPushNotification(
      null, 'New Service Request', `New ${serviceType} request from ${req.user.name}`, { type: 'service_request' }, ['admin']
    );

    // Notify Admin in-app DB
    await createNotification(req.app, {
      role: 'admin',
      type: 'service_request',
      message: `New ${serviceType} request from ${req.user.name}`,
      orderId: newRequest._id
    });

    // Notify ALL Technicians in-app DB
    await createNotification(req.app, {
      role: 'technician',
      type: 'service_request',
      message: `New Service Request: ${serviceType}. Check Service Tickets.`,
      orderId: newRequest._id
    });

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: List Service Requests
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'technician') {
      filter.assignedTechnician = req.user._id;
    }
    // Admins see all

    const requests = await ServiceRequest.find(filter)
      .populate('customer', 'name email phone address')
      .populate('assignedTechnician', 'name phone')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Verify Service Request (Admin)
router.patch('/:id/verify', [auth, authorize('admin', 'sub-admin')], async (req, res) => {
  try {
    const { verifiedType, remarks } = req.body;
    const reqData = await ServiceRequest.findById(req.params.id).populate('customer', 'fcmToken');
    if (!reqData) return res.status(404).json({ error: 'Not found' });

    reqData.adminVerification = { verifiedType, remarks, verifiedAt: new Date(), verifiedBy: req.user._id };
    
    let newStatus = 'Under Verification';
    if (verifiedType === 'Free Warranty Service') newStatus = 'Warranty Verified';
    else if (verifiedType === 'Free AMC Visit') newStatus = 'AMC Verified';
    else if (verifiedType === 'Paid Service') newStatus = 'Paid Service Required';
    else if (verifiedType === 'Rejected') newStatus = 'Rejected';
    else if (verifiedType === 'Pending Customer Response') newStatus = 'Pending Customer Response';

    reqData.status = newStatus;
    reqData.timeline.push({ status: newStatus, remarks, updatedBy: req.user._id });

    await reqData.save();

    if (reqData.customer?.fcmToken) {
      notificationHelper.sendPushNotification(reqData.customer.fcmToken, 'Service Request Update', `Your request is now: ${newStatus}`, { requestId: reqData._id });
    }

    res.json(reqData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Assign Technician (Admin)
router.patch('/:id/assign', [auth, authorize('admin', 'sub-admin')], async (req, res) => {
  try {
    const { technicianId } = req.body;
    const reqData = await ServiceRequest.findById(req.params.id).populate('customer', 'fcmToken');
    if (!reqData) return res.status(404).json({ error: 'Not found' });

    reqData.assignedTechnician = technicianId;
    reqData.status = 'Technician Assigned';
    reqData.timeline.push({ status: 'Technician Assigned', remarks: 'Technician assigned by admin.', updatedBy: req.user._id });

    await reqData.save();

    const tech = await User.findById(technicianId);
    if (tech && tech.fcmToken) {
      notificationHelper.sendPushNotification(tech.fcmToken, 'New Service Job', 'You have been assigned a new service request.', { requestId: reqData._id });
    }
    if (reqData.customer?.fcmToken) {
      notificationHelper.sendPushNotification(reqData.customer.fcmToken, 'Technician Assigned', 'A technician has been assigned to your service request.', { requestId: reqData._id });
    }

    res.json(reqData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Update Timeline (Technician/Admin)
router.patch('/:id/timeline', auth, upload.array('media', 5), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const mediaUrls = req.files ? req.files.map(f => f.filename) : [];

    const reqData = await ServiceRequest.findById(req.params.id).populate('customer', 'fcmToken');
    if (!reqData) return res.status(404).json({ error: 'Not found' });

    reqData.status = status;
    reqData.timeline.push({ status, remarks, media: mediaUrls, updatedBy: req.user._id });

    await reqData.save();
    
    if (reqData.customer?.fcmToken) {
      notificationHelper.sendPushNotification(reqData.customer.fcmToken, 'Service Update', `Status changed to: ${status}`, { requestId: reqData._id });
    }
    
    // Notify admin for critical statuses
    if (['Reached Site', 'Inspection Completed', 'Repair Started', 'Testing', 'Service Completed'].includes(status)) {
       notificationHelper.sendPushNotification(null, 'Service Update', `Service ${reqData._id.toString().slice(-6)} is now ${status}`, { type: 'service_request' }, ['admin']);
    }

    res.json(reqData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Spare Parts Management
router.patch('/:id/spare-parts', auth, async (req, res) => {
  try {
    const { partName, quantity, status, cost } = req.body;
    const reqData = await ServiceRequest.findById(req.params.id);
    if (!reqData) return res.status(404).json({ error: 'Not found' });

    if (status === 'Requested') {
      reqData.spareParts.push({ partName, quantity, status: 'Requested' });
      reqData.status = 'Waiting Spare Parts';
      reqData.timeline.push({ status: 'Waiting Spare Parts', remarks: `Requested: ${partName}`, updatedBy: req.user._id });
    } else {
      // Update existing part (for Admin)
      const partIndex = reqData.spareParts.findIndex(p => p.partName === partName && p.status !== 'Received');
      if (partIndex > -1) {
        reqData.spareParts[partIndex].status = status;
        if (cost) reqData.spareParts[partIndex].cost = cost;
        if (status === 'Approved') reqData.spareParts[partIndex].approvedAt = new Date();
      }
      if (status === 'Received') {
        // Check if all are received
        const allReceived = reqData.spareParts.every(p => p.status === 'Received');
        if (allReceived) {
           reqData.status = 'Spare Parts Received';
           reqData.timeline.push({ status: 'Spare Parts Received', remarks: 'All parts received.', updatedBy: req.user._id });
        }
      }
    }

    await reqData.save();
    res.json(reqData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Complete Service
router.patch('/:id/complete', auth, upload.fields([{ name: 'beforePhotos', maxCount: 2 }, { name: 'afterPhotos', maxCount: 2 }]), async (req, res) => {
  try {
    const { customerSignature, technicianRemarks } = req.body;
    const reqData = await ServiceRequest.findById(req.params.id).populate('customer', 'fcmToken');
    if (!reqData) return res.status(404).json({ error: 'Not found' });

    const beforePhotos = req.files['beforePhotos'] ? req.files['beforePhotos'].map(f => f.filename) : [];
    const afterPhotos = req.files['afterPhotos'] ? req.files['afterPhotos'].map(f => f.filename) : [];

    reqData.serviceReport = {
      beforePhotos,
      afterPhotos,
      customerSignature,
      technicianRemarks,
      completedAt: new Date()
    };
    reqData.status = 'Service Completed';
    reqData.timeline.push({ status: 'Service Completed', remarks: technicianRemarks, updatedBy: req.user._id });

    await reqData.save();
    
    if (reqData.customer?.fcmToken) {
       notificationHelper.sendPushNotification(reqData.customer.fcmToken, 'Service Completed', 'Your service request has been successfully completed.', { requestId: reqData._id });
    }

    res.json(reqData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
