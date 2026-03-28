const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin', 'technician', 'sub-admin'], default: 'customer' },
  phone: { type: String },
  address: { type: String },
  profilePic: { type: String },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  location: {
    lat: { type: Number },
    lng: { type: Number },
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
  
  // Technician Specific Fields
  availabilityStatus: { 
    type: String, 
    enum: ['Available', 'Busy', 'On Leave', 'Offline', 'Assigned'], 
    default: 'Offline' 
  },
  salaryConfig: {
    type: { type: String, enum: ['hourly', 'monthly'], default: 'monthly' },
    base: { type: Number, default: 0 },
    workingHoursPerDay: { type: Number, default: 8 },
    overtimeRate: { type: Number, default: 0 },
    overtimeEligible: { type: Boolean, default: true },
    commissionPerService: { type: Number, default: 0 }
  },
  serviceCity: { type: String },
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
