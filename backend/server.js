const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const User = require('./models/User');
const Category = require('./models/Category');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const hardcodedOrigins = [
  "http://localhost:3000", 
  "https://sktechnology.services", 
  "https://www.sktechnology.services", 
  "https://sk-tech-cctv-app.vercel.app",
  "https://sk-tech-cctv.vercel.app",
  "https://sk-tech-cctv-s6ob.vercel.app"
];

const envOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, "")) 
  : [];

const allowedOrigins = [...new Set([...hardcodedOrigins, ...envOrigins])];

console.log('[CORS] Initialized with origins:', allowedOrigins);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  }
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.indexOf(cleanOrigin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[CORS] REJECTED: ${origin}. Not in whitelist.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Socket.io instance
app.set('socketio', io);

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sk-technology';
const maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@'); // Mask password for logging
console.log(`[DB] Attempting to connect to: ${maskedUri}`);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000, // 10s timeout
})
const seedData = async () => {
  try {
    // Optimized email normalization: Convert all emails to lowercase in one operation
    console.log('[Seed] Normalizing user emails...');
    await User.updateMany(
      { email: { $exists: true } }, 
      [{ $set: { email: { $toLower: "$email" } } }]
    );

    // Admin Account Verification
    const adminEmail = 'admin@sktech.com';
    const adminData = {
      name: 'SK Admin',
      email: adminEmail,
      password: 'admin123',
      role: 'admin',
      phone: '1234567890',
      address: 'HQ Mumbai'
    };

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      existingAdmin.password = 'admin123';
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('[Seed] Admin account verified');
    } else {
      await new User(adminData).save();
      console.log('[Seed] Admin account created: admin@sktech.com / admin123');
    }

    // Default Technician Verification
    const techEmail = 'tech@sktech.com';
    const existingTech = await User.findOne({ email: techEmail });
    if (!existingTech) {
      await new User({
        name: 'Default Technician',
        email: techEmail,
        password: 'tech123',
        role: 'technician',
        phone: '9876543210',
        address: 'Service Center A'
      }).save();
      console.log('[Seed] Technician account created');
    }

    // Default Categories Seeding
    const defaultCategories = [
      { name: 'CCTV Cameras', image: '/assets/categories/cctv.png', order: 1 },
      { name: 'Dome Cameras', image: '/assets/categories/dome.png', order: 2 },
      { name: 'Bullet Cameras', image: '/assets/categories/bullet.png', order: 3 },
      { name: 'Wireless Cameras', image: '/assets/categories/wireless.png', order: 4 },
      { name: 'PTZ Cameras', image: '/assets/categories/ptz.png', order: 5 },
      { name: 'DVR / NVR', image: '/assets/categories/dvr.png', order: 6 },
      { name: 'Accessories', image: '/assets/categories/acc.png', order: 7 }
    ];

    for (const cat of defaultCategories) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        await new Category(cat).save();
        console.log(`[Seed] Category created: ${cat.name}`);
      }
    }
    console.log('[Seed] Data initialization sequence completed');
  } catch (err) {
    console.error('[Seed] Initialization error:', err);
  }
};

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000, 
})
  .then(() => {
    console.log('[DB] MongoDB connected perfectly');
    seedData(); // Run in background - do not block
  })
  .catch(err => console.error('[DB] MongoDB connection failure:', err));

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const technicianRoutes = require('./routes/technician');
const internalRoutes = require('./routes/internal');
const orderRoutes = require('./routes/orders');

const adminRoutes = require('./routes/admin');
const supportRoutes = require('./routes/support');
const offerRoutes = require('./routes/offers');
const reviewRoutes = require('./routes/reviews');

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes Registry
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/notifications', require('./routes/notifications'));
apiRouter.use('/technician', technicianRoutes);
apiRouter.use('/internal', internalRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/support', supportRoutes);
apiRouter.use('/offers', offerRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/upload', require('./routes/upload'));
apiRouter.use('/subscription', require('./routes/subscription'));
apiRouter.use('/slots', require('./routes/slots'));
apiRouter.use('/bookings', require('./routes/bookings'));
apiRouter.use('/chat', require('./routes/chat'));
apiRouter.use('/profile', require('./routes/profile'));
apiRouter.use('/wishlist', require('./routes/wishlist'));
apiRouter.use('/attendance', require('./routes/attendance'));
apiRouter.use('/expenses', require('./routes/expenses'));
apiRouter.use('/billing', require('./routes/billing'));
apiRouter.use('/availability', require('./routes/availability'));
apiRouter.use('/tickets', require('./routes/tickets'));
apiRouter.use('/salary', require('./routes/salary'));
apiRouter.use('/worklogs', require('./routes/worklogs'));
apiRouter.use('/holidays', require('./routes/holidays'));

// Mount router at both /api and root to handle various proxy configurations
app.use('/api', apiRouter);
app.use(apiRouter); // Fallback for stripped /api prefix


app.get('/api', (req, res) => {
  res.status(200).json({ 
    status: 'ONLINE', 
    message: 'SK Technology API is fully operational.',
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.send('SK Technology API is running...');
});

// Socket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join', ({ userId, role }) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    }
    if (role) {
      socket.join(`role:${role}`);
      console.log(`User with role ${role} joined room`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
