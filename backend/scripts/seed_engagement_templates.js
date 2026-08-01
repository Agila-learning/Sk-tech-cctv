const mongoose = require('mongoose');
const EngagementTemplate = require('../models/EngagementTemplate');
require('dotenv').config({ path: '../.env' });

const templates = [
  // CCTV Service Reminders (service_reminder)
  { title: 'CCTV Health Check', message: 'Is your CCTV system working perfectly? Book a free health check today.', category: 'service_reminder' },
  { title: 'Maintenance Due', message: 'It\'s been a while since your last service. Schedule preventive maintenance today.', category: 'service_reminder' },
  { title: 'Prevent Camera Failure', message: 'Don\'t wait for a camera failure. Book a routine inspection now.', category: 'service_reminder' },
  { title: 'Keep Property Secure', message: 'Keep your property secure with a quick CCTV maintenance visit.', category: 'service_reminder' },
  { title: 'Lens Cleaning Required', message: 'Dirty camera lenses reduce video clarity. Schedule a cleaning service today.', category: 'service_reminder' },
  { title: 'DVR System Check', message: 'Ensure your DVR is recording properly with a quick system check.', category: 'service_reminder' },
  { title: 'Routine Inspection', message: 'Protect your home before problems arise. Book a CCTV inspection now.', category: 'service_reminder' },
  { title: 'Security Maintenance', message: 'Your security deserves regular maintenance. Schedule a visit today.', category: 'service_reminder' },
  { title: 'Preventive Repairs', message: 'Small maintenance today prevents expensive repairs tomorrow.', category: 'service_reminder' },
  { title: 'Uninterrupted Surveillance', message: 'Book a preventive service and enjoy uninterrupted surveillance.', category: 'service_reminder' },

  // Offers & Discounts (offer_discount)
  { title: 'Weekend Special', message: '🎉 Enjoy 10% OFF on CCTV installation this weekend.', category: 'offer_discount' },
  { title: 'Latest Offers', message: 'Upgrade your security system with our latest offers.', category: 'offer_discount' },
  { title: 'Exclusive Discount', message: 'Exclusive discount available for existing customers.', category: 'offer_discount' },
  { title: 'Limited AMC Renewal', message: 'Limited-time AMC renewal offer just for you.', category: 'offer_discount' },
  { title: 'Special Price Upgrade', message: 'Upgrade your old CCTV cameras at a special price.', category: 'offer_discount' },
  { title: 'Service Benefits', message: 'Book any CCTV service today and receive exciting benefits.', category: 'offer_discount' },
  { title: 'Seasonal Packages', message: 'Save more with our seasonal installation packages.', category: 'offer_discount' },
  { title: 'Affordable Upgrade', message: 'Secure your property with affordable upgrade plans.', category: 'offer_discount' },
  { title: 'Live Special Offers', message: 'Weekend special offers are now live.', category: 'offer_discount' },
  { title: 'Customer Pricing', message: 'Exclusive customer-only pricing available for a limited time.', category: 'offer_discount' },

  // Product Promotions (product_promotion)
  { title: 'Better Security', message: 'Looking for better security? Explore our latest CCTV cameras.', category: 'product_promotion' },
  { title: '4K Surveillance', message: 'Upgrade to crystal-clear 4K surveillance today.', category: 'product_promotion' },
  { title: 'Smart Wi-Fi Cameras', message: 'Smart Wi-Fi cameras are now available.', category: 'product_promotion' },
  { title: 'AI Powered Cameras', message: 'New AI-powered CCTV cameras have arrived.', category: 'product_promotion' },
  { title: 'Smart Video Doorbells', message: 'Upgrade your home with smart video doorbells.', category: 'product_promotion' },
  { title: 'Biometric Attendance', message: 'Explore our latest biometric attendance systems.', category: 'product_promotion' },
  { title: 'Premium DVR', message: 'Check out our premium DVR and NVR solutions.', category: 'product_promotion' },
  { title: 'New Accessories', message: 'New security accessories are now in stock.', category: 'product_promotion' },
  { title: 'Business Surveillance', message: 'Protect your business with our latest surveillance solutions.', category: 'product_promotion' },
  { title: 'Smart Products', message: 'Discover new smart security products today.', category: 'product_promotion' },

  // AMC & Warranty (amc_warranty)
  { title: 'AMC Renewal Approaching', message: 'Your AMC renewal is approaching. Renew now for uninterrupted service.', category: 'amc_warranty' },
  { title: 'AMC Protection', message: 'Protect your CCTV investment with an Annual Maintenance Contract.', category: 'amc_warranty' },
  { title: 'Warranty Expiring', message: 'Warranty expiring soon. Renew today and stay protected.', category: 'amc_warranty' },
  { title: 'Avoid Repair Costs', message: 'Avoid unexpected repair costs with AMC coverage.', category: 'amc_warranty' },
  { title: 'Worry-free Surveillance', message: 'Secure another year of worry-free surveillance.', category: 'amc_warranty' },
  { title: 'Renew This Month', message: 'Your warranty expires this month. Renew before it\'s too late.', category: 'amc_warranty' },
  { title: 'Extend Protection', message: 'Extend your CCTV protection with our AMC plans.', category: 'amc_warranty' },
  { title: 'Camera Life', message: 'Regular AMC maintenance improves camera life.', category: 'amc_warranty' },
  { title: 'Priority Support', message: 'AMC customers enjoy priority support.', category: 'amc_warranty' },
  { title: 'Exclusive Benefits', message: 'Renew today and enjoy exclusive benefits.', category: 'amc_warranty' },

  // Security Awareness (security_awareness)
  { title: 'Check Recordings', message: 'Is your CCTV recording properly? Check today.', category: 'security_awareness' },
  { title: 'Healthy Surveillance', message: 'A secure home begins with a healthy surveillance system.', category: 'security_awareness' },
  { title: 'Family Safety', message: 'Regular CCTV maintenance keeps your family safe.', category: 'security_awareness' },
  { title: 'Backup Recordings', message: 'Backup your CCTV recordings regularly.', category: 'security_awareness' },
  { title: 'Strong Security', message: 'Strong security starts with regular inspections.', category: 'security_awareness' },
  { title: 'Camera Functionality', message: 'Make sure every camera is functioning properly.', category: 'security_awareness' },
  { title: 'Night Vision', message: 'Improve night vision by cleaning your CCTV lenses.', category: 'security_awareness' },
  { title: 'Test DVR Backup', message: 'Test your DVR backup before you need it.', category: 'security_awareness' },
  { title: 'Prevent Security Issues', message: 'A small inspection today prevents security issues tomorrow.', category: 'security_awareness' },
  { title: 'Our Priority', message: 'Your safety is our priority.', category: 'security_awareness' },

  // Customer Engagement (customer_engagement)
  { title: 'Thank You', message: 'Thank you for choosing SK Technology.', category: 'customer_engagement' },
  { title: 'We Appreciate You', message: 'We appreciate your trust in our services.', category: 'customer_engagement' },
  { title: 'Support Team', message: 'Need any assistance? Our support team is here to help.', category: 'customer_engagement' },
  { title: 'Contact Us', message: 'Have questions? Contact us anytime.', category: 'customer_engagement' },
  { title: 'Feedback', message: 'We\'d love to hear your feedback.', category: 'customer_engagement' },
  { title: 'Valued Customer', message: 'Thank you for being a valued customer.', category: 'customer_engagement' },
  { title: 'Exciting Offers', message: 'Stay connected for exciting offers.', category: 'customer_engagement' },
  { title: 'Your Satisfaction', message: 'Your satisfaction is our priority.', category: 'customer_engagement' },
  { title: 'Always Here', message: 'We\'re always here to secure your property.', category: 'customer_engagement' },
  { title: 'Great Day', message: 'Have a great day from the SK Technology team!', category: 'customer_engagement' },

  // Personalized (personalized)
  { title: 'Happy Birthday', message: 'Happy Birthday! Wishing you a wonderful year ahead.', category: 'personalized' },
  { title: 'Happy Anniversary', message: 'Happy Anniversary! Thank you for choosing SK Technology.', category: 'personalized' },
  { title: 'One Year Anniversary', message: 'Congratulations on completing one year with us.', category: 'personalized' },
  { title: 'We Miss You', message: 'We miss you! It\'s been a while since your last service.', category: 'personalized' },
  { title: 'Welcome Back', message: 'Welcome back! Check out our latest offers.', category: 'personalized' },
  { title: 'Loyal Customer', message: 'Thank you for being one of our loyal customers.', category: 'personalized' },
  { title: 'Exclusive Reward', message: 'Here\'s an exclusive reward just for you.', category: 'personalized' },
  { title: 'Continued Trust', message: 'Your continued trust means everything to us.', category: 'personalized' }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sk-technology';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    await EngagementTemplate.deleteMany({});
    console.log('Cleared old templates.');

    await EngagementTemplate.insertMany(templates);
    console.log(`Successfully seeded ${templates.length} templates!`);

  } catch (error) {
    console.error('Error seeding templates:', error);
  } finally {
    process.exit(0);
  }
}

seed();
