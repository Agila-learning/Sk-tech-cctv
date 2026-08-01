const mongoose = require('mongoose');
const EngagementTemplate = require('../models/EngagementTemplate');
require('dotenv').config({ path: '../.env' });

const templates = [
  // CCTV Service Reminders (service_reminder)
  { title: 'CCTV Health Check', message: 'Is your CCTV system working perfectly? Book a free health check today.', category: 'Service Reminder' },
  { title: 'Maintenance Due', message: 'It\'s been a while since your last service. Schedule preventive maintenance today.', category: 'Service Reminder' },
  { title: 'Prevent Camera Failure', message: 'Don\'t wait for a camera failure. Book a routine inspection now.', category: 'Service Reminder' },
  { title: 'Keep Property Secure', message: 'Keep your property secure with a quick CCTV maintenance visit.', category: 'Service Reminder' },
  { title: 'Lens Cleaning Required', message: 'Dirty camera lenses reduce video clarity. Schedule a cleaning service today.', category: 'Service Reminder' },
  { title: 'DVR System Check', message: 'Ensure your DVR is recording properly with a quick system check.', category: 'Service Reminder' },
  { title: 'Routine Inspection', message: 'Protect your home before problems arise. Book a CCTV inspection now.', category: 'Service Reminder' },
  { title: 'Security Maintenance', message: 'Your security deserves regular maintenance. Schedule a visit today.', category: 'Service Reminder' },
  { title: 'Preventive Repairs', message: 'Small maintenance today prevents expensive repairs tomorrow.', category: 'Service Reminder' },
  { title: 'Uninterrupted Surveillance', message: 'Book a preventive service and enjoy uninterrupted surveillance.', category: 'Service Reminder' },

  // Offers & Discounts (offer_discount)
  { title: 'Weekend Special', message: '🎉 Enjoy 10% OFF on CCTV installation this weekend.', category: 'Offer' },
  { title: 'Latest Offers', message: 'Upgrade your security system with our latest offers.', category: 'Offer' },
  { title: 'Exclusive Discount', message: 'Exclusive discount available for existing customers.', category: 'Offer' },
  { title: 'Limited AMC Renewal', message: 'Limited-time AMC renewal offer just for you.', category: 'Offer' },
  { title: 'Special Price Upgrade', message: 'Upgrade your old CCTV cameras at a special price.', category: 'Offer' },
  { title: 'Service Benefits', message: 'Book any CCTV service today and receive exciting benefits.', category: 'Offer' },
  { title: 'Seasonal Packages', message: 'Save more with our seasonal installation packages.', category: 'Offer' },
  { title: 'Affordable Upgrade', message: 'Secure your property with affordable upgrade plans.', category: 'Offer' },
  { title: 'Live Special Offers', message: 'Weekend special offers are now live.', category: 'Offer' },
  { title: 'Customer Pricing', message: 'Exclusive customer-only pricing available for a limited time.', category: 'Offer' },

  // Product Promotions (product_promotion)
  { title: 'Better Security', message: 'Looking for better security? Explore our latest CCTV cameras.', category: 'Product Promotion' },
  { title: '4K Surveillance', message: 'Upgrade to crystal-clear 4K surveillance today.', category: 'Product Promotion' },
  { title: 'Smart Wi-Fi Cameras', message: 'Smart Wi-Fi cameras are now available.', category: 'Product Promotion' },
  { title: 'AI Powered Cameras', message: 'New AI-powered CCTV cameras have arrived.', category: 'Product Promotion' },
  { title: 'Smart Video Doorbells', message: 'Upgrade your home with smart video doorbells.', category: 'Product Promotion' },
  { title: 'Biometric Attendance', message: 'Explore our latest biometric attendance systems.', category: 'Product Promotion' },
  { title: 'Premium DVR', message: 'Check out our premium DVR and NVR solutions.', category: 'Product Promotion' },
  { title: 'New Accessories', message: 'New security accessories are now in stock.', category: 'Product Promotion' },
  { title: 'Business Surveillance', message: 'Protect your business with our latest surveillance solutions.', category: 'Product Promotion' },
  { title: 'Smart Products', message: 'Discover new smart security products today.', category: 'Product Promotion' },

  // AMC & Warranty (amc_warranty)
  { title: 'AMC Renewal Approaching', message: 'Your AMC renewal is approaching. Renew now for uninterrupted service.', category: 'Service Reminder' },
  { title: 'AMC Protection', message: 'Protect your CCTV investment with an Annual Maintenance Contract.', category: 'Service Reminder' },
  { title: 'Warranty Expiring', message: 'Warranty expiring soon. Renew today and stay protected.', category: 'Service Reminder' },
  { title: 'Avoid Repair Costs', message: 'Avoid unexpected repair costs with AMC coverage.', category: 'Service Reminder' },
  { title: 'Worry-free Surveillance', message: 'Secure another year of worry-free surveillance.', category: 'Service Reminder' },
  { title: 'Renew This Month', message: 'Your warranty expires this month. Renew before it\'s too late.', category: 'Service Reminder' },
  { title: 'Extend Protection', message: 'Extend your CCTV protection with our AMC plans.', category: 'Service Reminder' },
  { title: 'Camera Life', message: 'Regular AMC maintenance improves camera life.', category: 'Service Reminder' },
  { title: 'Priority Support', message: 'AMC customers enjoy priority support.', category: 'Service Reminder' },
  { title: 'Exclusive Benefits', message: 'Renew today and enjoy exclusive benefits.', category: 'Service Reminder' },

  // Security Awareness (security_awareness)
  { title: 'Check Recordings', message: 'Is your CCTV recording properly? Check today.', category: 'Security Tip' },
  { title: 'Healthy Surveillance', message: 'A secure home begins with a healthy surveillance system.', category: 'Security Tip' },
  { title: 'Family Safety', message: 'Regular CCTV maintenance keeps your family safe.', category: 'Security Tip' },
  { title: 'Backup Recordings', message: 'Backup your CCTV recordings regularly.', category: 'Security Tip' },
  { title: 'Strong Security', message: 'Strong security starts with regular inspections.', category: 'Security Tip' },
  { title: 'Camera Functionality', message: 'Make sure every camera is functioning properly.', category: 'Security Tip' },
  { title: 'Night Vision', message: 'Improve night vision by cleaning your CCTV lenses.', category: 'Security Tip' },
  { title: 'Test DVR Backup', message: 'Test your DVR backup before you need it.', category: 'Security Tip' },
  { title: 'Prevent Security Issues', message: 'A small inspection today prevents security issues tomorrow.', category: 'Security Tip' },
  { title: 'Our Priority', message: 'Your safety is our priority.', category: 'Security Tip' },

  // Customer Engagement (customer_engagement)
  { title: 'Thank You', message: 'Thank you for choosing SK Technology.', category: 'Customer Engagement' },
  { title: 'We Appreciate You', message: 'We appreciate your trust in our services.', category: 'Customer Engagement' },
  { title: 'Support Team', message: 'Need any assistance? Our support team is here to help.', category: 'Customer Engagement' },
  { title: 'Contact Us', message: 'Have questions? Contact us anytime.', category: 'Customer Engagement' },
  { title: 'Feedback', message: 'We\'d love to hear your feedback.', category: 'Customer Engagement' },
  { title: 'Valued Customer', message: 'Thank you for being a valued customer.', category: 'Customer Engagement' },
  { title: 'Exciting Offers', message: 'Stay connected for exciting offers.', category: 'Customer Engagement' },
  { title: 'Your Satisfaction', message: 'Your satisfaction is our priority.', category: 'Customer Engagement' },
  { title: 'Always Here', message: 'We\'re always here to secure your property.', category: 'Customer Engagement' },
  { title: 'Great Day', message: 'Have a great day from the SK Technology team!', category: 'Customer Engagement' },

  // Personalized (personalized)
  { title: 'Happy Birthday', message: 'Happy Birthday! Wishing you a wonderful year ahead.', category: 'Personalized' },
  { title: 'Happy Anniversary', message: 'Happy Anniversary! Thank you for choosing SK Technology.', category: 'Personalized' },
  { title: 'One Year Anniversary', message: 'Congratulations on completing one year with us.', category: 'Personalized' },
  { title: 'We Miss You', message: 'We miss you! It\'s been a while since your last service.', category: 'Personalized' },
  { title: 'Welcome Back', message: 'Welcome back! Check out our latest offers.', category: 'Personalized' },
  { title: 'Loyal Customer', message: 'Thank you for being one of our loyal customers.', category: 'Personalized' },
  { title: 'Exclusive Reward', message: 'Here\'s an exclusive reward just for you.', category: 'Personalized' },
  { title: 'Continued Trust', message: 'Your continued trust means everything to us.', category: 'Personalized' }
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
