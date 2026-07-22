const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper'); // Assume this exists based on previous work

// Schedule to run every day at midnight (0 0 * * *)
const startWarrantyCron = (app) => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily warranty check...');
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // We check for orders where warranty is ending in exactly 30 days
      // or exactly expired yesterday (to avoid spamming every day).
      // For simplicity, let's find orders whose warrantyEndDate is between today and 30 days from now,
      // and haven't been notified yet. Since we don't have a "notified" flag, we'll just check
      // specific day windows.
      
      // 1. Expiring in exactly 30 days
      const expiringIn30 = await Order.find({
        warrantyEndDate: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 31)
        }
      }).populate('customer');

      // 2. Expiring in exactly 7 days
      const expiringIn7 = await Order.find({
        warrantyEndDate: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8)
        }
      }).populate('customer');

      // 3. Just expired yesterday
      const justExpired = await Order.find({
        warrantyEndDate: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      }).populate('customer');

      // Get all admins to notify
      const admins = await User.find({ role: { $in: ['admin', 'sub-admin'] } });

      const notifyAdmins = async (orders, messageTemplate, type) => {
        for (const order of orders) {
          const customerName = order.customer ? order.customer.name : 'A customer';
          const msg = messageTemplate.replace('{customer}', customerName).replace('{orderId}', order._id.toString().slice(-6));
          
          // Notify all admins
          for (const admin of admins) {
            await createNotification(app, {
              userId: admin._id,
              role: admin.role,
              type: type,
              message: msg,
              orderId: order._id
            });
          }

          // Also notify assigned primary technician if any
          if (order.technician) {
            await createNotification(app, {
              userId: order.technician,
              role: 'technician',
              type: type,
              message: msg,
              orderId: order._id
            });
          }
        }
      };

      await notifyAdmins(expiringIn30, 'Warranty for {customer} (Order #{orderId}) expires in 30 days. Consider following up for AMC.', 'warranty_expiring_soon');
      await notifyAdmins(expiringIn7, 'Urgent: Warranty for {customer} (Order #{orderId}) expires in 7 days.', 'warranty_expiring_urgent');
      await notifyAdmins(justExpired, 'Warranty for {customer} (Order #{orderId}) has expired.', 'warranty_expired');

      console.log(`[CRON] Warranty check complete. 30 days: ${expiringIn30.length}, 7 days: ${expiringIn7.length}, expired: ${justExpired.length}`);

    } catch (error) {
      console.error('[CRON] Error running warranty check:', error);
    }
  });
};

module.exports = startWarrantyCron;
