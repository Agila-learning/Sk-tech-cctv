const mongoose = require('mongoose');

const workFlowSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 6-Stage Workflow
  stages: {
    assigned: {
      status: { type: Boolean, default: true },
      timestamp: { type: Date, default: Date.now }
    },
    accepted: {
      status: { type: Boolean, default: false },
      timestamp: { type: Date }
    },
    reached: {
      status: { type: Boolean, default: false },
      timestamp: { type: Date },
      photo: {
        url: String,
        coordinates: { lat: Number, lng: Number },
        timestamp: Date
      }
    },
    started: {
      status: { type: Boolean, default: false },
      timestamp: { type: Date },
      photo: {
        url: String,
        coordinates: { lat: Number, lng: Number },
        timestamp: Date
      }
    },
    inProgress: {
      status: { type: Boolean, default: false },
      timestamp: { type: Date },
      photos: [{
        url: String,
        coordinates: { lat: Number, lng: Number },
        timestamp: Date
      }]
    },
    completed: {
      status: { type: Boolean, default: false },
      timestamp: { type: Date },
      photo: {
        url: String,
        coordinates: { lat: Number, lng: Number },
        timestamp: Date
      }
    }
  },

  // Real-time GPS Tracking
  currentLocation: {
    lat: Number,
    lng: Number,
    lastUpdate: { type: Date },
    status: { type: String, enum: ['active', 'weak', 'denied'], default: 'active' }
  },
  locationHistory: [{
    lat: Number,
    lng: Number,
    timestamp: { type: Date, default: Date.now }
  }],

  serviceReport: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceReport' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkFlow', workFlowSchema);
