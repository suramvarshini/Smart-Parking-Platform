/**
 * Smart Parking Platform - Comprehensive Thunder Client API Test Suite Simulator
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 *
 * Simulates complete Thunder Client REST API testing for Session 3 (JWT, RBAC, Conflict, DB Ops).
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

async function runSession3TestSuite() {
  console.log('================================================================');
  console.log('   SESSION 3: COMPREHENSIVE BACKEND & REST API TEST SUITE       ');
  console.log('================================================================\n');

  let passedCount = 0;
  let totalTests = 18;

  // 1. Health & JWT Engine check
  const health = await apiCall({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('[TEST 1] Health & JWT Engine:');
  const t1Pass = health.status === 200 && health.json.authEngine?.includes('JWT');
  console.log(`Status: ${health.status} | Auth: ${health.json.authEngine} -> ${t1Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t1Pass) passedCount++;

  // 2. User Registration & JWT Issuance
  const randEmail = 'pooja' + Date.now() + '@sru.edu.in';
  const reg = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Pooja Reddy', email: randEmail, phone: '9123456780', password: 'password123', vehicleNo: 'TS 08 AB 9999' });
  console.log('\n[TEST 2] User Registration & JWT Issuance:');
  const t2Pass = reg.status === 201 && !!reg.json.token && reg.json.user.role === 'USER';
  console.log(`Status: ${reg.status} | User: ${reg.json.user?.name} | JWT Issued: ${!!reg.json.token} -> ${t2Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t2Pass) passedCount++;

  // 3. Duplicate Email Prevention
  const dupReg = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { name: 'Pooja Duplicate', email: randEmail, phone: '9123456780', password: 'password123' });
  console.log('\n[TEST 3] Duplicate Email Prevention (MongoDB Unique Index):');
  const t3Pass = dupReg.status === 409 && dupReg.json.error.includes('already exists');
  console.log(`Status: ${dupReg.status} | Error: ${dupReg.json.error} -> ${t3Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t3Pass) passedCount++;

  // 4. User Login & Bearer Token Generation
  const loginRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'user@sru.edu.in', password: 'user123' });
  const userToken = loginRes.json.token;
  const userCookie = (loginRes.headers['set-cookie'] || [])[0];
  console.log('\n[TEST 4] User Login with JWT Token (Role USER):');
  const t4Pass = loginRes.status === 200 && loginRes.json.user.role === 'USER' && !!userToken;
  console.log(`Status: ${loginRes.status} | User: ${loginRes.json.user.name} | Role: ${loginRes.json.user.role} | Token Length: ${userToken?.length} -> ${t4Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t4Pass) passedCount++;

  // 5. Admin Login & Bearer Token Generation
  const adminLoginRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@sru.edu.in', password: 'admin123' });
  const adminToken = adminLoginRes.json.token;
  console.log('\n[TEST 5] Admin Login with JWT Token (Role ADMIN):');
  const t5Pass = adminLoginRes.status === 200 && adminLoginRes.json.user.role === 'ADMIN' && !!adminToken;
  console.log(`Status: ${adminLoginRes.status} | Admin: ${adminLoginRes.json.user.name} | Role: ${adminLoginRes.json.user.role} -> ${t5Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t5Pass) passedCount++;

  // 6. User Profile via Authorization: Bearer <token>
  const meRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/auth/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log('\n[TEST 6] Protected User Profile via Bearer Token:');
  const t6Pass = meRes.status === 200 && meRes.json.authenticated === true && meRes.json.user.email === 'user@sru.edu.in';
  console.log(`Status: ${meRes.status} | Identity: ${meRes.json.user?.name} (${meRes.json.user?.role}) -> ${t6Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t6Pass) passedCount++;

  // 7. Parking Lots Retrieval & Live Counters
  const lotsRes = await apiCall({ hostname: 'localhost', port: 5000, path: '/api/parking-lots', method: 'GET' });
  console.log('\n[TEST 7] Parking Lots Directory from MongoDB:');
  const t7Pass = lotsRes.status === 200 && lotsRes.json.count >= 4;
  console.log(`Status: ${lotsRes.status} | Total Facilities: ${lotsRes.json.count} -> ${t7Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t7Pass) passedCount++;

  const targetLot = lotsRes.json.lots.find(l => l.totalSlots >= 20) || lotsRes.json.lots[0];

  // 8. Time-Window Aware Slots Retrieval (Conflict Checking)
  const today = new Date().toISOString().split('T')[0];
  const slotsRes = await apiCall({
    hostname: 'localhost', port: 5000,
    path: `/api/parking-lots/${targetLot._id}/slots?date=${today}&startTime=10:00&duration=2&vehicleType=Car`,
    method: 'GET'
  });
  console.log(`\n[TEST 8] Time-Window Dynamic Slot Availability (${targetLot.name}):`);
  const t8Pass = slotsRes.status === 200 && slotsRes.json.slots.length >= 20;
  console.log(`Status: ${slotsRes.status} | Slots Checked: ${slotsRes.json.slots.length} -> ${t8Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t8Pass) passedCount++;

  // 9. Booking Creation
  const freshSlot = slotsRes.json.slots.find(s => (s.dynamicStatus || s.status) === 'AVAILABLE');
  const startHour = String(10 + Math.floor(Math.random() * 5)).padStart(2, '0');
  const bookRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/bookings', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }
  }, {
    parkingLotId: targetLot._id,
    parkingSlotId: freshSlot._id,
    vehicleNumber: 'TS 09 XY 7777',
    vehicleType: 'Car',
    bookingDate: today,
    startTime: `${startHour}:00`,
    duration: 2
  });
  console.log('\n[TEST 9] Reservation Creation & Pass Generation:');
  const t9Pass = bookRes.status === 201 && bookRes.json.booking?.bookingId.startsWith('BK-');
  console.log(`Status: ${bookRes.status} | Booking ID: ${bookRes.json.booking?.bookingId} | Bay: ${bookRes.json.booking?.parkingSlot?.slotNumber} -> ${t9Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t9Pass) passedCount++;

  const createdBooking = bookRes.json.booking;

  // 10. Overlapping Booking Conflict Prevention (Same Slot, Overlapping Window)
  const conflictRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/bookings', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }
  }, {
    parkingLotId: targetLot._id,
    parkingSlotId: freshSlot._id,
    vehicleNumber: 'TS 09 XY 8888',
    vehicleType: 'Car',
    bookingDate: today,
    startTime: `${startHour}:30`, // 30 mins into the 2-hour window -> OVERLAP!
    duration: 2
  });
  console.log('\n[TEST 10] Overlapping Booking Rejection (Conflict Guard):');
  const t10Pass = conflictRes.status === 409 && conflictRes.json.error.includes('Slot Conflict');
  console.log(`Status: ${conflictRes.status} | Conflict Error: "${conflictRes.json.error}" -> ${t10Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t10Pass) passedCount++;

  // 11. Retrieve User Bookings
  const userBookingsRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/bookings/my-bookings', method: 'GET',
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log('\n[TEST 11] Retrieve User Isolated Bookings:');
  const t11Pass = userBookingsRes.status === 200 && userBookingsRes.json.count >= 1;
  console.log(`Status: ${userBookingsRes.status} | Bookings Count: ${userBookingsRes.json.count} -> ${t11Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t11Pass) passedCount++;

  // 12. User Cancels Own Booking
  const cancelRes = await apiCall({
    hostname: 'localhost', port: 5000, path: `/api/bookings/${createdBooking._id}/cancel`, method: 'PUT',
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log('\n[TEST 12] User Booking Cancellation & Slot Release:');
  const t12Pass = cancelRes.status === 200 && cancelRes.json.booking?.bookingStatus === 'CANCELLED';
  console.log(`Status: ${cancelRes.status} | Updated Status: ${cancelRes.json.booking?.bookingStatus} -> ${t12Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t12Pass) passedCount++;

  // 13. Security: Normal USER accessing Admin API (Forbidden 403)
  const userAdminAttempt = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET',
    headers: { 'Authorization': `Bearer ${userToken}`, 'Accept': 'application/json' }
  });
  console.log('\n[TEST 13] Admin-Only API Access Restriction (USER Token):');
  const t13Pass = userAdminAttempt.status === 403 && userAdminAttempt.json.error.includes('Administrator role required');
  console.log(`Status: ${userAdminAttempt.status} | Rejection: ${userAdminAttempt.json.error} -> ${t13Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t13Pass) passedCount++;

  // 14. Admin Statistics Retrieval (ADMIN Authorized)
  const adminStats = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Accept': 'application/json' }
  });
  console.log('\n[TEST 14] Admin Statistics Aggregation (ADMIN Token):');
  const t14Pass = adminStats.status === 200 && adminStats.json.stats?.totalLots >= 4;
  console.log(`Status: ${adminStats.status} | Facilities: ${adminStats.json.stats?.totalLots} | Revenue: ${adminStats.json.stats?.totalRevenue} -> ${t14Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t14Pass) passedCount++;

  // 15. Admin Facility Creation & Auto-Slot Generation
  const testLotName = 'Innovation Hub Lot ' + Math.floor(Math.random() * 1000);
  const createLotRes = await apiCall({
    hostname: 'localhost', port: 5000, path: '/api/admin/parking-lots', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, {
    name: testLotName,
    location: 'Innovation Complex, Gate 5',
    address: 'Near Incubation Center',
    totalSlots: 10,
    hourlyRate: 20
  });
  console.log('\n[TEST 15] Admin Facility Creation:');
  const t15Pass = createLotRes.status === 201 && createLotRes.json.lot?.name === testLotName;
  console.log(`Status: ${createLotRes.status} | Facility Created: ${createLotRes.json.lot?.name} -> ${t15Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t15Pass) passedCount++;

  const newLotId = createLotRes.json.lot?._id;

  // 16. Admin Facility Edit
  const editLotRes = await apiCall({
    hostname: 'localhost', port: 5000, path: `/api/admin/parking-lots/${newLotId}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, {
    hourlyRate: 35,
    operatingHours: '06:00 AM - 10:00 PM'
  });
  console.log('\n[TEST 16] Admin Facility Edit (Tariff & Hours):');
  const t16Pass = editLotRes.status === 200 && editLotRes.json.lot?.hourlyRate === 35;
  console.log(`Status: ${editLotRes.status} | Updated Tariff: ₹${editLotRes.json.lot?.hourlyRate}/hr -> ${t16Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t16Pass) passedCount++;

  // 17. Admin Slot Status Override (Available -> Occupied)
  const slotRes = await apiCall({ hostname: 'localhost', port: 5000, path: `/api/parking-lots/${newLotId}/slots`, method: 'GET' });
  const slotToOverride = slotRes.json.slots[0];
  const overrideRes = await apiCall({
    hostname: 'localhost', port: 5000, path: `/api/admin/slots/${slotToOverride._id}/status`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { status: 'OCCUPIED' });
  console.log('\n[TEST 17] Admin Slot Manual Status Override:');
  const t17Pass = overrideRes.status === 200 && overrideRes.json.slot?.status === 'OCCUPIED';
  console.log(`Status: ${overrideRes.status} | Slot: ${overrideRes.json.slot?.slotNumber} -> ${overrideRes.json.slot?.status} -> ${t17Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t17Pass) passedCount++;

  // 18. Admin Facility Deletion & Cascading Slot Cleanup
  const deleteLotRes = await apiCall({
    hostname: 'localhost', port: 5000, path: `/api/admin/parking-lots/${newLotId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('\n[TEST 18] Admin Facility Deletion (Cascading Cleanup):');
  const t18Pass = deleteLotRes.status === 200 && deleteLotRes.json.success === true;
  console.log(`Status: ${deleteLotRes.status} | Message: ${deleteLotRes.json.message} -> ${t18Pass ? '✅ PASS' : '❌ FAIL'}`);
  if (t18Pass) passedCount++;

  console.log('\n================================================================');
  console.log(`   SESSION 3 TEST SUMMARY: ${passedCount}/${totalTests} TESTS PASSED SUCCESSFULLY! `);
  console.log('================================================================');
}

runSession3TestSuite().catch(console.error);
