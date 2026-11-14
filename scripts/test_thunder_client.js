/**
 * Smart Parking Platform - Thunder Client API Test Suite Simulator
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 *
 * Simulates comprehensive Thunder Client REST API testing for Session 2.
 */

const http = require('http');

function apiCall(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, json: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   THUNDER CLIENT TEST SIMULATOR: SESSION 2 DATABASE SUITE      ');
  console.log('================================================================\n');

  let passedCount = 0;
  let totalTests = 16;

  // 1. Health & MongoDB Connection
  const health = await apiCall({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('[TEST 1] Health & MongoDB Connection:');
  const t1Pass = health.status === 200 && health.json.database.includes('smart_parking_db');
  console.log(`Status: ${health.status} | DB: ${health.json.database} -> ${t1Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t1Pass) passedCount++;

  // 2. User Registration
  const randEmail = 'testuser' + Date.now() + '@sru.edu.in';
  const reg = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Pooja Reddy', email: randEmail, phone: '9123456780', password: 'password123', vehicleNo: 'TS 08 AB 9999' });
  console.log('\n[TEST 2] User Registration (MongoDB Write):');
  const t2Pass = reg.status === 201 && reg.json.success === true;
  console.log(`Status: ${reg.status} | Msg: ${reg.json.message} -> ${t2Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t2Pass) passedCount++;

  // 3. Duplicate Email Prevention
  const dupReg = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Pooja Duplicate', email: randEmail, phone: '9123456780', password: 'password123' });
  console.log('\n[TEST 3] Duplicate Email Rejection (Mongoose Unique Constraint):');
  const t3Pass = dupReg.status === 409 && dupReg.json.error.includes('already exists');
  console.log(`Status: ${dupReg.status} | Error: ${dupReg.json.error} -> ${t3Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t3Pass) passedCount++;

  // 4. User Login & Session Creation
  const loginRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'user@sru.edu.in', password: 'user123' });
  const userCookie = (loginRes.headers['set-cookie'] || [])[0];
  console.log('\n[TEST 4] User Login & Session Cookie (Role USER):');
  const t4Pass = loginRes.status === 200 && loginRes.json.user.role === 'USER' && !!userCookie;
  console.log(`Status: ${loginRes.status} | User: ${loginRes.json.user.name} | Role: ${loginRes.json.user.role} -> ${t4Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t4Pass) passedCount++;

  // 5. Admin Login & Session Creation
  const adminLoginRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@sru.edu.in', password: 'admin123' });
  const adminCookie = (adminLoginRes.headers['set-cookie'] || [])[0];
  console.log('\n[TEST 5] Admin Login & Session Cookie (Role ADMIN):');
  const t5Pass = adminLoginRes.status === 200 && adminLoginRes.json.user.role === 'ADMIN' && !!adminCookie;
  console.log(`Status: ${adminLoginRes.status} | Admin: ${adminLoginRes.json.user.name} | Role: ${adminLoginRes.json.user.role} -> ${t5Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t5Pass) passedCount++;

  // 6. Parking Lots Retrieval
  const lotsRes = await apiCall({ hostname: 'localhost', port: 5000, path: '/api/parking-lots', method: 'GET' });
  console.log('\n[TEST 6] Parking Lot Retrieval from MongoDB:');
  const t6Pass = lotsRes.status === 200 && lotsRes.json.count >= 4;
  console.log(`Status: ${lotsRes.status} | Facilities Found: ${lotsRes.json.count} -> ${t6Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t6Pass) passedCount++;

  const targetLot = lotsRes.json.lots.find(l => l.totalSlots >= 20) || lotsRes.json.lots[0];

  // 7. Slots Retrieval for Selected Lot
  const slotsRes = await apiCall({ hostname: 'localhost', port: 5000, path: `/api/parking-lots/${targetLot._id}/slots`, method: 'GET' });
  console.log(`\n[TEST 7] Parking Slots for Facility "${targetLot.name}":`);
  const t7Pass = slotsRes.status === 200 && slotsRes.json.slots.length >= 20;
  console.log(`Status: ${slotsRes.status} | Total Slots: ${slotsRes.json.slots.length} -> ${t7Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t7Pass) passedCount++;

  // 8. Booking Creation - dynamically find a slot with NO bookings on today
  const today = new Date().toISOString().split('T')[0];
  const activeTodayBookings = await apiCall({ hostname: 'localhost', port: 5000, path: `/api/parking-lots/${targetLot._id}/slots?date=${today}&startTime=10:00&duration=12`, method: 'GET' });
  const freshSlot = activeTodayBookings.json.slots.find(s => s.dynamicStatus === 'AVAILABLE' || s.status === 'AVAILABLE');

  const bookRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/bookings', method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userCookie }
  }, {
    parkingLotId: targetLot._id,
    parkingSlotId: freshSlot._id,
    vehicleNumber: 'TS 09 XY 7777',
    vehicleType: 'Car',
    bookingDate: today,
    startTime: '10:00',
    duration: 2
  });
  console.log('\n[TEST 8] Booking Creation (MongoDB Document Creation):');
  const t8Pass = bookRes.status === 201 && bookRes.json.booking && bookRes.json.booking.bookingId.startsWith('BK-');
  console.log(`Status: ${bookRes.status} | Booking ID: ${bookRes.json.booking?.bookingId} | Bay: ${bookRes.json.booking?.parkingSlot?.slotNumber} -> ${t8Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t8Pass) passedCount++;

  // 9. Conflict / Overlapping Booking Prevention
  // Attempt to book the EXACT SAME SLOT during an overlapping window (11:00 - 13:00 overlaps with 10:00 - 12:00)
  const conflictRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/bookings', method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userCookie }
  }, {
    parkingLotId: targetLot._id,
    parkingSlotId: freshSlot._id,
    vehicleNumber: 'TS 09 XY 8888',
    vehicleType: 'Car',
    bookingDate: today,
    startTime: '11:00',
    duration: 2
  });
  console.log('\n[TEST 9] Overlapping Booking Conflict Prevention (11:00 vs 10:00-12:00):');
  const t9Pass = conflictRes.status === 409 && conflictRes.json.error.includes('Slot Conflict');
  console.log(`Status: ${conflictRes.status} | Conflict Error: "${conflictRes.json.error}" -> ${t9Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t9Pass) passedCount++;

  // 10. Non-overlapping Subsequent Booking on Same Slot (Later time: 21:00 - 23:00)
  const nonOverlapRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/bookings', method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: userCookie }
  }, {
    parkingLotId: targetLot._id,
    parkingSlotId: freshSlot._id,
    vehicleNumber: 'TS 09 XY 9999',
    vehicleType: 'Car',
    bookingDate: today,
    startTime: '21:00',
    duration: 2
  });
  console.log('\n[TEST 10] Non-Overlapping Subsequent Booking (21:00 - 23:00):');
  const t10Pass = nonOverlapRes.status === 201 && !!nonOverlapRes.json.booking;
  console.log(`Status: ${nonOverlapRes.status} | Booking ID: ${nonOverlapRes.json.booking?.bookingId} | Error: ${nonOverlapRes.json?.error || 'None'} -> ${t10Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t10Pass) passedCount++;

  // 11. Retrieve Current User Bookings
  const myBookings = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/bookings/my-bookings', method: 'GET',
    headers: { Cookie: userCookie }
  });
  console.log('\n[TEST 11] Retrieve Current User Bookings (User-Scoped Isolation):');
  const t11Pass = myBookings.status === 200 && myBookings.json.count >= 2;
  console.log(`Status: ${myBookings.status} | User Bookings Count: ${myBookings.json.count} -> ${t11Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t11Pass) passedCount++;

  // 12. Booking Cancellation
  const cancelId = bookRes.json.booking._id;
  const cancelRes = await apiCall({
    hostname: 'localhost', port: 5000, path: `/api/bookings/${cancelId}/cancel`, method: 'PUT',
    headers: { Cookie: userCookie }
  });
  console.log('\n[TEST 12] Booking Cancellation & Slot Release:');
  const t12Pass = cancelRes.status === 200 && cancelRes.json.booking?.bookingStatus === 'CANCELLED';
  console.log(`Status: ${cancelRes.status} | Status Updated To: ${cancelRes.json.booking?.bookingStatus} -> ${t12Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t12Pass) passedCount++;

  // 13. Admin-Only API Access Restrictions (USER Forbidden)
  const userAdminAttempt = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET',
    headers: { Cookie: userCookie, Accept: 'application/json' }
  });
  console.log('\n[TEST 13] Admin-Only API Access Restrictions (USER Attempted):');
  const t13Pass = userAdminAttempt.status === 403 && (userAdminAttempt.json?.error?.includes('Administrator role required') || userAdminAttempt.body?.includes('Access Denied'));
  console.log(`Status: ${userAdminAttempt.status} | Rejection: ${userAdminAttempt.json?.error || '403 Forbidden'} -> ${t13Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t13Pass) passedCount++;

  // 14. Admin Statistics Retrieval (ADMIN Authorized)
  const adminStats = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET',
    headers: { Cookie: adminCookie, Accept: 'application/json' }
  });
  console.log('\n[TEST 14] Admin Statistics Retrieval (ADMIN Authorized):');
  const t14Pass = adminStats.status === 200 && adminStats.json.stats?.totalLots >= 4;
  console.log(`Status: ${adminStats.status} | Lots: ${adminStats.json.stats?.totalLots} | Revenue: ${adminStats.json.stats?.totalRevenue} -> ${t14Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t14Pass) passedCount++;

  // 15. Admin Parking Lot Creation
  const newLotName = 'Campus Extension Zone ' + Math.floor(Math.random() * 1000);
  const newLot = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/admin/parking-lots', method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie }
  }, {
    name: newLotName,
    location: 'West Campus, Gate 4',
    address: 'Near University Health Center',
    description: 'Faculty and student parking near medical labs.',
    totalSlots: 10,
    hourlyRate: 15
  });
  console.log('\n[TEST 15] Admin Parking Lot & Auto-Slot Generation:');
  const t15Pass = newLot.status === 201 && newLot.json.lot?.name === newLotName;
  console.log(`Status: ${newLot.status} | Created Facility: ${newLot.json.lot?.name} -> ${t15Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t15Pass) passedCount++;

  // 16. Admin Slot Status Manual Override
  const slotToOverride = slotsRes.json.slots[slotsRes.json.slots.length - 1];
  const overrideRes = await apiCall({
    hostname: 'localhost', port: 5000, path: `/api/admin/slots/${slotToOverride._id}/status`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie }
  }, { status: 'OCCUPIED' });
  console.log('\n[TEST 16] Admin Slot Status Manual Override:');
  const t16Pass = overrideRes.status === 200 && overrideRes.json.slot?.status === 'OCCUPIED';
  console.log(`Status: ${overrideRes.status} | Msg: ${overrideRes.json.message} -> ${t16Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t16Pass) passedCount++;

  console.log('\n================================================================');
  console.log(`   TEST SUMMARY: ${passedCount}/${totalTests} TESTS PASSED SUCCESSFULLY!       `);
  console.log('================================================================');
}

runTestSuite().catch(console.error);
