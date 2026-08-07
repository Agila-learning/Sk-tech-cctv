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
        nextFollowUpDate: { $gte: today, $lt: tomorrow },
        followUpStatus: { $in: ['Pending', 'Waiting', 'Draft', 'Called', 'Customer Interested', 'Negotiation'] }
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

        // Notify all sub-admins
        await createNotification(app, {
          role: 'sub-admin',
          title: 'Quotation Follow-up Due',
          message: `Quotation ${quotation.invoiceNumber} for ${quotation.customer?.name || 'Customer'} requires follow-up today.`,
          type: 'billing',
          metadata: { invoiceId: quotation._id }
        });

        // Notify all technicians
        await createNotification(app, {
          role: 'technician',
          title: 'Quotation Follow-up Due',
          message: `Quotation ${quotation.invoiceNumber} for ${quotation.customer?.name || 'Customer'} requires follow-up today.`,
          type: 'billing',
          metadata: { invoiceId: quotation._id }
        });
      }

      
      // 1.5 Billing / Invoice Follow-ups
      const dueInvoices = await Invoice.find({
        $or: [
          { followUpDate: { $gte: today, $lt: tomorrow } },
          { followUpDate: { $lt: today } } // Overdue
        ]
      }).populate('customer');

      for (const inv of dueInvoices) {
        const timeDiff = new Date(inv.followUpDate).getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        let msg = '';
        let title = '';
        if (daysLeft === 0) {
          title = `${inv.type === 'quotation' ? 'Quotation' : 'Invoice'} Follow-up Due Today`;
          msg = `${inv.type === 'quotation' ? 'Quotation' : 'Invoice'} ${inv.invoiceNumber} for ${inv.customer?.name || inv.manualCustomer?.name || 'Customer'} requires follow-up today.`;
        } else if (daysLeft < 0) {
          title = `${inv.type === 'quotation' ? 'Quotation' : 'Invoice'} OVERDUE by ${Math.abs(daysLeft)} days`;
          msg = `${inv.type === 'quotation' ? 'Quotation' : 'Invoice'} ${inv.invoiceNumber} for ${inv.customer?.name || inv.manualCustomer?.name || 'Customer'} is overdue for follow-up.`;
        } else if (daysLeft <= 3 && daysLeft > 0) {
          title = `${inv.type === 'quotation' ? 'Quotation' : 'Invoice'} Reminder`;
          msg = `${inv.type === 'quotation' ? 'Quotation' : 'Invoice'} ${inv.invoiceNumber} for ${inv.customer?.name || inv.manualCustomer?.name || 'Customer'} follow-up is due in ${daysLeft} days.`;
        }
        
        if(msg) {
          await createNotification(app, {
            role: 'admin',
            title: title,
            message: msg,
            type: 'billing',
            metadata: { invoiceId: inv._id }
          });
        }
      }

      // 2. Product Warranty Expiry & Resolution Reminders
      const warranties = await ProductWarranty.find({
        status: { $ne: 'Closed' }
      });

      for (const warranty of warranties) {
        // Expected Resolution Date Reminders
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
        
        // Next Follow-up Date Reminders
        if (warranty.nextFollowUpDate) {
          const followDate = new Date(warranty.nextFollowUpDate);
          followDate.setHours(0, 0, 0, 0);
          
          if (followDate.getTime() === today.getTime()) {
             await createNotification(app, {
               role: 'admin',
               title: 'Warranty Follow-up Due',
               message: `Follow-up required for Product Warranty: ${warranty.productName} (Current Status: ${warranty.followUpStatus || 'Pending'})`,
               type: 'service',
               metadata: { warrantyId: warranty._id }
             });
          }
        }
      }

      // 3. Daily Low Stock Notifications
      const Product = require('./models/Product');
      const lowStockProducts = await Product.find({ stock: { $lte: 5 } });
      if (lowStockProducts.length > 0) {
        for (const prod of lowStockProducts) {
          await createNotification(app, {
            role: 'admin',
            title: 'LOW STOCK ALERT',
            message: `Product ${prod.name} has only ${prod.stock} items left in inventory. Please restock.`,
            type: 'system_alert'
          });
        }
      }

      // 4. Daily Report Follow-up (Next Morning Escalate to Admin)
      const Order = require('./models/Order');
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const activeOrdersYesterday = await Order.find({
        status: { $in: ['in_progress', 'paused', 'travel_started', 'reached_site'] }
      }).populate('technician');

      for (const order of activeOrdersYesterday) {
        // Check if there is a daily report for yesterday
        const hasReport = order.dailyReports && order.dailyReports.some(r => {
          const reportDate = new Date(r.timestamp);
          return reportDate >= yesterday && reportDate < today;
        });

        if (!hasReport && order.technician) {
          await createNotification(app, {
            role: 'admin',
            title: 'Daily Report Missing - Escalation',
            message: `Technician ${order.technician.name} failed to submit a daily report yesterday for Order #${order.shortId}.`,
            type: 'system_alert'
          });
        }
      }

      console.log('[Cron] Daily background jobs completed.');
    } catch (err) {
      console.error('[Cron] Error running daily jobs:', err);
    }
  });

  // Daily Report Follow-up (6 PM)
  cron.schedule('0 18 * * *', async () => {
    console.log('[Cron] Running 6 PM Daily Report Follow-up...');
    try {
      const Order = require('./models/Order');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeOrders = await Order.find({
        status: { $in: ['in_progress', 'paused', 'travel_started', 'reached_site'] }
      });

      for (const order of activeOrders) {
        const hasReport = order.dailyReports && order.dailyReports.some(r => {
          const reportDate = new Date(r.timestamp);
          return reportDate >= today;
        });

        if (!hasReport && order.technician) {
          await createNotification(app, {
            userId: order.technician,
            role: 'technician',
            title: 'Daily Report Reminder',
            message: `Please submit your daily report for Order #${order.shortId}. It is 6 PM.`,
            type: 'reminder'
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Daily Report Follow-up (8 PM)
  cron.schedule('0 20 * * *', async () => {
    console.log('[Cron] Running 8 PM Daily Report Follow-up...');
    try {
      const Order = require('./models/Order');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeOrders = await Order.find({
        status: { $in: ['in_progress', 'paused', 'travel_started', 'reached_site'] }
      });

      for (const order of activeOrders) {
        const hasReport = order.dailyReports && order.dailyReports.some(r => {
          const reportDate = new Date(r.timestamp);
          return reportDate >= today;
        });

        if (!hasReport && order.technician) {
          await createNotification(app, {
            userId: order.technician,
            role: 'technician',
            title: 'URGENT: Daily Report Missing',
            message: `You still haven't submitted your daily report for Order #${order.shortId}. Please submit it now.`,
            type: 'reminder'
          });
        }
      }
    } catch (err) {
      console.error(err);
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

  // Auto-approve pending_admin_approval Service Reports & Orders after 30 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const Order = require('./models/Order');
      const ServiceReport = require('./models/ServiceReport');
      const thresholdDate = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago

      const pendingOrders = await Order.find({
        status: 'pending_admin_approval',
        completedAt: { $lt: thresholdDate }
      });

      for (const order of pendingOrders) {
        order.status = 'completed';
        order.trackingTimeline.push({
          status: 'completed',
          remarks: 'System auto-approved job completion after 30 minutes.'
        });
        await order.save();
        
        // Approve corresponding service report
        const report = await ServiceReport.findOne({ jobId: order._id });
        if (report) {
          report.adminApproval = {
            status: 'approved',
            timestamp: new Date(),
            reviewedBy: null, // System auto-approved
            notes: 'System auto-approved after 30 minutes.'
          };
          await report.save();
        }

        // Notify Admin
        await createNotification(app, {
          role: 'admin',
          title: 'System Auto-Approval',
          message: `Order #${order._id.toString().slice(-6)} was auto-approved.`,
          type: 'system_alert'
        });
      }
    } catch (err) {
      console.error('[Cron] Error auto-approving reports:', err);
    }
  });
  // Auto Follow-Up: Check at 6 PM and 8 PM if active technicians have submitted their daily report.
  cron.schedule('0 18,20 * * *', async () => {
    try {
      const Order = require('./models/Order');
      const DailyReport = require('./models/DailyReport');
      
      const activeOrders = await Order.find({ status: { $in: ['in_progress', 'paused', 'travel_started', 'reached_site'] } });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const order of activeOrders) {
        if (!order.technician) continue;

        const report = await DailyReport.findOne({
          orderId: order._id,
          technicianId: order.technician,
          workDate: { $gte: today }
        });

        if (!report) {
          // Notify Technician
          await createNotification(app, {
            userId: order.technician,
            role: 'technician',
            type: 'system_alert',
            message: `Reminder: Please submit your daily report for Order #${order._id.toString().slice(-6)}.`,
            orderId: order._id
          });
        }
      }
    } catch (err) {
      console.error('[Cron] Error checking daily reports:', err);
    }
  });

  // Escalate to admin next morning at 9 AM for missing reports from yesterday
  cron.schedule('0 9 * * *', async () => {
    try {
      const Order = require('./models/Order');
      const DailyReport = require('./models/DailyReport');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeOrders = await Order.find({ status: { $in: ['in_progress', 'paused', 'travel_started', 'reached_site'] } });
      for (const order of activeOrders) {
        if (!order.technician) continue;
        const report = await DailyReport.findOne({
          orderId: order._id,
          technicianId: order.technician,
          workDate: { $gte: yesterday, $lt: today }
        });

        if (!report) {
          await createNotification(app, {
            role: 'admin',
            type: 'system_alert',
            message: `ESCALATION: Technician for Order #${order._id.toString().slice(-6)} missed yesterday's daily report.`,
            orderId: order._id
          });
        }
      }
    } catch (err) {
      console.error('[Cron] Error escalating missing daily reports:', err);
    }
  });
};

module.exports = initCronJobs;
