const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sk-tech-cctv';

const categories = [
  { name: 'Dome Cameras', image: 'dome_4k.png', order: 1, isActive: true },
  { name: 'Bullet Cameras', image: 'bullet_ultra.png', order: 2, isActive: true },
  { name: 'PTZ Cameras', image: 'ptz_recon.png', order: 3, isActive: true },
  { name: 'Wireless Cameras', image: 'wireless_tech.png', order: 4, isActive: true },
  { name: 'DVR / NVR', image: 'accessories.png', order: 5, isActive: true }
];

const products = [
  {
    name: 'PTZ Recon Alpha 4K',
    brand: 'SK-Tech',
    price: 15499,
    category: 'PTZ Cameras',
    description: 'Ultra-high definition 4K PTZ camera with 30x optical zoom and AI-enhanced human tracking for maximum tactical awareness.',
    images: ['ptz_recon.png'],
    stock: 25,
    features: ['4K Resolution', 'AI Tracking', '30x Optical Zoom', 'Weatherproof'],
    resolution: '4K',
    usage: 'outdoor'
  },
  {
    name: 'Bullet Ultra X1',
    brand: 'SK-Tech',
    price: 8999,
    category: 'Bullet Cameras',
    description: 'Strategic long-range surveillance with infrared night vision and dual-stream capability for high-traffic zones.',
    images: ['bullet_ultra.png'],
    stock: 50,
    features: ['Full HD', 'IR Night Vision', 'Motion Detection'],
    resolution: '1080p',
    usage: 'outdoor'
  },
  {
    name: 'Dome Zenith Stealth',
    brand: 'SK-Tech',
    price: 6499,
    category: 'Dome Cameras',
    description: 'Discreet indoor security node with 180° panoramic horizontal field of view and integrated audio recording.',
    images: ['dome_4k.png'],
    stock: 40,
    features: ['Wide Angle', 'Discrete Design', 'Two-Way Audio'],
    resolution: '4K',
    usage: 'indoor'
  },
  {
    name: 'Wireless Ghost V2',
    brand: 'SK-Tech',
    price: 4999,
    category: 'Wireless Cameras',
    description: 'Rapid deployment wireless node with solar charging capability and high-density battery storage.',
    images: ['wireless_tech.png'],
    stock: 35,
    features: ['Wi-Fi 6', 'Cloud Storage', 'Solar Ready'],
    resolution: '2K',
    usage: 'both'
  }
];

async function seed() {
  try {
    console.log('--- SYSTEM RECOVERY INITIATED ---');
    console.log(`Connecting to Data Grid: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    
    console.log('Flushing existing data protocols...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    
    console.log('Injecting Category Data Clusters...');
    await Category.insertMany(categories);
    
    console.log('Deploying Hardware Asset Nodes...');
    await Product.insertMany(products);
    
    console.log('--- DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('--- FATAL SEEDING ERROR ---');
    console.error(err);
    process.exit(1);
  }
}

seed();
