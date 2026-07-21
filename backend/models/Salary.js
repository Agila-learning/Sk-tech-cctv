const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format YYYY-MM
  
  // Simplified Core Inputs
  monthlySalary: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  incentive: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
  otherAllowance: { type: Number, default: 0 },
  workingDays: { type: Number, default: 30 }, // Total days in month (can vary)
  
  // Calculated Fields
  perDaySalary: { type: Number, default: 0 },
  leaveDeduction: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 }, // Final Salary
  
  // Payslip specific data
  payslipDetails: {
    employeeName: String,
    employeeId: String,
    designation: String,
    department: String,
    joiningDate: Date,
    bankDetails: String,
    pan: String,
    uan: String
  },

  status: { type: String, enum: ['draft', 'pending', 'paid', 'partially_paid'], default: 'draft' },
  paymentDate: { type: Date },
  remarks: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

salarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Automatic calculations
  if (this.workingDays > 0) {
    this.perDaySalary = parseFloat((this.monthlySalary / this.workingDays).toFixed(2));
  } else {
    this.perDaySalary = 0;
  }
  
  this.leaveDeduction = parseFloat((this.perDaySalary * this.leaveDays).toFixed(2));
  
  this.grossSalary = this.monthlySalary + this.bonus + this.incentive + this.otherAllowance;
  this.netSalary = this.grossSalary - this.leaveDeduction;
  
  // For backwards compatibility mapping
  this.totalPayable = this.netSalary;
  
  next();
});

module.exports = mongoose.model('Salary', salarySchema);
