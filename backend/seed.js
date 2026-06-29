const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cctv_sk_tech';

const products = [
  {
    name: 'SK BULLET ULTRA',
    brand: 'SK TECH',
    price: 22499,
    discount: 15,
    category: 'Bullet Cameras',
    description: 'Professional grade bullet camera with long-range thermal surveillance and 4K resolution.',
    images: ['/products/bullet_ultra.png'],
    stock: 50,
    ratings: { average: 4.8, count: 124 },
    features: ['4K Ultra HD', 'Night Vision', 'IP67 Weatherproof'],
    usage: 'outdoor',
    resolution: '4K (8MP)'
  },
  {
    name: 'SK WIRELESS SMART',
    brand: 'SK TECH',
    price: 8990,
    discount: 10,
    category: 'Wireless Cameras',
    description: 'Smart wireless camera for agile, rapid installation with high-definition streaming.',
    images: ['/products/wireless_tech.png'],
    stock: 120,
    ratings: { average: 4.5, count: 89 },
    features: ['1080p HD', 'Two-Way Audio', 'Motion Detection'],
    usage: 'indoor',
    resolution: '2MP'
  },
  {
    name: 'SK PTZ RECON',
    brand: 'SK TECH',
    price: 48999,
    discount: 25,
    category: 'PTZ Cameras',
    description: 'Omni-directional high-value PTZ camera with 30x optical zoom and AI tracking.',
    images: ['/products/ptz_recon.png'],
    stock: 15,
    ratings: { average: 4.9, count: 210 },
    features: ['360° Pan', '30x Zoom', 'Auto Tracking'],
    usage: 'outdoor',
    resolution: 'PTZ Optic'
  },
  {
    name: 'SK NIGHT GUARD',
    brand: 'SK TECH',
    price: 15999,
    discount: 20,
    category: 'Dome Cameras',
    description: 'Vandal-proof dome camera with superior night vision capabilities.',
    images: ['/products/dome_4k.png', '/products/dome_internals.png', '/products/dome_side_view.png', '/products/dome_bottom_view.png'],
    stock: 75,
    ratings: { average: 4.7, count: 156 },
    features: ['Color Night Vision', 'IK10 Vandal Proof', 'Wide Angle'],
    usage: 'both',
    resolution: '4K (8MP)'
  }
];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    
    await Product.deleteMany({});
    console.log('Cleared existing products');

    await Product.insertMany(products);
    console.log('Successfully seeded database with products');

    // Seed Admin User
    const adminExists = await User.findOne({ email: 'admin@sktech.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'SK Admin',
        email: 'admin@sktech.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'admin',
        phone: '1234567890',
        address: 'HQ Mumbai'
      });
      await admin.save();
      console.log('Admin user seeded: admin@sktech.com / admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDB();
