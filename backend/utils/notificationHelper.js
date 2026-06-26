const Notification = require('../models/Notification');
const User = require('../models/User');
const axios = require('axios');

/**
 * Creates a notification in the database and emits it via Socket.io
 * @param {Object} app - Express app instance
 * @param {Object} data - Notification data
 * @param {String} [data.userId] - Optional target user ID
 * @param {String} data.role - Target role ('admin', 'technician', 'customer')
 * @param {String} data.type - Notification type (e.g., 'new_order', 'workflow_update')
 * @param {String} data.message - Notification message
 * @param {String} [data.orderId] - Optional associated order ID
 */
const createNotification = async (app, data) => {
  try {
    const notification = new Notification({
      userId: data.userId,
      role: data.role,
      type: data.type,
      message: data.message,
      orderId: data.orderId
    });

    await notification.save();

    const io = app.get('socketio');
    if (io) {
      // Emit to a specific user if userId is provided
      if (data.userId) {
        io.to(data.userId.toString()).emit('new_notification', notification);
      }
      
      // Also emit to the role room (matching server.js room naming: role:<role>)
      io.to(`role:${data.role}`).emit('new_notification', notification);
      
      console.log(`[Notification] Emitted to role:${data.role}${data.userId ? ` and user ${data.userId}` : ''}`);
    }

    // Physical Push Notification via Expo
    try {
      let pushTokens = [];
      if (data.userId) {
        const user = await User.findById(data.userId).select('pushToken');
        if (user && user.pushToken) pushTokens.push(user.pushToken);
      } else if (data.role) {
        const users = await User.find({ role: data.role, pushToken: { $exists: true, $ne: null } }).select('pushToken');
        pushTokens = users.map(u => u.pushToken);
      }

      if (pushTokens.length > 0) {
        const messages = pushTokens.map(token => ({
          to: token,
          sound: 'default',
          priority: 'high',
          channelId: 'default',
          title: 'SK Tech CCTV',
          body: data.message,
          data: { orderId: data.orderId, type: data.type }
        }));
        
        await axios.post('https://exp.host/--/api/v2/push/send', messages);
        console.log(`[Push Notification] Sent to ${pushTokens.length} devices.`);
      }
    } catch (pushError) {
      console.error('[Push Notification Error]', pushError.message);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Helper Error]', error);
    // Don't throw error to prevent breaking the main flow if notification fails
    return null;
  }
};

module.exports = { createNotification };
