const mongoose = require('mongoose');
const Category = require('./models/Category');
const Offer = require('./models/Offer');
require('dotenv').config();

const categories = [
  { name: 'Analog CCTV', image: '/assets/products/analog_cctv_pro_1774352528652.png', order: 0 },
  { name: 'IP Cameras', image: '/assets/products/dome_camera_pro_4k_1774352436789.png', order: 1 },
  { name: 'DVRs & NVRs', image: '/assets/products/dvr_nvr_unit_sleek_1774352489086.png', order: 2 },
  { name: 'Smart Home', image: '/assets/products/wireless_smart_node_1774352511581.png', order: 3 },
  { name: 'Accessories', image: '/assets/products/security_accessories_kit_1774352543453.png', order: 4 }
];

const mockOffer = {
  title: "Launch Celebration",
  description: "Get 20% off on all professional camera installation nodes this season. Limited time corporate priority access.",
  code: "SKTECH2026",
  discountPercentage: 20,
  isActive: true,
  image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800"
};

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sk-technology';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB:', uri);
    
    // Seed Categories
    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
      console.log(`Seeded category: ${cat.name}`);
    }

    // Seed Offer
    await Offer.findOneAndUpdate(
      { title: mockOffer.title },
      mockOffer,
      { upsert: true, new: true }
    );
    console.log(`Seeded offer: ${mockOffer.title}`);
    
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
