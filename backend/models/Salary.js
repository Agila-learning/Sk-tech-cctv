const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format YYYY-MM
  
  // Base Components (Independent)
  fixedSalary: { type: Number, default: 0 },
  monthlySalary: { type: Number, default: 0 }, // If fixed but specifically monthly
  dailyWage: { 
    rate: { type: Number, default: 0 },
    days: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  hourlyWage: {
    rate: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  // Add-ons
  incentive: { type: Number, default: 0 },
  overtime: {
    hours: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  bonus: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },

  // Deductions
  deductions: { type: Number, default: 0 },
  advanceTaken: { type: Number, default: 0 }, // Salary Advance (Debit)
  
  // Final Calculation (Calculated but stored for history)
  totalPayable: { type: Number, default: 0 },
  
  // Detailed Ledger of transactions for this month
  ledger: [{
    type: { 
      type: String, 
      enum: ['fixed', 'incentive', 'ot', 'hourly', 'daily', 'bonus', 'deduction', 'advance', 'allowance'] 
    },
    amount: { type: Number, required: true },
    description: String,
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  }],

  status: { type: String, enum: ['draft', 'pending', 'paid', 'partially_paid'], default: 'draft' },
  paymentDate: { type: Date },
  remarks: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

salarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Recalculate totalPayable from components on every save
  const base = this.fixedSalary + this.monthlySalary + this.dailyWage.total + this.hourlyWage.total;
  const adds = this.incentive + this.overtime.total + this.bonus + this.allowances;
  const subs = this.deductions + this.advanceTaken;
  
  this.totalPayable = base + adds - subs;
  
  next();
});

module.exports = mongoose.model('Salary', salarySchema);
