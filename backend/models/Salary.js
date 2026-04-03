const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format YYYY-MM
  
  salaryMonthly: { type: Number, default: 0 },
  salaryDaily: { type: Number, default: 0 },
  salaryHourly: { type: Number, default: 0 },
  
  totalWorkedHours: { type: Number, default: 0 },
  totalWorkedDays: { type: Number, default: 0 },
  
  overtimeAmount: { type: Number, default: 0 },
  incentiveAmount: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  
  totalPayable: { type: Number, required: true },
  
  adjustments: [{
    amount: Number,
    reason: String,
    date: { type: Date, default: Date.now }
  }],
  
  status: { type: String, enum: ['pending', 'paid', 'on_hold'], default: 'pending' },
  paymentDate: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

salarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Salary', salarySchema);
