/**
 * Smart Parking Platform - Main Server & Security Engine
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 *
 * Session 1: Serves frontend and enforces strict server-side Role-Based Access Control (RBAC).
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_parking';

// Password hashing helper (deterministic, salt-protected, no external package needed)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'sru_spp_hackathon_salt_2026').digest('hex');
}

// ---------------- Database Models ---------------- //

// User Model: Exactly two roles ('USER', 'ADMIN')
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  vehicleNo: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Session Model: Server-side stored sessions (TTL 24 hours)
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const Session = mongoose.model('Session', sessionSchema);

// ---------------- Middleware ---------------- //

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

// Session Loader Middleware: Attaches req.user strictly from DB session
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

// ---------------- Authorization Middlewares ---------------- //

// Require any authenticated user (USER or ADMIN)
function requireAuth(req, res, next) {
  if (!req.user) {
    if (req.accepts('html')) {
      return res.redirect('/login.html?error=unauthenticated');
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Please log in to proceed.' });
  }
  next();
}

// Require strictly ADMIN role
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

// ---------------- Authentication Endpoints ---------------- //

// User Registration: STRICTLY FORCES role = 'USER'
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, vehicleNo } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, phone, and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    // Role is ALWAYS forced to 'USER' - Users cannot self-assign ADMIN
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashPassword(password),
      role: 'USER',
      vehicleNo: vehicleNo ? vehicleNo.trim() : ''
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account registered successfully. Please proceed to login.',
      role: newUser.role
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});

// Login Endpoint: Authenticates and creates server session
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

    // Generate secure session ID
    const sessionId = crypto.randomUUID();

    // Store in MongoDB Session collection
    await Session.create({
      sessionId,
      userId: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    });

    // Set HttpOnly Cookie
    res.setHeader('Set-Cookie', `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

    res.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

// Logout Endpoint: Clears session on server and cookie
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

// Current User State Endpoint
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false, user: null });
  }
  res.json({ authenticated: true, user: req.user });
});

// Protected API Endpoint Examples (Enforce RBAC)
app.get('/api/admin/overview', requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Authorized access to Admin Overview API.',
    operator: req.user.name,
    role: req.user.role,
    stats: { totalLots: 4, activeSlots: 80, liveOccupancy: '47.5%' }
  });
});

app.get('/api/user/profile', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Authorized access to User Profile API.',
    user: req.user
  });
});

// ---------------- Protected Page Route Interceptors ---------------- //
// MUST be registered BEFORE express.static to prevent unauthorized static file delivery

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

// ---------------- Public Static File Serving ---------------- //
app.use(express.static(path.join(__dirname, 'public')));

// Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Smart Parking Platform',
    hackathon: 'SR University 2026',
    database: mongoose.connection.readyState === 1 ? 'Connected to MongoDB' : 'Disconnected',
    security: 'Server-side Role-Based Access Control Active'
  });
});

// Root Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------- Default Account Seeder ---------------- //
async function seedDefaultAccounts() {
  try {
    // 1. Seed Default Admin Account if missing
    const adminEmail = 'admin@sru.edu.in';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'SRU Campus Admin',
        email: adminEmail,
        phone: '9999999999',
        password: hashPassword('admin123'),
        role: 'ADMIN'
      });
      console.log('🛡️ Default ADMIN account seeded: admin@sru.edu.in / admin123');
    }

    // 2. Seed Default User Account if missing
    const userEmail = 'user@sru.edu.in';
    const userExists = await User.findOne({ email: userEmail });
    if (!userExists) {
      await User.create({
        name: 'Rahul Sharma',
        email: userEmail,
        phone: '9876543210',
        password: hashPassword('user123'),
        role: 'USER',
        vehicleNo: 'TS 03 AB 1234'
      });
      console.log('🚗 Default USER account seeded: user@sru.edu.in / user123');
    }
  } catch (err) {
    console.error('Account seeding error:', err.message);
  }
}

// ---------------- Start Server ---------------- //
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully.');
    await seedDefaultAccounts();
    app.listen(PORT, () => {
      console.log(`🚀 Smart Parking Platform running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    app.listen(PORT, () => {
      console.log(`🚀 Smart Parking Platform running (offline DB mode) at http://localhost:${PORT}`);
    });
  });
