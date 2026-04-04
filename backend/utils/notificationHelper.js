const Notification = require('../models/Notification');

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

    return notification;
  } catch (error) {
    console.error('[Notification Helper Error]', error);
    // Don't throw error to prevent breaking the main flow if notification fails
    return null;
  }
};

module.exports = { createNotification };
