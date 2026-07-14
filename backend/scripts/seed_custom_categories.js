const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Category = require('../models/Category');

const categoriesData = [
  {
    name: 'Electronics',
    displayName: 'Electronics',
    icon: 'Cpu',
    description: 'All electronic items and smart devices',
    order: 1,
    showOnHome: true,
    isFeatured: true,
    subcategories: [
      { name: 'CCTV' }, { name: 'IP Cameras' }, { name: 'DVR' }, { name: 'NVR' },
      { name: 'Video Door Phone' }, { name: 'Home Automation' }, { name: 'Smart Locks' },
      { name: 'GPS Trackers' }, { name: 'Biometric Devices' }, { name: 'Access Control' }
    ]
  },
  {
    name: 'Computers',
    displayName: 'Computers & Networking',
    icon: 'Monitor',
    description: 'Laptops, PCs, and Networking equipment',
    order: 2,
    showOnHome: true,
    isFeatured: true,
    subcategories: [
      { name: 'Laptops', filters: ['RAM', 'Processor', 'Storage', 'Brand', 'Screen Size'] },
      { name: 'Desktop PCs' }, { name: 'Gaming PCs' }, { name: 'Monitors' },
      { name: 'Keyboards' }, { name: 'Mouse' }, { name: 'UPS' },
      { name: 'Networking' }, { name: 'Routers' }, { name: 'Switches' }
    ]
  },
  {
    name: 'Storage',
    displayName: 'Storage Devices',
    icon: 'HardDrive',
    description: 'Data storage solutions',
    order: 3,
    showOnHome: true,
    subcategories: [
      { name: 'Pendrive' }, { name: 'SSD' }, { name: 'HDD' }, 
      { name: 'Memory Cards' }, { name: 'NAS Storage' }
    ]
  },
  {
    name: 'Office',
    displayName: 'Office Equipment',
    icon: 'Printer',
    description: 'Printers, scanners and projectors',
    order: 4,
    subcategories: [
      { name: 'Printers', filters: ['Laser', 'Inkjet', 'Wireless', 'Duplex'] },
      { name: 'Scanners' }, { name: 'Projectors' }, { name: 'Conference Systems' }
    ]
  },
  {
    name: 'Audio',
    displayName: 'Audio Systems',
    icon: 'Speaker',
    description: 'Speakers and sound equipment',
    order: 5,
    subcategories: [
      { name: 'Speakers' }, { name: 'Soundbars' }, { name: 'Headphones' }, { name: 'Microphones' }
    ]
  },
  {
    name: 'Television',
    displayName: 'Televisions',
    icon: 'Tv',
    description: 'Smart TVs and displays',
    order: 6,
    showOnHome: true,
    subcategories: [
      { name: 'Smart TVs', filters: ['Screen Size', 'Display Type', 'Smart TV', 'Resolution', 'Brand'] },
      { name: 'Android TVs' }, { name: 'OLED TVs' }, { name: 'QLED TVs' }
    ]
  },
  {
    name: 'Accessories',
    displayName: 'Accessories & Cables',
    icon: 'Cable',
    description: 'Cables, chargers and adapters',
    order: 7,
    subcategories: [
      { name: 'HDMI Cables' }, { name: 'Power Banks' }, { name: 'Chargers' }, 
      { name: 'Adapters' }, { name: 'CCTV Accessories' }, { name: 'Network Cables' }
    ]
  },
  {
    name: 'Security',
    displayName: 'Security Alarms',
    icon: 'ShieldAlert',
    description: 'Alarms and detection systems',
    order: 8,
    isFeatured: true,
    subcategories: [
      { name: 'Burglar Alarm' }, { name: 'Fire Alarm' }, { name: 'Smoke Detector' },
      { name: 'Boom Barrier' }, { name: 'Metal Detector' }
    ]
  }
];

const seedCategories = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not found in .env');

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    for (const parentData of categoriesData) {
      const { subcategories, ...parentProps } = parentData;
      
      // Upsert parent category
      let parentCategory = await Category.findOne({ name: parentProps.name });
      if (!parentCategory) {
        parentCategory = new Category(parentProps);
        await parentCategory.save();
        console.log(`Created parent category: ${parentCategory.name}`);
      } else {
        await Category.updateOne({ _id: parentCategory._id }, { $set: parentProps });
        console.log(`Updated parent category: ${parentCategory.name}`);
      }

      // Upsert subcategories
      if (subcategories && subcategories.length > 0) {
        for (const sub of subcategories) {
          const subProps = {
            ...sub,
            displayName: sub.name,
            parentCategory: parentCategory._id,
            isActive: true
          };
          
          let subCategoryDoc = await Category.findOne({ name: sub.name });
          if (!subCategoryDoc) {
            subCategoryDoc = new Category(subProps);
            await subCategoryDoc.save();
            console.log(`  -> Created subcategory: ${sub.name}`);
          } else {
            await Category.updateOne({ _id: subCategoryDoc._id }, { $set: subProps });
            console.log(`  -> Updated subcategory: ${sub.name}`);
          }
        }
      }
    }

    console.log('Categories seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedCategories();
