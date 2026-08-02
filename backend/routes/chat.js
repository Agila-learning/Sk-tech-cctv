const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    let { receiver, receiverRole, orderId, content, attachments, chatType = 'customer' } = req.body;
    const Order = require('../models/Order');
    
    let activeOrder = null;
    if (orderId) {
      activeOrder = await Order.findById(orderId);
      if (activeOrder && req.user.role !== 'customer') {
        // If an admin or tech sends a message on an order, direct it to the customer
        receiver = activeOrder.customer;
        receiverRole = 'customer';
      }
    }

    // If customer sends without a specific receiver, target admin role
    if (req.user.role === 'customer' && !receiver && !receiverRole) {
      receiverRole = 'admin';
    }

    // Authorization Check: Customer <-> Technician
    if (req.user.role === 'customer') {
      if (chatType === 'team') {
        return res.status(403).send({ error: 'Customers cannot participate in team chats.' });
      }
      if (receiver) {
        const User = require('../models/User');
        const targetUser = await User.findById(receiver);
        
        if (targetUser && targetUser.role === 'technician') {
          const activeOrderCheck = await Order.findOne({
            customer: req.user._id,
            technician: receiver,
            status: { $in: ['assigned', 'accepted', 'in_progress', 'started', 'ongoing', 'completed', 'pending_approval', 'pending_admin_approval', 'paused', 'waiting_for_material', 'waiting_for_customer', 'testing'] }
          });

          if (!activeOrderCheck) {
            return res.status(403).send({ error: 'You can only chat with technicians assigned to your active orders.' });
          }

          // Disable sending if completed
          if (activeOrderCheck.status === 'completed') {
            return res.status(403).send({ error: 'Order is completed. Chat is now read-only.' });
          }
        }
      }
    } else if (chatType === 'customer' && activeOrder) {
      if (activeOrder.status === 'completed') {
        return res.status(403).send({ error: 'Order is completed. Customer chat is now read-only.' });
      }
    }

    // Authorization Check: Technician <-> Customer removed as per new platform requirements

    const message = new Message({
      sender: req.user._id,
      receiver,
      receiverRole,
      orderId,
      chatType,
      content,
      attachments
    });
    await message.save();
    await message.populate('sender', 'name role');

    const io = req.app.get('socketio');
    if (io) {
      // Always emit to direct receiver room if specified
      if (message.receiver) {
        io.to(message.receiver.toString()).emit(`message:${message.receiver}`, message);
        io.to(message.receiver.toString()).emit('message', message);
      }
      
      // Emit to role room
      if (message.receiverRole) {
        io.to(`role:${message.receiverRole}`).emit(`message_role:${message.receiverRole}`, message);
        io.to(`role:${message.receiverRole}`).emit('message', message);
      }
      
      // Broadcast to specific order channel
      if (orderId) {
        io.emit(`message_order:${orderId}`, message);
      }

      // Always broadcast a generic 'new_chat_message' event to admin
      io.to('role:admin').emit('new_chat_message', message);

      // Global broadcast fallback
      io.emit('message', message);
    }

    // Send Real-time Push Notification
    await createNotification(req.app, {
      userId: receiver,
      role: receiverRole || (req.user.role === 'customer' ? 'admin' : 'customer'),
      type: 'new_chat_message',
      message: `New message from ${req.user.name}: ${content}`,
      orderId
    });

    res.status(201).send(message);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get my messages (sorted by latest first for global dashboard views)
router.get('/', auth, async (req, res) => {
  try {
    const { orderId, chatType } = req.query;
    let query = {};
    if (orderId) {
      query = { orderId };
      if (chatType) query.chatType = chatType;
      // Hide team chat from customers
      if (req.user.role === 'customer') {
        query.chatType = 'customer';
      }
    } else if (req.user.role === 'admin' || req.user.role === 'sub-admin') {
      query = {}; // Admin can see all support chats
      if (chatType) query.chatType = chatType;
    } else {
      const rolesToInclude = [req.user.role];
      if (req.user.role === 'sub-admin' || req.user.role === 'admin') {
        rolesToInclude.push('admin');
      }
      query = {
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id },
          { receiverRole: { $in: rolesToInclude } }
        ]
      };
      if (req.user.role === 'customer') {
        query.chatType = 'customer';
      }
    }
    const messages = await Message.find(query).populate('sender', 'name role').sort({ createdAt: -1 });
    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get 1-on-1 conversation
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Mark messages from this user to me as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );
    
    // Also mark role-based messages from this user as read (e.g. they sent to 'admin' and I am admin)
    if (req.user.role === 'admin' || req.user.role === 'technician') {
      await Message.updateMany(
        { sender: userId, receiverRole: req.user.role, isRead: false },
        { $set: { isRead: true } }
      );
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
        // Also fetch messages sent by them specifically to my role
        { sender: userId, receiverRole: req.user.role },
        // Also fetch messages I sent specifically to their role (if I am replying)
        { sender: currentUserId, receiverRole: 'customer', receiver: null } // broad, but helps context
      ]
    }).populate('sender', 'name role').sort({ createdAt: -1 });

    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get conversation summaries (for sidebar with unread counts)
router.get('/summary', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    const rolesToInclude = [req.user.role];
    if (req.user.role === 'sub-admin' || req.user.role === 'admin') {
      rolesToInclude.push('admin');
    }

    // Aggregate to find last message and unread count per user
    const summary = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId },
            { receiverRole: { $in: rolesToInclude } }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", currentUserId] },
              { $ifNull: ["$receiver", "$receiverRole"] }, // If admin sent to role or specific user
              "$sender" // If admin received, group by sender
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $ne: ["$sender", currentUserId] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      // If user lookup fails (e.g., _id was a string like 'admin' instead of an ObjectId), preserve the record 
      // but we mainly care about valid ObjectId groups for direct chat
      {
        $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          unreadCount: 1,
          lastMessage: 1,
          "userInfo.name": {
            $cond: [
              { $eq: ["$_id", "customer"] }, "Broadcast to Customers",
              { $cond: [
                { $eq: ["$_id", "technician"] }, "Broadcast to Technicians",
                { $cond: [
                  { $eq: ["$_id", "admin"] }, "Broadcast to Admins",
                  { $ifNull: ["$userInfo.name", "System / General"] }
                ]}
              ]}
            ]
          },
          "userInfo.role": { $ifNull: ["$userInfo.role", "system"] },
          "userInfo.profilePic": 1,
          "userInfo.availabilityStatus": 1
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    res.send(summary);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Admin ONLY: Monitor all chats across the platform
router.get('/admin/all', auth, authorize('admin', 'sub-admin'), async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'name role profilePic')
      .populate('receiver', 'name role profilePic')
      .populate('orderId', 'status serviceType')
      .sort({ createdAt: -1 });
    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Mark messages as read
router.patch('/read/:senderId', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { 
        sender: req.params.senderId, 
        receiver: req.user._id,
        isRead: false 
      },
      { isRead: true }
    );
    res.send({ success: true });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).send({ error: 'Message not found' });
    }
    // Only sender or admin can delete
    if (message.sender.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).send({ error: 'Not authorized to delete this message' });
    }
    await Message.findByIdAndDelete(req.params.id);
    
    // Notify clients to remove message
    const io = req.app.get('socketio');
    if (io) {
      io.emit('message_deleted', req.params.id);
    }
    
    res.send({ success: true });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
