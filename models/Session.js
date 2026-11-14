/**
 * Smart Parking Platform - Session Model (RBAC)
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24-hour TTL expiration
  }
});

module.exports = mongoose.model('Session', sessionSchema);
