/**
 * Smart Parking Platform - Main Server & API Engine
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 *
 * Session 3: Full Backend & Frontend Integration, JWT Auth, RBAC, Conflict Prevention.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'public'))
  ? path.join(__dirname, 'public')
  : path.join(process.cwd(), 'public');

// Mongoose Models
const User = require('./models/User');
const ParkingLot = require('./models/ParkingLot');
const ParkingSlot = require('./models/ParkingSlot');
const Booking = require('./models/Booking');
const Session = require('./models/Session');
const seedDatabase = require('./scripts/seed');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_parking_db';
const JWT_SECRET = process.env.JWT_SECRET || 'sru_smart_parking_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ---------------- Helper Utilities ---------------- //

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'sru_spp_hackathon_salt_2026').digest('hex');
}

function calculateEndTime(startTime, durationHours) {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = (h * 60 + m) + (Number(durationHours) * 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

async function syncLotAvailability(lotId) {
  const total = await ParkingSlot.countDocuments({ parkingLot: lotId });
  const occupiedCount = await ParkingSlot.countDocuments({
    parkingLot: lotId,
    status: { $in: ['OCCUPIED', 'RESERVED'] }
  });
  const available = Math.max(0, total - occupiedCount);
  await ParkingLot.findByIdAndUpdate(lotId, {
    totalSlots: total,
    availableSlots: available
  });
  return { total, available };
}

// ---------------- Middlewares ---------------- //

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lightweight Cookie Parser Middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      req.cookies[name] = decodeURIComponent(value);
    });
  }
  next();
});

// JWT & Session Authentication Middleware
app.use(async (req, res, next) => {
  req.user = null;

  // 1. Check Authorization Header (Bearer <token>)
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        phone: decoded.phone,
        vehicleNo: decoded.vehicleNo
      };
      return next();
    } catch (err) {
      // Token expired or invalid, fallback to session DB check if present
    }
  }

  // 2. Fallback to MongoDB session_id cookie if JWT not present/expired
  const sessionId = req.cookies.session_id;
  if (sessionId) {
    try {
      const activeSession = await Session.findOne({ sessionId });
      if (activeSession) {
        req.user = {
          id: activeSession.userId,
          name: activeSession.name,
          email: activeSession.email,
          role: activeSession.role
        };
      }
    } catch (err) {
      console.error('Session lookup error:', err.message);
    }
  }

  next();
});

// RBAC Route Protection Guards
function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.accepts('html')) {
      return res.redirect('/login.html?error=unauthenticated');
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Valid authentication token required.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    if (req.accepts('html')) {
      return res.redirect('/login.html?error=unauthenticated');
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Please log in to proceed.' });
  }

  if (req.user.role !== 'ADMIN') {
    if (req.accepts('html')) {
      return res.status(403).sendFile(path.join(PUBLIC_DIR, 'access-denied.html'));
    }
    return res.status(403).json({ success: false, error: 'Access Denied: Administrator role required.' });
  }

  next();
}

// ==========================================================================
// 1. AUTHENTICATION REST APIS (JWT & RBAC)
// ==========================================================================

// Register New User (Strictly forces role: USER)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, vehicleNo } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, phone, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    // Role is strictly forced to 'USER' - Prevent privilege escalation
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashPassword(password),
      role: 'USER',
      vehicleNo: vehicleNo ? vehicleNo.trim().toUpperCase() : ''
    });

    await newUser.save();

    // Issue JWT Token
    const token = jwt.sign(
      { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone, vehicleNo: newUser.vehicleNo },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set HttpOnly cookie
    res.setHeader('Set-Cookie', [
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `session_id=${crypto.randomUUID()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    ]);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone, vehicleNo: newUser.vehicleNo }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, vehicleNo: user.vehicleNo },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const sessionId = crypto.randomUUID();

    // Store session in MongoDB for state tracking
    await Session.create({
      sessionId,
      userId: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    });

    // Set secure HttpOnly cookies
    res.setHeader('Set-Cookie', [
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    ]);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleNo: user.vehicleNo
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during authentication.' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const sessionId = req.cookies.session_id;
    if (sessionId) {
      await Session.deleteOne({ sessionId });
    }
    // Expire cookies
    res.setHeader('Set-Cookie', [
      'token=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'session_id=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, error: 'Server error during logout.' });
  }
});

// Current User Profile
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false, user: null });
  }
  res.json({ authenticated: true, user: req.user });
});

// ==========================================================================
// 2. PARKING FACILITY & SLOT MANAGEMENT APIS
// ==========================================================================

// Get All Parking Lots (Supports search & filter)
app.get('/api/parking-lots', async (req, res) => {
  try {
    const { search, type } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const lots = await ParkingLot.find(query).sort({ createdAt: -1 });

    const enrichedLots = await Promise.all(lots.map(async (lot) => {
      const { total, available } = await syncLotAvailability(lot._id);
      const occupied = total - available;
      return {
        _id: lot._id,
        name: lot.name,
        location: lot.location,
        address: lot.address,
        description: lot.description,
        totalSlots: total,
        availableSlots: available,
        occupiedSlots: occupied,
        operatingHours: lot.operatingHours,
        hourlyRate: lot.hourlyRate
      };
    }));

    res.json({ success: true, count: enrichedLots.length, lots: enrichedLots });
  } catch (err) {
    console.error('Get lots error:', err);
    res.status(500).json({ success: false, error: 'Error fetching parking facilities.' });
  }
});

// Get Single Parking Lot
app.get('/api/parking-lots/:id', async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Parking facility not found.' });
    }

    const { total, available } = await syncLotAvailability(lot._id);
    res.json({
      success: true,
      lot: {
        _id: lot._id,
        name: lot.name,
        location: lot.location,
        address: lot.address,
        description: lot.description,
        totalSlots: total,
        availableSlots: available,
        operatingHours: lot.operatingHours,
        hourlyRate: lot.hourlyRate
      }
    });
  } catch (err) {
    console.error('Get lot details error:', err);
    res.status(500).json({ success: false, error: 'Error retrieving facility details.' });
  }
});

// Get Slots for a Parking Lot (Time Window & Vehicle Type Aware)
app.get('/api/parking-lots/:id/slots', async (req, res) => {
  try {
    const lotId = req.params.id;
    const lot = await ParkingLot.findById(lotId);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Parking facility not found.' });
    }

    let filter = { parkingLot: lotId };
    const { date, startTime, duration, vehicleType } = req.query;

    if (vehicleType && vehicleType !== 'All') {
      filter.slotType = vehicleType;
    }

    const slots = await ParkingSlot.find(filter).sort({ slotNumber: 1 });

    // If a specific time window is requested, calculate live dynamic slot states
    if (date && startTime && duration) {
      const endTime = calculateEndTime(startTime, Number(duration));

      const activeBookings = await Booking.find({
        parkingLot: lotId,
        bookingDate: date,
        bookingStatus: 'CONFIRMED'
      });

      const dynamicSlots = slots.map(slot => {
        // If slot is marked OCCUPIED by admin for maintenance
        if (slot.status === 'OCCUPIED') {
          return { ...slot.toObject(), dynamicStatus: 'OCCUPIED' };
        }

        // Check if there is an overlapping active booking
        const hasConflict = activeBookings.some(b => {
          return b.parkingSlot.toString() === slot._id.toString() &&
                 (startTime < b.endTime && endTime > b.startTime);
        });

        return {
          ...slot.toObject(),
          dynamicStatus: hasConflict ? 'RESERVED' : slot.status
        };
      });

      return res.json({ success: true, lotName: lot.name, hourlyRate: lot.hourlyRate, slots: dynamicSlots });
    }

    res.json({ success: true, lotName: lot.name, hourlyRate: lot.hourlyRate, slots });
  } catch (err) {
    console.error('Get slots error:', err);
    res.status(500).json({ success: false, error: 'Error fetching parking slots.' });
  }
});

// ==========================================================================
// 3. BOOKING APIS & CONFLICT PREVENTION ENGINE
// ==========================================================================

// Create a New Parking Reservation
app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    const { parkingLotId, parkingSlotId, vehicleNumber, vehicleType, bookingDate, startTime, duration } = req.body;

    // 1. Validate inputs
    if (!parkingLotId || !parkingSlotId || !vehicleNumber || !bookingDate || !startTime || !duration) {
      return res.status(400).json({ success: false, error: 'All reservation fields are required.' });
    }

    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum < 1) {
      return res.status(400).json({ success: false, error: 'Duration must be at least 1 hour.' });
    }

    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return res.status(400).json({ success: false, error: 'Start time must be in HH:MM format.' });
    }

    const endTime = calculateEndTime(startTime, durationNum);

    // 2. Validate booking date/time is not in the past
    const todayStr = new Date().toISOString().split('T')[0];
    if (bookingDate < todayStr) {
      return res.status(400).json({ success: false, error: 'Cannot book a parking slot for a past date.' });
    }

    // 3. Verify facility and slot exist in MongoDB
    const lot = await ParkingLot.findById(parkingLotId);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Selected parking facility not found.' });
    }

    const slot = await ParkingSlot.findOne({ _id: parkingSlotId, parkingLot: parkingLotId });
    if (!slot) {
      return res.status(404).json({ success: false, error: 'Selected parking slot not found in this facility.' });
    }

    if (slot.status === 'OCCUPIED') {
      return res.status(409).json({ success: false, error: `Slot ${slot.slotNumber} is currently marked OCCUPIED by facility marshals.` });
    }

    // 4. Time-Window Overlap & Double-Booking Prevention:
    // Overlap occurs if requestedStart < existingEnd AND requestedEnd > existingStart
    const conflictingBookings = await Booking.find({
      parkingSlot: parkingSlotId,
      bookingDate: bookingDate,
      bookingStatus: 'CONFIRMED'
    });

    const conflict = conflictingBookings.find(b => {
      return (startTime < b.endTime && endTime > b.startTime);
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        error: `Slot Conflict: Slot ${slot.slotNumber} is already booked on ${bookingDate} between ${conflict.startTime} and ${conflict.endTime}. Please choose another bay or time window.`
      });
    }

    // 5. Calculate total cost
    const totalAmount = durationNum * lot.hourlyRate;

    // 6. Generate Unique Booking ID
    let bookingId;
    let isUnique = false;
    while (!isUnique) {
      bookingId = 'BK-' + Math.floor(1000 + Math.random() * 9000);
      const exists = await Booking.findOne({ bookingId });
      if (!exists) isUnique = true;
    }

    // 7. Save Booking Document in MongoDB
    const booking = new Booking({
      bookingId,
      user: req.user.id,
      parkingLot: lot._id,
      parkingSlot: slot._id,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType: vehicleType || 'Car',
      bookingDate,
      startTime,
      endTime,
      duration: durationNum,
      totalAmount,
      bookingStatus: 'CONFIRMED'
    });

    await booking.save();

    // 8. Update live slot status if booking is for current day
    if (bookingDate === todayStr) {
      slot.status = 'RESERVED';
      await slot.save();
    }

    await syncLotAvailability(lot._id);

    const populated = await Booking.findById(booking._id)
      .populate('parkingLot', 'name location address hourlyRate')
      .populate('parkingSlot', 'slotNumber slotType')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Parking bay reserved successfully!',
      booking: populated
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ success: false, error: 'Server error processing booking.' });
  }
});

// Get User's Own Bookings
app.get('/api/bookings/my-bookings', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('parkingLot', 'name location address hourlyRate')
      .populate('parkingSlot', 'slotNumber slotType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('Get user bookings error:', err);
    res.status(500).json({ success: false, error: 'Error retrieving user bookings.' });
  }
});

// Cancel a Booking (User or Admin)
app.put('/api/bookings/:id/cancel', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking record not found.' });
    }

    // Only owner of booking or ADMIN can cancel
    if (booking.user.toString() !== req.user.id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized to cancel this booking.' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'This booking has already been cancelled.' });
    }

    booking.bookingStatus = 'CANCELLED';
    await booking.save();

    // Free up slot status in MongoDB
    const slot = await ParkingSlot.findById(booking.parkingSlot);
    if (slot && slot.status === 'RESERVED') {
      slot.status = 'AVAILABLE';
      await slot.save();
    }

    await syncLotAvailability(booking.parkingLot);

    res.json({
      success: true,
      message: `Booking #${booking.bookingId} cancelled and slot released back to facility.`,
      booking
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ success: false, error: 'Error cancelling booking.' });
  }
});

// Get All Bookings (Admin Only, supports search/filter)
app.get('/api/bookings/all', requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'ALL') {
      query.bookingStatus = status;
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone vehicleNo')
      .populate('parkingLot', 'name location')
      .populate('parkingSlot', 'slotNumber slotType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('Get all bookings error:', err);
    res.status(500).json({ success: false, error: 'Error retrieving platform bookings.' });
  }
});

// Admin Update Booking Status (e.g. COMPLETED / CANCELLED)
app.put('/api/admin/bookings/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid booking status.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking record not found.' });
    }

    booking.bookingStatus = status;
    await booking.save();

    if (status === 'CANCELLED' || status === 'COMPLETED') {
      const slot = await ParkingSlot.findById(booking.parkingSlot);
      if (slot && slot.status === 'RESERVED') {
        slot.status = 'AVAILABLE';
        await slot.save();
      }
      await syncLotAvailability(booking.parkingLot);
    }

    res.json({ success: true, message: `Booking #${booking.bookingId} status updated to ${status}.`, booking });
  } catch (err) {
    console.error('Admin update booking error:', err);
    res.status(500).json({ success: false, error: 'Error updating booking status.' });
  }
});

// ==========================================================================
// 4. ADMIN MANAGEMENT REST APIS
// ==========================================================================

// Create Parking Facility
app.post('/api/admin/parking-lots', requireAdmin, async (req, res) => {
  try {
    const { name, location, address, description, totalSlots, hourlyRate, operatingHours } = req.body;

    if (!name || !location || !address || !totalSlots || !hourlyRate) {
      return res.status(400).json({ success: false, error: 'Name, location, address, totalSlots and hourlyRate are required.' });
    }

    const existing = await ParkingLot.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A parking facility with this name already exists.' });
    }

    const lot = new ParkingLot({
      name: name.trim(),
      location: location.trim(),
      address: address.trim(),
      description: description ? description.trim() : '',
      totalSlots: Number(totalSlots),
      availableSlots: Number(totalSlots),
      hourlyRate: Number(hourlyRate),
      operatingHours: operatingHours || '24/7'
    });

    await lot.save();

    // Auto-generate bays for Lanes A and B
    const slotCount = Number(totalSlots);
    const slots = [];
    const half = Math.ceil(slotCount / 2);

    for (let i = 1; i <= half; i++) {
      const num = i < 10 ? `0${i}` : `${i}`;
      slots.push({ parkingLot: lot._id, slotNumber: `A-${num}`, slotType: 'Car', status: 'AVAILABLE' });
    }
    for (let i = 1; i <= (slotCount - half); i++) {
      const num = i < 10 ? `0${i}` : `${i}`;
      slots.push({ parkingLot: lot._id, slotNumber: `B-${num}`, slotType: 'Car', status: 'AVAILABLE' });
    }

    await ParkingSlot.insertMany(slots);
    await syncLotAvailability(lot._id);

    res.status(201).json({ success: true, message: 'Parking facility and slots created successfully.', lot });
  } catch (err) {
    console.error('Admin create lot error:', err);
    res.status(500).json({ success: false, error: 'Error creating parking facility.' });
  }
});

// Update Parking Facility
app.put('/api/admin/parking-lots/:id', requireAdmin, async (req, res) => {
  try {
    const { name, location, address, description, hourlyRate, operatingHours } = req.body;
    const lot = await ParkingLot.findById(req.params.id);

    if (!lot) {
      return res.status(404).json({ success: false, error: 'Parking facility not found.' });
    }

    if (name) lot.name = name.trim();
    if (location) lot.location = location.trim();
    if (address) lot.address = address.trim();
    if (description !== undefined) lot.description = description.trim();
    if (hourlyRate) lot.hourlyRate = Number(hourlyRate);
    if (operatingHours) lot.operatingHours = operatingHours.trim();

    await lot.save();
    res.json({ success: true, message: 'Parking facility updated successfully.', lot });
  } catch (err) {
    console.error('Admin update lot error:', err);
    res.status(500).json({ success: false, error: 'Error updating parking lot.' });
  }
});

// Delete Parking Facility
app.delete('/api/admin/parking-lots/:id', requireAdmin, async (req, res) => {
  try {
    const lotId = req.params.id;
    const lot = await ParkingLot.findById(lotId);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Parking facility not found.' });
    }

    // Cascade delete slots and facility
    await ParkingSlot.deleteMany({ parkingLot: lotId });
    await ParkingLot.findByIdAndDelete(lotId);

    res.json({ success: true, message: `Facility "${lot.name}" and its bays deleted successfully.` });
  } catch (err) {
    console.error('Admin delete lot error:', err);
    res.status(500).json({ success: false, error: 'Error deleting parking facility.' });
  }
});

// Add Slot Bay to Facility
app.post('/api/admin/parking-lots/:id/slots', requireAdmin, async (req, res) => {
  try {
    const lotId = req.params.id;
    const { slotNumber, slotType } = req.body;

    if (!slotNumber) {
      return res.status(400).json({ success: false, error: 'Slot number is required.' });
    }

    const lot = await ParkingLot.findById(lotId);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Parking facility not found.' });
    }

    const normalizedSlot = slotNumber.trim().toUpperCase();
    const existing = await ParkingSlot.findOne({ parkingLot: lotId, slotNumber: normalizedSlot });
    if (existing) {
      return res.status(409).json({ success: false, error: `Slot ${normalizedSlot} already exists in this facility.` });
    }

    const slot = new ParkingSlot({
      parkingLot: lotId,
      slotNumber: normalizedSlot,
      slotType: slotType || 'Car',
      status: 'AVAILABLE'
    });

    await slot.save();
    await syncLotAvailability(lotId);

    res.status(201).json({ success: true, message: 'Slot bay created.', slot });
  } catch (err) {
    console.error('Add slot error:', err);
    res.status(500).json({ success: false, error: 'Error adding slot bay.' });
  }
});

// Update Slot Status (Override status)
app.put('/api/admin/slots/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be AVAILABLE, OCCUPIED, or RESERVED.' });
    }

    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, error: 'Parking slot not found.' });
    }

    slot.status = status;
    await slot.save();
    await syncLotAvailability(slot.parkingLot);

    res.json({ success: true, message: `Slot ${slot.slotNumber} status updated to ${status}.`, slot });
  } catch (err) {
    console.error('Update slot error:', err);
    res.status(500).json({ success: false, error: 'Error updating slot status.' });
  }
});

// Admin Stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const totalLots = await ParkingLot.countDocuments();
    const totalSlots = await ParkingSlot.countDocuments();
    const availableSlots = await ParkingSlot.countDocuments({ status: 'AVAILABLE' });
    const occupiedSlots = await ParkingSlot.countDocuments({ status: 'OCCUPIED' });
    const reservedSlots = await ParkingSlot.countDocuments({ status: 'RESERVED' });

    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ bookingStatus: 'CONFIRMED' });

    const revenueAggr = await Booking.aggregate([
      { $match: { bookingStatus: 'CONFIRMED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAggr.length > 0 ? revenueAggr[0].total : 0;

    const occupancyRate = totalSlots > 0 ? (((totalSlots - availableSlots) / totalSlots) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      stats: {
        totalLots,
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        totalBookings,
        confirmedBookings,
        totalRevenue: `₹${totalRevenue}`,
        occupancyRate: `${occupancyRate}%`
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, error: 'Error computing administrative stats.' });
  }
});

// ==========================================================================
// 5. PROTECTED ROUTE GUARDS (BEFORE STATIC SERVING)
// ==========================================================================

app.get(['/admin.html', '/admin'], requireAdmin, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.get(['/dashboard.html', '/dashboard'], requireAuth, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'dashboard.html'));
});

app.get(['/booking.html', '/booking'], requireAuth, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'booking.html'));
});

// ==========================================================================
// 6. PUBLIC STATIC FILE SERVING
// ==========================================================================
app.use(express.static(PUBLIC_DIR));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Smart Parking Platform',
    hackathon: 'SR University 2026',
    database: mongoose.connection.readyState === 1 ? 'Connected to smart_parking_db' : 'Disconnected',
    authEngine: 'JSON Web Token (JWT) + MongoDB Session Store',
    models: ['User', 'ParkingLot', 'ParkingSlot', 'Booking', 'Session']
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ==========================================================================
// 7. MONGODB CONNECTION & SERVER EXPORT (Supports Vercel Serverless & Node)
// ==========================================================================
let isDbConnecting = false;
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (isDbConnecting) return;
  try {
    isDbConnecting = true;
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Successfully connected to MongoDB database: ${mongoose.connection.name}`);
    await seedDatabase();
  } catch (err) {
    console.error('❌ MongoDB database connection error:', err.message);
  } finally {
    isDbConnecting = false;
  }
}

// Middleware to ensure DB connection before handling requests on Vercel Serverless
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// Start local server when not running inside Vercel serverless environment
if (require.main === module || !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Smart Parking Platform running at http://localhost:${PORT}`);
    });
  });
}

module.exports = app;
