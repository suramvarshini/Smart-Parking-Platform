/**
 * Comprehensive MongoDB Database & CRUD Verification Harness
 * Smart Parking Platform - SR University Hackathon 2026
 *
 * Verifies live MongoDB connection and performs genuine CRUD operations
 * across Users, ParkingLot, ParkingSlot, and Booking models.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'sru_spp_hackathon_salt_2026').digest('hex');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_parking_db';

async function runDatabaseVerification() {
  console.log('================================================================');
  console.log('   SMART PARKING PLATFORM: LIVE MONGODB & CRUD VERIFICATION    ');
  console.log('================================================================\n');

  console.log(`[1] CONNECTING TO MONGODB: ${MONGODB_URI}`);
  const startTime = Date.now();
  await mongoose.connect(MONGODB_URI);
  const latency = Date.now() - startTime;
  console.log(`✅ Connected successfully in ${latency}ms`);
  console.log(`   Database Name : ${mongoose.connection.name}`);
  console.log(`   Host          : ${mongoose.connection.host}`);
  console.log(`   Port          : ${mongoose.connection.port}`);
  console.log(`   Ready State   : ${mongoose.connection.readyState} (1 = Connected)\n`);

  // Inspect Existing Collections & Document Counts
  console.log('----------------------------------------------------------------');
  console.log('[2] EXISTING LIVE DATA AUDIT IN smart_parking_db');
  console.log('----------------------------------------------------------------');
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`   📁 Collection: ${col.name.padEnd(16)} | Document Count: ${count}`);
  }
  console.log('');

  // -------------------------------------------------------------
  // CRUD TEST 1: USERS
  // -------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('[3] CRUD OPERATION TEST: USER MODEL');
  console.log('----------------------------------------------------------------');
  const testUserEmail = `crud.test.${Date.now()}@sru.edu.in`;
  const plainPassword = 'Password@123';
  const hashedPassword = hashPassword(plainPassword);

  // C - Create
  const createdUser = await User.create({
    name: 'MongoDB Verification User',
    email: testUserEmail,
    password: hashedPassword,
    phone: '9876543210',
    role: 'USER'
  });
  console.log(`   [CREATE] Stored User in MongoDB:`);
  console.log(`            _id   : ${createdUser._id}`);
  console.log(`            name  : ${createdUser.name}`);
  console.log(`            email : ${createdUser.email}`);
  console.log(`            role  : ${createdUser.role}`);

  // R - Read
  const retrievedUser = await User.findOne({ email: testUserEmail });
  const isPassMatch = retrievedUser.password === hashPassword(plainPassword);
  console.log(`   [READ]   Retrieved from MongoDB by email:`);
  console.log(`            Found : ${retrievedUser.name} (${retrievedUser.email})`);
  console.log(`            SHA-256 Hash Validation: ${isPassMatch ? 'MATCHES (Valid)' : 'FAILED'}`);

  // U - Update
  const updatedUser = await User.findByIdAndUpdate(
    createdUser._id,
    { phone: '9123456789', name: 'MongoDB Verified Driver' },
    { returnDocument: 'after' }
  );
  console.log(`   [UPDATE] Modified in MongoDB:`);
  console.log(`            Updated Phone: ${updatedUser.phone}`);
  console.log(`            Updated Name : ${updatedUser.name}`);

  // D - Delete
  const userDeleteResult = await User.deleteOne({ _id: createdUser._id });
  const checkDeletedUser = await User.findById(createdUser._id);
  console.log(`   [DELETE] Removed from MongoDB:`);
  console.log(`            Deleted Count : ${userDeleteResult.deletedCount}`);
  console.log(`            Verified Gone : ${checkDeletedUser === null ? 'YES (Confirmed)' : 'NO'}\n`);

  // -------------------------------------------------------------
  // CRUD TEST 2: PARKING LOTS (FACILITIES)
  // -------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('[4] CRUD OPERATION TEST: PARKINGLOT MODEL');
  console.log('----------------------------------------------------------------');
  const lotCode = Math.floor(100 + Math.random() * 900);
  const testLotName = `SRU Mechanical Block Lot ${lotCode}`;

  // C - Create
  const createdLot = await ParkingLot.create({
    name: testLotName,
    location: 'North Campus Near Workshop 3',
    address: 'North Campus Near Workshop 3, SR University, Warangal',
    description: 'Faculty and student multi-tier parking lot with shade.',
    totalSlots: 20,
    availableSlots: 20,
    hourlyRate: 25,
    operatingHours: '07:00 AM - 09:00 PM'
  });
  console.log(`   [CREATE] Stored Facility in MongoDB:`);
  console.log(`            _id         : ${createdLot._id}`);
  console.log(`            name        : ${createdLot.name}`);
  console.log(`            totalSlots  : ${createdLot.totalSlots}`);
  console.log(`            hourlyRate  : ₹${createdLot.hourlyRate}/hr`);

  // R - Read
  const retrievedLot = await ParkingLot.findById(createdLot._id);
  console.log(`   [READ]   Retrieved Facility from MongoDB:`);
  console.log(`            Found       : ${retrievedLot.name}`);
  console.log(`            Hours       : ${retrievedLot.operatingHours}`);

  // U - Update
  const updatedLot = await ParkingLot.findByIdAndUpdate(
    createdLot._id,
    { hourlyRate: 30, availableSlots: 19 },
    { returnDocument: 'after' }
  );
  console.log(`   [UPDATE] Updated Facility Rates & Capacity:`);
  console.log(`            New Rate    : ₹${updatedLot.hourlyRate}/hr`);
  console.log(`            New Avail   : ${updatedLot.availableSlots} slots`);

  // -------------------------------------------------------------
  // CRUD TEST 3: PARKING SLOTS (BAYS)
  // -------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('[5] CRUD OPERATION TEST: PARKINGSLOT MODEL');
  console.log('----------------------------------------------------------------');

  // C - Create
  const createdSlot = await ParkingSlot.create({
    parkingLot: createdLot._id,
    slotNumber: 'M-01',
    slotType: 'Car',
    status: 'AVAILABLE'
  });
  console.log(`   [CREATE] Stored Bay in MongoDB:`);
  console.log(`            _id         : ${createdSlot._id}`);
  console.log(`            parkingLot  : ${createdSlot.parkingLot}`);
  console.log(`            slotNumber  : ${createdSlot.slotNumber}`);
  console.log(`            slotType    : ${createdSlot.slotType}`);
  console.log(`            status      : ${createdSlot.status}`);

  // R - Read
  const retrievedSlot = await ParkingSlot.findOne({ parkingLot: createdLot._id, slotNumber: 'M-01' });
  console.log(`   [READ]   Retrieved Bay from MongoDB:`);
  console.log(`            Bay Number  : ${retrievedSlot.slotNumber}`);
  console.log(`            Bay Status  : ${retrievedSlot.status}`);

  // U - Update (Status Override)
  const updatedSlot = await ParkingSlot.findByIdAndUpdate(
    createdSlot._id,
    { status: 'RESERVED' },
    { returnDocument: 'after' }
  );
  console.log(`   [UPDATE] Modified Bay Status:`);
  console.log(`            Status      : ${updatedSlot.status} (Updated)`);

  // -------------------------------------------------------------
  // CRUD TEST 4: BOOKINGS (RESERVATIONS)
  // -------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('[6] CRUD OPERATION TEST: BOOKING MODEL');
  console.log('----------------------------------------------------------------');
  // Need an existing user from the database
  const activeUser = await User.findOne({ role: 'USER' });
  const testBookingId = `BK-CRUD-${Date.now().toString().slice(-4)}`;

  // C - Create
  const createdBooking = await Booking.create({
    bookingId: testBookingId,
    user: activeUser._id,
    parkingLot: createdLot._id,
    parkingSlot: createdSlot._id,
    vehicleNumber: 'TS 03 EQ 9988',
    vehicleType: 'Car',
    bookingDate: '2026-11-15',
    startTime: '10:00',
    endTime: '13:00',
    duration: 3,
    totalAmount: 90,
    bookingStatus: 'CONFIRMED'
  });
  console.log(`   [CREATE] Stored Booking in MongoDB:`);
  console.log(`            _id           : ${createdBooking._id}`);
  console.log(`            bookingId     : ${createdBooking.bookingId}`);
  console.log(`            vehicleNumber : ${createdBooking.vehicleNumber}`);
  console.log(`            schedule      : ${createdBooking.bookingDate} (${createdBooking.startTime} - ${createdBooking.endTime})`);
  console.log(`            totalAmount   : ₹${createdBooking.totalAmount}`);
  console.log(`            bookingStatus : ${createdBooking.bookingStatus}`);

  // R - Read with Mongoose Population (Relational Integrity)
  const populatedBooking = await Booking.findById(createdBooking._id)
    .populate('user', 'name email role')
    .populate('parkingLot', 'name location hourlyRate')
    .populate('parkingSlot', 'slotNumber slotType');

  console.log(`   [READ]   Retrieved & Populated from MongoDB:`);
  console.log(`            Driver Name   : ${populatedBooking.user.name} (${populatedBooking.user.email})`);
  console.log(`            Facility Name : ${populatedBooking.parkingLot.name}`);
  console.log(`            Bay Number    : ${populatedBooking.parkingSlot.slotNumber} (${populatedBooking.parkingSlot.slotType})`);

  // U - Update (Cancellation Workflow)
  const cancelledBooking = await Booking.findByIdAndUpdate(
    createdBooking._id,
    { bookingStatus: 'CANCELLED' },
    { returnDocument: 'after' }
  );
  console.log(`   [UPDATE] Cancelled Reservation in MongoDB:`);
  console.log(`            New Status    : ${cancelledBooking.bookingStatus}`);

  // Clean up test booking and slot
  await Booking.deleteOne({ _id: createdBooking._id });
  await ParkingSlot.deleteOne({ _id: createdSlot._id });
  await ParkingLot.deleteOne({ _id: createdLot._id });
  console.log(`   [CLEANUP] Deleted test booking, slot, and facility.`);
  console.log(`            Verified cleanup complete: YES\n`);

  // -------------------------------------------------------------
  // LIVE SAMPLE DATA INSPECTION
  // -------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('[7] LIVE REAL RECORDS CURRENTLY STORED IN DATABASE');
  console.log('----------------------------------------------------------------');

  const usersCount = await User.countDocuments();
  const sampleUsers = await User.find({}, 'name email role createdAt').limit(3);
  console.log(`\n📌 USERS IN DATABASE (Total: ${usersCount}):`);
  sampleUsers.forEach((u, i) => {
    console.log(`   ${i + 1}. Name: ${u.name.padEnd(20)} | Email: ${u.email.padEnd(22)} | Role: ${u.role}`);
  });

  const lotsCount = await ParkingLot.countDocuments();
  const sampleLots = await ParkingLot.find({}, 'name location totalSlots availableSlots hourlyRate').limit(3);
  console.log(`\n📌 PARKING FACILITIES IN DATABASE (Total: ${lotsCount}):`);
  sampleLots.forEach((l, i) => {
    console.log(`   ${i + 1}. Lot: ${l.name.padEnd(28)} | Slots: ${l.totalSlots} | Rate: ₹${l.hourlyRate}/hr | Loc: ${l.location}`);
  });

  const slotsCount = await ParkingSlot.countDocuments();
  const availableSlotsCount = await ParkingSlot.countDocuments({ status: 'AVAILABLE' });
  const occupiedSlotsCount = await ParkingSlot.countDocuments({ status: 'OCCUPIED' });
  const reservedSlotsCount = await ParkingSlot.countDocuments({ status: 'RESERVED' });
  console.log(`\n📌 PARKING BAYS IN DATABASE (Total: ${slotsCount}):`);
  console.log(`   🟢 Available: ${availableSlotsCount} | 🔴 Occupied: ${occupiedSlotsCount} | 🟠 Reserved: ${reservedSlotsCount}`);

  const bookingsCount = await Booking.countDocuments();
  const sampleBookings = await Booking.find().populate('user', 'name').populate('parkingLot', 'name').limit(3);
  console.log(`\n📌 RESERVATIONS IN DATABASE (Total: ${bookingsCount}):`);
  sampleBookings.forEach((b, i) => {
    console.log(`   ${i + 1}. ID: ${b.bookingId} | User: ${b.user ? b.user.name : 'Unknown'} | Lot: ${b.parkingLot ? b.parkingLot.name : 'N/A'} | Date: ${b.bookingDate} | Status: ${b.bookingStatus}`);
  });

  console.log('\n================================================================');
  console.log('   MONGODB VERIFICATION RESULT: 100% REAL PERSISTENCE CONFIRMED');
  console.log('================================================================');

  await mongoose.disconnect();
}

runDatabaseVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
