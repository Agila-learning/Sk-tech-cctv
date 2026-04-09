const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  entityType: { type: String, required: true }, // e.g., 'Product', 'Order'
  action: { type: String, required: true }, // e.g., 'PRICE_CHANGE', 'STOCK_UPDATE'
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  previousValues: { type: mongoose.Schema.Types.Mixed },
  newValues: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  remarks: { type: String }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
