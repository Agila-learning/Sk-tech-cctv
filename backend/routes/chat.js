const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth, authorize } = require('../middleware/auth');

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiver, receiverRole, content, attachments } = req.body;
    
    // Authorization Check: Customer <-> Technician
    if (req.user.role === 'customer' && receiver) {
      const User = require('../models/User');
      const targetUser = await User.findById(receiver);
      
      if (targetUser && targetUser.role === 'technician') {
        const Order = require('../models/Order');
        const activeOrder = await Order.findOne({
          customer: req.user._id,
          technician: receiver,
          status: { $in: ['assigned', 'accepted', 'in_progress', 'completed'] }
        });

        if (!activeOrder) {
          return res.status(403).send({ error: 'You can only chat with technicians assigned to your active orders.' });
        }

        // Disable sending if completed
        if (activeOrder.status === 'completed') {
          return res.status(403).send({ error: 'Order is completed. Chat is now read-only.' });
        }
      }
    }

    // Authorization Check: Technician <-> Customer
    if (req.user.role === 'technician' && receiver) {
      const User = require('../models/User');
      const targetUser = await User.findById(receiver);

      if (targetUser && targetUser.role === 'customer') {
        const Order = require('../models/Order');
        const activeOrder = await Order.findOne({
          technician: req.user._id,
          customer: receiver,
          status: { $in: ['assigned', 'accepted', 'in_progress', 'completed'] }
        });

        if (!activeOrder) {
          return res.status(403).send({ error: 'You can only chat with customers assigned to your active jobs.' });
        }

        if (activeOrder.status === 'completed') {
          return res.status(403).send({ error: 'Job is completed. Chat is now read-only.' });
        }
      }
    }

    const message = new Message({
      sender: req.user._id,
      receiver,
      receiverRole,
      content,
      attachments
    });
    await message.save();

    const io = req.app.get('socketio');
    if (io) {
      if (message.receiver) {
        io.to(message.receiver.toString()).emit(`message:${message.receiver}`, message);
      } else if (message.receiverRole) {
        io.to(`role:${message.receiverRole}`).emit(`message_role:${message.receiverRole}`, message);
      }
    }

    res.status(201).send(message);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get my messages (sorted by latest first for global dashboard views)
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
        { receiverRole: req.user.role }
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
