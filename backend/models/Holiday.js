const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true, unique: true }, // Format YYYY-MM-DD
  type: { type: String, enum: ['national', 'regional', 'restricted', 'other'], default: 'national' },
  description: { type: String },
  isRecurring: { type: Boolean, default: false } // If true, applies every year
}, { timestamps: true });

module.exports = mongoose.model('Holiday', holidaySchema);
