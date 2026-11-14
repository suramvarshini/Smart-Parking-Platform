# Smart Parking Platform (SPP)
## Presentation Slide Deck — SR University Hackathon 2026
**Track**: Web Technologies & Mobile Programming Hackathon 2026  
**Format**: 14 Widescreen Slides (Generated as `Smart_Parking_Platform_Presentation.pptx`)

---

### Slide 1: Title & Team Details
- **Header**: SR UNIVERSITY HACKATHON 2026
- **Title**: Smart Parking Platform (SPP)
- **Subtitle**: Automated Real-Time Parking Space Discovery, Visual Bay Reservation & Facility Management System
- **Institution**: SR University
- **Track**: Web Technologies & Mobile Programming Hackathon 2026
- **Team Lead & Members**: [Lead Developer & Team Members]
- **Faculty Mentor**: [Department Faculty Mentor / Evaluator]
- **Technology Stack**: HTML5, CSS3, JavaScript (ES6+), Node.js, Express.js, MongoDB, Mongoose, JWT

---

### Slide 2: Problem Statement & Objectives
- **Urban Parking Pain Points**:
  - Inefficient manual cruising for parking spaces leads to congestion, wasted fuel, and urban carbon emissions.
  - Absence of real-time lot occupancy leads to arrival uncertainty and scheduling frustration.
  - Double-booking and scheduling overlap conflicts common in basic reservation tools.
  - Lack of centralized visibility for campus/commercial facility supervisors.
- **Hackathon Project Objectives**:
  - Centralized real-time discovery of parking lots with location, total bays, and live capacity.
  - Interactive visual parking grid with intuitive color coding (Green: Available, Red: Occupied, Orange: Reserved).
  - Robust time-overlap validation engine to guarantee conflict-free slot booking.
  - Strict Role-Based Access Control (RBAC) separating student/visitor users from administrative managers.

---

### Slide 3: Proposed Solution & System Overview
- **Core Pillars**:
  1. **User Discovery & Intuitive Reservation**: Search campus facilities by name/location, filter by vehicle type (Car/Bike), choose bay visually, and secure an instant digital booking pass (`#BK-xxxx`).
  2. **Intelligent Conflict Prevention**: Date and time window overlap detection (`requestedStart < existingEnd && requestedEnd > existingStart`) evaluated dynamically at database query level.
  3. **Role-Based Workflows**: Standard Users access personal dashboards and reservations; Administrators manage lots, configure bays, and monitor live metrics.
  4. **Lightweight & Standards-Based**: Zero heavy client frameworks; raw HTML5/CSS3/Vanilla JS for high performance, mobile responsiveness, and zero build complexity.

---

### Slide 4: System Architecture & Technology Stack
- **Architecture**:
  - **Frontend Client**: HTML5, CSS3 Modern Flex/Grid, Vanilla JavaScript ES6+. Communicates via Fetch API with JWT Bearer authentication and HttpOnly cookies.
  - **Backend Server**: Node.js & Express.js RESTful API, centralized error handling, custom RBAC middleware (`requireAuth`, `requireAdmin`), password hashing with bcryptjs.
  - **Database Tier**: MongoDB Community Server v7.0+ on port 27017, Mongoose ODM with schema validations, timestamping, and compound unique indexing (`{ parkingLot: 1, slotNumber: 1 }`).
- **RESTful Endpoints**:
  - `/api/auth`: `POST /register`, `POST /login`, `POST /logout`, `GET /me`
  - `/api/lots`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
  - `/api/slots`: `GET /lot/:lotId`, `GET /lot/:lotId/availability`, `POST /`, `PATCH /:id/status`
  - `/api/bookings`: `POST /`, `GET /my-bookings`, `GET /all`, `POST /:id/cancel`
  - `/api/admin`: `GET /stats`

---

