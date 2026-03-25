const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin', 'technician'], default: 'customer' },
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
