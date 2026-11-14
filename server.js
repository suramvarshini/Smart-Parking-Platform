/**
 * Smart Parking Platform - Main Server
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 *
 * Session 1: Serves the static frontend and establishes database connectivity.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_parking';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Smart Parking Platform',
    hackathon: 'SR University 2026',
    database: mongoose.connection.readyState === 1 ? 'Connected to MongoDB' : 'Disconnected'
  });
});

// Root Route fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB & Start Server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Smart Parking Platform running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Still start server to serve frontend even if DB is in standby
    app.listen(PORT, () => {
      console.log(`🚀 Smart Parking Platform running (offline DB mode) at http://localhost:${PORT}`);
    });
  });
