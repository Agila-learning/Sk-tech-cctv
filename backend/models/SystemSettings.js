const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'SK Technology' },
  supportEmail: { type: String, default: 'support@sktechnology.com' },
  supportPhone: { type: String, default: '+91 98765 43210' },
  maintenanceMode: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  smsAlerts: { type: Boolean, default: false },
  autoAssignTechnician: { type: Boolean, default: true },
  maxOrdersPerTechnician: { type: Number, default: 5 },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