### Slide 5: Database Schema & Entity Relationships
- **Entities & Relations**:
  - `User`: `_id`, `name`, `email` (unique), `password` (hashed), `phone`, `role` (`USER` | `ADMIN`), `createdAt`.
  - `ParkingLot`: `_id`, `name`, `location`, `description`, `totalSlots`, `availableSlots`, `hourlyRate`, `operatingHours`, `createdAt`.
  - `ParkingSlot`: `_id`, `parkingLot` (ref), `slotNumber` (unique per lot), `slotType` (`Car` | `Bike`), `status` (`AVAILABLE` | `OCCUPIED` | `RESERVED`), `createdAt`.
  - `Booking`: `_id`, `bookingId` (`#BK-xxxx`), `user` (ref), `parkingLot` (ref), `parkingSlot` (ref), `vehicleNumber`, `vehicleType`, `bookingDate`, `startTime`, `durationHours`, `endTime`, `totalAmount`, `status` (`CONFIRMED` | `CANCELLED` | `COMPLETED`), `createdAt`.
- **Integrity**: Referential integrity via Mongoose `populate()`, slot count synchronization upon creation, and atomic booking transactions.

---

### Slide 6: Visual Parking Bay Grid & Slot State Engine
- **Visual Grid Representation**:
  - True-to-life parking lot layout with driving lanes and demarcated bays.
  - Responsive 4-column bay layout on mobile, 8-column layout on desktop monitors.
- **Three-Tier Dynamic Color Coding**:
  - 🟢 **Green (Available)**: Bay is vacant and completely free for the requested date and time span. One-click selection.
  - 🔴 **Red (Occupied)**: Bay currently physically occupied or scheduled for maintenance. Selection disabled.
  - 🟠 **Orange (Reserved)**: Bay booked by another driver during the requested reservation window. Selection disabled.
- **Client-Side Live Recalculation**:
  - Selecting date, start time, or duration automatically triggers `/api/slots/lot/:id/availability?date=...&startTime=...&durationHours=...` without requiring a full page refresh.

---

### Slide 7: Smart Booking & Time-Overlap Conflict Prevention
- **The Double-Booking Problem**: Multiple users attempting to book Slot C-03 at SRU Tech Hub for overlapping times.
- **Algorithmic Solution**:
  $$\text{Overlap Condition: } (\text{RequestedStart} < \text{ExistingEnd}) \land (\text{RequestedEnd} > \text{ExistingStart})$$
- **Database Query Validation**:
  ```javascript
  const conflictingBooking = await Booking.findOne({
    parkingSlot: slotId,
    bookingDate: date,
    status: 'CONFIRMED',
    $or: [
      { startTime: { $lt: reqEndTime }, endTime: { $gt: reqStartTime } }
    ]
  });
  if (conflictingBooking) {
    return res.status(409).json({ error: 'Selected slot is already reserved for this time window.' });
  }
  ```
- **Atomicity & Accuracy**: Returns HTTP 409 Conflict with clear error feedback and refreshes the bay grid to display the newly reserved state.

---

### Slide 8: Role-Based Access Control (RBAC) & Security Architecture
- **Dual-Layer Defense**:
  - **Layer 1: Frontend Route Guards (`main.js`)**: Inspects JWT user role in client storage; automatically redirects unauthorized users attempting to access `admin.html` to `access-denied.html` (HTTP 403 UI).
  - **Layer 2: Backend API Middleware (`server.js`)**:
    - `requireAuth`: Verifies cryptographic JWT signature; extracts `req.user`. Returns HTTP 401 if token is missing or forged.
    - `requireAdmin`: Checks `req.user.role === 'ADMIN'`. Returns HTTP 403 Forbidden with `{ error: 'Access denied. Administrator privileges required.' }`.
- **Data Protection**:
  - Passwords hashed with bcrypt (salt rounds = 10).
  - Environment isolation with `.env` and `.gitignore`.
  - Sanitized error messages to avoid leaking database internals.

---

### Slide 9: User Workflow & Key Features
1. **Explore**: Browse parking facilities with live available bay counters and search filters.
2. **Select Lot & Bay**: Choose date, start time, duration, and vehicle type; pick open bay from the color-coded visual layout.
3. **Instant Confirmation**: Enter vehicle registration number, review dynamic pricing breakdown, and confirm booking.
4. **Digital Pass Voucher**: Instant generation of unique booking code (`#BK-xxxx`) with complete receipt details.
5. **Manage & Cancel**: Review active bookings on the User Dashboard; cancel with one click to immediately release the bay back into available inventory.

---

