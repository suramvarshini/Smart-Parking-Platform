/**
 * Smart Parking Platform - ParkingSlot Model
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: [true, 'Parking lot reference is required'],
    index: true
  },
  slotNumber: {
    type: String,
    required: [true, 'Slot number is required'],
    trim: true,
    uppercase: true
  },
  slotType: {
    type: String,
    enum: ['Car', 'Bike'],
    default: 'Car'
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
    default: 'AVAILABLE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound unique constraint: unique slotNumber per ParkingLot
parkingSlotSchema.index({ parkingLot: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
