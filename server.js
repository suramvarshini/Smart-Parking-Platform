/**
 * Smart Parking Platform - Main Server & API Engine
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 *
 * Session 2: Full MongoDB + Mongoose Integration, RBAC Security & Conflict Prevention.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

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

// ---------------- Helpers ---------------- //

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'sru_spp_hackathon_salt_2026').digest('hex');
}

function calculateEndTime(startTime, durationHours) {
  const [h, m] = startTime.split(':').map(Number);
  const endH = h + Number(durationHours);
  const formattedH = String(endH % 24).padStart(2, '0');
  const formattedM = String(m).padStart(2, '0');
  return `${formattedH}:${formattedM}`;
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

// ---------------- Middleware ---------------- //

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser Middleware
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

// Session Loader Middleware
app.use(async (req, res, next) => {
  req.user = null;
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

// Authorization Middlewares
function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.accepts('html')) {
      return res.redirect('/login.html?error=unauthenticated');
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Please log in to proceed.' });
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
      return res.status(403).sendFile(path.join(__dirname, 'public', 'access-denied.html'));
    }
    return res.status(403).json({ success: false, error: 'Access Denied: Administrator role required.' });
  }

  next();
}

// ==========================================================================
// 1. AUTHENTICATION APIS
// ==========================================================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, vehicleNo } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, phone, and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    // Role is strictly forced to 'USER' - no privilege self-assignment
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashPassword(password),
      role: 'USER',
      vehicleNo: vehicleNo ? vehicleNo.trim().toUpperCase() : ''
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
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

    const sessionId = crypto.randomUUID();

    // Store session in MongoDB
    await Session.create({
      sessionId,
      userId: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    });

    res.setHeader('Set-Cookie', `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

    res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vehicleNo: user.vehicleNo
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const sessionId = req.cookies.session_id;
    if (sessionId) {
      await Session.deleteOne({ sessionId });
    }
    res.setHeader('Set-Cookie', 'session_id=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
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
// 2. PARKING LOTS & SLOTS APIS
// ==========================================================================

// Get all parking lots
app.get('/api/parking-lots', async (req, res) => {
  try {
    const lots = await ParkingLot.find().sort({ createdAt: -1 });

    // Sync available counts live
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
    res.status(500).json({ success: false, error: 'Error fetching parking lots.' });
  }
});

// Get single parking lot details
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
    res.status(500).json({ success: false, error: 'Error fetching parking lot details.' });
  }
});

// Get slots for a parking lot (with dynamic time-window conflict check)
app.get('/api/parking-lots/:id/slots', async (req, res) => {
  try {
    const lotId = req.params.id;
    const lot = await ParkingLot.findById(lotId);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Parking lot not found.' });
    }

    const slots = await ParkingSlot.find({ parkingLot: lotId }).sort({ slotNumber: 1 });

    const { date, startTime, duration } = req.query;

    // If query contains specific date/time, calculate dynamic status considering active bookings
    if (date && startTime && duration) {
      const endTime = calculateEndTime(startTime, Number(duration));

      const activeBookings = await Booking.find({
        parkingLot: lotId,
        bookingDate: date,
        bookingStatus: 'CONFIRMED'
      });

      const dynamicSlots = slots.map(slot => {
        // Base slot status from admin
        if (slot.status === 'OCCUPIED') {
          return { ...slot.toObject(), dynamicStatus: 'OCCUPIED' };
        }

        // Check if there is an overlapping booking for this specific slot
        const conflict = activeBookings.find(b => {
          return b.parkingSlot.toString() === slot._id.toString() &&
                 (startTime < b.endTime && endTime > b.startTime);
        });

        return {
          ...slot.toObject(),
          dynamicStatus: conflict ? 'RESERVED' : slot.status
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
// 3. BOOKING APIS & CONFLICT PREVENTION
// ==========================================================================

// Create Booking
app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    const { parkingLotId, parkingSlotId, vehicleNumber, vehicleType, bookingDate, startTime, duration } = req.body;

    // 1. Validate required fields
    if (!parkingLotId || !parkingSlotId || !vehicleNumber || !bookingDate || !startTime || !duration) {
      return res.status(400).json({ success: false, error: 'All booking fields are required.' });
    }

    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum < 1) {
      return res.status(400).json({ success: false, error: 'Duration must be at least 1 hour.' });
    }

    // 2. Validate booking time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return res.status(400).json({ success: false, error: 'Start time must be in HH:MM format.' });
    }

    const endTime = calculateEndTime(startTime, durationNum);

    // 3. Prevent past date / time bookings
    const todayStr = new Date().toISOString().split('T')[0];
    if (bookingDate < todayStr) {
      return res.status(400).json({ success: false, error: 'Cannot book a parking slot for a past date.' });
    }

    // 4. Verify Parking Lot and Slot exist
    const lot = await ParkingLot.findById(parkingLotId);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Selected parking facility not found.' });
    }

    const slot = await ParkingSlot.findOne({ _id: parkingSlotId, parkingLot: parkingLotId });
    if (!slot) {
      return res.status(404).json({ success: false, error: 'Selected parking slot bay not found in this lot.' });
    }

    if (slot.status === 'OCCUPIED') {
      return res.status(409).json({ success: false, error: 'This slot is currently marked OCCUPIED by facility marshals.' });
    }

    // 5. Booking Conflict Prevention: Check for overlapping active bookings
    const conflictingBookings = await Booking.find({
      parkingSlot: parkingSlotId,
      bookingDate: bookingDate,
      bookingStatus: 'CONFIRMED'
    });

    const hasOverlap = conflictingBookings.some(b => {
      return (startTime < b.endTime && endTime > b.startTime);
    });

    if (hasOverlap) {
      return res.status(409).json({
        success: false,
        error: `Slot Conflict: Slot ${slot.slotNumber} is already booked on ${bookingDate} between ${conflictingBookings[0].startTime} and ${conflictingBookings[0].endTime}. Please choose another time or bay.`
      });
    }

    // 6. Calculate total amount
    const totalAmount = durationNum * lot.hourlyRate;

    // 7. Generate unique Booking ID
    let bookingId;
    let isUnique = false;
    while (!isUnique) {
      bookingId = 'BK-' + Math.floor(1000 + Math.random() * 9000);
      const exists = await Booking.findOne({ bookingId });
      if (!exists) isUnique = true;
    }

    // 8. Create booking record in MongoDB
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

    // 9. Update live slot status if booking is for today's active window
    if (bookingDate === todayStr) {
      slot.status = 'RESERVED';
      await slot.save();
    }

    await syncLotAvailability(lot._id);

    // Return populated booking
    const populated = await Booking.findById(booking._id)
      .populate('parkingLot', 'name location address hourlyRate')
      .populate('parkingSlot', 'slotNumber slotType')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Parking slot booked successfully!',
      booking: populated
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, error: 'Server error while processing booking.' });
  }
});

// Get Current User's Bookings
app.get('/api/bookings/my-bookings', requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('parkingLot', 'name location hourlyRate')
      .populate('parkingSlot', 'slotNumber slotType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('Get my bookings error:', err);
    res.status(500).json({ success: false, error: 'Error fetching your bookings.' });
  }
});

// Cancel a Booking
app.put('/api/bookings/:id/cancel', requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    // Ensure user owns booking OR user is ADMIN
    if (booking.user.toString() !== req.user.id.toString() && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'You are not authorized to cancel this booking.' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'This booking is already cancelled.' });
    }

    booking.bookingStatus = 'CANCELLED';
    await booking.save();

    // Free up slot status
    const slot = await ParkingSlot.findById(booking.parkingSlot);
    if (slot && slot.status === 'RESERVED') {
      slot.status = 'AVAILABLE';
      await slot.save();
    }

    await syncLotAvailability(booking.parkingLot);

    res.json({ success: true, message: `Booking #${booking.bookingId} cancelled successfully.`, booking });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ success: false, error: 'Error cancelling booking.' });
  }
});

// Get All Bookings (Admin Only)
app.get('/api/bookings/all', requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email phone vehicleNo')
      .populate('parkingLot', 'name location')
      .populate('parkingSlot', 'slotNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    console.error('Get all bookings error:', err);
    res.status(500).json({ success: false, error: 'Error fetching platform bookings.' });
  }
});

// ==========================================================================
// 4. ADMIN MANAGEMENT APIS
// ==========================================================================

// Add Parking Lot
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

    // Automatically create parking slots for the new lot (Lanes A & B)
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
    console.error('Admin add lot error:', err);
    res.status(500).json({ success: false, error: 'Error creating parking facility.' });
  }
});

// Update Parking Lot
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

// Delete Parking Lot
app.delete('/api/admin/parking-lots/:id', requireAdmin, async (req, res) => {
  try {
    const lotId = req.params.id;
    const lot = await ParkingLot.findById(lotId);
    if (!lot) {
      return res.status(404).json({ success: false, error: 'Parking facility not found.' });
    }

    // Delete associated slots and lot
    await ParkingSlot.deleteMany({ parkingLot: lotId });
    await ParkingLot.findByIdAndDelete(lotId);

    res.json({ success: true, message: `Facility "${lot.name}" and its slots deleted successfully.` });
  } catch (err) {
    console.error('Admin delete lot error:', err);
    res.status(500).json({ success: false, error: 'Error deleting parking lot.' });
  }
});

// Add Individual Parking Slot
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

    const existing = await ParkingSlot.findOne({ parkingLot: lotId, slotNumber: slotNumber.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: `Slot ${slotNumber} already exists in this facility.` });
    }

    const slot = new ParkingSlot({
      parkingLot: lotId,
      slotNumber: slotNumber.trim().toUpperCase(),
      slotType: slotType || 'Car',
      status: 'AVAILABLE'
    });

    await slot.save();
    await syncLotAvailability(lotId);

    res.status(201).json({ success: true, message: 'Slot bay created.', slot });
  } catch (err) {
    console.error('Add slot error:', err);
    res.status(500).json({ success: false, error: 'Error creating slot.' });
  }
});

// Update Slot Status (Available, Occupied, Reserved)
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
    console.error('Update slot status error:', err);
    res.status(500).json({ success: false, error: 'Error updating slot status.' });
  }
});

// Admin Dashboard Overview Statistics
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

// Protect Admin Portal URL: STRICTLY requires ADMIN role
app.get(['/admin.html', '/admin'], requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Protect User Dashboard URL: Requires authenticated user
app.get(['/dashboard.html', '/dashboard'], requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Protect Booking Page URL: Requires authenticated user
app.get(['/booking.html', '/booking'], requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

// ==========================================================================
// 6. PUBLIC STATIC FILE SERVING
// ==========================================================================
app.use(express.static(path.join(__dirname, 'public')));

// Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Smart Parking Platform',
    hackathon: 'SR University 2026',
    database: mongoose.connection.readyState === 1 ? 'Connected to smart_parking_db' : 'Disconnected',
    models: ['User', 'ParkingLot', 'ParkingSlot', 'Booking', 'Session'],
    security: 'Server-side Role-Based Access Control Active'
  });
});

// Root Route fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================================================
// 7. START SERVER & CONNECT DATABASE
// ==========================================================================
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log(`✅ Successfully connected to MongoDB database: ${mongoose.connection.name}`);
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Smart Parking Platform running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB database connection error:', err.message);
    app.listen(PORT, () => {
      console.log(`🚀 Smart Parking Platform running (offline DB mode) at http://localhost:${PORT}`);
    });
  });
