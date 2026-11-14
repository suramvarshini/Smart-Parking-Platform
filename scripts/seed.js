/**
 * Smart Parking Platform - Database Seeder
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 *
 * Populates initial campus parking lots, slots, default admin, and default user.
 */

const crypto = require('crypto');
const User = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'sru_spp_hackathon_salt_2026').digest('hex');
}

async function seedDatabase() {
  try {
    // 1. Seed Default Admin Account
    const adminEmail = 'admin@sru.edu.in';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'SRU Campus Admin',
        email: adminEmail,
        phone: '9999999999',
        password: hashPassword('admin123'),
        role: 'ADMIN'
      });
      console.log('🛡️ Default ADMIN account seeded: admin@sru.edu.in / admin123');
    }

    // 2. Seed Default User Account
    const userEmail = 'user@sru.edu.in';
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await User.create({
        name: 'Rahul Sharma',
        email: userEmail,
        phone: '9876543210',
        password: hashPassword('user123'),
        role: 'USER',
        vehicleNo: 'TS 03 AB 1234'
      });
      console.log('🚗 Default USER account seeded: user@sru.edu.in / user123');
    }

    // 3. Seed Campus Parking Lots & Slots if none exist
    const lotCount = await ParkingLot.countDocuments();
    if (lotCount === 0) {
      console.log('📦 Seeding initial campus parking facilities and slots...');

      const initialLots = [
        {
          name: 'SRU Main Academic Block',
          location: 'North Campus, Gate 1',
          address: 'Opposite Administrative Office, Main Gate Entrance',
          description: 'Paved ground-level lot with CCTV monitoring and EV fast-charging ports. Ideal for classroom and administration access.',
          totalSlots: 20,
          availableSlots: 20,
          operatingHours: '24/7',
          hourlyRate: 20
        },
        {
          name: 'Science & Tech Tower (Zone B)',
          location: 'East Campus, Near CS Labs',
          address: 'Adjacent to Computer Engineering Block & IT Center',
          description: 'Multi-lane shaded parking zone with dedicated bays for four-wheelers and high-speed boom barrier entry.',
          totalSlots: 20,
          availableSlots: 20,
          operatingHours: '06:00 AM - 11:00 PM',
          hourlyRate: 25
        },
        {
          name: 'Sports Complex & Auditorium',
          location: 'South Campus, Beside Stadium',
          address: 'Stadium Approach Road, Near Indoor Badminton Hall',
          description: 'Spacious open-air parking area suitable for university events, matches, and extended faculty/student visits.',
          totalSlots: 20,
          availableSlots: 20,
          operatingHours: '06:00 AM - 10:00 PM',
          hourlyRate: 15
        },
        {
          name: 'Central Library Basement',
          location: 'Central Campus, Lower Level',
          address: 'Central Library Complex, Basement Ramp B1',
          description: 'Underground weather-proof parking facility with automated ticketless camera entry and well-lit bays.',
          totalSlots: 20,
          availableSlots: 20,
          operatingHours: '24/7',
          hourlyRate: 30
        }
      ];

      for (const lotData of initialLots) {
        const createdLot = await ParkingLot.create(lotData);
        const slotsToCreate = [];

        // Generate 20 slots: Lane A (A-01 to A-10) and Lane B (B-01 to B-10)
        for (let i = 1; i <= 10; i++) {
          const num = i < 10 ? `0${i}` : `${i}`;
          // A few sample occupied/reserved for realistic student demo
          let status = 'AVAILABLE';
          if (createdLot.name === 'SRU Main Academic Block') {
            if (i === 2 || i === 6 || i === 9) status = 'OCCUPIED';
            if (i === 3) status = 'RESERVED';
          }
          slotsToCreate.push({
            parkingLot: createdLot._id,
            slotNumber: `A-${num}`,
            slotType: i === 5 ? 'Car' : 'Car',
            status
          });
        }

        for (let i = 1; i <= 10; i++) {
          const num = i < 10 ? `0${i}` : `${i}`;
          let status = 'AVAILABLE';
          if (createdLot.name === 'SRU Main Academic Block') {
            if (i === 2 || i === 4 || i === 7 || i === 10) status = 'OCCUPIED';
            if (i === 5) status = 'RESERVED';
          }
          slotsToCreate.push({
            parkingLot: createdLot._id,
            slotNumber: `B-${num}`,
            slotType: i === 5 ? 'Car' : 'Car',
            status
          });
        }

        await ParkingSlot.insertMany(slotsToCreate);

        // Update available slot count
        const availableCount = slotsToCreate.filter(s => s.status === 'AVAILABLE').length;
        createdLot.availableSlots = availableCount;
        await createdLot.save();
      }

      console.log('✅ 4 Campus parking lots and 80 parking slots seeded successfully.');

      // 4. Seed an initial confirmed booking for Rahul Sharma to showcase in User Dashboard
      const firstLot = await ParkingLot.findOne({ name: 'SRU Main Academic Block' });
      const firstSlot = await ParkingSlot.findOne({ parkingLot: firstLot._id, slotNumber: 'A-03' });
      
      const today = new Date().toISOString().split('T')[0];
      await Booking.create({
        bookingId: 'BK-9481',
        user: user._id,
        parkingLot: firstLot._id,
        parkingSlot: firstSlot._id,
        vehicleNumber: 'TS 03 AB 1234',
        vehicleType: 'Car',
        bookingDate: today,
        startTime: '12:00',
        endTime: '14:00',
        duration: 2,
        totalAmount: 40,
        bookingStatus: 'CONFIRMED'
      });
      console.log('🎟️ Initial sample confirmed booking #BK-9481 seeded.');
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
}

module.exports = seedDatabase;