### Slide 10: Admin Management Capabilities
- **Overview Dashboard Metrics**:
  - Total Facilities, Total Campus Slots, Active Bookings, and Gross Revenue counter.
- **Facility Management**:
  - Add new parking lots with location, rates, and operating hours.
  - Edit existing facility details in real time.
  - Delete unused facilities with cascade protection.
- **Slot Configuration**:
  - Add new bays (Car / Bike) to any registered parking lot.
  - Override slot operational status (`AVAILABLE`, `OCCUPIED`, `RESERVED`) for on-ground maintenance.
- **Master Booking Log**:
  - Searchable, auditable table of every campus reservation with status tags.

---

### Slide 11: Testing & Verification Summary (18/18 Automated Test Suite)
- **Automated Verification Harness (`scripts/test_thunder_client.js`)**:
  - 18 comprehensive tests covering unit, integration, and security paths.
  - Test 1: User Registration with unique email — **PASS**
  - Test 2: Duplicate Email Rejection (400 Bad Request) — **PASS**
  - Test 3: User Authentication & JWT Issuance — **PASS**
  - Test 4: Retrieve Current User Profile (`/api/auth/me`) — **PASS**
  - Test 5: Fetch All Parking Lots — **PASS**
  - Test 6: Fetch Parking Slots for Specific Lot — **PASS**
  - Test 7: Calculate Slot Availability for Date/Time Window — **PASS**
  - Test 8: Create Valid Reservation & Generate `#BK-xxxx` — **PASS**
  - Test 9: Verify Conflict Engine: Exact Time Duplicate Rejection (409) — **PASS**
  - Test 10: Verify Conflict Engine: Partial Overlap Rejection (409) — **PASS**
  - Test 11: Non-Overlapping Booking on Same Slot (Success) — **PASS**
  - Test 12: Standard User Booking History Retrieval — **PASS**
  - Test 13: RBAC Security: User Blocked from Admin APIs (403) — **PASS**
  - Test 14: Admin Authentication & Privileged JWT Issuance — **PASS**
  - Test 15: Admin Overview Statistics API — **PASS**
  - Test 16: Admin Create & Update Parking Lot — **PASS**
  - Test 17: Admin Manual Slot Status Override — **PASS**
  - Test 18: Booking Cancellation & Inventory Release — **PASS**
- **Success Rate**: **100% (18/18 Tests Passed)**

---

### Slide 12: Screenshots & UI Showcase
- **Landing Page (`index.html`)**: Clean hero section, live facility counters, and search interface.
- **Interactive Bay Layout (`slot-selection.html`)**: Visual parking lot matrix with real-time green/red/orange status indicators.
- **User Dashboard (`dashboard.html`)**: Active reservations list, cancellation action, and quick booking portal.
- **Admin Management Console (`admin.html`)**: Facility editor modal, live analytics tiles, and full reservation ledger.
- **Access Denied (`access-denied.html`)**: Clear collegiate security boundary illustration and return home button.

---

### Slide 13: Future Enhancements & Scalability
- **Upcoming Roadmap**:
  1. **Automated ANPR (License Plate Recognition)**: Camera-based optical recognition at boom barriers to automate check-in and check-out.
  2. **IoT Ultrasonic Sensors**: Real-time bay occupancy detection using ESP32/Arduino sensor nodes communicating via MQTT/WebSocket.
  3. **UPI & Payment Gateway Integration**: Native Razorpay/Stripe integration for automatic penalty handling and contactless payments.
  4. **Native Mobile Application**: Cross-platform Flutter / React Native app with push notifications and turn-by-turn indoor parking navigation.

---

### Slide 14: Conclusion & Faculty Q&A
- **Summary**:
  - Developed a full-stack, enterprise-grade Smart Parking Platform in 4 structured hackathon sessions.
  - Successfully achieved real-time availability, dynamic visual grid selection, double-booking prevention, and strict JWT role-based security.
  - Backed by an automated test suite with 100% pass rate and clean, faculty-explainable code.
- **Thank You!**
  - Open for Faculty Evaluation, Code Walkthrough & Live Interactive Demonstration.
  - **GitHub / Repository**: Smart-Parking-Platform
  - **SR University Hackathon 2026**
