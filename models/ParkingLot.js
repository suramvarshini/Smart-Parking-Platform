/**
 * Smart Parking Platform - ParkingLot Model
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Parking lot name is required'],
    trim: true,
    unique: true
  },
  location: {
    type: String,
    required: [true, 'Location/Campus zone is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Full address/landmark is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  totalSlots: {
    type: Number,
    required: [true, 'Total number of slots is required'],
    min: [1, 'Total slots must be at least 1']
  },
  availableSlots: {
    type: Number,
    required: true,
    min: [0, 'Available slots cannot be negative'],
    default: 0
  },
  operatingHours: {
    type: String,
    trim: true,
    default: '24/7'
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly tariff is required'],
    min: [0, 'Tariff cannot be negative'],
    default: 20
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
