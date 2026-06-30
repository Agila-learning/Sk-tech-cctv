const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    let { receiver, receiverRole, orderId, content, attachments } = req.body;
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
    if (req.user.role === 'customer' && receiver) {
      const User = require('../models/User');
      const targetUser = await User.findById(receiver);
      
      if (targetUser && targetUser.role === 'technician') {
        const activeOrderCheck = await Order.findOne({
          customer: req.user._id,
          technician: receiver,
          status: { $in: ['assigned', 'accepted', 'in_progress', 'completed', 'pending_approval', 'pending_admin_approval'] }
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

    // Authorization Check: Technician <-> Customer
    if (req.user.role === 'technician' && receiver) {
      const User = require('../models/User');
      const targetUser = await User.findById(receiver);

      if (targetUser && targetUser.role === 'customer') {
        const activeOrderCheck = await Order.findOne({
          technician: req.user._id,
          customer: receiver,
          status: { $in: ['assigned', 'accepted', 'in_progress', 'completed', 'pending_approval', 'pending_admin_approval'] }
        });

        if (!activeOrderCheck) {
          return res.status(403).send({ error: 'You can only chat with customers assigned to your active jobs.' });
        }

        if (activeOrderCheck.status === 'completed') {
          return res.status(403).send({ error: 'Job is completed. Chat is now read-only.' });
        }
      }
    }

    const message = new Message({
      sender: req.user._id,
      receiver,
      receiverRole,
      orderId,
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
    const { orderId } = req.query;
    let query = {};
    if (orderId) {
      query = { orderId };
    } else if (req.user.role === 'admin') {
      query = {}; // Admin can see all support chats
    } else {
      query = {
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id },
          { receiverRole: req.user.role }
        ]
      };
    }
    const messages = await Message.find(query).populate('sender', 'name role').sort({ createdAt: -1 });
    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get conversation summaries (for sidebar with unread counts)
router.get('/summary', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    
    // Aggregate to find last message and unread count per user
    const summary = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId },
            { receiverRole: req.user.role }
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
              "$receiver",
              "$sender"
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
      {
        $unwind: "$userInfo"
      },
      {
        $project: {
          _id: 1,
          unreadCount: 1,
          lastMessage: 1,
          "userInfo.name": 1,
          "userInfo.role": 1,
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

module.exports = router;
