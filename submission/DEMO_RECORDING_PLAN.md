# Smart Parking Platform (SPP)
## 5-Minute Live Video Demonstration Script & Recording Guide
**Hackathon Event**: SR University Web Technologies & Mobile Programming Hackathon 2026  
**Project**: Smart Parking Platform (SPP)  
**Target Duration**: 05:00 Minutes (300 Seconds)  
**Media Output Asset**: `submission/Smart_Parking_Platform_Demo.mp4`

---

### Recommended Screen Recording Setup
1. **Tool**: Windows Game Bar (`Win + G` -> Record), OBS Studio, or PowerPoint Screen Recording (`Insert` -> `Screen Recording`).
2. **Resolution**: 1920x1080 (1080p Full HD), 30 fps.
3. **Audio**: Built-in or external microphone for clear voiceover narration.
4. **Browser**: Open Edge / Chrome at `http://localhost:5000`.
5. **Terminal / DB View**: Second window open with MongoDB Compass or PowerShell terminal running `mongosh smart_parking_db`.

---

### Timed Scene-by-Scene Demonstration Script

#### 🎬 Scene 1: Introduction & Landing Page (00:00 – 00:35)
- **Visual**: Navigate to `http://localhost:5000/`.
- **Narration**:
  > *"Good morning respected faculty and hackathon evaluators. Welcome to our demonstration of the Smart Parking Platform (SPP), developed for the SR University Web Technologies and Mobile Programming Hackathon 2026. SPP solves the pervasive campus issue of parking congestion, blind cruising, and double-booking. Our landing page welcomes drivers with live facility metrics, immediate facility search, and clear navigation into our authenticated portals."*
- **Action**: Scroll down to showcase the dynamic statistics tiles (Active Facilities, Real-time Bays, Operational Hours). Click on the search bar and filter facilities dynamically.

---

#### 🎬 Scene 2: User Registration & JWT Authentication (00:35 – 01:10)
- **Visual**: Click **Register** (`/register.html`), then switch to **Login** (`/login.html`).
- **Narration**:
  > *"Security and role-based access control are built from the ground up. Passwords are never stored in plain text; they are cryptographically salted and hashed using bcrypt. Upon authentication, our Express backend generates a signed JSON Web Token (JWT) that manages user sessions with HttpOnly security."*
- **Action**:
  - Show quick-fill demo pill for Student/Visitor (`user@sru.edu.in` / `user123`).
  - Click **Sign In**.
  - Highlight the smooth redirect to `/dashboard.html` with personalized user badge *"Rahul Sharma (Student Driver)"*.

---

#### 🎬 Scene 3: User Dashboard & Facility Search (01:10 – 01:45)
- **Visual**: User Dashboard (`dashboard.html`).
- **Narration**:
  > *"On the driver dashboard, students and visitors have immediate visibility over campus parking availability. Users can search facilities by name or building location, and filter between Car and Two-Wheeler zones. The system displays live bay counts loaded directly from MongoDB."*
- **Action**:
  - Type *"Library"* in the filter box to filter to *Central Library Basement*.
  - Click **Reserve Slot** on the *Central Library Basement* card.

---

#### 🎬 Scene 4: Visual Parking Grid & Time-Window Availability (01:45 – 02:30)
- **Visual**: Slot Selection (`slot-selection.html?lotId=...`).
- **Narration**:
  > *"Here is one of our flagship innovations: the Visual Parking Bay Matrix. Unlike traditional portals that only show a number, SPP renders a true-to-life 2D bay layout. Slots are color-coded in real-time: Green indicates available, Red indicates occupied, and Orange signifies already reserved for the selected schedule. When we adjust the reservation date, start time, or duration, the grid dynamically queries our backend conflict engine without reloading the page."*
- **Action**:
  - Point out Green (Bay A-01, A-02), Red, and Orange slots.
  - Select Date: Today (`2026-11-14`), Time: `16:00`, Duration: `2 Hours`, Vehicle: `Car`.
  - Click on an open green bay (e.g. **Bay A-02**).
  - Click **Proceed to Booking**.

