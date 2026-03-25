const mongoose = require('mongoose');
// Use ABSOLUTE path to avoid any resolution issues
const Category = require('C:\\Users\\agila\\OneDrive\\Documents\\Agila\\CCTV_SK-tech\\backend\\models\\Category');

const MONGO_URI = 'mongodb://localhost:27017/sk-technology';

const categories = [
  { 
    name: 'Bullet Cameras', 
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    name: 'Dome Cameras', 
    image: 'https://images.unsplash.com/photo-1590483734724-383b85ad92e0?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    name: 'DVR/NVR Units', 
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    name: 'PTZ Speed Domes', 
    image: 'https://images.unsplash.com/photo-1521206698660-5e377ff3fd1d?auto=format&fit=crop&q=80&w=800' 
  },
  { 
    name: 'Security Accessories', 
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800' 
  }
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    for (const cat of categories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        { $set: { image: cat.image, isActive: true } },
        { upsert: true, new: true }
      );
      console.log(`Updated category: ${cat.name}`);
    }
    console.log('All categories updated successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error updating categories:', err);
    process.exit(1);
  });
