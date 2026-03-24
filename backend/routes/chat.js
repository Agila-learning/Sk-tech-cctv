const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { auth, authorize } = require('../middleware/auth');

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiver, receiverRole, content } = req.body;
    const message = new Message({
      sender: req.user._id,
      receiver,
      receiverRole,
      content
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

// Get my messages
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
        { receiverRole: req.user.role }
      ]
    }).populate('sender', 'name role').sort({ createdAt: 1 });
    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
