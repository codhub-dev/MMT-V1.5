const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  truckNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  truckName: {
    type: String,
    required: true,
    trim: true
  },
  truckModel: {
    type: String,
    required: true,
    trim: true
  },
  truckCapacity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  assignedDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Truck', truckSchema);
