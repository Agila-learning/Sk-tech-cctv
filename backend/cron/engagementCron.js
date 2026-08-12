const cron = require('node-cron');
const SystemSettings = require('../models/SystemSettings');
const EngagementTemplate = require('../models/EngagementTemplate');
const EngagementLog = require('../models/EngagementLog');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

// Helper to determine today's category based on Day of Week
function getCategoryForToday() {
  const day = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  switch (day) {
    case 1: return 'Service Reminder'; // Monday
    case 3: return 'Product Promotion'; // Wednesday
    case 5: return 'Offer'; // Friday
    case 0: return 'Security Tip'; // Sunday
    default: return null;
  }
}

async function runDailyEngagement() {
  console.log('[Engagement Cron] Starting daily evaluation...');
  try {
    const settings = await SystemSettings.findOne();
    if (!settings || !settings.autoEngagementEnabled) {
      console.log('[Engagement Cron] Auto Engagement is disabled in settings. Skipping.');
      return;
    }

    const category = getCategoryForToday();
    if (!category) {
      console.log('[Engagement Cron] No category scheduled for today. Skipping.');
      return;
    }

    // Get all active templates for today's category
    const templates = await EngagementTemplate.find({ category, active: true });
    if (templates.length === 0) {
      console.log(`[Engagement Cron] No active templates found for category: ${category}. Skipping.`);
      return;
    }

    // Get all customers with either a mobile push token or a web push subscription
    const customers = await User.find({
      role: 'customer',
      $or: [
        { pushToken: { $exists: true, $ne: '' } },
        { webPushSubscription: { $exists: true, $ne: null } }
      ]
    });
    if (customers.length === 0) return;

    let sentCount = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const user of customers) {
      // Pick a random template from the available ones
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

      // Check if this specific user received THIS specific template in the last 30 days
      const recentLog = await EngagementLog.findOne({
        userId: user._id,
        templateId: randomTemplate._id,
        sentAt: { $gte: thirtyDaysAgo }
      });

      if (!recentLog) {
        // Safe to send
        try {
          // createNotification expects app instance. We will pass a dummy app or we need to pass app to cron init.
          // For now, notificationHelper's createNotification handles io emitting if app is provided, but FCM still works if app is omitted/null as long as io isn't strictly required. 
          // Wait, createNotification uses `app.get('socketio')`. If app is null, it will crash. 
          // We will modify this below by wrapping it safely or we'll export a function that takes `app`.
          await createNotification(global.app, {
            userId: user._id,
            role: 'customer',
            type: 'engagement',
            title: randomTemplate.title,
            message: randomTemplate.message
          });

          // Log the engagement
          await EngagementLog.create({
            userId: user._id,
            templateId: randomTemplate._id,
            category: randomTemplate.category,
            sentAt: new Date(),
            status: 'Delivered'
          });

          sentCount++;
        } catch (err) {
          console.error(`[Engagement Cron] Error sending to user ${user._id}:`, err.message);
        }
      }
    }

    console.log(`[Engagement Cron] Completed. Sent ${sentCount} notifications for category: ${category}`);

  } catch (error) {
    console.error('[Engagement Cron] Fatal Error:', error);
  }
}

// Initialize the cron job
// Run every day at 13:00 (1:00 PM) - between 9 AM and 8 PM as requested
const initEngagementCron = (app) => {
  // Store app globally or in a scoped way so cron can use it for createNotification
  global.app = app; 
  
  // Schedule to run at 1:00 PM everyday
  cron.schedule('0 13 * * *', () => {
    runDailyEngagement();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('[Cron] Engagement Cron Job Scheduled for 1:00 PM daily.');
};

module.exports = { initEngagementCron, runDailyEngagement };
