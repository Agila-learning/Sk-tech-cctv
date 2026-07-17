const cron = require('node-cron');
const Invoice = require('./models/Invoice');
const ProductWarranty = require('./models/ProductWarranty');
const { createNotification } = require('./utils/notificationHelper');
const User = require('./models/User');

const initCronJobs = (app) => {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running daily background jobs...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 1. Quotation Follow-ups
      const dueQuotations = await Invoice.find({
        type: 'quotation',
        followUpDate: { $gte: today, $lt: tomorrow },
        quotationStatus: { $in: ['Pending', 'Waiting'] }
      }).populate('customer');

      for (const quotation of dueQuotations) {
        // Notify Admins
        await createNotification(app, {
          role: 'admin',
          title: 'Quotation Follow-up Due',
          message: `Quotation ${quotation.invoiceNumber} for ${quotation.customer?.name || 'Customer'} requires follow-up today.`,
          type: 'billing',
          metadata: { invoiceId: quotation._id }
        });

        // Try to notify the creator/assigned tech if we stored it, else broadcast
      }

      // 2. Product Warranty Expiry & Resolution Reminders
      const warranties = await ProductWarranty.find({
        status: { $ne: 'Closed' }
      });

      for (const warranty of warranties) {
        if (warranty.expectedResolutionDate) {
          const resDate = new Date(warranty.expectedResolutionDate);
          resDate.setHours(0, 0, 0, 0);
          
          const timeDiff = resDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          if (daysLeft === 10 || daysLeft === 9 || daysLeft === 8 || daysLeft === 1) {
             await createNotification(app, {
               role: 'admin',
               title: 'Product Warranty Reminder',
               message: `Product Warranty for ${warranty.productName} is due in ${daysLeft} days.`,
               type: 'service',
               metadata: { warrantyId: warranty._id }
             });
          } else if (daysLeft === 0) {
             await createNotification(app, {
               role: 'admin',
               title: 'Product Warranty Due Today',
               message: `Product Warranty for ${warranty.productName} is expected to be resolved today!`,
               type: 'service',
               metadata: { warrantyId: warranty._id }
             });
          } else if (daysLeft < 0) {
             await createNotification(app, {
               role: 'admin',
               title: 'Product Warranty OVERDUE',
               message: `Product Warranty for ${warranty.productName} is overdue by ${Math.abs(daysLeft)} days.`,
               type: 'service',
               metadata: { warrantyId: warranty._id }
             });
          }
        }
      }

      console.log('[Cron] Daily background jobs completed.');
    } catch (err) {
      console.error('[Cron] Error running daily jobs:', err);
    }
  });

  // Check every 10 minutes for inactive online technicians
  cron.schedule('*/10 * * * *', async () => {
    try {
      const SystemSettings = require('./models/SystemSettings');
      const settings = await SystemSettings.findOne();
      
      let timeoutMs = 0;
      if (settings?.autoOfflineTimeout === '30m') timeoutMs = 30 * 60 * 1000;
      else if (settings?.autoOfflineTimeout === '1h') timeoutMs = 60 * 60 * 1000;
      else if (settings?.autoOfflineTimeout === '2h') timeoutMs = 120 * 60 * 1000;

      if (timeoutMs > 0) {
        const thresholdDate = new Date(Date.now() - timeoutMs);
        
        const inactiveTechs = await User.find({
          role: 'technician',
          isOnline: true,
          $or: [
            { lastActive: { $lt: thresholdDate } },
            { 'liveLocation.timestamp': { $lt: thresholdDate } }
          ]
        });

        for (const tech of inactiveTechs) {
          tech.isOnline = false;
          tech.availabilityStatus = 'Offline';
          await tech.save();
          
          if (app.get('socketio')) {
            app.get('socketio').emit('availability_change', {
              userId: tech._id,
              isOnline: false,
              availabilityStatus: 'Offline',
              activeTasks: 0
            });
          }

          await createNotification(app, {
            role: 'admin',
            title: 'Technician Auto-Offline',
            message: `Technician ${tech.name} was marked offline due to inactivity.`,
            type: 'system_alert'
          });
        }
      }
    } catch (err) {
      console.error('[Cron] Error running auto-offline monitor:', err);
    }
  });
};

module.exports = initCronJobs;
