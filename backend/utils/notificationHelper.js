const notificationHelper = (io) => {
  return {
    notifyNewOrder: (order, customerName) => {
      io.to('admin').emit('notification', {
        type: 'new_order',
        title: 'New Booking Received',
        message: `Order #${order._id.toString().slice(-6)} placed by ${customerName}`,
        priority: 'high'
      });
    },
    notifyAssignment: (technicianId, orderId) => {
      io.to(technicianId.toString()).emit('notification', {
        type: 'technician_assigned',
        title: 'New Job Assignment',
        message: `You have been assigned to Order #${orderId.toString().slice(-6)}`,
        priority: 'urgent'
      });
    },
    notifyWorkUpdate: (userId, orderId, status) => {
      io.to(userId.toString()).emit('notification', {
        type: 'installation_update',
        title: 'Service Update',
        message: `Order #${orderId.toString().slice(-6)} status: ${status.toUpperCase()}`,
        priority: 'medium'
      });
    },
    notifyAnnouncement: (target, title, priority = 'general') => {
      const room = target === 'all' ? 'all_users' : target;
      io.to(room).emit('notification', {
        type: 'announcement',
        title: 'Admin Announcement',
        message: title,
        priority: priority
      });
    },
    notifyEmergency: (userId, message) => {
      io.to(userId.toString()).emit('notification', {
        type: 'emergency',
        title: 'EMERGENCY PRIORITY',
        message: message,
        priority: 'urgent'
      });
    }
  };
};

module.exports = notificationHelper;