---

#### 🎬 Scene 5: Booking Confirmation & Digital Pass Generation (02:30 – 03:05)
- **Visual**: Booking Page (`booking.html`).
- **Narration**:
  > *"The booking interface automatically calculates the hourly tariff based on facility rates and duration. The driver inputs their vehicle registration number. When we click Confirm Booking, our backend atomically locks the slot and prevents any other user from booking this bay during the exact same timeframe."*
- **Action**:
  - Enter vehicle number: `TS 03 AB 4589`.
  - Confirm tariff: `2 hrs × ₹20/hr = ₹40`.
  - Click **Confirm Reservation**.
  - Show the animated confirmation modal and digital pass voucher displaying unique booking ID `#BK-xxxx`, QR visual badge, and timestamp.

---

#### 🎬 Scene 6: Double-Booking Conflict Prevention Demo (03:05 – 03:40)
- **Visual**: Reopen `slot-selection.html` in an Incognito window or second tab.
- **Narration**:
  > *"To demonstrate our mathematical conflict engine in action: if another driver attempts to reserve that same bay (Bay A-02) for an overlapping window—such as 16:30 to 18:00—the backend instantly identifies that requestedStart is less than existingEnd and requestedEnd is greater than existingStart. The request is rejected with HTTP 409 Conflict, ensuring zero double-booking on campus."*
- **Action**:
  - Attempt to book the same slot for 16:30.
  - Show the prompt/alert: *"Slot Conflict: Bay is already reserved during this time."*

---

#### 🎬 Scene 7: User Dashboard Booking Management & Cancellation (03:40 – 04:05)
- **Visual**: Back to `dashboard.html`.
- **Narration**:
  > *"Drivers retain full control over their reservations. The My Bookings ledger lists active passes. If their schedule changes, clicking Cancel Booking immediately updates MongoDB status to CANCELLED and instantly frees the bay for other campus drivers."*
- **Action**:
  - Point to the newly created booking in the table.
  - Click **Cancel**.
  - Verify row updates to badge `CANCELLED` and slot availability count increments.

---

#### 🎬 Scene 8: Admin Dashboard & Facility Operations (04:05 – 04:40)
- **Visual**: Log out and log in as `admin@sru.edu.in` / `admin123` -> `admin.html`.
- **Narration**:
  > *"Now let's switch to the Administrative Portal. Campus marshals and parking managers access comprehensive facility analytics: total lots, total parking bays, active reservations, and gross collected tariff. Administrators can add new campus parking lots, edit hourly tariffs, add slots, or manually override slot statuses when a bay undergoes maintenance."*
- **Action**:
  - Show Admin Metrics bar (7 Facilities, Active Bookings, Total Revenue).
  - Show Facility Editor modal.
  - Toggle a slot status from `AVAILABLE` to `OCCUPIED`.
  - Show Master Bookings Log.

---

#### 🎬 Scene 9: Security Verification & MongoDB Direct Inspection (04:40 – 05:00)
- **Visual**: Accessing `/admin.html` as standard user (demonstrates `access-denied.html`), then switch to Terminal / Compass.
- **Narration**:
  > *"Security is reinforced on both client and server sides. If a standard user attempts to manually force-navigate to /admin.html or calls an admin endpoint, our RBAC middleware returns HTTP 403 Forbidden. Finally, in MongoDB database smart_parking_db, all users, parking lots, parking slots, and booking records are permanently and reliably persisted. Thank you, and we welcome your questions!"*
- **Action**:
  - Show `access-denied.html` 403 page.
  - Show MongoDB query output in terminal: `db.bookings.find().limit(3)`.

---

### Verification Checklist for Recording
- [x] Backend server running at `http://localhost:5000`
- [x] MongoDB service active on port `27017`
- [x] Seed data initialized with test user and admin accounts
- [x] All 18 automated tests passing (`node scripts/test_thunder_client.js`)
- [x] 100% genuine data flow with real database persistence
