const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin', 'technician', 'sub-admin'], default: 'customer' },
  phone: { type: String },
  alternatePhone: { type: String },
  address: { type: String },
  notes: { type: String },
  warrantyPeriod: { type: String, default: '12 Months' },
  warrantyEndDate: { type: Date },
  liveLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
    timestamp: { type: Date }
  },
  profilePic: { type: String },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  location: {
    lat: { type: Number },
    lng: { type: Number },
    state: { type: String },
    pincode: { type: String },
    updatedAt: { type: Date }
  },
  zone: { type: String },
  skills: [String],
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  rating: { type: Number, default: 5 }, // For technicians
  reviewCount: { type: Number, default: 0 },
  pushToken: { type: String },
  webPushSubscription: { type: mongoose.Schema.Types.Mixed },
  
  // Technician Specific Fields
  isOnline: { type: Boolean, default: false },
  availabilityStatus: { 
    type: String, 
    enum: ['Available', 'Busy', 'On Leave', 'Offline', 'Assigned'], 
    default: 'Offline' 
  },
  salaryConfig: {
    monthlySalary: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    incentive: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    uanNumber: { type: String, default: '' },
    panNumber: { type: String, default: '' }
  },

  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  tasksCompleted: { type: Number, default: 0 },
  tasksAssisted: { type: Number, default: 0 },
  completedOrders: { type: Number, default: 0 }, // FSM
  reworkCount: { type: Number, default: 0 }, // FSM
  workloadScore: { type: Number, default: 0 },
  serviceCity: { type: String },
  serviceArea: { type: String },
  leaveStatus: { type: String, enum: ['active', 'on_leave', 'half_day'], default: 'active' },
  lastActive: { type: Date, default: Date.now },
  shiftTiming: {
    start: String, // HH:mm
    end: String    // HH:mm
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (this.email) this.email = this.email.toLowerCase();
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
