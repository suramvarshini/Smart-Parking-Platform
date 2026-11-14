/**
 * Smart Parking Platform - Booking Model
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: [true, 'Unique Booking ID is required'],
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: [true, 'Parking lot reference is required'],
    index: true
  },
  parkingSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: [true, 'Parking slot reference is required'],
    index: true
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle registration number is required'],
    trim: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['Car', 'Bike'],
    default: 'Car'
  },
  bookingDate: {
    type: String,
    required: [true, 'Booking date is required'] // e.g. YYYY-MM-DD
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'] // e.g. HH:MM (24-hour)
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'] // e.g. HH:MM (24-hour)
  },
  duration: {
    type: Number,
    required: [true, 'Duration in hours is required'],
    min: [1, 'Minimum booking duration is 1 hour']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total booking amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  bookingStatus: {
    type: String,
    enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
    default: 'CONFIRMED'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to quickly search for overlapping bookings for a given slot on a date
bookingSchema.index({ parkingSlot: 1, bookingDate: 1, bookingStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
