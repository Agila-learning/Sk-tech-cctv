const cron = require('node-cron');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const EngagementTemplate = require('../models/EngagementTemplate');
const EngagementHistory = require('../models/EngagementHistory');
const { createNotification } = require('../utils/notificationHelper');

const scheduleEngagementCron = (app) => {
  // Run every day at 11:30 AM 
  // (In production this might be spread out, but for this setup a daily blast is efficient)
  cron.schedule('30 11 * * *', async () => {
    try {
      console.log('[EngagementCron] Checking schedule...');
      
      const settings = await SystemSettings.findOne();
      if (!settings || !settings.autoEngagementEnabled) {
        console.log('[EngagementCron] Auto Engagement is disabled. Skipping.');
        return;
      }

      // Determine Category by Day of Week
      // 0 = Sunday, 1 = Monday, 3 = Wed, 5 = Friday
      const day = new Date().getDay();
      let targetCategory = null;

      switch(day) {
        case 1: targetCategory = 'service_reminder'; break; // Monday
        case 3: targetCategory = 'product_promotion'; break; // Wednesday
        case 5: targetCategory = 'offer_discount'; break; // Friday
        case 0: targetCategory = 'security_awareness'; break; // Sunday
        default: 
           console.log(`[EngagementCron] Day ${day} has no scheduled batch. Skipping.`);
           return; 
      }

      console.log(`[EngagementCron] Today is category: ${targetCategory}`);

      // 1. Fetch all active templates for this category
      const templates = await EngagementTemplate.find({ category: targetCategory, isActive: true });
      if (templates.length === 0) {
         console.log(`[EngagementCron] No active templates for ${targetCategory}.`);
         return;
      }

      // 2. Fetch all customers
      const customers = await User.find({ role: 'customer' });
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      let sentCount = 0;

      for (const customer of customers) {
        // 3. Check if customer received THIS category in the last 30 days
        const recentLog = await EngagementHistory.findOne({
           userId: customer._id,
           category: targetCategory,
           sentAt: { $gte: thirtyDaysAgo }
        });

        if (recentLog) {
          // Already received this category recently, skip
          continue;
        }

        // 4. Select a random template
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

        // 5. Send Notification
        await createNotification(app, {
          userId: customer._id,
          role: 'customer',
          type: 'engagement',
          title: randomTemplate.title,
          message: randomTemplate.message
        });

        // 6. Record in History
        await EngagementHistory.create({
          userId: customer._id,
          templateId: randomTemplate._id,
          category: targetCategory,
          status: 'sent'
        });

        sentCount++;
      }

      console.log(`[EngagementCron] Processed batch. Sent ${sentCount} notifications for ${targetCategory}.`);

    } catch (error) {
      console.error('[EngagementCron] Error:', error.message);
    }
  });
};

module.exports = scheduleEngagementCron;
