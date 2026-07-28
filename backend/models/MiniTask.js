const mongoose = require('mongoose');

const miniTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed'], 
    default: 'pending' 
  },
  progress: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

miniTaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MiniTask', miniTaskSchema);
