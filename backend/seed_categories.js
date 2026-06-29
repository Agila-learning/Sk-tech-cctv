const mongoose = require('mongoose');
const Category = require('./models/Category');

const MONGO_URI = 'mongodb://localhost:27017/sk-technology';

const seedCategories = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const categories = [
            { name: 'Bullet Cameras', image: '/assets/products/bullet_ultra.png', order: 1, isActive: true },
            { name: 'Dome Cameras', image: '/assets/products/dome_4k.png', order: 2, isActive: true },
            { name: 'PTZ Cameras', image: '/assets/products/ptz_recon.png', order: 3, isActive: true },
            { name: 'IP Cameras', image: '/assets/products/wireless_tech.png', order: 4, isActive: true },
            { name: 'Accessories', image: '/assets/products/dome_internals.png', order: 5, isActive: true }
        ];

        for (const cat of categories) {
            await Category.findOneAndUpdate(
                { name: cat.name },
                cat,
                { upsert: true, new: true }
            );
        }

        console.log('Categories seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedCategories();
