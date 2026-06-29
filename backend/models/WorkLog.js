const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema({
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Optional link to a specific job
  date: { type: String, required: true }, // Format YYYY-MM-DD
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // In hours
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  location: {
    start: {
      lat: Number,
      lng: Number,
      address: String
    },
    end: {
      lat: Number,
      lng: Number,
      address: String
    }
  },
  notes: String,
  taskDescription: String // Manual description if no taskId
}, { timestamps: true });

module.exports = mongoose.model('WorkLog', workLogSchema);
