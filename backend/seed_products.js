const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

// Load env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const images = [
  { name: 'Dome Pro 4K', category: 'Dome Cameras', path: 'C:\\Users\\agila\\.gemini\\antigravity\\brain\\86544d39-35ad-4bd1-a609-c8641061c675\\dome_camera_pro_4k_1774352436789.png', price: 12999 },
  { name: 'Bullet NightVision Ultra', category: 'Bullet Cameras', path: 'C:\\Users\\agila\\.gemini\\antigravity\\brain\\86544d39-35ad-4bd1-a609-c8641061c675\\bullet_camera_night_vision_1774352453701.png', price: 15499 },
  { name: 'PTZ Recon Zoom X30', category: 'PTZ Cameras', path: 'C:\\Users\\agila\\.gemini\\antigravity\\brain\\86544d39-35ad-4bd1-a609-c8641061c675\\ptz_recon_camera_1774352470308.png', price: 42999 },
  { name: 'Nexus 32CH NVR', category: 'DVR / NVR', path: 'C:\\Users\\agila\\.gemini\\antigravity\\brain\\86544d39-35ad-4bd1-a609-c8641061c675\\dvr_nvr_unit_sleek_1774352489086.png', price: 28999 },
  { name: 'Smart Wireless Node', category: 'Wireless Cameras', path: 'C:\\Users\\agila\\.gemini\\antigravity\\brain\\86544d39-35ad-4bd1-a609-c8641061c675\\wireless_smart_node_1774352511581.png', price: 8499 },
  { name: 'Analog Pro Box', category: 'CCTV Cameras', path: 'C:\\Users\\agila\\.gemini\\antigravity\\brain\\86544d39-35ad-4bd1-a609-c8641061c675\\analog_cctv_pro_1774352528652.png', price: 5999 },
  { name: 'Elite Install Kit', category: 'Accessories', path: 'C:\\Users\\agila\\.gemini\\antigravity\\brain\\86544d39-35ad-4bd1-a609-c8641061c675\\security_accessories_kit_1774352543453.png', price: 3499 }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Optional: Clear existing seeded products if needed
    // await Product.deleteMany({ brand: 'SK TECH PRO' });

    for (const item of images) {
      console.log(`Uploading ${item.name}...`);
      const result = await cloudinary.uploader.upload(item.path, {
        folder: 'sk-tech-generated'
      });
      
      const product = new Product({
        name: item.name,
        brand: 'SK TECH PRO',
        price: item.price,
        category: item.category,
        description: `Professional-grade ${item.category} solution for high-security environments. Features advanced optics and durable build.`,
        images: [result.secure_url],
        stock: 50,
        specifications: {
          resolution: '4K Ultra HD',
          connectivity: item.category === 'Wireless Cameras' ? 'Wi-Fi 6' : 'PoE / BNC',
          sensor: '1/1.8" CMOS Progressive'
        },
        usage: 'both',
        features: ['AI Motion Detection', 'IR Night Vision', 'Weather Proof']
      });

      await product.save();
      console.log(`Saved ${item.name} with URL: ${result.secure_url}`);
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
