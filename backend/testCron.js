const mongoose = require('mongoose');
const { runDailyEngagement } = require('./cron/engagementCron');
mongoose.connect('mongodb+srv://sktech:sktech%402024@nutribox-cluster.r9xduvg.mongodb.net/sk-tech-cctv?retryWrites=true&w=majority&appName=NutriBox-Cluster').then(async () => { 
  await runDailyEngagement(); 
  process.exit(0); 
});
